# Semantic Convention Templates

Weaver uses Jinja2 templates to generate type-safe code and documentation from the registry in `semconv/models/`. The templates live in `semconv/templates/registry/` and are organised by target language:

```
semconv/templates/registry/
├── go/            → api/internal/semconv/
├── python/        → pricing-service/pricing_service/semconv/
├── typescript/    → frontend/src/semconv/
├── markdown/      → docs/semconv/
└── grafana/       → docs/grafana/
```

Run `make generate` to regenerate all targets at once, or use a specific target:

```sh
make generate-go
make generate-python
make generate-typescript
make generate-grafana
make docs
```

## Targets

| Target | weaver.yaml | Templates | Description |
|---|---|---|---|
| `go` | `go/weaver.yaml` | `attribute.go.j2`, `metric.go.j2`, `span.go.j2` | Generates attribute constants, typed metric instruments, and span helpers for the Go API service. |
| `python` | `python/weaver.yaml` | `attribute.py.j2`, `metric.py.j2`, `span.py.j2` | Generates attribute constants, metric helpers, and span helpers for the Python pricing service. |
| `typescript` | `typescript/weaver.yaml` | `attribute.ts.j2`, `metric.ts.j2`, `span.ts.j2` | Generates attribute constants, metric helpers, and span helpers for the React frontend. |
| `grafana` | `grafana/weaver.yaml` | `dashboard.json.j2` | Generates a Grafana dashboard JSON with panels for all registry metrics. |
| `markdown` | `markdown/weaver.yaml` | Multiple `.md.j2` files | Generates human-readable reference docs grouped by namespace (attributes, metrics, spans, events). |

## How a target works

Each target directory contains a `weaver.yaml` configuration and one or more `.j2` templates.

### weaver.yaml

The configuration file tells Weaver which templates to run, how to filter registry data, and where to write the output. A typical entry looks like this:

```yaml
templates:
  - pattern: metric.go.j2
    filter: >
      .groups
      | map(select(.type == "metric" and .instrument != "gauge"))
      | { metrics: . }
    application_mode: single
    file_name: metric.go
```

- **`pattern`** — the Jinja2 template file to render.
- **`filter`** — a JQ expression that selects and shapes the registry data passed to the template as `ctx`.
- **`application_mode`** — `single` renders the template once with all matched data; `each` renders once per item (used by the markdown target to create one file per namespace).
- **`file_name`** — output filename. Can use Jinja2 expressions for `each` mode (e.g. `{{ctx.namespace}}/metrics.md`).

The file also defines `text_maps` for type mappings (e.g. `string` → `str` in Python) and `comment_formats` for doc-comment style.

### .j2 templates

Templates receive the filtered data as `ctx` and use standard Jinja2 syntax. Common patterns across our templates:

- **Name conversion macros** — each target defines a macro (e.g. `go_name`, `smart_title_case`) that converts dotted attribute names like `spaceport.departure.id` into language-idiomatic identifiers like `SpaceportDepartureId`.
- **`map_text`** — maps registry types to language types using the `text_maps` in `weaver.yaml` (e.g. `int` → `int64` in Go, `number` in TypeScript).
- **`comment`** — formats `brief` descriptions as language-appropriate comments.

All generated files include a "DO NOT MODIFY" header pointing back to the source template.

## Working with templates

To modify generated output, edit the `.j2` template and/or the `weaver.yaml` filter — never edit the generated files directly.

After making changes, regenerate and verify:

```sh
make generate
make lint
make test
```

To debug what data a template receives, you can add `{{ debug(ctx) }}` inside a `.j2` file. This prints the full context as JSON during generation. Remove it before committing.

To inspect the resolved registry data that feeds into the JQ filters:

```sh
weaver registry resolve -r semconv/models/ -o resolved.json -f json
```

You can then test JQ filter expressions against `resolved.json` using the [JQ playground](https://www.devtoolsdaily.com/jq_playground/) or locally with `jq`.
