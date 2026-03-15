package handler

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
)

var tracer = otel.Tracer("spaceport-api")

// Departure represents a departure row.
type Departure struct {
	ID             int      `json:"id"`
	Destination    string   `json:"destination"`
	DepartureTime  string   `json:"departure_time"`
	Description    string   `json:"description"`
	SeatClasses    []string `json:"seat_classes"`
	AvailableSeats int      `json:"available_seats"`
}

// DepartureHandler groups departure routes and their deps.
type DepartureHandler struct {
	DB                *sql.DB
	PricingURL        string
	HTTPClient        *http.Client
	Logger            *slog.Logger
	currencyCache     []byte
	currencyCacheMu   sync.Mutex
	currencyCacheDone bool
}

// ListDepartures handles GET /api/departures.
func (h *DepartureHandler) ListDepartures(c *gin.Context) {
	ctx := c.Request.Context()
	h.Logger.InfoContext(ctx, "listing departures")

	ctx, span := tracer.Start(ctx, "api.load_departures")
	defer span.End()

	rows, err := h.DB.QueryContext(ctx, "SELECT id, destination, departure_time, description, seat_classes, available_seats FROM departures")
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		h.Logger.ErrorContext(ctx, "query departures failed", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	defer rows.Close()

	var deps []Departure
	for rows.Next() {
		var d Departure
		var classes string
		if err := rows.Scan(&d.ID, &d.Destination, &d.DepartureTime, &d.Description, &classes, &d.AvailableSeats); err != nil {
			span.SetStatus(codes.Error, err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
			return
		}
		_ = json.Unmarshal([]byte(classes), &d.SeatClasses)
		span.SetAttributes(attribute.String("spaceport.departure.destination", d.Destination))
		deps = append(deps, d)
	}

	c.JSON(http.StatusOK, deps)
}

// GetDeparture handles GET /api/departures/:id.
func (h *DepartureHandler) GetDeparture(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")
	h.Logger.InfoContext(ctx, "getting departure detail", "departure_id", id)

	var d Departure
	var classes string
	err := h.DB.QueryRowContext(ctx, "SELECT id, destination, departure_time, description, seat_classes, available_seats FROM departures WHERE id = ?", id).
		Scan(&d.ID, &d.Destination, &d.DepartureTime, &d.Description, &classes, &d.AvailableSeats)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "departure not found"})
		return
	}
	if err != nil {
		h.Logger.ErrorContext(ctx, "query departure failed", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	_ = json.Unmarshal([]byte(classes), &d.SeatClasses)

	pricing, err := h.callPricingService(ctx, id)
	if err != nil {
		h.Logger.ErrorContext(ctx, "pricing service failed", "error", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
		return
	}

	recs, err := h.callRecommendationService(ctx, id)
	if err != nil {
		h.Logger.ErrorContext(ctx, "recommendation service failed", "error", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"departure":       d,
		"pricing":         pricing,
		"recommendations": recs,
	})
}

func (h *DepartureHandler) callPricingService(ctx context.Context, departureID string) (any, error) {
	ctx, span := tracer.Start(ctx, "api.call_pricing_service")
	defer span.End()

	url := fmt.Sprintf("%s/price/%s", h.PricingURL, departureID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}
	resp, err := h.HTTPClient.Do(req)
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		var pricingErr struct {
			Detail string `json:"detail"`
			Error  string `json:"error"`
		}
		_ = json.Unmarshal(errBody, &pricingErr)
		msg := pricingErr.Detail
		if msg == "" {
			msg = pricingErr.Error
		}
		if msg == "" {
			msg = fmt.Sprintf("pricing service returned %d", resp.StatusCode)
		}
		span.SetStatus(codes.Error, msg)
		span.SetAttributes(
			attribute.Int("http.response.status_code", resp.StatusCode),
			attribute.String("spaceport.pricing.error", msg),
		)
		return nil, fmt.Errorf("%s", msg)
	}

	var result any
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return result, nil
}

func (h *DepartureHandler) callRecommendationService(ctx context.Context, departureID string) (any, error) {
	ctx, span := tracer.Start(ctx, "api.call_recommendation_service")
	defer span.End()

	url := fmt.Sprintf("%s/recommendations/%s", h.PricingURL, departureID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}
	resp, err := h.HTTPClient.Do(req)
	if err != nil {
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		var recErr struct {
			Detail string `json:"detail"`
			Error  string `json:"error"`
		}
		_ = json.Unmarshal(errBody, &recErr)
		msg := recErr.Detail
		if msg == "" {
			msg = recErr.Error
		}
		if msg == "" {
			msg = fmt.Sprintf("recommendation service returned %d", resp.StatusCode)
		}
		span.SetStatus(codes.Error, msg)
		span.SetAttributes(
			attribute.Int("http.response.status_code", resp.StatusCode),
			attribute.String("spaceport.recommendations.error", msg),
		)
		return nil, fmt.Errorf("%s", msg)
	}

	var result any
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return result, nil
}

// GetCurrencies proxies GET /currencies from the pricing service with in-memory caching.
func (h *DepartureHandler) GetCurrencies(c *gin.Context) {
	ctx := c.Request.Context()
	h.Logger.InfoContext(ctx, "getting currencies")

	h.currencyCacheMu.Lock()
	if h.currencyCacheDone {
		data := h.currencyCache
		h.currencyCacheMu.Unlock()
		c.Data(http.StatusOK, "application/json; charset=utf-8", data)
		return
	}
	h.currencyCacheMu.Unlock()

	url := fmt.Sprintf("%s/currencies", h.PricingURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		h.Logger.ErrorContext(ctx, "currency fetch failed", "error", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "pricing service unavailable"})
		return
	}
	resp, err := h.HTTPClient.Do(req)
	if err != nil {
		h.Logger.ErrorContext(ctx, "currency fetch failed", "error", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "pricing service unavailable"})
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		h.Logger.ErrorContext(ctx, "currency fetch failed", "status", resp.StatusCode)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "pricing service unavailable"})
		return
	}
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		h.Logger.ErrorContext(ctx, "currency read failed", "error", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "pricing service unavailable"})
		return
	}

	h.currencyCacheMu.Lock()
	h.currencyCache = body
	h.currencyCacheDone = true
	h.currencyCacheMu.Unlock()

	c.Data(http.StatusOK, "application/json; charset=utf-8", body)
}
