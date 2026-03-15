## 1. Repository Structure

- [x] 1.1 Create top-level directories: `frontend/`, `api/`, `pricing-service/`, `weaver/`, `helm/`, `tests/`, `docs/`
- [x] 1.2 Add `.gitkeep` files where directories start empty
- [x] 1.3 Add root `.gitignore` covering: `.env`, `*.sqlite`, `node_modules/`, `__pycache__/`, Go build artifacts, `dist/`

## 2. Weaver Registry

- [x] 2.1 Create `weaver/registry_manifest.yaml` with name `spaceport`, version `0.1.0`, importing OTel semconv v1.34.0 as dependency
- [x] 2.2 Define `spaceport.departure.*` attributes: `id` (string), `destination` (string), `departure_time` (string, ISO8601)
- [x] 2.3 Define `spaceport.booking.*` attributes: `id` (string), `status` (string enum: confirmed/failed)
- [x] 2.4 Define `spaceport.seat.*` attributes: `class` (string enum: economy-cryosleep/business-warp/first-class-nebula)
- [x] 2.5 Define `spaceport.pricing.*` attributes: `total` (double, unit: UNC), `promo_applied` (boolean), `base_currency` (string, constant "UNC"), `display_currency` (string enum: UNC/REP/LAT/QUA/NIN/BZD/COIN/TKN)
- [x] 2.6 Define `spaceport.chaos.*` attributes: `failure_mode` (string), `latency_ms` (int)
- [x] 2.7 Verify `weaver registry check -r weaver/` exits with code 0

## 3. Shared Configuration

- [ ] 3.1 Create `.env.example` with all variables: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_VERSION`, port overrides for each service, and `SPACEPORT_ENV`
- [ ] 3.2 Document service name constants in `docs/service-names.md`: `spaceport-frontend`, `spaceport-api`, `spaceport-pricing-service`

## 4. Docker Compose

- [ ] 4.1 Create `docker-compose.yaml` with services: `frontend` (port 3000), `api` (port 8080), `pricing-service` (port 8000)
- [ ] 4.2 Add `depends_on` with `condition: service_healthy` so `api` waits for `pricing-service`
- [ ] 4.3 Configure OTLP env vars on each service using `${OTEL_EXPORTER_OTLP_ENDPOINT}` from `.env`
- [ ] 4.4 Add named volume `spaceport-sqlite` mounted into `api` at `/data/spaceport.db`
- [ ] 4.5 Add health check endpoints to each service definition (`/api/health` for api, `/health` for pricing-service, HTTP check on port 3000 for frontend)
- [ ] 4.6 Test: copy `.env.example` to `.env`, run `docker-compose up --wait`, verify all services healthy

## 5. Helm Chart

- [ ] 5.1 Create `helm/spaceport/Chart.yaml` with `apiVersion: v2`, name `spaceport`, version `0.1.0`
- [ ] 5.2 Create `helm/spaceport/values.yaml` with keys: `enabled`, `otlpEndpoint`, `frontend.image`, `api.image`, `pricingService.image`, resource requests/limits
- [ ] 5.3 Create Deployment templates for `frontend`, `api`, `pricing-service` referencing image and OTLP values
- [ ] 5.4 Create Service templates (ClusterIP) for all three services with correct ports
- [ ] 5.5 Create ConfigMap template for shared OTLP and service name config
- [ ] 5.6 Create PersistentVolumeClaim template for SQLite volume (`api`)
- [ ] 5.7 Verify `helm lint helm/spaceport/` exits with code 0
- [ ] 5.8 Document `file://` dependency entry for observabilitystack `Chart.yaml` in `docs/helm-integration.md`

## 6. Makefile

- [ ] 6.1 Create root `Makefile` with targets: `help` (default, prints targets), `dev`, `build`, `deploy`, `test`, `lint`
- [ ] 6.2 `dev` target: `docker-compose up --build`
- [ ] 6.3 `build` target: `docker-compose build`
- [ ] 6.4 `deploy` target: `helm upgrade --install spaceport helm/spaceport/`
- [ ] 6.5 `test` target: `cd tests && npx playwright test`
- [ ] 6.6 `lint` target: `weaver registry check -r weaver/`
- [ ] 6.7 Add `link-chart` target that creates symlink from `../observabilitystack/helm/stackcharts/charts/spaceport` to `./helm/spaceport`

## 7. README

- [ ] 7.1 Write `README.md` with: project description, architecture diagram (ASCII), prerequisites, quickstart (`make dev`), link to `docs/demo-script.md`
- [ ] 7.2 Add port allocation table to README
