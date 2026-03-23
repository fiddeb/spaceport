package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"

	"github.com/fiddeb/spaceport/api/internal/applog"
	"github.com/fiddeb/spaceport/api/internal/db"
	"github.com/fiddeb/spaceport/api/internal/handler"
	"github.com/fiddeb/spaceport/api/internal/metrics"
	"github.com/fiddeb/spaceport/api/internal/middleware"
	"github.com/fiddeb/spaceport/api/internal/telemetry"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	logger := applog.New()

	shutdown, err := telemetry.Setup(ctx)
	if err != nil {
		log.Fatalf("telemetry setup: %v", err)
	}
	defer shutdown()

	startCtx, startSpan := otel.Tracer("spaceport-api").Start(ctx, "startup",
		trace.WithSpanKind(trace.SpanKindInternal),
	)

	dbPath := envOr("SPACEPORT_DB_PATH", "spaceport.db")
	database, err := db.Open(startCtx, dbPath)
	if err != nil {
		startSpan.End()
		log.Fatalf("db open: %v", err)
	}
	defer database.Close()

	if err := db.Migrate(startCtx, database); err != nil {
		startSpan.End()
		log.Fatalf("db migrate: %v", err)
	}
	if err := db.Seed(startCtx, database); err != nil {
		startSpan.End()
		log.Fatalf("db seed: %v", err)
	}

	// Set initial values for active gauges from DB state.
	initActiveMetrics(startCtx, database)
	startSpan.End()

	httpClient := &http.Client{
		Timeout: 10 * time.Second,
	}

	pricingURL := envOr("PRICING_SERVICE_URL", "http://localhost:8000")
	frontendOrigin := envOr("SPACEPORT_FRONTEND_ORIGIN", "http://localhost:5175")

	depHandler := &handler.DepartureHandler{
		DB:         database,
		PricingURL: pricingURL,
		HTTPClient: httpClient,
		Logger:     logger,
	}
	bookHandler := &handler.BookingHandler{
		DB:         database,
		PricingURL: pricingURL,
		HTTPClient: httpClient,
		Logger:     logger,
	}
	healthHandler := &handler.HealthHandler{DB: database}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Tracing())
	r.Use(middleware.HTTPMetrics())
	r.Use(middleware.InstrumentedCORS(cors.Config{
		AllowOrigins: localhostOrigins(frontendOrigin),
		AllowMethods: []string{"GET", "POST", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "traceparent", "tracestate"},
	}, logger))

	api := r.Group("/api")
	api.GET("/departures", depHandler.ListDepartures)
	api.GET("/departures/:id", depHandler.GetDeparture)
	api.GET("/currencies", depHandler.GetCurrencies)
	api.POST("/bookings", bookHandler.CreateBooking)
	api.GET("/health", healthHandler.Health)

	addr := envOr("SPACEPORT_ADDR", ":8080")
	srv := &http.Server{Addr: addr, Handler: r}

	go func() {
		logger.Info("starting spaceport-api", "addr", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	<-ctx.Done()
	logger.Info("shutting down")
	shutCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutCtx)
}

// localhostOrigins returns both localhost and 127.0.0.1 variants of the given
// origin so that either form works in a browser.
func localhostOrigins(origin string) []string {
	origins := []string{origin}
	switch {
	case strings.Contains(origin, "://localhost"):
		origins = append(origins, strings.Replace(origin, "://localhost", "://127.0.0.1", 1))
	case strings.Contains(origin, "://127.0.0.1"):
		origins = append(origins, strings.Replace(origin, "://127.0.0.1", "://localhost", 1))
	}
	return origins
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func initActiveMetrics(ctx context.Context, database *sql.DB) {
	var depCount int
	if err := database.QueryRowContext(ctx, "SELECT COUNT(*) FROM departures").Scan(&depCount); err == nil {
		metrics.DepartureActive.Add(ctx, float64(depCount))
	}
	var bookCount int
	if err := database.QueryRowContext(ctx, "SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'").Scan(&bookCount); err == nil {
		metrics.BookingActive.Add(ctx, float64(bookCount))
	}
}
