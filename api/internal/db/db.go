package db

import (
	"context"
	"database/sql"

	"github.com/XSAM/otelsql"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	_ "modernc.org/sqlite"
)

// Open creates a *sql.DB backed by SQLite with otelsql tracing.
func Open(ctx context.Context, path string) (*sql.DB, error) {
	db, err := otelsql.Open("sqlite", path,
		otelsql.WithAttributes(semconv.DBSystemKey.String("sqlite")),
		otelsql.WithSpanOptions(otelsql.SpanOptions{
			DisableErrSkip: true,
		}),
	)
	if err != nil {
		return nil, err
	}

	if _, err := db.ExecContext(ctx, "PRAGMA journal_mode=WAL"); err != nil {
		db.Close()
		return nil, err
	}

	return db, nil
}
