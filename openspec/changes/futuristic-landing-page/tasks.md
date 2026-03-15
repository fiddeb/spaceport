## 1. Routing & Layout

- [x] 1.1 Add a second route layout branch in `main.tsx` — the landing page gets its own full-bleed layout (no `max-w-5xl` constraint), while existing pages stay under the current `App` layout
- [x] 1.2 Create the `/` route pointing to `LandingPage` and move `DepartureListPage` to `/departures`
- [x] 1.3 Update any internal `<Link to="/">` references (header logo, error boundary) so they still point to the landing page, and the departure list is reachable via `/departures`

## 2. Shared Utility

- [x] 2.1 Create `frontend/src/components/landing/useInView.ts` — a small `IntersectionObserver` hook that returns a boolean when a ref enters the viewport (threshold configurable)

## 3. Hero Section

- [x] 3.1 Create `frontend/src/components/landing/Hero.tsx` — full-viewport section with gradient placeholder background, `data-prompt` attribute with an atmospheric spaceport image prompt, oversized headline (Outfit Variable 6xl–8xl), subtitle, and a primary CTA button linking to `/departures`
- [x] 3.2 Add subtle grain/noise texture overlay on the hero background using a CSS pseudo-element or inline SVG filter
- [x] 3.3 Add entrance animation — headline and CTA fade-in and slide-up on mount using tw-animate-css utilities

## 4. Destination Showcase

- [x] 4.1 Create `frontend/src/components/landing/DestinationShowcase.tsx` — horizontal strip of four destination cards (Mars Colony Alpha, Titan Station Prometheus, Europa Deep Dive, Moonbase Alpha) with gradient image placeholders and `data-prompt` attributes
- [x] 4.2 Each card shows destination name, short teaser text, and links to the corresponding departure detail or `/departures`
- [x] 4.3 Add hover effect on destination cards — subtle scale and glow/border transition
- [x] 4.4 Wire `useInView` so cards stagger-animate in when the section scrolls into the viewport

## 5. Stats Section

- [x] 5.1 Create `frontend/src/components/landing/StatsSection.tsx` — section with 4 stat items: "4 Destinations", "12 Routes Weekly", "2,847 Travellers Launched", "99.2% On-Time*"
- [x] 5.2 Implement count-up animation triggered by `useInView` — numbers animate from 0 to target value over ~1.5s using `requestAnimationFrame`
- [x] 5.3 Style with large monospace-style numbers, subtle border separators, and muted label text below each number

## 6. Landing Page Composition

- [x] 6.1 Create `frontend/src/pages/LandingPage.tsx` — composes `Hero`, `DestinationShowcase`, and `StatsSection` in order, full-width, no outer padding
- [x] 6.2 Ensure the page scrolls naturally between sections with appropriate vertical spacing

## 7. Visual Polish & Consistency

- [x] 7.1 Verify all colours use existing CSS custom properties (--background, --foreground, --primary, --muted-foreground, --border, --card)
- [x] 7.2 Verify sharp corners (radius 0) are maintained on all new elements — no rounded-* classes
- [x] 7.3 Verify Outfit Variable font is used throughout — no fallback to Inter/system fonts
- [x] 7.4 Add `data-prompt` attributes to all image placeholders with descriptive, usable generation prompts

## 8. Verification

- [x] 8.1 Run `npm run build` and confirm zero TypeScript/build errors
- [x] 8.2 Visually confirm the landing page renders correctly at desktop and mobile widths
- [x] 8.3 Confirm `/departures` still renders the departure list identically to the current state
- [x] 8.4 Confirm existing OTel instrumentation on departure/booking pages is unaffected
