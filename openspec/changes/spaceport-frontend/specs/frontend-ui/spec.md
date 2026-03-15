## ADDED Requirements

### Requirement: Departure list page
The frontend SHALL render a departure list at `/` showing at least: destination name, departure time, seat class availability indicator, and a "View Details" link. The list SHALL be fetched from `GET /api/departures`.

#### Scenario: Departure list loads and displays
- **WHEN** a user navigates to `/`
- **THEN** the page displays at least one departure card with destination name and departure time within 3 seconds

#### Scenario: Loading state is shown
- **WHEN** the departures fetch is in progress
- **THEN** a loading indicator is visible before data appears

### Requirement: Departure detail page
The frontend SHALL render a detail page at `/departures/:id` showing: full destination description, pricing breakdown (fetched from API including pricing service data), seat class options, recommendations, and a "Book Now" button.

#### Scenario: Detail page shows pricing
- **WHEN** a user navigates to `/departures/:id`
- **THEN** the page shows a price for at least one seat class within 3 seconds

#### Scenario: Recommendations are displayed
- **WHEN** the detail page loads successfully
- **THEN** at least one recommended departure is shown

### Requirement: Booking form page
The frontend SHALL render a booking form at `/book/:id` with fields: passenger name, seat class selector, cryosleep toggle, extra baggage toggle. Submitting the form SHALL call `POST /api/bookings` and redirect to `/confirmation/:bookingId` on success.

#### Scenario: Booking form submits successfully
- **WHEN** a user fills in passenger name, selects a seat class, and clicks "Confirm Booking"
- **THEN** the form submits and the user is redirected to the confirmation page

#### Scenario: Booking form shows error on API failure
- **WHEN** the API returns a non-2xx response
- **THEN** an error message is displayed inline without losing form data

### Requirement: Booking confirmation page
The frontend SHALL render a confirmation page at `/confirmation/:bookingId` showing: booking ID, destination, departure time, seat class, and total price.

#### Scenario: Confirmation page renders booking details
- **WHEN** a user lands on `/confirmation/:bookingId`
- **THEN** the booking ID and destination are displayed

### Requirement: spaceport theme and humor
The UI SHALL use shadcn initialized with preset `aJx2k9T`. At least three humorous spaceport-themed strings SHALL appear in the UI: e.g., "Economy Cryosleep", "Window Seat With Cosmic Radiation Disclaimer", "Snacks not included beyond lunar orbit".

#### Scenario: Theme is applied
- **WHEN** the app loads
- **THEN** the UI renders with the shadcn preset aJx2k9T component styles

### Requirement: Error boundary renders fallback
The app SHALL wrap all routes in a React ErrorBoundary that renders a spaceport-themed error message (e.g., "Navigation system offline — captain lost in time anomaly") instead of crashing.

#### Scenario: JS error shows fallback UI
- **WHEN** a component throws an uncaught error
- **THEN** the error boundary catches it and renders the fallback UI without a blank page

### Requirement: Currency selector in site header
The frontend SHALL render a shadcn `Select` component in the site header allowing users to choose their display currency. The available currencies SHALL be fetched from `GET /api/currencies` on app startup and stored in a React `CurrencyContext`. All price values displayed anywhere in the app SHALL be converted from their UNC base amount using the selected currency's exchange rate. The default display currency SHALL be UNC.

#### Scenario: User changes display currency
- **WHEN** a user selects "REP" from the currency selector in the site header
- **THEN** all prices on the current page update to show REP-denominated amounts (UNC amount × 1.25)

#### Scenario: Currency catalog loads on startup
- **WHEN** the app first renders
- **THEN** the currency catalog has been fetched from `/api/currencies` and is available in `CurrencyContext` before any price is displayed
