package middleware

import (
	"fmt"
	"log/slog"
	"net/http"
	"sync/atomic"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"

	"github.com/fiddeb/spaceport/api/internal/semconv"
)

// corsBlockRemaining is the number of requests that should be rejected with
// a simulated CORS 403. Decremented atomically on each blocked request.
var corsBlockRemaining atomic.Int32

// SetCORSBlock sets the number of upcoming requests to reject with a CORS 403.
func SetCORSBlock(count int) {
	corsBlockRemaining.Store(int32(count))
}

// InstrumentedCORS wraps gin-contrib/cors so that a CORS rejection (403) is
// visible in traces and logs instead of silently aborting the request.
// It also supports chaos injection via SetCORSBlock.
func InstrumentedCORS(cfg cors.Config, logger *slog.Logger) gin.HandlerFunc {
	corsHandler := cors.New(cfg)

	return func(c *gin.Context) {
		// Chaos: simulate CORS block if counter > 0
		if corsBlockRemaining.Load() > 0 {
			corsBlockRemaining.Add(-1)
			origin := c.Request.Header.Get("Origin")
			if origin == "" {
				origin = "(no Origin header)"
			}
			reason := fmt.Sprintf("Chaos: simulated CORS rejection for origin %q", origin)

			span := trace.SpanFromContext(c.Request.Context())
			span.SetStatus(codes.Error, reason)
			span.SetAttributes(
				semconv.AttrErrorType("cors_origin_not_allowed"),
				semconv.AttrErrorMessage(reason),
			)

			logger.ErrorContext(c.Request.Context(), reason,
				"origin", origin,
				"allowed_origins", cfg.AllowOrigins,
				"http.response.status_code", 403,
				"chaos", true,
			)

			c.AbortWithStatus(http.StatusForbidden)
			return
		}

		corsHandler(c)

		if c.IsAborted() && c.Writer.Status() == http.StatusForbidden {
			origin := c.Request.Header.Get("Origin")
			reason := fmt.Sprintf("CORS policy rejected origin %q", origin)

			span := trace.SpanFromContext(c.Request.Context())
			span.SetStatus(codes.Error, reason)
			span.SetAttributes(
				semconv.AttrErrorType("cors_origin_not_allowed"),
				semconv.AttrErrorMessage(reason),
			)

			logger.ErrorContext(c.Request.Context(), reason,
				"origin", origin,
				"allowed_origins", cfg.AllowOrigins,
				"http.response.status_code", 403,
			)
		}
	}
}
