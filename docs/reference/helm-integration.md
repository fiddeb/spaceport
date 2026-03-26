# Helm Integration

The Spaceport chart (`helm/spaceport/`) is designed to integrate into the [observabilitystack](https://github.com/fiddeb/observabilitystack) umbrella chart as a local `file://` subchart.

## Adding Spaceport to the Umbrella Chart

### 1. Ensure the chart path is reachable

The simplest approach is a symlink from inside the observabilitystack repo to this repo's Helm chart:

```
observabilitystack/
└── helm/
    └── stackcharts/
        └── charts/
            └── spaceport -> /path/to/spaceport/helm/spaceport
```

Use the Makefile helper:

```bash
make link-chart
```

This creates:

```
../observabilitystack/helm/stackcharts/charts/spaceport -> ./helm/spaceport
```

Both repos must be checked out as siblings for this to work by default. If your layout differs, pass the path explicitly:

```bash
ln -s "$(pwd)/helm/spaceport" ../observabilitystack/helm/stackcharts/charts/spaceport
```

### 2. Add the dependency entry in `helm/stackcharts/Chart.yaml`

```yaml
dependencies:
  # ... existing dependencies ...
  - name: spaceport
    version: "0.1.0"
    repository: "file://charts/spaceport"
    condition: spaceport.enabled
```

### 3. Enable in umbrella `values.yaml`

```yaml
spaceport:
  enabled: true
  otlpEndpoint: "http://opentelemetry-collector:4317"
```

### 4. Update dependencies and verify

```bash
helm dependency update helm/stackcharts/
helm template stackcharts helm/stackcharts/ | grep "kind:" | sort
```

## OTLP Endpoint

The chart defaults to `http://opentelemetry-collector:4317`, which matches the observabilitystack collector service name. Override via `values.yaml` or `--set`:

```bash
helm upgrade --install spaceport helm/spaceport/ \
  --set enabled=true \
  --set otlpEndpoint=http://my-collector:4317
```

## Disabling

The chart is disabled by default (`enabled: false`). It can be toggled without removing the dependency entry:

```yaml
# observabilitystack values.yaml
spaceport:
  enabled: false
```
