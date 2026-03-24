# docker-compose-dev Specification

## Purpose
TBD - created by archiving change project-foundation. Update Purpose after archive.
## Requirements
### Requirement: Docker Compose starts all three services
The `docker-compose.yaml` at the repo root SHALL define services for `frontend`, `api`, and `pricing-service` with health checks, and a `depends_on` chain ensuring the api starts after pricing-service.

#### Scenario: All services start with health checks green
- **WHEN** `docker-compose up --wait` is run
- **THEN** all three services reach healthy state within 60 seconds

#### Scenario: Frontend can reach the API
- **WHEN** the stack is running
- **THEN** `http://localhost:3000` returns a 200 response and the page loads

### Requirement: OTLP export to external collector
Each service in Docker Compose SHALL be configured via environment variables to export OTLP traces, metrics, and logs to the collector endpoint defined in `.env`. The default endpoint SHALL be `http://otel-collector:4317` to match the observabilitystack's collector service name.

#### Scenario: Override collector endpoint via .env
- **WHEN** `OTEL_EXPORTER_OTLP_ENDPOINT` is set in `.env`
- **THEN** all services use that endpoint without requiring Docker Compose restarts beyond `docker-compose up`

### Requirement: .env.example documents all variables
A `.env.example` file SHALL document all required and optional environment variables with inline comments. Developers SHALL copy it to `.env` to get a working local setup.

#### Scenario: .env.example is complete
- **WHEN** a developer copies `.env.example` to `.env` without changes
- **THEN** `make dev` starts successfully in the default local setup

### Requirement: Named Docker volumes for persistent data
The `api` service SHALL mount a named Docker volume for the SQLite database file to persist data across container restarts.

#### Scenario: Bookings persist across restart
- **WHEN** a booking is placed and the `api` container is restarted
- **THEN** the booking is still visible after restart

