package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestAPIChaosConsumesApplicationRequestsOnly(t *testing.T) {
	gin.SetMode(gin.TestMode)
	SetAPIFailure(1)
	t.Cleanup(func() { SetAPIFailure(0); SetAPILatency(0, 0) })

	router := gin.New()
	router.Use(APIChaos())
	router.GET("/api/health", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.POST("/api/chaos/simulate-failure", func(c *gin.Context) { c.Status(http.StatusOK) })
	router.GET("/api/departures", func(c *gin.Context) { c.Status(http.StatusOK) })

	for _, tc := range []struct {
		method, path string
		want         int
	}{
		{http.MethodGet, "/api/health", http.StatusOK},
		{http.MethodPost, "/api/chaos/simulate-failure", http.StatusOK},
		{http.MethodGet, "/api/departures", http.StatusServiceUnavailable},
		{http.MethodGet, "/api/departures", http.StatusOK},
	} {
		response := httptest.NewRecorder()
		router.ServeHTTP(response, httptest.NewRequest(tc.method, tc.path, nil))
		if response.Code != tc.want {
			t.Errorf("%s %s: status = %d, want %d", tc.method, tc.path, response.Code, tc.want)
		}
	}
}

func TestAPIChaosLatency(t *testing.T) {
	gin.SetMode(gin.TestMode)
	SetAPILatency(1, 40)
	t.Cleanup(func() { SetAPIFailure(0); SetAPILatency(0, 0) })
	router := gin.New()
	router.Use(APIChaos())
	router.GET("/api/departures", func(c *gin.Context) { c.Status(http.StatusOK) })
	start := time.Now()
	router.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/api/departures", nil))
	if elapsed := time.Since(start); elapsed < 40*time.Millisecond {
		t.Errorf("elapsed = %s, want at least 40ms", elapsed)
	}
}
