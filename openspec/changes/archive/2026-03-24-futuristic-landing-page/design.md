## Context

The Spaceport frontend is a React + Vite + TypeScript SPA using shadcn/ui (radix-vega preset), Tailwind v4 with OKLch dark theme, Outfit Variable font, and sharp corners (radius 0). The current `/` route renders `DepartureListPage` directly — functional but visually flat. The app uses `react-router-dom` v7 with a nested `<Route element={<App />}>` layout wrapping all pages (sticky header, footer, `<Outlet />`). tw-animate-css is already installed. No heavy animation libs are present.

The user wants a cinematic, futuristic landing hero as the first impression, keeping the existing departure list and booking flow untouched. Placeholder images use `data-prompt` attributes for downstream AI image generation (Nano Banana etc.).

## Goals / Non-Goals

**Goals:**
- Add a full-viewport hero, destination showcase, and stats section as the new `/` route
- Maintain visual cohesion with the existing dark theme, Outfit font, sharp corners, and OKLch palette
- Use only CSS/Tailwind animations (tw-animate-css) — no new JS animation libraries
- All images are inline placeholders with `data-prompt` generation prompts
- Keep the existing DepartureListPage at `/departures` with zero modifications

**Non-Goals:**
- No real image assets or external image URLs
- No changes to the Go API or Python pricing-service
- No new OTel instrumentation on the landing page (it's a static presentation layer)
- No server-side rendering or preloading optimisations
- No mobile-specific layout rework beyond standard responsive breakpoints

## Decisions

### 1. Route structure: dedicated landing route + move departure list

**Decision**: Add a new `LandingPage` component at `/` and move `DepartureListPage` to `/departures`.

**Rationale**: Keeping the departure list as a scroll-target within the landing page would couple two independent concerns and make the departure list harder to deep-link. A dedicated `/departures` route keeps both pages clean and navigable. The hero CTA links to `/departures`.

**Alternative considered**: Single-page scroll with hash anchors (`/#departures`). Rejected because it complicates the `<Outlet />` layout pattern and mixes a presentation-heavy hero with a data-fetching card grid.

### 2. Landing page lives outside the max-w-5xl container

**Decision**: The landing page breaks out of the standard `max-w-5xl` content width — hero is full-bleed, showcase and stats span the full viewport width with internal padding.

**Rationale**: A cinematic hero constrained to 5xl looks boxed-in. The existing `App.tsx` layout wraps `<Outlet />` in `max-w-5xl`. The landing page component will use negative margins or a separate layout branch to escape the container for full-bleed sections.

**Implementation approach**: Add a conditional in `App.tsx` — when on the `/` route, the `<main>` drops its `max-w-5xl` constraint. Alternatively, the `LandingPage` component uses `className="-mx-4 w-screen"` to break out. Preferred: route-level layout variant using a second `<Route>` element without the constrained `<main>`.

### 3. Aesthetic direction: dark cinematic terminal

**Decision**: The landing page follows a **dark cinematic terminal** aesthetic — deep dark background, subtle grain/noise texture overlay, monochromatic palette with a single teal/blue accent (the existing `--primary`), generous whitespace, oversized typography, and understated motion.

**Rationale**: The existing site is sharp-edged, dark-themed, and utilitarian. The landing page amplifies this into a more dramatic presentation. Avoiding bright, colourful, or retro-neon styles — those would clash with the muted card-based interior pages.

Key visual elements:
- **Hero**: full-viewport with gradient overlay on placeholder image, oversized headline (6xl–8xl), subtle background grain
- **Destination cards**: large image placeholders with overlay text, equal-width horizontal strip, hover scale/glow effect
- **Stats**: large monospace or tabular numbers, count-up on `IntersectionObserver`, subtle border separators

### 4. Animation approach: CSS-only with IntersectionObserver trigger

**Decision**: All animations use CSS transitions/animations from tw-animate-css, triggered by adding classes when elements enter the viewport via `IntersectionObserver`.

**Rationale**: tw-animate-css is already available. Adding framer-motion or similar would be over-engineering for a landing page with ~3 animated sections. A simple `useInView` hook (10 lines, custom) handles scroll-triggered reveals.

**Implementation**: A `useInView(ref, options)` hook returns `boolean`. Components apply `opacity-0 translate-y-4` initially and transition to `opacity-100 translate-y-0` when in view.

### 5. Image placeholders: gradient divs with data-prompt

**Decision**: Placeholder images are styled `<div>` elements with CSS gradients (dark, atmospheric tones) and a `data-prompt` attribute. No `<img>` tags or external URLs.

**Rationale**: Avoids broken image icons, keeps the page functional without any asset pipeline, and the gradient fills look intentional on the dark theme. The `data-prompt` attribute makes it trivial to find and replace with real images later.

### 6. Component structure

```
frontend/src/
├── components/
│   └── landing/
│       ├── Hero.tsx            # Full-viewport hero with tagline + CTA
│       ├── DestinationShowcase.tsx  # Horizontal destination card strip
│       ├── StatsSection.tsx    # Animated stats/numbers
│       └── useInView.ts        # IntersectionObserver hook
├── pages/
│   └── LandingPage.tsx         # Composes Hero + DestinationShowcase + Stats
```

`LandingPage.tsx` is the new `/` route component. Each section is a self-contained component. `useInView` is shared.

## Risks / Trade-offs

**[Route change breaks bookmarks]** → Users who bookmarked `/` expecting the departure list will now see the landing page. Mitigation: The CTA and destination cards link prominently to `/departures`. Low risk for a demo app.

**[Container escape complexity]** → Breaking out of `max-w-5xl` in `App.tsx` may require layout refactoring. Mitigation: Use a second layout route — the `LandingPage` gets its own `<Route>` branch without the constrained `<main>`, while all other pages remain under the existing layout.

**[Placeholder images look empty]** → Gradient divs might appear "unfinished." Mitigation: Use rich multi-stop gradients with subtle noise-like patterns, and add faint iconography or text overlays so they look intentional rather than broken.

## Open Questions

- Should destination cards fetch real departure data from the API, or use hardcoded content matching the seed data? Leaning hardcoded to keep the landing page zero-fetch.
- Exact stats numbers/labels — proposed: "4 Destinations", "12 Routes Weekly", "2,847 Travellers Launched", "99.2% On-Time*" (* subject to gravitational delays).
