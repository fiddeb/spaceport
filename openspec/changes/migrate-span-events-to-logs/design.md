## Context

All three Spaceport services currently emit domain events using the Span Event API (`Span.AddEvent`, `Span.RecordException`). OpenTelemetry is deprecating this API in favor of log-based events emitted via the Logs API, correlated with spans through context ([OTEP 4430](https://github.com/open-telemetry/opentelemetry-specification/blob/fd43145dde7e5192ebc59a20992d98a3e6af5553/oteps/4430-span-event-api-deprecation-plan.md)).

Current state per service:

| Service | Span event calls | Log bridge in place? |
|---|---|---|
| Frontend (React) | 10 `addEvent` + 1 `recordException` | Yes — `LoggerProvider` + OTLP log exporter already configured. Many call sites already emit a parallel `logger.emit(...)` alongside `span.addEvent(...)`. |
| Go API | 1 `span.AddEvent` | Yes — `otelslog` bridge + `fanoutHandler` (stdout JSON + OTLP) |
| Python pricing | 2 `span.add_event` | Yes — Python `logging` + OTel logging bridge |

The frontend is the most interesting case: it already has duplicate emission (span event + log-based event) in most places. The migration is mostly about removing the span event call and ensuring the log-based event carries the event name.

## Goals / Non-Goals

**Goals:**
- Remove all `Span.AddEvent` and `Span.RecordException` calls across all three services
- Emit equivalent events via each service's existing Logs API bridge
- Register all events in the Weaver semconv registry as `type: event` groups
- Generate typed event helpers from registry definitions (where template support exists)
- Maintain trace correlation — events MUST still appear correlated with the span they belong to

**Non-Goals:**
- No backend/collector changes — existing OTLP log pipeline handles this
- No new OTel SDK dependencies for Go or Python (bridges already exist)
- No migration of OTel-standard exceptions beyond `ErrorBoundary.recordException` — `Span.RecordException` usage is a single call site and maps to a log with `exception.*` attributes
- No Grafana dashboard changes — Loki already receives these logs and Tempo shows linked log panels
- No codegen for Go events — the Go API has a single event (`booking_completed`) and the existing `slog.InfoContext` pattern is direct enough; typed helpers would be over-engineering

## Decisions

### D1: Use the top-level EventName field for log-based events
The OTel Logs Data Model defines `EventName` as a **top-level field** on LogRecord (same level as `Body`, `Timestamp`, `Attributes`). Per the spec: *"A log record with non-empty event name is interpreted as an event record."* Each service uses the EventName field through whatever mechanism its SDK/bridge exposes:

- **Frontend (JS)**: `logger.emit({ eventName: "booking_completed", ... })` — the `@opentelemetry/api-logs` `LogRecord` interface has a native `eventName?: string` field.
- **Go API**: The `otelslog` bridge (v0.17.0) does not expose EventName through slog. Use `"event.name"` as a slog attribute for now — this lands in OTLP log attributes. In a future upgrade, the bridge or a direct `log.Record.SetEventName()` call can promote it to the top-level field.
- **Python**: The OTel logging bridge maps Python `logging.LogRecord` fields to OTLP. Use `extra={"event.name": "..."}` which lands in attributes. Same upgrade path as Go when the bridge adds native EventName support.

**Alternative considered:** Using `body` as event name — rejected because `body` is meant for human-readable text and backends don't index it for event filtering. Also considered putting `event.name` only in attributes everywhere — works but misses the spec's intended top-level field for JS where it's already supported.

### D2: Frontend — remove span.addEvent, add eventName to existing logger.emit
Most frontend call sites already have both `span.addEvent(...)` and `logger.emit(...)`. The migration adds the `eventName` field to the existing `logger.emit` call and removes the `span.addEvent` call. No new emission code needed in most places.

For `CurrencyContext.tsx` and `ChaosMenu.tsx` success paths (which lack a parallel `logger.emit`), add the log emission with `eventName`.

**Alternative considered:** Creating a wrapper function that emits to both during a transition period — rejected because the frontend already has dual emission; we just cut over.

### D3: Go API — add event.name attribute to existing slog call
The single `span.AddEvent("booking_completed", ...)` in `bookings.go` is already next to a `slog.InfoContext` call. Add `"event.name", "booking_completed"` to the existing slog call and remove the `span.AddEvent`. The `otelslog` bridge places this in OTLP log attributes (not the top-level EventName). When the bridge gains native EventName support, the attribute can be promoted.

### D4: Python pricing — add event.name to existing logging calls
The chaos events in `main.py` already have `logger.error(...)` / `logger.warning(...)` calls adjacent to the `span.add_event(...)` calls. Add `event.name` to the existing log calls' extra kwargs and remove the `span.add_event` calls. Same EventName promotion path as Go.

### D5: Register all events in semconv as type: event
Only `exhibit_viewed` is currently registered. Add registry definitions for all events with their expected attributes. Group them by service in the models directory.

### D6: No codegen for events in this change
Event helpers are straightforward enough (a log emit with eventName + attributes) that codegen would add complexity without proportional benefit. The semconv registry definitions serve as documentation and validation source. Codegen can be added later if the event catalog grows.

**Alternative considered:** Generating typed event emitters per language — deferred to a follow-up if event count grows beyond ~15.

## Risks / Trade-offs

- **[Risk: Backend event display]** Some Grafana/Tempo timeline views may show span events differently from log-based events. → Mitigation: Log-based events are already flowing to Loki; Tempo's "Logs for this span" panel surfaces them. Verify in Grafana after migration.
- **[Risk: Duplicate events during rollout]** If changes are partially deployed, some events fire twice (span event + log event). → Mitigation: All three services are deployed together; the frontend already has dual emission that we're deduplicating, not introducing.
- **[Trade-off: event.name discoverability]** Log-based events require querying Loki by `event_name` label rather than expanding span events inline. This is a different UX but aligns with the OTel direction.
