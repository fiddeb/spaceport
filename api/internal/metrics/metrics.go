package metrics

import (
	"go.opentelemetry.io/otel"

	"github.com/fiddeb/spaceport/api/internal/semconv"
)

var (
	BookingCount         semconv.SpaceportBookingCount
	BookingActive        semconv.SpaceportBookingActive
	DepartureActive      semconv.SpaceportDepartureActive
	PricingReqDuration   semconv.SpaceportPricingRequestDuration
	PricingFailuresCount semconv.SpaceportPricingFailuresCount
)

func init() {
	meter := otel.Meter("spaceport-api")

	BookingCount, _ = semconv.NewSpaceportBookingCount(meter)
	BookingActive, _ = semconv.NewSpaceportBookingActive(meter)
	DepartureActive, _ = semconv.NewSpaceportDepartureActive(meter)
	PricingReqDuration, _ = semconv.NewSpaceportPricingRequestDuration(meter)
	PricingFailuresCount, _ = semconv.NewSpaceportPricingFailuresCount(meter)
}
