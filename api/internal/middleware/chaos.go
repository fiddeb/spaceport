package middleware

import (
	"net/http"
	"strings"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"

	"github.com/fiddeb/spaceport/api/internal/semconv"
)

var apiFailureRemaining atomic.Int32
var apiLatencyRemaining atomic.Int32
var apiLatencyMillis atomic.Int64

func SetAPIFailure(count int) { apiFailureRemaining.Store(int32(count)) }

func SetAPILatency(count, millis int) {
	apiLatencyMillis.Store(int64(millis))
	apiLatencyRemaining.Store(int32(count))
}

func consume(remaining *atomic.Int32) bool {
	for {
		current := remaining.Load()
		if current <= 0 {
			return false
		}
		if remaining.CompareAndSwap(current, current-1) {
			return true
		}
	}
}

// APIChaos affects the next application requests while leaving health and control routes usable.
func APIChaos() gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path
		if c.Request.Method == http.MethodOptions || path == "/api/health" ||
			strings.HasPrefix(path, "/api/chaos/") || strings.HasPrefix(path, "/chaos/") {
			c.Next()
			return
		}
		span := trace.SpanFromContext(c.Request.Context())
		if consume(&apiFailureRemaining) {
			span.AddEvent("chaos.failure_triggered", trace.WithAttributes(semconv.AttrSpaceportChaosFailureMode("api_failure")))
			span.SetStatus(codes.Error, "simulated API failure")
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "simulated API failure"})
			return
		}
		if consume(&apiLatencyRemaining) {
			millis := apiLatencyMillis.Load()
			span.AddEvent("chaos.latency_injected", trace.WithAttributes(semconv.AttrSpaceportChaosLatencyMs(int(millis))))
			select {
			case <-time.After(time.Duration(millis) * time.Millisecond):
			case <-c.Request.Context().Done():
				c.Abort()
				return
			}
		}
		c.Next()
	}
}
