## Why

The current frontend drops users directly into the departure list — a functional but unremarkable card grid. For a demo app that showcases observability, first impressions matter. A cinematic landing page establishes the spaceport theme immediately, makes the app memorable during presentations, and gives the frontend a distinct identity beyond "yet another CRUD list." It also creates an additional surface for meaningful user-interaction traces (scroll, CTA engagement) before the booking flow.

## What Changes

- Add a full-viewport **hero section** as the new landing experience at `/`, pushing the departure list below the fold or onto its own route
- Hero features a large atmospheric image/illustration placeholder (with AI image-gen prompts), a bold tagline, and a primary CTA that scrolls or navigates to departures
- Add a **destination showcase strip** — horizontal section with destination cards (Mars, Titan, Europa, Moonbase Alpha) featuring placeholder images and brief teasers
- Add a **"Why Spaceport"** stats/features section with animated counters or icons (routes served, galaxies connected, satisfied travellers — playful fictional numbers)
- Integrate with the existing design system: Outfit Variable font, dark theme, OKLch palette, sharp corners (radius 0), shadcn components, tw-animate-css
- Use placeholder `<img>` tags with descriptive `alt` text and `data-prompt` attributes containing generation prompts for tools like Nano Banana
- Preserve the existing departure list, booking flow, currency selector, and all OTel instrumentation untouched

## Capabilities

### New Capabilities
- `landing-page`: Full-viewport hero landing experience with destination showcase, stats section, image placeholders with AI-gen prompts, and CTA leading into the existing departure/booking flow

### Modified Capabilities

_None — existing pages, routing, layout, and instrumentation remain unchanged._

## Impact

- **Frontend only** — no API or pricing-service changes
- New components in `frontend/src/pages/` or `frontend/src/components/landing/`
- Route change: current `/` content may shift to `/departures` or the landing page scrolls into it
- Possible new dependency: CSS animation utilities (tw-animate-css already available) — no heavy libs required
- Placeholder images need `data-prompt` attributes for downstream image generation; no actual image assets committed
- Zero impact on OTel instrumentation, backend, or existing page logic
