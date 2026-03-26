# Working with Weaver & Semantic Conventions

This tutorial walks through the full workflow of defining, generating, and using semantic conventions in Spaceport via [OTel Weaver](https://github.com/open-telemetry/weaver).

## What you'll learn

- How the semconv registry (`semconv/models/`) is structured
- How to add a new custom attribute
- How to generate typed constants for Go and Python
- How to validate your changes against OTel policies

## Prerequisites

- [Weaver CLI](https://github.com/open-telemetry/weaver) ≥ 0.22 installed
- The spaceport repo cloned and set up per the [Quickstart](../getting-started/quickstart.md)

---

## 1. The registry structure

All custom telemetry definitions live under `semconv/models/`:

```
semconv/
├── models/
│   ├── attributes/       # Attribute definitions (spaceport.*, http.*, etc.)
│   │   ├── exhibit.yaml
│   │   ├── departure.yaml
│   │   ├── seat.yaml
│   │   └── ...
│   ├── spans/            # Span definitions with required/optional attributes
│   │   ├── frontend.yaml
│   │   ├── api.yaml
│   │   └── pricing.yaml
│   ├── metrics/          # Metric definitions (counters, histograms)
│   │   ├── frontend.yaml
│   │   ├── api.yaml
│   │   └── pricing.yaml
│   └── events/           # Event definitions
├── templates/            # Jinja2 templates for code generation
├── policies/             # Rego policies for validation
└── weaver.yaml           # Weaver configuration
```

Every `spaceport.*` attribute used anywhere in the codebase **must** be defined in this registry first.

## 2. Adding a new attribute

Say you want to track `spaceport.passenger.loyalty_tier` across services.

### Define the attribute

Create or edit a file in `semconv/models/attributes/`:

```yaml
groups:
  - id: registry.spaceport.passenger
    type: attribute_group
    display_name: Spaceport Passenger Attributes
    brief: Attributes describing a passenger.
    attributes:
      - id: spaceport.passenger.loyalty_tier
        type: string
        stability: development
        brief: The passenger's loyalty program tier.
        examples: ["bronze", "silver", "gold", "platinum"]
```

### Validate

```bash
make lint
```

This runs `weaver registry check` against your models and OTel policies. Fix any errors before proceeding.

### Generate code

```bash
make generate
```

This produces typed constants in:

- `api/internal/semconv/` — Go constants
- `pricing_service/pricing_service/semconv/` — Python constants

!!! warning
    Never hand-edit generated files. They will be overwritten on the next `make generate`.

## 3. Using generated constants

### Go (API service)

```go
import "spaceport/internal/semconv"

span.SetAttributes(
    semconv.SpaceportPassengerLoyaltyTier("gold"),
)
```

### Python (Pricing service)

```python
from pricing_service.semconv import SpaceportAttributes

span.set_attribute(
    SpaceportAttributes.SPACEPORT_PASSENGER_LOYALTY_TIER, "gold"
)
```

### TypeScript (Frontend)

The frontend currently uses string constants. Generated TypeScript support is planned.

## 4. Defining spans and metrics

Beyond attributes, you can define complete span and metric schemas:

### Span definition

```yaml
groups:
  - id: span.spaceport.passenger.check_in
    type: span
    span_kind: server
    brief: Passenger check-in processing.
    attributes:
      - ref: spaceport.passenger.loyalty_tier
        requirement_level: recommended
      - ref: spaceport.departure.id
        requirement_level: required
```

### Metric definition

```yaml
groups:
  - id: metric.spaceport.passenger.check_ins
    type: metric
    metric_name: spaceport.passenger.check_ins
    instrument: counter
    unit: "{check_in}"
    brief: Number of passenger check-ins.
    attributes:
      - ref: spaceport.passenger.loyalty_tier
        requirement_level: recommended
```

## 5. Validation policies

Weaver validates your registry against policies in `semconv/policies/`. These enforce rules like:

- All `spaceport.*` attributes must have `stability` set
- Metric names must follow naming conventions
- Span definitions must reference existing attributes

Run validation:

```bash
make lint
```

## Next steps

- Browse the full [Attribute Registry](../semconv/attributes/README.md)
- See [Spaceport Spans](../semconv/spaceport/spans.md) for all defined span schemas
- Read the [Instrumentation Walk-through](../presentation/instrumentation-walkthrough.md) for a live code tour
