## Why

The Spaceport Booking demo app needs a monorepo structure, build system, and deployment configuration before any service can be developed. Without a shared foundation — Docker Compose for local dev, Kubernetes manifests for deployment alongside the observability stack, and a consistent project layout — each service would be built in isolation with incompatible setups.

## What Changes

- Create monorepo directory structure: `frontend/`, `api/`, `pricing-service/`
- Add root `docker-compose.yaml` that builds and runs all three services with OTLP export to the external collector
- Add Kubernetes manifests (or Helm chart) for deploying the three services alongside the existing observability stack
- Add root `Makefile` or `justfile` with common commands: `dev`, `build`, `deploy`, `test`
- Add shared configuration for OTLP endpoint, service names, and environment variables
- Add `.env.example` with documented environment variables
- Add root `README.md` with quickstart instructions

## Non-goals

- Not implementing any service logic — this is infrastructure only
- No CI/CD pipeline in v1
- No Helm chart repository or versioning — plain manifests are sufficient
- No multi-environment config (staging, production) — local only
- No Ingress or TLS — services communicate via cluster DNS or localhost

## Capabilities

### New Capabilities
- `project-structure`: Monorepo layout, directory conventions, and shared tooling (Makefile/justfile)
- `docker-compose-dev`: Docker Compose configuration for local development with hot-reload and OTLP export
- `kubernetes-deployment`: Kubernetes manifests for deploying all services into the local cluster alongside the observability stack
- `shared-config`: Shared environment variables and configuration for OTLP endpoints, service naming, and ports

### Modified Capabilities
<!-- No existing capabilities to modify — greenfield project -->

## Impact

- Every service depends on this foundation for build and deployment
- The observability stack (external) must be reachable from the app services via configured OTLP endpoint
- Developers need Docker and optionally kubectl/k3d to run the project
- Port allocation must not conflict with the observability stack
