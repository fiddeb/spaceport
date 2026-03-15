.DEFAULT_GOAL := help

.PHONY: help dev build push deploy test lint link-chart

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Start all services locally with Docker Compose (hot-reload)
	docker-compose up --build

build: ## Build all Docker images
	docker-compose build

push: ## Push all Docker images to the registry
	docker-compose push

deploy: ## Deploy to Kubernetes via Helm
	helm upgrade --install spaceport helm/spaceport/ --set enabled=true

test: ## Run Playwright smoke tests
	cd tests && npx playwright test

lint: ## Validate the Weaver semantic convention registry
	weaver-otel registry check -r weaver/

link-chart: ## Symlink helm/spaceport into the observabilitystack umbrella chart
	@target_dir="../observabilitystack/helm/stackcharts/charts"; \
	if [ ! -d "$$target_dir" ]; then \
		echo "Error: $$target_dir does not exist. Is observabilitystack checked out as a sibling?"; \
		exit 1; \
	fi; \
	ln -sfn "$$(pwd)/helm/spaceport" "$$target_dir/spaceport" && \
		echo "Linked $$(pwd)/helm/spaceport -> $$target_dir/spaceport"
