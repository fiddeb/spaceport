# landing-page Specification

## Purpose
TBD - created by archiving change futuristic-landing-page. Update Purpose after archive.
## Requirements
### Requirement: Hero section fills the viewport
The landing page SHALL render a full-viewport hero section as the first visible content when a user navigates to `/`. The hero SHALL contain a background image placeholder, a headline tagline, a supporting subtitle, and a primary call-to-action button.

#### Scenario: User lands on the root URL
- **WHEN** a user navigates to `/`
- **THEN** a full-height hero section fills the viewport with a background image placeholder, tagline text, subtitle text, and a CTA button

#### Scenario: Hero image placeholder carries a generation prompt
- **WHEN** the hero section renders
- **THEN** the background image element SHALL include a `data-prompt` attribute with a descriptive text prompt suitable for AI image generation tools (e.g. Nano Banana)

### Requirement: CTA navigates to departures
The hero's primary CTA button SHALL either scroll to the departures section below the fold or navigate to the departures listing, making the transition from landing to booking flow seamless.

#### Scenario: User clicks the hero CTA
- **WHEN** a user clicks the primary CTA button in the hero section
- **THEN** the view SHALL scroll smoothly to the departure list section or navigate to the departures route

### Requirement: Destination showcase strip
The landing page SHALL display a horizontal destination showcase section below the hero, featuring cards for the four destinations: Mars Colony Alpha, Titan Station Prometheus, Europa Deep Dive, and Moonbase Alpha.

#### Scenario: Destination cards render with placeholders
- **WHEN** the destination showcase section renders
- **THEN** four destination cards SHALL be visible, each showing a destination name, a short teaser description, and an image placeholder with a `data-prompt` attribute

#### Scenario: Destination card links to departure detail
- **WHEN** a user clicks a destination card
- **THEN** the user SHALL be navigated to the corresponding departure detail page or the departures list filtered for that destination

### Requirement: Stats section with animated figures
The landing page SHALL include a stats/features section displaying playful fictional numbers (e.g. routes served, galaxies connected, satisfied travellers) with count-up animation on scroll.

#### Scenario: Stats animate on scroll into view
- **WHEN** the stats section scrolls into the viewport
- **THEN** the numeric values SHALL animate from zero to their target value

#### Scenario: Stats display thematic content
- **WHEN** the stats section renders
- **THEN** at least three stat items SHALL be visible with fictional spaceport-themed labels and numbers

### Requirement: Design system consistency
The landing page SHALL use the existing design tokens: Outfit Variable font, dark theme, OKLch color palette, border-radius 0 (sharp corners), and shadcn/ui components where applicable.

#### Scenario: Landing page matches existing theme
- **WHEN** the landing page renders
- **THEN** all text SHALL use the Outfit Variable font family, colours SHALL reference existing CSS custom properties (--background, --foreground, --primary, --muted-foreground), and corners SHALL remain sharp (radius 0)

### Requirement: Image placeholders with AI generation prompts
Every decorative or illustrative image on the landing page SHALL use a placeholder element (e.g. a coloured div or low-contrast SVG) with a `data-prompt` attribute containing a descriptive prompt for AI image generation.

#### Scenario: No real image assets required
- **WHEN** the landing page renders
- **THEN** no external image URLs or committed image files SHALL be required; all image slots SHALL use inline placeholders

#### Scenario: Prompt text is descriptive and usable
- **WHEN** inspecting a placeholder's `data-prompt` attribute
- **THEN** the value SHALL be a complete, descriptive sentence suitable for pasting into an AI image generator (e.g. "A futuristic spaceport terminal at dusk, neon-lit boarding gates, passengers with luggage, cinematic wide angle, dark moody atmosphere")

### Requirement: Existing pages remain unchanged
The landing page addition SHALL NOT alter the behaviour, layout, or instrumentation of the existing DepartureListPage, DepartureDetailPage, BookingFormPage, or ConfirmationPage.

#### Scenario: Departure list still accessible
- **WHEN** a user navigates to `/departures` (or scrolls past the hero)
- **THEN** the departure list SHALL render identically to its current state

#### Scenario: OTel instrumentation unaffected
- **WHEN** the landing page is added
- **THEN** all existing OTel spans, metrics, and log emissions on other pages SHALL remain unchanged

