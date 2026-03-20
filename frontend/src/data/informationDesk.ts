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
  {
    id: "core-signals",
    number: 3,
    image: "/info/logmetrictrace.png",
    title: "The Core Signals",
    intro:
      "True observability is achieved through the correlation of signals. OTel ensures that Traces, Metrics, and Logs share a common context. This interoperability allows an engineer to jump from a high-level metric spike to a specific trace, and finally to the granular log entry describing the failure.",
    slideTitle: "Traces, Metrics, and Logs",
    points: [
      {
        label: "Traces",
        text: "Follow a single request as it moves through services, showing the full path, timing, and where delays or failures happen.",
      },
      {
        label: "Metrics",
        text: "Show the overall behavior of the system over time through aggregated measurements like traffic, latency, and error rates.",
      },
      {
        label: "Logs",
        text: "Capture detailed events from specific parts of the system, adding local context that helps explain what happened inside a service.",
      },
    ],
    note: "While the OTLP protocol is stable for all three signal types, always check your specific language SDK's maturity status before a production rollout.",
  },
  {
  id: "trace-boundaries",
  number: 4,
  title: "Trace Boundaries in Distributed Systems",
  image: "/info/tracing-flow.jpg",
  intro:
    "A trace should represent one coherent unit of work triggered by a specific event. In practice, the most useful boundary is often the point where the system stops acting on an existing trigger and waits for new input. This helps developers avoid traces that become too broad, too long-lived, or misleading. A good tracing strategy is not about connecting everything, but about modeling causality clearly.",
  slideTitle: "When to Continue a Trace and When to Start a New One",
  points: [
    {
      label: "Continue the Existing Trace",
      text: "Inherit the trace context when the system is still executing work caused by the same trigger, such as an incoming request, downstream API calls, database queries, or automatic UI-driven fetches required to complete the current operation.",
    },
    {
      label: "Start a New Trace",
      text: "Create a new root trace when a new trigger appears, especially when the user provides new input. A click that opens a form can be one trace, while submitting that form should usually start another.",
    },
    {
      label: "Do Not Model a Whole Session as One Trace",
      text: "A trace should describe an operation, not an entire user journey. Time spent reading, scrolling, or thinking should not keep a trace alive.",
      subPoints: [
        "A page load and its automatic background calls usually belong to one trace.",
        "A later form submission is typically a separate trace, even if it happens on the same page.",
        "If two traces belong to the same business flow, correlate them with business IDs or links instead of forcing parent-child relationships.",
      ],
    },
  ],
  note: "Do: keep the same trace for direct downstream work, end spans when the operation is complete, and start a new trace for new user input. Don't: keep traces alive across passive waiting, reuse old context for a new interaction, or turn a user session into a single trace."
},
  {
    id: "learning-lab",
    number: 6,
    title: "Continued Learning & Local Experimentation",
    intro:
      "The best way to learn observability is to instrument real applications and explore the data. This Spaceport demo and the ObservabilityStack give you a complete local lab environment to experiment with all the concepts covered here.",
    slideTitle: "Your Local Observability Lab",
    points: [
      {
        label: "ObservabilityStack",
        text: "A local lab with Grafana, Loki, Prometheus, and Tempo for OTel testing on Kubernetes, deployed by ArgoCD.",
      },
      {
        label: "Spaceport Demo",
        text: "A multi-language demo (Go, Python, React) designed for learning observability, OpenTelemetry, Weaver, and schema-first development.",
      },
    ],
    links: [
      {
        label: "ObservabilityStack on GitHub",
        url: "https://github.com/fiddeb/observabilitystack",
        description: "Full local lab setup with ArgoCD, Grafana, Loki, Prometheus, Tempo and Spaceport demo.",
      },
      {
        label: "Spaceport on GitHub",
        url: "https://github.com/fiddeb/spaceport",
        description: "The source code for this demo application.",
      },
    ],
  },
  {
    id: "resources",
    number: 7,
    title: "Resources & Links",
    intro:
      "A curated collection of specifications, tools, and community resources to deepen your understanding of OpenTelemetry and modern observability.",
    slideTitle: "Essential Reading",
    points: [],
    links: [
      {
        label: "OpenTelemetry",
        url: "https://opentelemetry.io",
        description: "Official site — specifications, language SDKs, and getting started guides.",
      },
      {
        label: "OTel Collector Documentation",
        url: "https://opentelemetry.io/docs/collector/",
        description: "Configuration, deployment patterns, and component reference.",
      },
      {
        label: "Semantic Conventions",
        url: "https://opentelemetry.io/docs/specs/semconv/",
        description: "The standardized attribute naming registry for all signal types.",
      },
      {
        label: "OTel Weaver",
        url: "https://github.com/open-telemetry/weaver",
        description: "Schema-driven code generation and policy validation for semantic conventions.",
      },
      {
        label: "OTLP Specification",
        url: "https://opentelemetry.io/docs/specs/otlp/",
        description: "The protocol specification for telemetry data exchange.",
      },
      {
        label: "CNCF OpenTelemetry Project",
        url: "https://www.cncf.io/projects/opentelemetry/",
        description: "CNCF project page with community, governance, and adoption details.",
      },
    ],
  },
];
