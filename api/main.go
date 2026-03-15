package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"

	"github.com/fiddeb/spaceport/api/internal/applog"
	"github.com/fiddeb/spaceport/api/internal/db"
	"github.com/fiddeb/spaceport/api/internal/handler"
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

	dbPath := envOr("SPACEPORT_DB_PATH", "spaceport.db")
	database, err := db.Open(ctx, dbPath)
	if err != nil {
		log.Fatalf("db open: %v", err)
	}
	defer database.Close()

	if err := db.Migrate(ctx, database); err != nil {
		log.Fatalf("db migrate: %v", err)
	}
	if err := db.Seed(ctx, database); err != nil {
		log.Fatalf("db seed: %v", err)
	}

	httpClient := &http.Client{
		Transport: otelhttp.NewTransport(http.DefaultTransport,
			otelhttp.WithSpanNameFormatter(func(_ string, r *http.Request) string {
				return "HTTP " + r.Method + " " + r.URL.Path
			}),
		),
		Timeout: 10 * time.Second,
	}

	pricingURL := envOr("PRICING_SERVICE_URL", "http://localhost:8000")
	frontendOrigin := envOr("SPACEPORT_FRONTEND_ORIGIN", "http://localhost:3000")

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
	r.Use(otelgin.Middleware("spaceport-api"))
	r.Use(middleware.HTTPMetrics())
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{frontendOrigin},
		AllowMethods: []string{"GET", "POST", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "traceparent", "tracestate"},
	}))

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

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
