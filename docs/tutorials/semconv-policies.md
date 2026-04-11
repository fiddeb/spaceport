# Semantic Convention Policies

All attributes, metrics, and events in the Spaceport registry are validated by a set of Rego policies executed by [Weaver](https://github.com/open-telemetry/weaver). The policy files live in `semconv/policies/` and are checked automatically by `make lint`, which runs:

```sh
weaver registry check -r semconv/models/ -p semconv/policies/
```

## Rules

| Policy | Phase | Description |
|---|---|---|
| `registry.rego` | before_resolution | Ensures attributes are defined inside a `registry.*` group with the correct type, that `ref` attributes do not appear in the registry, that `requirement_level` is only set on references, and that all attributes and semconv groups include a `stability` field. |
| `yaml_schema.rego` | before_resolution | Validates name format for attributes, metrics, events, and resources, and checks that group IDs follow the patterns `metric.{metric_name}`, `event.{name}`, and `resource.{name}`. |
| `metric_naming.rego` | before_resolution | Enforces OpenTelemetry naming conventions for metrics: lowercase only, must start with a letter, no consecutive `.` or `_`, requires a namespace, forbids the `_total` suffix on counters, and disallows pluralised UpDownCounter names. Only applies to local metrics, not external dependencies. |
| `attribute_name_collisions.rego` | after_resolution | Detects collisions where two attributes produce the same constant name (e.g. `foo.bar` and `foo_bar`), where an attribute name collides with a namespace, or where the same attribute is defined more than once in the same group. |
| `group_stability.rego` | after_resolution | Checks that stable groups do not reference experimental attributes with a `requirement_level` other than `opt_in`. |
| `platform_metrics.rego` | after_resolution | Requires metrics in the `platform.*` namespace to use only `counter` or `histogram` as their instrument and to have at least one required attribute. |
| `compatibility.rego` | comparison_after_resolution | Compares the current registry against a baseline and rejects backward-incompatible changes: removed attributes, degraded stability, changed types on stable attributes, removed enum members, and removed or altered metrics/resources/events. |
| `test_simple.rego` | before_resolution | A minimal test policy that denies a specific metric name — used to verify that the policy pipeline works. |

## Working with policies

Run `make lint` to validate the registry against all policies. This should always pass before you commit changes to `semconv/models/`.

To add a new rule, create a `.rego` file in `semconv/policies/`. Choose the right Rego package depending on when the rule should run:

- **`before_resolution`** — runs on raw YAML data before reference resolution; good for syntax and naming validations.
- **`after_resolution`** — runs after all `ref` attributes have been resolved; good for semantic checks.
- **`comparison_after_resolution`** — runs against both the baseline and the current registry; used for backward-compatibility checks.

Each rule produces a `deny` object with a description and metadata. Follow the pattern in the existing files — create a helper function for the violation object and one or more `deny contains ...` rules.

Test your policy locally with:

```sh
make lint
```

To debug a rule, first resolve the registry to JSON, then paste the output as input in the [Rego Playground](https://play.openpolicyagent.org/) along with your policy code:

```sh
weaver registry resolve -r semconv/models/ -o resolved.json -f json
```

If the playground returns `{ "deny": [] }` it means no rules triggered — the registry passes all policies without violations.

### Learning Rego

- [Weaver Checker](https://github.com/open-telemetry/weaver/blob/main/crates/weaver_checker/README.md) — Weaver-specific policy docs
- [OPA Policy Language](https://www.openpolicyagent.org/docs/policy-language) — complete learning guide
- [OPA Policy Reference](https://www.openpolicyagent.org/docs/policy-reference) — built-ins and syntax

