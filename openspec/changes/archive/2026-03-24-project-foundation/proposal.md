## Why

The Spaceport Booking demo app needs a monorepo structure, build system, and deployment configuration before any service can be developed. Without a shared foundation — Docker Compose for local dev, a Helm chart consumable by the observabilitystack umbrella chart, and a consistent project layout — each service would be built in isolation with incompatible setups.

## What Changes

- Create monorepo directory structure: `frontend/`, `api/`, `pricing-service/`
- Add root `docker-compose.yaml` that builds and runs all three services with OTLP export to the external collector
- Build a Helm chart in `helm/spaceport/` deployable as a local `file://` subchart inside the observabilitystack umbrella chart (`helm/stackcharts/charts/spaceport`), following the same pattern as `mimir-distributed`
- Chart includes Deployments, Services, ConfigMaps, and a PVC for the SQLite volume
- `values.yaml` exposes OTLP endpoint, image tags, replica counts, and resource limits
- Add root `Makefile` or `justfile` with common commands: `dev`, `build`, `deploy`, `test`
- Add shared configuration for OTLP endpoint, service names, and environment variables
- Add `.env.example` with documented environment variables
- Add root `README.md` with quickstart instructions

## Non-goals

- Not implementing any service logic — this is infrastructure only
- No CI/CD pipeline in v1
- No published Helm chart repository — local `file://` reference is sufficient
- No multi-environment config (staging, production) — local only
- No Ingress or TLS in v1 — port-forward or NodePort for local access

## Capabilities

### New Capabilities
- `project-structure`: Monorepo layout, directory conventions, and shared tooling (Makefile/justfile)
- `docker-compose-dev`: Docker Compose configuration for local development with hot-reload and OTLP export
- `helm-chart`: Helm chart for deploying all three spaceport services as a local subchart of the observabilitystack umbrella chart, with configurable values for OTLP endpoint, images, and resources
- `shared-config`: Shared environment variables and configuration for OTLP endpoints, service naming, and ports

### Modified Capabilities
<!-- No existing capabilities to modify — greenfield project -->

## Impact

- Every service depends on this foundation for build and deployment
- The observability stack (external) must be reachable from the app services via configured OTLP endpoint
- Developers need Docker for local dev; the observabilitystack repo must be checked out and the spaceport chart path symlinked or copied into `helm/stackcharts/charts/`
- Port allocation must not conflict with the observability stack
- The chart is enabled/disabled via a `spaceport.enabled` condition in the umbrella chart's `values.yaml`
