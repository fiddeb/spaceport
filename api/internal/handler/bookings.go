package handler

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	neturl "net/url"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"

	"github.com/fiddeb/spaceport/api/internal/metrics"
	"github.com/fiddeb/spaceport/api/internal/semconv"
)

// BookingRequest is the POST body for creating a booking.
type BookingRequest struct {
	DepartureID      int    `json:"departure_id" binding:"required"`
	PassengerName    string `json:"passenger_name" binding:"required"`
	SeatClass        string `json:"seat_class" binding:"required"`
	CryosleepEnabled bool   `json:"cryosleep_enabled"`
	ExtraBaggage     int    `json:"extra_baggage"`
	Currency         string `json:"currency"`
}

// BookingHandler groups booking routes and their deps.
type BookingHandler struct {
	DB         *sql.DB
	PricingURL string
	HTTPClient *http.Client
	Logger     *slog.Logger
}

// CreateBooking handles POST /api/bookings.
func (h *BookingHandler) CreateBooking(c *gin.Context) {
	ctx := c.Request.Context()

	ctx, span := tracer.Start(ctx, semconv.SpanSpaceportBookingCreateServerName)
	defer span.End()

	var req BookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	span.SetAttributes(
		semconv.AttrSpaceportDepartureIdKey.Int(req.DepartureID),
		semconv.AttrSpaceportSeatClass(req.SeatClass),
	)

	bookingID := uuid.New().String()
	span.SetAttributes(semconv.AttrSpaceportBookingId(bookingID))

	h.Logger.InfoContext(ctx, "processing booking",
		"booking_id", bookingID,
		"departure_id", req.DepartureID,
		"seat_class", req.SeatClass,
	)

	totalPrice, currency, err := h.callPricing(ctx, req)
	if err != nil {
		h.Logger.ErrorContext(ctx, "pricing call failed", "error", err, "booking_id", bookingID)
		span.SetStatus(codes.Error, err.Error())
		metrics.PricingFailuresCount.Add(ctx, 1,
			semconv.SpaceportSeatClass(req.SeatClass),
		)

		h.insertBooking(ctx, bookingID, req, 0, currency, "failed", err.Error())
		metrics.BookingCount.Add(ctx, 1,
			semconv.AttrSpaceportBookingStatusFailed,
			semconv.SpaceportSeatClass(req.SeatClass),
		)

		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":      "pricing service unavailable",
			"booking_id": bookingID,
			"status":     "failed",
		})
		return
	}

	h.insertBooking(ctx, bookingID, req, totalPrice, currency, "confirmed", "")
	span.AddEvent("booking_completed",
		trace.WithAttributes(semconv.AttrSpaceportBookingId(bookingID)),
	)
	metrics.BookingCount.Add(ctx, 1,
		semconv.AttrSpaceportBookingStatusConfirmed,
		semconv.SpaceportSeatClass(req.SeatClass),
	)

	h.Logger.InfoContext(ctx, "booking confirmed", "booking_id", bookingID, "total_price", totalPrice)

	c.JSON(http.StatusCreated, gin.H{
		"booking_id":  bookingID,
		"status":      "confirmed",
		"total_price": totalPrice,
		"currency":    currency,
	})
}

func (h *BookingHandler) callPricing(ctx context.Context, req BookingRequest) (float64, string, error) {
	ctx, span := semconv.StartSpaceportPricingCalculateClient(ctx, tracer, req.SeatClass)
	defer span.End()

	start := time.Now()
	currency := req.Currency
	if currency == "" {
		currency = "UNC"
	}
	params := neturl.Values{}
	params.Set("currency", currency)
	url := fmt.Sprintf("%s/price/%d?%s", h.PricingURL, req.DepartureID, params.Encode())

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		return 0, currency, err
	}
	injectTrace(ctx, httpReq)
	resp, err := h.HTTPClient.Do(httpReq)
	elapsed := time.Since(start)
	metrics.PricingReqDuration.Record(ctx, float64(elapsed.Milliseconds()),
		req.SeatClass,
	)

	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		return 0, currency, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		span.SetStatus(codes.Error, fmt.Sprintf("pricing returned %d", resp.StatusCode))
		return 0, currency, fmt.Errorf("pricing service returned %d", resp.StatusCode)
	}

	var result struct {
		Prices []struct {
			SeatClass  string  `json:"seat_class"`
			TotalPrice float64 `json:"total_price"`
			Currency   string  `json:"currency"`
		} `json:"prices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, currency, err
	}

	for _, p := range result.Prices {
		if p.SeatClass == req.SeatClass {
			return p.TotalPrice, p.Currency, nil
		}
	}

	return 0, currency, fmt.Errorf("seat class %q not found in pricing response", req.SeatClass)
}

func (h *BookingHandler) insertBooking(ctx context.Context, bookingID string, req BookingRequest, totalPrice float64, currency, status, errorReason string) {
	cryo := 0
	if req.CryosleepEnabled {
		cryo = 1
	}
	_, err := h.DB.ExecContext(ctx,
		`INSERT INTO bookings (id, departure_id, passenger_name, seat_class, cryosleep_enabled, extra_baggage, total_price, currency, status, error_reason)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		bookingID, req.DepartureID, req.PassengerName, req.SeatClass, cryo, req.ExtraBaggage, totalPrice, currency, status, errorReason,
	)
	if err != nil {
		h.Logger.ErrorContext(ctx, "insert booking failed", "error", err, "booking_id", bookingID)
	}
}
