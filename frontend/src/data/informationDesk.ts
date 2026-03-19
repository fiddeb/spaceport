/**
 * Information Desk content registry.
 *
 * Each exhibit is a self-contained section that the InformationDeskPage
 * renders in order. To add/remove/reorder content between releases,
 * edit this array — no component changes needed.
 *
 * Images go in public/information/ and are referenced by path,
 * e.g. "/information/otel-pipeline.png".
 */

export interface InfoLink {
  label: string;
  url: string;
  /** Short description shown below the link */
  description?: string;
}

export interface InfoPoint {
  label: string;
  text: string;
  subPoints?: string[];
}

export interface InfoExhibit {
  /** URL-safe slug used for anchor links and scroll tracking */
  id: string;
  /** Display order number (01, 02, ...) */
  number: number;
  /** Main section title */
  title: string;
  /** Longer introductory paragraph */
  intro: string;
  /** Shorter slide-style heading shown above the bullet points */
  slideTitle: string;
  /** Key teaching points */
  points: InfoPoint[];
  /** Editorial / graphics note (shown as an aside) */
  note?: string;
  /** Path to an image in public/, e.g. "/information/signals.png" */
  image?: string;
  /** Alt text for the image */
  imageAlt?: string;
  /** External/internal links shown at the bottom of the exhibit */
  links?: InfoLink[];
}

// ---------------------------------------------------------------------------
// Page-level config — customise for your own fork / demo.
// ---------------------------------------------------------------------------

export const pageConfig = {
  /** Small label above the title */
  label: "Information Desk",
  /** Main heading. Wrap a word in *asterisks* to highlight it. */
  title: "Traveller's Guide to *Observability*",
  /** Subtitle shown below the heading */
  subtitle:
    "A kickstart to understand OpenTelemetry, semantic conventions, " +
    "and modern observability \u2014 from first principles to hands-on experimentation.",
  /** Hint shown below the subtitle */
  scrollHint: "Scroll to begin \u2193",
  /** Closing slide shown after the last exhibit */
  closing: {
    label: "End of Presentation",
    title: "So Long, and Thanks for All the *Fish*",
    subtitle: "Now go instrument something.",
  },
};

// ---------------------------------------------------------------------------
// Exhibits — edit freely, the rendering adapts automatically.
// ---------------------------------------------------------------------------

export const exhibits: InfoExhibit[] = [
  {
    id: "strategic-case",
    number: 1,
    title: "The Strategic Case for OpenTelemetry",
    image: "/info/logmetrictrace.png",
    intro:
      "Modern enterprise observability is navigating a silent crisis: the compounding debt of fragmented tooling and aggressive vendor lock-in. For years, organizations have been tethered to proprietary agents, creating fragile \"agent sprawl\" that increases operational friction. OpenTelemetry is the industry's strategic response — a unified, vendor-neutral standard that decouples telemetry generation from storage, transforming observability from a vendor-controlled tax into a future-proof engineering discipline.",
    slideTitle: "Breaking the Chains of Fragmented Observability",
    points: [
      {
        label: "The High Cost of Vendor Lock-in",
        text: "Traditional proprietary agents create tight coupling. Switching platforms requires expensive manual re-instrumentation.",
      },
      {
        label: "Unified Collection Point",
        text: 'OTel replaces multiple specific agents with a high-performance pipeline. The "instrument once, send anywhere" approach dramatically reduces cognitive load.',
      },
      {
        label: "Business Impact & Strategy",
        text: "Standardized data collection unlocks operational agility, strategic cost management, and architectural decoupling.",
        subPoints: [
          "Operational Agility — Standardized collection across all languages and frameworks.",
          "Strategic Cost Management — Filter and sample data before it hits expensive billing endpoints.",
          "Architectural Decoupling — Swap analysis tools by updating configuration, not source code.",
        ],
      },
    ],
    note: "OpenTelemetry provides the plumbing for observability. It ensures telemetry data is high-quality and consistent, allowing teams to focus on analysis rather than maintenance of proprietary agents.",
  },
];
