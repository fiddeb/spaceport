## Context

Greenfield monorepo. Three services (React frontend, Go API, Python pricing-service) need a shared build/run/deploy foundation before any feature work begins. The observabilitystack already runs in a local Kubernetes cluster via ArgoCD and an umbrella Helm chart (`helm/stackcharts`). Spaceport must integrate with that setup with minimal friction.

## Goals / Non-Goals

**Goals:**
- Establish a consistent monorepo directory layout all developers can rely on
- Single command to bring up all three services for local dev
- Helm chart that slots into the existin observabilitystack umbrella chart as a `file://` subchart
- OTel Weaver registry defining custom `spaceport.*` attributes as a source-of-truth for telemetry naming

**Non-Goals:**
- CI/CD pipelines — local tooling only for v1
- Multi-environment configs (staging/prod)
- Ingress or TLS — port-forward or NodePort for local access
- Published Helm chart repository

## Decisions

### 1. Flat monorepo with top-level service directories

**Decision**: Service directories live at the repo root (`frontend/`, `api/`, `pricing-service/`, `weaver/`, `helm/`, `tests/`).

**Rationale**: Keeps paths short and obvious. With only three services there's no need for a nested `services/` wrapper. Every directory is immediately self-describing.

**Alternative considered**: `apps/` or `services/` wrapper — rejected as unnecessary indirection for a small repo.

### 2. Makefile as the task runner

**Decision**: Use a root `Makefile` with targets: `dev`, `build`, `push`, `deploy`, `test`, `lint`.

**Rationale**: `make` is universally available with no install step. `justfile` is nicer but requires installing `just`. For a demo app that prioritizes zero-friction setup, `make` wins.

**Alternative considered**: `justfile` — nice syntax, but adds a dependency.

### 3. Docker Compose for local dev, Helm chart for Kubernetes

**Decision**: `docker-compose.yaml` at root for local development. Separate Helm chart in `helm/spaceport/` for Kubernetes deployment.

**Rationale**: Docker Compose gives fast iteration (hot-reload, no image builds for some changes). The Helm chart is for the real demo environment (the local K8s cluster). Both point to the same OTLP endpoint, just configured via environment variables.

**Alternative considered**: Dev in K8s only (Skaffold/Tilt) — too much overhead for fast iteration. Instead: `docker-compose up` for development, Helm for demo day.

### 4. Helm chart as `file://` subchart in observabilitystack

**Decision**: The spaceport Helm chart (`helm/spaceport/`) is referenced from observabilitystack as a local `file://` path in `helm/stackcharts/Chart.yaml` dependencies. Enabled via `spaceport.enabled: true` in values.

**Rationale**: This is the exact same pattern used by `mimir-distributed` in the observabilitystack repo. No chart repository needed, no versioning complexity.

**Alternative considered**: Separate Helm values overlay — more indirection, harder to manage.

### 5. OTel Weaver registry in `weaver/`

**Decision**: Custom semantic convention registry in `weaver/registry_manifest.yaml` importing the official OTel semconv v1.34.0 as a dependency. All `spaceport.*` custom attributes defined here.

**Rationale**: Following the OTel Weaver pattern from the official blog (2025), custom attributes must have a canonical definition to avoid drift. Weaver's `registry check` command validates naming conventions and prevents collisions with standard semconv. Generated constants ensure span attribute names are never hardcoded strings in the service code.

**Namespace rule**: All custom attributes use `spaceport.` prefix: `spaceport.departure.id`, `spaceport.booking.id`, `spaceport.seat.class`, etc. Standard semconv attributes (`http.*`, `db.*`, `server.*`, `service.*`) are used as-is — never re-declared in the custom registry.

**Alternative considered**: Freeform attribute names per service — causes the exact drift problem Weaver exists to solve.

## Risks / Trade-offs

- **file:// subchart path is relative to observabilitystack** → Documentation must clearly state the expected checkout layout (e.g., `~/src/spaceport` and `~/src/observabilitystack` as siblings, or an explicit path override in values). Mitigation: Document in README and provide a `make link-chart` target.
- **Docker Compose and K8s config diverge over time** → Mitigated by sharing `.env`/ConfigMap values and keeping service configs thin.
- **Weaver CLI is an extra dev dependency** → Weaver is a single binary, available via `brew install otel-weaver` or GitHub releases. Makefile `lint` target runs `weaver registry check` but it's non-blocking in v1.

## Open Questions

- Should the Helm chart include an `initContainer` to seed the SQLite database, or should the Go API handle seeding on first startup? → Lean toward API-handled seeding to keep the chart simple.
- Port range to use to avoid colliding with observabilitystack? → Reserve 3000 (frontend), 8080 (api), 8000 (pricing-service). Confirm against observabilitystack port allocations.
