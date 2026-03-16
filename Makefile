.DEFAULT_GOAL := help

.PHONY: help dev build push deploy test lint docs link-chart load-test

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

test: ## Run Playwright smoke tests
	cd tests/playwright && npx playwright test

lint: ## Validate the Weaver semantic convention registry
	weaver-otel registry check -r semconv/models/ -p semconv/policies/

docs: ## Generate markdown docs from the Weaver registry
	weaver-otel registry generate markdown docs/semconv -r semconv/models/ -t semconv/templates/registry

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
