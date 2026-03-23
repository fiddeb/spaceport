package middleware

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"

	"github.com/fiddeb/spaceport/api/internal/semconv"
)

var tracer = otel.Tracer("spaceport-api")

// Tracing extracts W3C trace context from incoming requests and starts
// a server span named after the matched Gin route.
func Tracing() gin.HandlerFunc {
	prop := otel.GetTextMapPropagator()

	return func(c *gin.Context) {
		ctx := prop.Extract(c.Request.Context(), propagation.HeaderCarrier(c.Request.Header))

		route := c.FullPath()
		if route == "" {
			route = c.Request.URL.Path
		}
		spanName := fmt.Sprintf("%s %s", c.Request.Method, route)

		ctx, span := tracer.Start(ctx, spanName, trace.WithSpanKind(trace.SpanKindServer))
		defer span.End()

		c.Request = c.Request.WithContext(ctx)
		c.Next()

		status := c.Writer.Status()
		span.SetAttributes(
			semconv.AttrHttpRequestMethod(c.Request.Method),
			semconv.AttrHttpRouteKey.String(route),
			semconv.AttrHttpResponseStatusCodeKey.Int(status),
			semconv.AttrUrlPathKey.String(c.Request.URL.Path),
		)
		if status >= 400 {
			span.SetStatus(codes.Error, fmt.Sprintf("HTTP %d", status))
		}
	}
}
