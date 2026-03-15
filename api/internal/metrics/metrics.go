package metrics

import (
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/metric"
)

var (
	BookingCount         metric.Int64Counter
	PricingReqDuration   metric.Float64Histogram
	PricingFailuresCount metric.Int64Counter
)

func init() {
	meter := otel.Meter("spaceport-api")

	BookingCount, _ = meter.Int64Counter("spaceport.booking.count",
		metric.WithDescription("Number of booking attempts"),
		metric.WithUnit("{booking}"),
	)

	PricingReqDuration, _ = meter.Float64Histogram("spaceport.pricing.request.duration",
		metric.WithDescription("Duration of pricing service requests"),
		metric.WithUnit("ms"),
	)

	PricingFailuresCount, _ = meter.Int64Counter("spaceport.pricing.failures.count",
		metric.WithDescription("Number of pricing service call failures"),
		metric.WithUnit("{failure}"),
	)
}
