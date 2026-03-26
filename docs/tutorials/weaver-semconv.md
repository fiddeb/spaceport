# Working with Weaver & Semantic Conventions

This tutorial walks through the full workflow of defining, generating, and using semantic conventions in Spaceport via [OTel Weaver](https://github.com/open-telemetry/weaver).

## What you'll learn

- How the semconv registry (`semconv/models/`) is structured
- How to add a new custom attribute
- How to generate typed constants for Go, Python, and TypeScript
- How to validate your changes against OTel policies

## Prerequisites

- [Weaver CLI](https://github.com/open-telemetry/weaver) ≥ 0.22 installed
- The spaceport repo cloned and set up per the [Quickstart](../getting-started/quickstart.md)

---

## 1. The registry structure

All custom telemetry definitions live under `semconv/`:

```
semconv/
├── models/
│   ├── manifest.yaml     # Registry metadata and OTel dependency
│   ├── imports.yaml      # Imported OTel attribute groups and metrics
│   ├── attributes/       # Attribute definitions (spaceport.*)
│   │   ├── booking.yaml
│   │   ├── chaos.yaml
│   │   ├── departure.yaml
│   │   ├── exhibit.yaml
│   │   ├── pricing.yaml
│   │   └── seat.yaml
│   ├── spans/            # Span definitions with required/optional attributes
│   │   ├── booking.yaml
│   │   ├── frontend.yaml
│   │   └── pricing.yaml
│   └── metrics/          # Metric definitions (counters, histograms)
│       ├── booking.yaml
│       ├── frontend.yaml
│       └── pricing.yaml
├── templates/registry/   # Code generation templates per language
│   ├── go/
│   ├── python/
│   ├── typescript/
│   ├── grafana/
│   └── markdown/
└── policies/             # Rego policies for validation
```

The `manifest.yaml` declares the registry name and its OTel dependency:

```yaml
name: spaceport
description: Custom semantic conventions for the Spaceport booking demo app
schema_url: https://spaceport.example.com/schemas/v0.1.0
dependencies:
  - name: otel
    registry_path: https://github.com/open-telemetry/semantic-conventions/archive/refs/tags/v1.40.0.zip[model]
```

Standard OTel attributes (like `http.*`, `db.*`, `service.*`) are imported via `imports.yaml` — never redefined in your own attribute files.

Every `spaceport.*` attribute used anywhere in the codebase **must** be defined in this registry first.

## 2. Adding a new attribute

Say you want to track `spaceport.passenger.loyalty_tier` across services.

### Define the attribute

Create a new file `semconv/models/attributes/passenger.yaml`:

```yaml
groups:
  - id: registry.spaceport.passenger
    type: attribute_group
    brief: Attributes describing a passenger.
    stability: development
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

This runs `weaver registry check -r semconv/models/ -p semconv/policies/`. Fix any errors before proceeding.

### Generate code

```bash
make generate
```

This produces typed constants in:

- `api/internal/semconv/` — Go constants and helpers
- `pricing-service/pricing_service/semconv/` — Python constants
- `frontend/src/semconv/` — TypeScript constants

!!! warning
    Never hand-edit generated files in these directories. They will be overwritten on the next `make generate`.

## 3. Using generated constants

### Go (API service)

```go
import "github.com/fiddeb/spaceport/api/internal/semconv"

span.SetAttributes(
    semconv.AttrSpaceportPassengerLoyaltyTier("gold"),
)
```

The generated pattern is `AttrSpaceport<PascalCaseName>(value)` — returning an `attribute.KeyValue`.

### Python (Pricing service)

```python
from pricing_service.semconv.attribute import SPACEPORT_PASSENGER_LOYALTY_TIER

span.set_attribute(SPACEPORT_PASSENGER_LOYALTY_TIER, "gold")
```

Constants are `SCREAMING_SNAKE_CASE` strings in `pricing_service/semconv/attribute.py`.

### TypeScript (Frontend)

```typescript
import { SPACEPORT_PASSENGER_LOYALTY_TIER } from './semconv/attribute';

span.setAttribute(SPACEPORT_PASSENGER_LOYALTY_TIER, 'gold');
```

Generated constants live in `frontend/src/semconv/attribute.ts`.

## 4. Linking attributes to signals

The key mechanism is `ref:` — it links an attribute defined in `attributes/` to a metric, span, or event. You never redefine the attribute; you reference it by its `id`.

### How `ref:` works

Attributes are defined once in `semconv/models/attributes/`:

```yaml
# attributes/seat.yaml
groups:
  - id: registry.spaceport.seat
    type: attribute_group
    brief: Seat attributes.
    stability: development
    attributes:
      - id: spaceport.seat.class          # ← this is the attribute id
        type: string
        stability: development
        brief: The seat class for the booking.
        examples: ["economy-cryosleep", "business-warp"]
```

Then a metric or span **references** that attribute by its `id`:

```yaml
# metrics/booking.yaml
groups:
  - id: metric.spaceport.booking.count
    type: metric
    metric_name: spaceport.booking.count
    instrument: counter
    unit: "{booking}"
    brief: Number of booking attempts processed by the API.
    stability: development
    attributes:
      - ref: spaceport.seat.class           # ← links to the attribute above
        requirement_level: recommended
      - ref: spaceport.booking.status       # ← another attribute from booking.yaml
        requirement_level: required
```

The `ref:` value must exactly match an attribute `id` from the registry.

### Requirement levels

Each `ref:` specifies how important the attribute is for that signal:

| Level | Meaning |
|-------|---------|
| `required` | Must always be present |
| `recommended` | Should be present when available |
| `opt_in` | Only set when explicitly configured |
| `conditionally_required` | Required under certain conditions (add `condition:` text) |

### The same attribute, many signals

A single attribute can be referenced by multiple metrics and spans. For example, `spaceport.seat.class` is used by:

- `spaceport.booking.count` (metric) — as `recommended`
- `spaceport.booking.active` (metric) — as `recommended`
- `spaceport.booking.create` (span) — as `required`

This is the whole point of the registry: define once, reference everywhere, generate consistent code for all languages.

### Span definition

```yaml
groups:
  - id: span.spaceport.passenger.check_in
    type: span
    span_kind: server
    brief: Passenger check-in processing.
    stability: development
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
    stability: development
    attributes:
      - ref: spaceport.passenger.loyalty_tier
        requirement_level: recommended
```

## 5. Validation policies

Weaver validates your registry against Rego policies in `semconv/policies/`. These enforce rules like:

- All `spaceport.*` attributes must have `stability` set
- Metric names must follow naming conventions (namespaced, lowercase)
- Attribute names must not collide

Run validation:

```bash
make lint
```

## Next steps

- Browse the full [Attribute Registry](../semconv/attributes/README.md)
- See [Spaceport Spans](../semconv/spaceport/spans.md) for all defined span schemas
- Read the [Instrumentation Walk-through](../presentation/instrumentation-walkthrough.md) for a live code tour
