# helm-chart Specification

## Purpose
TBD - created by archiving change project-foundation. Update Purpose after archive.
## Requirements
### Requirement: Helm chart structure in helm/spaceport/
The directory `helm/spaceport/` SHALL contain a valid Helm chart with `Chart.yaml`, `values.yaml`, and templates for: Deployment + Service for each of the three services, a ConfigMap for shared configuration, and a PersistentVolumeClaim for the SQLite volume.

#### Scenario: Helm lint passes
- **WHEN** `helm lint helm/spaceport/` is run
- **THEN** the command exits with code 0 and no errors or warnings

#### Scenario: Dry-run renders all expected resources
- **WHEN** `helm template spaceport helm/spaceport/ | grep "kind:"` is run
- **THEN** output contains Deployment (x3), Service (x3), ConfigMap (x1), PersistentVolumeClaim (x1)

### Requirement: Enabled/disabled via spaceport.enabled condition
The chart SHALL be disabled by default (`enabled: false`) and enabled by setting `spaceport.enabled: true` in the consuming umbrella chart's values.

#### Scenario: Chart can be enabled in umbrella values
- **WHEN** the observabilitystack umbrella chart has `spaceport.enabled: true` in its values
- **THEN** all spaceport resources are created in the cluster

#### Scenario: Chart is inert when disabled
- **WHEN** `spaceport.enabled: false`
- **THEN** no spaceport resources are deployed

### Requirement: OTLP endpoint configurable via values
The Helm chart SHALL expose `values.yaml` keys for: `otlpEndpoint` (default: `http://opentelemetry-collector:4317`), image tags for each service, resource requests/limits, and replica counts.

#### Scenario: OTLP endpoint override works
- **WHEN** `helm template` is run with `--set otlpEndpoint=http://custom:4317`
- **THEN** all three service Deployments reference that endpoint in their env vars

### Requirement: file:// dependency path documented
The observabilitystack `helm/stackcharts/Chart.yaml` SHALL include a dependency entry using `repository: "file://<path-to-spaceport-chart>"`. The spaceport README SHALL document the exact path convention and provide a `make link-chart` helper that creates a symlink.

#### Scenario: Umbrella chart resolves the subchart
- **WHEN** `helm dependency update helm/stackcharts/` is run with the spaceport path correctly set
- **THEN** the command succeeds and spaceport resources appear in `helm template` output

