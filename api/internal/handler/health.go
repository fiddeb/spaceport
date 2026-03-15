package handler

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthHandler provides the health check endpoint.
type HealthHandler struct {
	DB *sql.DB
}

// Health handles GET /api/health.
func (h *HealthHandler) Health(c *gin.Context) {
	ctx := c.Request.Context()
	var count int
	if err := h.DB.QueryRowContext(ctx, "SELECT COUNT(*) FROM bookings").Scan(&count); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok", "bookings_count": count})
}
