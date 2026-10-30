package handler

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
	"go.opentelemetry.io/otel/trace"

	"github.com/fiddeb/spaceport/api/internal/middleware"
)

func TestCurrenciesPropagatesClientSpanToPricing(t *testing.T) {
	gin.SetMode(gin.TestMode)
	previousProvider := otel.GetTracerProvider()
	previousPropagator := otel.GetTextMapPropagator()
	recorder := tracetest.NewSpanRecorder()
	provider := sdktrace.NewTracerProvider(sdktrace.WithSpanProcessor(recorder))
	otel.SetTracerProvider(provider)
	otel.SetTextMapPropagator(propagation.TraceContext{})
	t.Cleanup(func() {
		otel.SetTracerProvider(previousProvider)
		otel.SetTextMapPropagator(previousPropagator)
		_ = provider.Shutdown(t.Context())
	})

	var outboundParent string
	pricing := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		outboundParent = r.Header.Get("traceparent")
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"currencies":[]}`)
	}))
	defer pricing.Close()

	h := &DepartureHandler{
		PricingURL: pricing.URL,
		HTTPClient: pricing.Client(),
		Logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
	router := gin.New()
	router.Use(middleware.Tracing())
	router.GET("/api/currencies", h.GetCurrencies)
	incoming := "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01"
	request := httptest.NewRequest(http.MethodGet, "/api/currencies", nil)
	request.Header.Set("traceparent", incoming)
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", response.Code)
	}
	parts := strings.Split(outboundParent, "-")
	if len(parts) != 4 || parts[1] != "0123456789abcdef0123456789abcdef" {
		t.Fatalf("outbound traceparent = %q", outboundParent)
	}
	for _, span := range recorder.Ended() {
		if span.SpanKind() == trace.SpanKindClient && span.Name() == "GET /currencies" {
			if span.SpanContext().SpanID().String() != parts[2] {
				t.Errorf("outbound parent %s differs from client span %s", parts[2], span.SpanContext().SpanID())
			}
			return
		}
	}
	t.Fatal("currency CLIENT span was not recorded")
}
