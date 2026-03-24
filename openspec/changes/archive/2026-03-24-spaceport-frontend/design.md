## Context

The frontend is the entry point for every demo. Users interact with it to generate browser-level telemetry — fetch spans, user interaction events, page load traces — which must propagate trace context to the Go backend to form end-to-end distributed traces in Tempo. The visual theme (shadcn preset `aJx2k9T`) gives a futuristic, premium spaceport feel without building a custom design system.

## Goals / Non-Goals

**Goals:**
- A React + Vite + TypeScript SPA with shadcn preset `aJx2k9T` for futuristic aesthetics
- Pages that naturally generate interesting telemetry through normal user interaction
- W3C `traceparent` propagated on every fetch call to the backend
- Custom spans and events for business milestones (add to cart, booking completed)
- Frontend JS errors captured as span events

**Non-Goals:**
- SSR — pure SPA is sufficient
- Real state management library — React useState/useContext is enough
- User authentication or accounts
- i18n — English with spaceport humor throughout
- Web Vitals reporting in v1

## Decisions

### 1. shadcn with preset aJx2k9T

**Decision**: Initialize shadcn with `npx shadcn init --preset aJx2k9T`. No custom design tokens will be created — use the preset's palette as-is.

**Rationale**: The preset gives a futuristic aesthetic suited to a spaceport theme immediately, without spending time on visual design. Consistent dark-mode-first components convey a premium feel appropriate for space travel pricing.

**Alternative considered**: Tailwind from scratch — substantially more time on styling, less time on telemetry which is the actual content of the demo.

### 2. OpenTelemetry Browser SDK with auto-instrumentation

**Decision**: Use `@opentelemetry/sdk-trace-web`, `@opentelemetry/instrumentation-fetch`, and `@opentelemetry/instrumentation-xml-http-request`. Configure W3C trace context propagation. Initialize once in `src/instrumentation.ts`, imported first in `src/main.tsx`.

**Rationale**: Auto-instrumentation for fetch/XHR with no manual work per request immediately demonstrates cross-service trace context propagation without requiring developers to instrument each API call. This is the primary value of the demo — it just works after SDK setup.

**Alternative considered**: Manual fetch wrapping — more code, harder to demo as "zero config". The auto-instrumentation is more impressive and more educational.

### 3. Custom spans via React hooks

**Decision**: Create a `useSpan` hook in `src/hooks/useSpan.ts` that wraps `tracer.startActiveSpan(...)` for use in event handlers. Custom spans for: `user.browse_departures`, `user.view_departure`, `user.place_booking`.

**Rationale**: This makes the instrumentation visible and understandable in the source code — when demoing, you can point to the hook call and explain the span. It also gives rich context to traces without polluting component logic.

**Naming**: Span names follow OTel semantic conventions — `{namespace}.{verb}_{noun}` in snake_case.

### 4. Page routing with React Router

**Decision**: Use React Router v6 with routes: `/` (departure list), `/departures/:id` (detail), `/book/:id` (booking form), `/confirmation/:bookingId` (confirmation).

**Rationale**: Standard, minimal, and gives distinct page-level spans per route. React Router's lazy loading can also demonstrate page-load spans if wanted later.

### 5. Error boundaries capture JS errors as span events

**Decision**: Wrap the app in an `ErrorBoundary` component that records caught errors to the active span via `span.recordException(error)` before rendering a fallback UI.

**Rationale**: Frontend errors appearing in traces is a compelling demo scenario — shows how OTel works uniformly for errors, not just happy paths.

## Risks / Trade-offs

- **CORS must be correctly configured on the Go API** → Without correct CORS, `traceparent` headers are stripped or rejected. Mitigation: Go API must allow `traceparent` in CORS allowed headers. Noted in spaceport-api design.
- **Browser SDK bundle size** → OTel browser SDK adds ~50kB gzip. Acceptable for a demo app.
- **Safari compatibility with fetch instrumentation** → OTel fetch instrumentation has known quirks in Safari. Mitigation: Demo targets Chrome/Firefox. Document this.
- **shadcn preset availability** → The preset `aJx2k9T` must be accessible at demo time. Mitigation: Cache preset config in repo.

## Open Questions

- Should the booking confirmation page poll the API for booking status, or is a static confirmation sufficient? → Static confirmation is sufficient for v1 — no polling complexity needed.
