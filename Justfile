set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# Show available recipes
default: help

# Show available recipes
help:
  @just --list

# Start all services locally with OTel export to the collector
dev:
  OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.k8s.test ./dev.sh

# Build all Docker images
build:
  docker-compose build

# Push all Docker images to the registry
push:
  docker-compose push

# Deploy to Kubernetes via Helm
deploy:
  helm upgrade --install spaceport helm/spaceport/ --set enabled=true

# Run Playwright smoke tests (requires app running at PLAYWRIGHT_BASE_URL, default http://localhost:5175)
test:
  #!/usr/bin/env bash
  base_url="${PLAYWRIGHT_BASE_URL:-http://localhost:5175}"
  if ! curl -fsS "$base_url" >/dev/null 2>&1; then
    echo "Playwright target not reachable at $base_url"
    echo "Start app with 'make dev' or set PLAYWRIGHT_BASE_URL"
    exit 1
  fi
  cd tests/playwright
  PLAYWRIGHT_BASE_URL="$base_url" npx playwright test

# Validate the Weaver semantic convention registry
lint:
  weaver registry check -r semconv/models/ -p semconv/policies/

# Generate code from the Weaver semantic convention registry
generate: generate-go generate-python generate-grafana

# Generate Go semconv code
generate-go:
  weaver registry generate go api/internal/semconv -r semconv/models/ -t semconv/templates/registry

# Generate Python semconv code
generate-python:
  weaver registry generate python pricing-service/pricing_service/semconv -r semconv/models/ -t semconv/templates/registry

# Generate Grafana dashboard from the Weaver registry
generate-grafana:
  weaver registry generate grafana docs/grafana -r semconv/models/ -t semconv/templates/registry

# Generate markdown docs from the Weaver registry
docs:
  weaver registry generate markdown docs/semconv -r semconv/models/ -t semconv/templates/registry

# Symlink helm/spaceport into the observabilitystack umbrella chart
link-chart:
  #!/usr/bin/env bash
  target_dir="../observabilitystack/helm/stackcharts/charts"
  if [[ ! -d "$target_dir" ]]; then
    echo "Error: $target_dir does not exist. Is observabilitystack checked out as a sibling?"
    exit 1
  fi
  ln -sfn "$(pwd)/helm/spaceport" "$target_dir/spaceport"
  echo "Linked $(pwd)/helm/spaceport -> $target_dir/spaceport"

# Run k6 load test against the API
load-test:
  k6 run tests/k6/booking-flow.js
