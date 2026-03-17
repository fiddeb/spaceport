# Spaceport Agent Notes

> Observability demo app: React + Go API + Python pricing service, all fully instrumented with OpenTelemetry and Weaver-generated semantic conventions.

## Skills

- Use the **weaver-semconv** skill whenever working with `semconv/`, code generation, or OTel attributes.
- Use the **openspec-\*** skills for spec-driven change management under `openspec/`.
- If you find inaccuracies in a skill or fail to use it correctly, update the skill file.

---

## Architecture

Three services, each fully OTel-instrumented, all exporting to the OTel Collector in the observabilitystack:

```
Browser → Frontend (:5175/:3000)
             ↓ /api/*
          API (:8080) — SQLite (otelsql-wrapped)
             ↓ /prices  /recommendations
          Pricing Service (:8000)

All three → OTLP → otel-collector.k8s.test → Tempo / Prometheus / Loki / Grafana
```

**Service responsibilities:**
| Service | Purpose | Key files |
|---|---|---|
| `frontend/` | React SPA, bookings UI, OTel browser SDK | `src/instrumentation.ts`, `src/pages/`, `src/contexts/` |
| `api/` | REST API, SQLite, OTel middleware + spans | `main.go`, `internal/handler/`, `internal/db/`, `internal/semconv/` |
| `pricing-service/` | Pricing calc, chaos injection | `pricing_service/main.py`, `pricing.py`, `telemetry.py` |
| `semconv/` | Weaver registry (source of truth for all `spaceport.*` attributes) | `models/`, `templates/`, `policies/` |
| `openspec/` | Spec-driven change workflow | `config.yaml`, `changes/`, `specs/` |

---

## Conventions

### OTel & Semconv
- All custom attributes use the `spaceport.*` prefix (e.g., `spaceport.departure.id`, `spaceport.seat.class`).
- Attribute definitions live in `semconv/models/attributes/*.yaml` — **never hardcode attribute name strings**; use generated constants.
- After changing `semconv/models/`, always run `make generate` and commit generated files.
- `api/internal/semconv/` and `pricing_service/pricing_service/semconv/` are **generated** — don't hand-edit them.

### Git / Branches
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Feature branches: `feat/<change-name>`
- Run `make lint` and `make test` before opening a PR.

---

## Gotchas

- **OTel export is disabled if `OTEL_EXPORTER_OTLP_ENDPOINT` is not set.** Services skip all OTLP exporters by default to avoid connection errors in bare local dev.
- **Generated semconv code is NOT committed.** Run `make generate` after any registry change. CI will fail without it.
- **Frontend OTLP proxy**: Vite dev server proxies `/otlp/*` to `http://127.0.0.1:80` → otel-collector to avoid CORS.
- **`spaceport.k8s.test`** requires dnsmasq: `address=/.k8s.test/127.0.0.1`. Without it, ingress and OTLP collector are unreachable.
- **Helm chart is disabled by default** (`enabled: false` in `helm/spaceport/values.yaml`). Enable explicitly in the observabilitystack umbrella values.
- **Playwright tests are copy-sensitive** — they assert on specific UI text ("Departures", "Mars Colony Alpha", etc.). Changing copy breaks tests.
- No `go.work` or npm workspaces — each service manages its own dependencies independently.

---

## Shell: heredoc limitations

- **Output is truncated after the closing delimiter.** Any commands chained after `EOF` in the same call will run but their output is never shown.
- **Workaround:** Use `create_file` to write multi-line content, then reference it (e.g. `--body-file`) in a separate terminal call.
