package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/metric"

	"github.com/fiddeb/spaceport/api/internal/semconv"
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
		metric.WithExplicitBucketBoundaries(0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10),
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
			semconv.AttrHttpRequestMethod(method),
			semconv.AttrUrlSchemeKey.String(urlScheme),
		))

		start := time.Now()
		c.Next()
		elapsed := time.Since(start).Seconds()

		route := c.FullPath()
		if route == "" {
			route = "unmatched"
		}

		httpServerDuration.Record(ctx, elapsed, metric.WithAttributes(
			semconv.AttrHttpRequestMethod(method),
			semconv.AttrHttpResponseStatusCodeKey.Int(c.Writer.Status()),
			semconv.AttrHttpRouteKey.String(route),
			semconv.AttrUrlSchemeKey.String(urlScheme),
		))
		httpServerActiveReqs.Add(ctx, -1, metric.WithAttributes(
			semconv.AttrHttpRequestMethod(method),
			semconv.AttrUrlSchemeKey.String(urlScheme),
		))
	}
}

func scheme(c *gin.Context) string {
	if c.Request.TLS != nil {
		return "https"
	}
	return "http"
}
