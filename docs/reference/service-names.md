# Service Name Constants

All Spaceport services report a fixed `service.name` OTel resource attribute. These constants are the same in Docker Compose and Kubernetes and must not be changed without updating dashboards and alerts.

| Service         | `service.name`                  | Port  |
|-----------------|---------------------------------|-------|
| Frontend        | `spaceport-frontend`            | 3000  |
| API             | `spaceport-api`                 | 8080  |
| Pricing Service | `spaceport-pricing-service`     | 8000  |

## Usage

Set `OTEL_SERVICE_NAME` as an environment variable on each service container, or configure the value directly in the service's OTel SDK setup.

**Docker Compose** — set per service in `docker-compose.yaml`:

```yaml
environment:
  OTEL_SERVICE_NAME: spaceport-api
```

**Kubernetes** — set via the ConfigMap defined in `helm/spaceport/templates/configmap.yaml`:

```yaml
data:
  OTEL_SERVICE_NAME: spaceport-api
```

## Port Allocation

These ports are reserved for Spaceport and must not conflict with the observabilitystack:

| Service         | Port  |
|-----------------|-------|
| Frontend        | 3000  |
| API             | 8080  |
| Pricing Service | 8000  |

These are defined as overrideable defaults in `.env.example`.
