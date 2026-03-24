## ADDED Requirements

### Requirement: Service name constants
Each service SHALL set the OTel resource attribute `service.name` to a fixed, documented value: `spaceport-frontend`, `spaceport-api`, `spaceport-pricing-service`. These values SHALL be the same in Docker Compose and Kubernetes.

#### Scenario: Traces are attributed to the correct service
- **WHEN** a request flows through all three services
- **THEN** Tempo shows three distinct service names matching the documented constants

### Requirement: Environment variable convention
All spaceport-specific configuration SHALL be passed via environment variables following the pattern `SPACEPORT_<SERVICE>_<KEY>`. OTel SDK configuration SHALL use the standard `OTEL_*` variables. A `.env.example` file SHALL define all variables.

#### Scenario: Service starts with only .env.example values
- **WHEN** `.env` is an unmodified copy of `.env.example`
- **THEN** all services start without errors and connect to the default collector endpoint

### Requirement: Port allocation registry
The following ports SHALL be reserved and not conflict with the observabilitystack: `3000` (frontend dev), `8080` (api), `8000` (pricing-service). The README SHALL document this allocation.

#### Scenario: No port conflicts in default setup
- **WHEN** the observabilitystack and spaceport are both running via Docker Compose
- **THEN** no port binding errors occur with default configuration

### Requirement: Weaver registry as source of truth for custom attribute names
The `weaver/` directory SHALL be the canonical source of truth for all `spaceport.*` attribute names. Service code MAY use generated constants from the Weaver registry. No `spaceport.*` attribute name SHALL be used in code that is not defined in `weaver/`.

#### Scenario: Custom attribute names are consistent across services
- **WHEN** `weaver registry check -r weaver/` is run
- **THEN** no naming collisions or format violations are reported

#### Scenario: New custom attribute is added to registry before use
- **WHEN** a developer adds a new `spaceport.*` attribute to service code
- **THEN** the attribute MUST first be defined in `weaver/` and pass `weaver registry check`
