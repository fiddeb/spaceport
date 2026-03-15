## Why

The demo needs a frontend that lets a user browse spaceport departures, view details, and book a trip — generating browser-level traces, fetch spans, and user interaction events. Without a frontend, there's no way to demonstrate end-to-end distributed traces from user click to backend response, which is the core value proposition of the demo.

## What Changes

- Scaffold a React + Vite + TypeScript application in `frontend/`
- Initialize shadcn with preset `aJx2k9T` for a futuristic spaceport aesthetic
- Build pages: destination list (`/`), departure detail (`/departures/:id`), booking form (`/book/:id`), booking confirmation
- Integrate OpenTelemetry browser SDK with automatic fetch/XHR instrumentation
- Add custom spans for key user interactions: "browse destinations", "view departure", "place booking"
- Add custom events for business milestones: "booking_completed", "booking_failed"
- Capture and report frontend JavaScript errors as span events
- Configure W3C trace context propagation on all fetch calls to the Go API
- Add Dockerfile for production build (nginx serving static assets)

## Non-goals

- No server-side rendering (SSR) — pure SPA is sufficient for this demo
- No state management library (Redux, Zustand) — React state and context are enough
- No authentication or user accounts
- No real payment flow
- No Web Vitals reporting in v1 (can be added later)
- No i18n — English only with spaceport humor

## Capabilities

### New Capabilities
- `frontend-ui`: React pages and components for the spaceport booking flow — destination list, departure details, booking form, confirmation
- `frontend-otel`: Browser OpenTelemetry instrumentation — auto-instrumentation for fetch/XHR, custom spans for user interactions, error capture, W3C trace context propagation

### Modified Capabilities
<!-- No existing capabilities to modify -->

## Impact

- Depends on `project-foundation` for Docker and build tooling
- Depends on `spaceport-api` for data (can use mock data during standalone development)
- Requires the Go API to accept CORS and propagate W3C `traceparent` headers
- Adds ~50MB to Docker image (nginx + static assets)
- Port 3000 for dev server, port 80 in container
