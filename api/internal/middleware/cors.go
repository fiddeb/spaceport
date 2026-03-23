package middleware

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"

	"github.com/fiddeb/spaceport/api/internal/semconv"
)

// InstrumentedCORS wraps gin-contrib/cors so that a CORS rejection (403) is
// visible in traces and logs instead of silently aborting the request.
func InstrumentedCORS(cfg cors.Config, logger *slog.Logger) gin.HandlerFunc {
	corsHandler := cors.New(cfg)

	return func(c *gin.Context) {
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
