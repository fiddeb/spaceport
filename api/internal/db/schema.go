package db

import (
	"context"
	"database/sql"
)

const createDepartures = `CREATE TABLE IF NOT EXISTS departures (
	id              INTEGER PRIMARY KEY,
	destination     TEXT    NOT NULL,
	departure_time  TEXT    NOT NULL,
	description     TEXT    NOT NULL,
	seat_classes    TEXT    NOT NULL,
	available_seats INTEGER NOT NULL DEFAULT 120
)`

const createBookings = `CREATE TABLE IF NOT EXISTS bookings (
	id               TEXT PRIMARY KEY,
	departure_id     INTEGER NOT NULL,
	passenger_name   TEXT    NOT NULL,
	seat_class       TEXT    NOT NULL,
	cryosleep_enabled INTEGER NOT NULL DEFAULT 0,
	extra_baggage    INTEGER NOT NULL DEFAULT 0,
	total_price      REAL    NOT NULL DEFAULT 0,
	currency         TEXT    NOT NULL DEFAULT 'UNC',
	status           TEXT    NOT NULL DEFAULT 'confirmed',
	error_reason     TEXT    NOT NULL DEFAULT '',
	created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (departure_id) REFERENCES departures(id)
)`

// Migrate creates tables if they don't exist.
func Migrate(ctx context.Context, db *sql.DB) error {
	if _, err := db.ExecContext(ctx, createDepartures); err != nil {
		return err
	}
	if _, err := db.ExecContext(ctx, createBookings); err != nil {
		return err
	}
	return nil
}
