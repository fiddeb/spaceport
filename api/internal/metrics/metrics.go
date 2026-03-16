package metrics

import (
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/metric"

	"github.com/fiddeb/spaceport/api/internal/semconv"
)

var (
	BookingCount         semconv.SpaceportBookingCount
	PricingReqDuration   semconv.SpaceportPricingRequestDuration
	PricingFailuresCount metric.Int64Counter
)

func init() {
	meter := otel.Meter("spaceport-api")

	BookingCount, _ = semconv.NewSpaceportBookingCount(meter)
	PricingReqDuration, _ = semconv.NewSpaceportPricingRequestDuration(meter)

	PricingFailuresCount, _ = meter.Int64Counter("spaceport.pricing.failures.count",
		metric.WithDescription("Number of pricing service call failures"),
		metric.WithUnit("{failure}"),
	)
}
