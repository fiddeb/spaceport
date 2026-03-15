package telemetry

import (
	"context"
	"os"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

// Setup initialises the OTel TracerProvider and MeterProvider with OTLP gRPC exporters.
func Setup(ctx context.Context) (shutdown func(), err error) {
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName("spaceport-api"),
			semconv.ServiceVersion(envOr("OTEL_SERVICE_VERSION", "0.0.0")),
			semconv.DeploymentEnvironment(envOr("SPACEPORT_ENV", "local")),
		),
	)
	if err != nil {
		return nil, err
	}

	traceExp, err := otlptracehttp.New(ctx, otlptracehttp.WithInsecure())
	if err != nil {
		return nil, err
	}
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(traceExp),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(tp)

	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	metricExp, err := otlpmetrichttp.New(ctx, otlpmetrichttp.WithInsecure())
	if err != nil {
		_ = tp.Shutdown(ctx)
		return nil, err
	}
	mp := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExp)),
		sdkmetric.WithResource(res),
	)
	otel.SetMeterProvider(mp)

	return func() {
		_ = tp.Shutdown(context.Background())
		_ = mp.Shutdown(context.Background())
	}, nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
