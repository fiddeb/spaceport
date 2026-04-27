.DEFAULT_GOAL := help

.PHONY: help dev build push deploy test lint generate generate-go generate-python generate-typescript generate-grafana docs link-chart load-test telemetry-test

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Start all services locally with OTel export to the collector
	OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.k8s.test ./dev.sh

build: ## Build all Docker images
	docker-compose build

push: ## Push all Docker images to the registry
	docker-compose push

deploy: ## Deploy to Kubernetes via Helm
	helm upgrade --install spaceport helm/spaceport/ --set enabled=true

test: ## Run browser smoke tests with k6 (requires app running at FRONTEND_URL, default http://localhost:5175)
	@base_url=$${FRONTEND_URL:-http://localhost:5175}; \
	if ! curl -fsS "$$base_url" >/dev/null 2>&1; then \
		echo "Frontend not reachable at $$base_url"; \
		echo "Start app with 'make dev' or set FRONTEND_URL"; \
		exit 1; \
	fi; \
	pricing_url=$${PRICING_SERVICE_URL:-http://localhost:8000}; \
	k6 run -e FRONTEND_URL="$$base_url" tests/k6/browser/browse-departures.js && \
	k6 run -e FRONTEND_URL="$$base_url" tests/k6/browser/view-departure.js && \
	k6 run -e FRONTEND_URL="$$base_url" tests/k6/browser/place-booking.js && \
	k6 run -e FRONTEND_URL="$$base_url" -e PRICING_SERVICE_URL="$$pricing_url" tests/k6/browser/error-scenario.js && \
	k6 run -e FRONTEND_URL="$$base_url" -e PRICING_SERVICE_URL="$$pricing_url" tests/k6/browser/latency-scenario.js

lint: ## Validate the Weaver semantic convention registry
	weaver registry check -r semconv/models/ -p semconv/policies/

generate: generate-go generate-python generate-typescript generate-grafana ## Generate code from the Weaver semantic convention registry

generate-go: ## Generate Go semconv code
	weaver registry generate go api/internal/semconv -r semconv/models/ -t semconv/templates/registry

generate-python: ## Generate Python semconv code
	weaver registry generate python pricing-service/pricing_service/semconv -r semconv/models/ -t semconv/templates/registry

generate-typescript: ## Generate TypeScript semconv code
	weaver registry generate typescript frontend/src/semconv -r semconv/models/ -t semconv/templates/registry

generate-grafana: ## Generate Grafana dashboard from the Weaver registry
	weaver registry generate grafana docs/grafana -r semconv/models/ -t semconv/templates/registry

docs: ## Generate markdown docs from the Weaver registry
	weaver registry generate markdown docs/semconv -r semconv/models/ -t semconv/templates/registry

link-chart: ## Symlink helm/spaceport into the observabilitystack umbrella chart
	@target_dir="../observabilitystack/helm/stackcharts/charts"; \
	if [ ! -d "$$target_dir" ]; then \
		echo "Error: $$target_dir does not exist. Is observabilitystack checked out as a sibling?"; \
		exit 1; \
	fi; \
	ln -sfn "$$(pwd)/helm/spaceport" "$$target_dir/spaceport" && \
		echo "Linked $$(pwd)/helm/spaceport -> $$target_dir/spaceport"

load-test: ## Run k6 load test against the API
	k6 run tests/k6/booking-flow.js

telemetry-test: ## Run Weaver live-check conformance test (requires weaver, k6, uv, go)
	bash tests/telemetry/run.sh
