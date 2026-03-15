package db

import (
	"context"
	"database/sql"
	_ "embed"
	"encoding/json"
	"fmt"
)

//go:embed data/departures.json
var departuresJSON []byte

type seedDeparture struct {
	ID             int      `json:"id"`
	Destination    string   `json:"destination"`
	DepartureTime  string   `json:"departure_time"`
	Description    string   `json:"description"`
	SeatClasses    []string `json:"seat_classes"`
	AvailableSeats int      `json:"available_seats"`
}

// Seed inserts departure data if the table is empty.
func Seed(ctx context.Context, db *sql.DB) error {
	var count int
	if err := db.QueryRowContext(ctx, "SELECT COUNT(*) FROM departures").Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	var deps []seedDeparture
	if err := json.Unmarshal(departuresJSON, &deps); err != nil {
		return fmt.Errorf("unmarshal departures.json: %w", err)
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx,
		"INSERT INTO departures (id, destination, departure_time, description, seat_classes, available_seats) VALUES (?, ?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, d := range deps {
		classes, _ := json.Marshal(d.SeatClasses)
		if _, err := stmt.ExecContext(ctx, d.ID, d.Destination, d.DepartureTime, d.Description, string(classes), d.AvailableSeats); err != nil {
			return err
		}
	}

	return tx.Commit()
}
