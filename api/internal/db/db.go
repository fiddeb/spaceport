package db

import (
	"context"
	"database/sql"

	_ "modernc.org/sqlite"
)

// Open creates a *sql.DB backed by SQLite.
func Open(ctx context.Context, path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}

	if _, err := db.ExecContext(ctx, "PRAGMA journal_mode=WAL"); err != nil {
		db.Close()
		return nil, err
	}

	return db, nil
}
