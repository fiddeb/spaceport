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
}

// ---------------------------------------------------------------------------
// Content — edit freely, the rendering adapts automatically.
// ---------------------------------------------------------------------------

export const exhibits: InfoExhibit[] = [
  {
    id: "strategic-case",
    number: 1,
    title: "The Strategic Case for OpenTelemetry",
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
    id: "architecture-origin",
    number: 2,
    title: "Architecture and Origin",
    intro:
      "OpenTelemetry is not a backend database — it is a vendor-neutral standard born from the 2019 merger of OpenTracing and OpenCensus under the CNCF. Now the second most active CNCF project after Kubernetes, OTel provides the specifications and tools to capture signals across diverse environments. A critical architectural shift currently underway is the move toward Declarative Configuration: YAML-based sources of truth that replace fragile environment-variable setups.",
    slideTitle: "The Industry's Standard for Telemetry Generation",
    points: [
      {
        label: "API vs. SDK",
        text: "The API defines the interfaces for creating telemetry; the SDK is the actual implementation handling sampling, processing, and exporting.",
      },
      {
        label: "OTLP (OpenTelemetry Protocol)",
        text: "The universal language for telemetry data exchange, ensuring signals move seamlessly across the ecosystem.",
      },
      {
        label: "Modern Configuration",
        text: "The shift to Declarative Config enables centralized, version-controlled YAML management over legacy environment variables.",
      },
      {
        label: "CNCF Status",
        text: "Backed by a global community including industry leaders like Google, Microsoft, and Red Hat.",
      },
    ],
    note: "OTel focuses strictly on the pipeline — generation, collection, and processing — intentionally leaving visualization and alerting to specialized backends.",
  },
  {
    id: "core-signals",
    number: 3,
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
    id: "data-pipeline",
    number: 4,
    title: "The Data Pipeline",
    intro:
      'The OpenTelemetry Collector is the "central nervous system" of the ecosystem. It acts as a buffer and processing layer between applications and backends. For architects, the Collector is now more than a proxy — it is a fleet-managed reliability layer with centralized management via OpAMP and signal-bridging via Connectors.',
    slideTitle: "The Collector: Your Observability Central Nervous System",
    points: [
      {
        label: "Distributions",
        text: "Understand the flavors — Core (essential), Contrib (the kitchen sink), and K8s-specific.",
      },
      {
        label: "OpAMP",
        text: "The emerging standard for fleet management and remote configuration of collector instances at scale.",
      },
      {
        label: "Connectors",
        text: "Bridge pipelines (e.g., Span-to-Metrics) to derive new insights from existing signals.",
      },
      {
        label: "OTel Arrow",
        text: "High-performance data compression for managing massive telemetry volumes at lower costs.",
      },
      {
        label: "Processing Power",
        text: "Use processors to sanitize PII, batch data for efficiency, and enrich signals with infrastructure metadata.",
      },
    ],
    note: "The Collector handles retries and batching to minimize network overhead and protect the application from backend latency — a critical reliability layer.",
  },
  {
    id: "semconv-weaver",
    number: 5,
    title: "Semantic Conventions & Weaver",
    intro:
      "Telemetry should be treated like a public API — it shouldn't break between releases. OpenTelemetry enforces this via Semantic Conventions, the grammar of attributes (e.g., http.request.method). To govern this, we use OTel Weaver: a tool that defines schemas, enforces Rego policies for CI/CD compliance, and generates type-safe constants to prevent instrumentation typos.",
    slideTitle: "Enforcing Consistency through OTel Weaver",
    points: [
      {
        label: "Semantic Conventions",
        text: 'Standardizing names to ensure dashboards "just work" regardless of the source.',
      },
      {
        label: "Policy-Based Validation",
        text: "Use Rego to catch non-compliant telemetry in CI/CD before it reaches production.",
      },
      {
        label: "Code Generation",
        text: "Weaver generates the constants that prevent developers from using inconsistent naming like user_id vs uid.",
      },
      {
        label: "Instrumentation Score",
        text: "An opinionated scoring system to measure telemetry quality against community best practices — cardinality checks, mandatory resource attributes, and more.",
      },
    ],
    note: "Weaver moves observability from a manual task to a governed engineering discipline. This is the approach used in the Spaceport codebase — all spaceport.* attributes are generated, never hand-coded.",
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
      {
        label: "Resources",
        text: "Visit opentelemetry.io for specifications, language SDKs, and community resources.",
      },
    ],
  },
];
