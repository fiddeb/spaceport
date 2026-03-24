# project-structure Specification

## Purpose
TBD - created by archiving change project-foundation. Update Purpose after archive.
## Requirements
### Requirement: Monorepo directory layout
The repository SHALL contain top-level directories: `frontend/`, `api/`, `pricing-service/`, `weaver/`, `helm/`, `tests/`, `docs/`. No service code SHALL live outside its designated top-level directory.

#### Scenario: New developer can orient immediately
- **WHEN** a developer clones the repo and runs `ls`
- **THEN** the purpose of each directory is self-evident from its name

### Requirement: Root Makefile with standard targets
The repository SHALL provide a root `Makefile` with targets: `dev` (start all services via Docker Compose), `build` (build all Docker images), `push` (push images), `deploy` (apply Helm chart), `test` (run Playwright smoke tests), `lint` (run Weaver registry check). Each target SHALL print a brief description when invoked.

#### Scenario: Start all services with one command
- **WHEN** a developer runs `make dev` from the repo root
- **THEN** Docker Compose starts all three services within 60 seconds and prints each service's URL

#### Scenario: Unknown target shows help
- **WHEN** a developer runs `make` with no arguments
- **THEN** available targets and their descriptions are printed

### Requirement: Root README with quickstart
The repository SHALL contain a `README.md` with: project description, prerequisites list (Docker, kubectl, Helm, Weaver CLI), `make dev` quickstart, link to demo script, and architecture diagram.

#### Scenario: Quickstart works end-to-end
- **WHEN** a developer follows the README prerequisites and `make dev` steps on a fresh machine
- **THEN** the frontend is accessible at `http://localhost:3000` within 5 minutes

### Requirement: Weaver registry directory
The repository SHALL contain a `weaver/` directory with `registry_manifest.yaml` defining the `spaceport` custom registry that imports OTel semconv v1.34.0 as a dependency.

#### Scenario: Weaver registry check passes
- **WHEN** a developer runs `weaver registry check -r weaver/`
- **THEN** the command exits with code 0 and no errors reported

