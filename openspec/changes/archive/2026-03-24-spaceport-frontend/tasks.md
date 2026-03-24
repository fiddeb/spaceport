## 1. Project Scaffold

- [x] 1.1 Run `npm create vite@latest frontend -- --template react-ts` to scaffold the project
- [x] 1.2 Initialize shadcn with `npx shadcn init --preset aJx2k9T` inside `frontend/`
- [x] 1.3 Install React Router: `npm install react-router-dom`
- [x] 1.4 Install OTel browser SDK packages: `@opentelemetry/sdk-trace-web`, `@opentelemetry/instrumentation-fetch`, `@opentelemetry/instrumentation-xml-http-request`, `@opentelemetry/exporter-trace-otlp-http`, `@opentelemetry/resources`, `@opentelemetry/semantic-conventions`
- [x] 1.5 Add `VITE_OTEL_EXPORTER_OTLP_ENDPOINT` and `VITE_SERVICE_VERSION` to `.env.example`
- [x] 1.6 Create `frontend/Dockerfile` with multi-stage build: Node build stage → nginx serving `dist/`

## 2. OTel SDK Initialization

- [x] 2.1 Create `src/instrumentation.ts` that initializes `WebTracerProvider` with `BatchSpanProcessor` and `OTLPTraceExporter` pointing to `VITE_OTEL_EXPORTER_OTLP_ENDPOINT`
- [x] 2.2 Configure `W3CTraceContextPropagator` as the global propagator
- [x] 2.3 Register `FetchInstrumentation` and `XMLHttpRequestInstrumentation` with the provider
- [x] 2.4 Set resource attributes: `service.name = "spaceport-frontend"`, `service.version` from env var, `deployment.environment.name = "local"`
- [x] 2.5 Import `./instrumentation` as the first line of `src/main.tsx`
- [x] 2.6 Verify: open browser DevTools Network tab, confirm `traceparent` header is present on fetch to `/api/departures`

## 3. Routing

- [x] 3.1 Set up React Router in `src/main.tsx` with routes: `/`, `/departures/:id`, `/book/:id`, `/confirmation/:bookingId`
- [x] 3.2 Create page components: `DepartureListPage`, `DepartureDetailPage`, `BookingFormPage`, `ConfirmationPage`
- [x] 3.3 Create `useSpan` hook in `src/hooks/useSpan.ts` wrapping `tracer.startActiveSpan`

## 4. Departure List Page

- [x] 4.1 Fetch `GET /api/departures` on mount, render list of departure cards using shadcn `Card` component
- [x] 4.2 Show destination name, departure time, and a `Button` linking to `/departures/:id`
- [x] 4.3 Add loading skeleton (shadcn `Skeleton`) while fetching
- [x] 4.4 Start `user.browse_departures` span on page mount, end on unmount

## 5. Departure Detail Page

- [x] 5.1 Fetch `GET /api/departures/:id` on mount, render destination name, description, pricing breakdown, and seat class options
- [x] 5.2 Display recommendations section with links to other departures
- [x] 5.3 Add "Book Now" button linking to `/book/:id`
- [x] 5.4 Start `user.view_departure` span with attributes `spaceport.departure.id` and `spaceport.departure.destination`

## 6. Booking Form Page

- [x] 6.1 Build form with: text input for passenger name, shadcn `Select` for seat class (economy-cryosleep / business-warp / first-class-nebula), `Switch` for cryosleep and extra baggage
- [x] 6.2 Add at least three humorous strings in UI labels: "Economy Cryosleep", "Window Seat With Cosmic Radiation Disclaimer", "Snacks not included beyond lunar orbit"
- [x] 6.3 On submit: call `POST /api/bookings`, on success redirect to `/confirmation/:bookingId`
- [x] 6.4 On API error: display inline error message without clearing form fields
- [x] 6.5 Start `user.place_booking` span on submit with `spaceport.departure.id` and `spaceport.seat.class`
- [x] 6.6 On booking success: add `booking_completed` event to span with `spaceport.booking.id`

## 7. Confirmation Page

- [x] 7.1 Display booking ID, destination, departure time, seat class, and total price from API response (stored in location state or re-fetched)
- [x] 7.2 Add a "Book Another Trip" button linking back to `/`

## 8. Error Handling

- [x] 8.1 Create `ErrorBoundary` component that calls `span.recordException(error)` and `span.setStatus(ERROR)` before rendering fallback
- [x] 8.2 Fallback UI displays: "Navigation system offline — captain lost in time anomaly" with a retry button
- [x] 8.3 Wrap `<App />` in `<ErrorBoundary>` in `src/main.tsx`

## 9. Currency Selector

- [x] 9.1 Create `src/contexts/CurrencyContext.tsx` exporting `CurrencyProvider` and `useCurrency` hook; state includes `currencies` (catalog array from API), `selectedCurrency` (code string, default "UNC"), and `setSelectedCurrency`
- [x] 9.2 Add `convert(amount: number): string` helper inside `useCurrency` that multiplies `amount` by the selected currency's `rate` and formats with the currency code (e.g., `"1112.50 REP"`)
- [x] 9.3 Fetch `GET /api/currencies` inside `CurrencyProvider` on mount; store catalog in state; render children only after catalog is loaded (or show minimal spinner)
- [x] 9.4 Wrap `<App />` in `<CurrencyProvider>` in `src/main.tsx` (inside `<ErrorBoundary>`)
- [x] 9.5 Add shadcn `Select` to the site header (App-level top bar) listing all currencies from context; on change call `setSelectedCurrency`
- [x] 9.6 Replace all hardcoded price displays in `DepartureDetailPage` and `ConfirmationPage` with `useCurrency().convert(price)` — prices received from API are in UNC
- [x] 9.7 Emit `exchange_completed` span event when `selectedCurrency` changes, with span attributes `spaceport.pricing.base_currency = "UNC"` and `spaceport.pricing.display_currency = newCode`
