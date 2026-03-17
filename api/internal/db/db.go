package db

import (
	"context"
	"database/sql"

	"github.com/XSAM/otelsql"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	_ "modernc.org/sqlite"
)

// Open creates a *sql.DB backed by SQLite with OTel tracing on every query.
func Open(ctx context.Context, path string) (*sql.DB, error) {
	driverName, err := otelsql.Register("sqlite",
		otelsql.WithAttributes(semconv.DBSystemSqlite),
	)
	if err != nil {
		return nil, err
	}

	db, err := sql.Open(driverName, path)
	if err != nil {
		return nil, err
	}

	if _, err := db.ExecContext(ctx, "PRAGMA journal_mode=WAL"); err != nil {
		db.Close()
		return nil, err
	}

	// Report connection pool metrics via OTel.
	if _, err := otelsql.RegisterDBStatsMetrics(db, otelsql.WithAttributes(semconv.DBSystemSqlite)); err != nil {
		db.Close()
		return nil, err
	}

	return db, nil
}
