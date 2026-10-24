package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/baggage"
	"go.opentelemetry.io/otel/propagation"
)

func TestTracingBaggageLimits(t *testing.T) {
	previous := otel.GetTextMapPropagator()
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{}, propagation.Baggage{},
	))
	t.Cleanup(func() { otel.SetTextMapPropagator(previous) })

	for _, tc := range []struct {
		name    string
		headers []string
		want    string
	}{
		{name: "valid", headers: []string{"customer=regular"}, want: "regular"},
		{name: "valid multiple fields", headers: []string{"tier=gold", "customer=regular"}, want: "regular"},
		{name: "oversized whitespace", headers: []string{"customer=" + strings.Repeat(" ", 16384) + "regular"}},
		{name: "oversized duplicate members", headers: []string{strings.Repeat("customer=regular,", 1024) + "customer=regular"}},
		{name: "oversized combined fields", headers: []string{"tier=gold" + strings.Repeat(" ", 4096), "customer=regular" + strings.Repeat("\t", 4096)}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			router := gin.New()
			router.Use(Tracing())
			router.GET("/health", func(c *gin.Context) {
				got := baggage.FromContext(c.Request.Context()).Member("customer").Value()
				if got != tc.want {
					t.Errorf("propagated customer = %q, want %q", got, tc.want)
				}
				c.Status(http.StatusOK)
			})
			req := httptest.NewRequest(http.MethodGet, "/health", nil)
			for _, header := range tc.headers {
				req.Header.Add("baggage", header)
			}
			response := httptest.NewRecorder()
			router.ServeHTTP(response, req)
			if response.Code != http.StatusOK {
				t.Errorf("status = %d, want %d", response.Code, http.StatusOK)
			}
		})
	}
}
