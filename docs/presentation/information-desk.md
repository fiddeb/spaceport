# Information Desk Content Guide

The Information Desk is a presentation-style page where each **exhibit** is a self-contained section. All content lives in a single TypeScript file — no component changes needed to add, remove, or reorder exhibits.

## File location

```
frontend/src/data/informationDesk.ts
```

## Page config

The `pageConfig` object controls all page-level text. Edit it to rebrand for your own demo:

```ts
export const pageConfig = {
  label: "Information Desk",                    // small label above the title
  title: "Traveller's Guide to *Observability*", // *word* = highlighted
  subtitle: "Your subtitle here.",
  scrollHint: "Scroll to begin ↓",
  footer: "End of exhibits — More content added each release",
};
```

Wrap a word in `*asterisks*` in the title to render it in the primary colour.

## Data model

```ts
InfoExhibit {
  id: string          // URL-safe slug — used for anchors, scroll tracking, and telemetry
  number: number      // Display order (1, 2, 3 …)
  title: string       // Main section heading
  intro: string       // Introductory paragraph
  slideTitle: string  // Shorter heading above the bullet points
  points: InfoPoint[] // Teaching points (can be empty for link-only exhibits)
  note?: string       // Aside / editorial note
  image?: string      // Path relative to public/, e.g. "/info/diagram.png"
  imageAlt?: string   // Alt text for the image
  links?: InfoLink[]  // External/internal links shown at the bottom
}

InfoPoint {
  label: string        // Bold heading for the point
  text: string         // Body text
  subPoints?: string[] // Optional bullet list under the point
}

InfoLink {
  label: string        // Link text
  url: string          // Href
  description?: string // Short description shown below
}
```

## Add an exhibit

1. Open `informationDesk.ts`.
2. Add a new object to the `exhibits` array at the desired position.
3. Set `number` to reflect the new order (renumber neighbours if inserting in the middle).
4. The page, nav, and telemetry all adapt automatically.

Minimal example:

```ts
{
  id: "my-new-topic",
  number: 4,
  title: "My New Topic",
  intro: "A paragraph introducing the topic.",
  slideTitle: "The Key Takeaway",
  points: [
    {
      label: "First Point",
      text: "Explanation of the first point.",
    },
  ],
},
```

## Add an image

1. Place the image in `frontend/public/info/`.
2. Reference it by path: `image: "/info/my-image.png"`.
3. Always set `imageAlt` when adding an image.

## Add links

```ts
links: [
  {
    label: "OpenTelemetry Docs",
    url: "https://opentelemetry.io/docs/",
    description: "Official documentation and getting started guides.",
  },
],
```

## Remove or reorder

- Delete the object from the array, or move it to a new position.
- Update `number` fields so they stay sequential.

## Sub-points

Any `InfoPoint` can include a `subPoints` array for nested bullets:

```ts
{
  label: "Key Benefits",
  text: "Summary sentence.",
  subPoints: [
    "First benefit with detail.",
    "Second benefit with detail.",
  ],
},
```

## Telemetry

Each exhibit automatically emits:

| Signal | Name | Attributes |
|--------|------|------------|
| Span event | `exhibit_viewed` | `spaceport.exhibit.id`, `.title`, `.number` |
| Counter | `spaceport.frontend.exhibit_views` | `spaceport.exhibit.id`, `.title` |
| Histogram | `spaceport.frontend.exhibit_dwell_time` | `spaceport.exhibit.id` |
| Log | INFO "Exhibit viewed: {title}" | `spaceport.exhibit.id` |

The `id` field is the key — keep it unique and URL-safe (lowercase, hyphens).

## Playwright tests

Tests assert on specific UI text. If you change exhibit titles or copy, check `frontend/e2e/` for matching assertions.
