package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"
)

var (
	httpServerDuration   metric.Float64Histogram
	httpServerActiveReqs metric.Int64UpDownCounter
)

func init() {
	meter := otel.Meter("spaceport-api")

	httpServerDuration, _ = meter.Float64Histogram(
		"http.server.request.duration",
		metric.WithDescription("Duration of HTTP server requests"),
		metric.WithUnit("s"),
	)

	httpServerActiveReqs, _ = meter.Int64UpDownCounter(
		"http.server.active_requests",
		metric.WithDescription("Number of active HTTP server requests"),
		metric.WithUnit("{request}"),
	)
}

// HTTPMetrics returns a Gin middleware that records HTTP server metrics
// per OpenTelemetry semantic conventions.
func HTTPMetrics() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		method := c.Request.Method
		urlScheme := scheme(c)

		httpServerActiveReqs.Add(ctx, 1, metric.WithAttributes(
			attribute.String("http.request.method", method),
			attribute.String("url.scheme", urlScheme),
		))

		start := time.Now()
		c.Next()
		elapsed := time.Since(start).Seconds()

		route := c.FullPath()
		if route == "" {
			route = "unmatched"
		}

		httpServerDuration.Record(ctx, elapsed, metric.WithAttributes(
			attribute.String("http.request.method", method),
			attribute.Int("http.response.status_code", c.Writer.Status()),
			attribute.String("http.route", route),
			attribute.String("url.scheme", urlScheme),
		))
		httpServerActiveReqs.Add(ctx, -1, metric.WithAttributes(
			attribute.String("http.request.method", method),
			attribute.String("url.scheme", urlScheme),
		))
	}
}

func scheme(c *gin.Context) string {
	if c.Request.TLS != nil {
		return "https"
	}
	return "http"
}
