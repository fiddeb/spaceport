.DEFAULT_GOAL := help

.PHONY: help dev build push deploy test lint generate generate-go generate-python generate-grafana docs link-chart load-test

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

test: ## Run Playwright smoke tests (requires app running at PLAYWRIGHT_BASE_URL, default http://localhost:5175)
	@base_url=$${PLAYWRIGHT_BASE_URL:-http://localhost:5175}; \
	if ! curl -fsS "$$base_url" >/dev/null 2>&1; then \
		echo "Playwright target not reachable at $$base_url"; \
		echo "Start app with 'make dev' or set PLAYWRIGHT_BASE_URL"; \
		exit 1; \
	fi; \
	cd tests/playwright && PLAYWRIGHT_BASE_URL="$$base_url" npx playwright test

lint: ## Validate the Weaver semantic convention registry
	weaver registry check -r semconv/models/ -p semconv/policies/

generate: generate-go generate-python generate-grafana ## Generate code from the Weaver semantic convention registry

generate-go: ## Generate Go semconv code
	weaver registry generate go api/internal/semconv -r semconv/models/ -t semconv/templates/registry

generate-python: ## Generate Python semconv code
	weaver registry generate python pricing-service/pricing_service/semconv -r semconv/models/ -t semconv/templates/registry

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
