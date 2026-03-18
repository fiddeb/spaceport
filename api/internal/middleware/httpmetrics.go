package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"

	"github.com/fiddeb/spaceport/api/internal/semconv"
)

var (
	httpServerDuration   semconv.HttpServerRequestDuration
	httpServerActiveReqs semconv.HttpServerActiveRequests
	httpMetricsEnabled   bool
)

func init() {
	meter := otel.Meter("spaceport-api")

	dur, err := semconv.NewHttpServerRequestDuration(meter)
	if err != nil {
		log.Printf("http metrics disabled: %v", err)
		return
	}
	active, err := semconv.NewHttpServerActiveRequests(meter)
	if err != nil {
		log.Printf("http metrics disabled: %v", err)
		return
	}

	httpServerDuration = dur
	httpServerActiveReqs = active
	httpMetricsEnabled = true
}

// HTTPMetrics returns a Gin middleware that records HTTP server metrics
// per OpenTelemetry semantic conventions.
func HTTPMetrics() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !httpMetricsEnabled {
			c.Next()
			return
		}

		ctx := c.Request.Context()
		method := c.Request.Method
		urlScheme := scheme(c)

		httpServerActiveReqs.Add(ctx, 1, method, urlScheme)

		start := time.Now()
		c.Next()
		elapsed := time.Since(start).Seconds()

		route := c.FullPath()
		if route == "" {
			route = "unmatched"
		}

		httpServerDuration.Record(ctx, elapsed, method, urlScheme,
			semconv.HttpResponseStatusCode(c.Writer.Status()),
			semconv.HttpRoute(route),
		)
		httpServerActiveReqs.Add(ctx, -1, method, urlScheme)
	}
}

func scheme(c *gin.Context) string {
	if c.Request.TLS != nil {
		return "https"
	}
	return "http"
}
