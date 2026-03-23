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
    "What observability is, why telemetry quality matters, " +
    "and what this demo actually shows you \u2014 in about ten minutes.",
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
  // ------------------------------------------------------------------
  // 1 — WHAT IS OBSERVABILITY?
  // ------------------------------------------------------------------
  {
    id: "what-is-observability",
    number: 1,
    title: "What Is Observability?",
    image: "/info/observability.png",
    imageAlt: "Traces, metrics and logs flowing through a system",
    intro:
      "Observability is the ability to understand a system\u2019s internal state from the data it emits. Distributed systems often behave like black boxes \u2014 we see what goes in and what comes out, but have little insight into what happens in between. Observability creates a trail of breadcrumbs through that darkness, letting us follow an event from the user\u2019s click all the way through every service it touches.",
    slideTitle: "From Black Box to Transparency",
    points: [
      {
        label: "A braid of signals, not three isolated pillars",
        text: "Traces, metrics and logs are not separate tools. They form a woven braid where all signals share context. A spike in error rate (metric) links to the specific request that failed (trace) and the exception message explaining why (log).",
        subPoints: [
          "Traces \u2014 follow a single request across every service it touches, with timing and status.",
          "Metrics \u2014 aggregated measurements like request rate, error rate and latency percentiles over time.",
          "Logs \u2014 detailed events with local context from inside a specific service.",
        ],
      },
      {
        label: "Context and correlation are everything",
        text: "The power is not in any single signal. It is in being able to see how a metric spike connects to a specific user\u2019s trace, and how that trace connects to the exact log entry that explains the failure.",
      },
      {
        label: "Structured data for machines, not just humans",
        text: "When telemetry is well-structured with consistent naming, machines can find correlations automatically. The investment is not in more data, but in data that is structured enough to be queryable.",
      },
    ],
    note: "Observability is not a product you buy. It is an engineering discipline: instrument well, correlate signals, and make systems debuggable by anyone on the team \u2014 not just the people who built them.",
  },

  // ------------------------------------------------------------------
  // 2 — WHY DO WE NEED IT?
  // ------------------------------------------------------------------
  {
    id: "why-observability",
    number: 2,
    title: "Why Do We Need It?",
    intro:
      "The need for observability has grown directly from the increasing complexity of our software architecture. In modern microservice systems with hundreds of services and thousands of connections, no single person can hold the full system in their head. We cannot debug these systems locally on a laptop \u2014 we must be able to observe them in production.",
    slideTitle: "Complexity Demands a New Approach",
    points: [
      {
        label: "Monitoring catches the known; observability handles the unknown",
        text: "Traditional monitoring works well for known failure types we have seen before. Observability is required for understanding emergent behavior \u2014 unexpected problems that arise in complex systems and that no one could have predicted.",
      },
      {
        label: "From gut feeling to evidence",
        text: "Without observability, debugging relies on experience and intuition: senior engineers guess where the problem might be. With correlated telemetry, any engineer can follow the data to the root cause \u2014 reducing Mean Time to Know (MTTK) from hours to minutes.",
      },
      {
        label: "Business value and user experience",
        text: "Users leave services that take more than two seconds to load. Observability lets teams ship fast and recover faster from failed deployments, because the signals tell them exactly what broke and where.",
      },
    ],
    note: "Instrumentation creates signals. Context binds them together. Analysis turns raw data into the deep understanding we call observability.",
  },

  // ------------------------------------------------------------------
  // 3 — OPENTELEMETRY: THE STANDARD
  // ------------------------------------------------------------------
  {
    id: "opentelemetry",
    number: 3,
    title: "OpenTelemetry \u2014 The Standard",
    image: "/info/otel.png",
    intro:
      "OpenTelemetry is the industry\u2019s answer to fragmented, vendor-locked observability tooling. It is an open, vendor-neutral standard for generating, collecting and exporting telemetry data \u2014 backed by the CNCF and supported by every major observability vendor. Instead of installing a different proprietary agent for each tool, you instrument once and send the data wherever you need it.",
    slideTitle: "Instrument Once, Send Anywhere",
    points: [
      {
        label: "One standard across all languages",
        text: "OTel provides SDKs for Go, Python, Java, .NET, JavaScript and more. All produce the same data format (OTLP), so a trace can start in a browser, cross a Go API and end in a Python service \u2014 and still appear as one coherent trace.",
      },
      {
        label: "The Collector as central pipeline",
        text: "The OTel Collector receives telemetry from all services, then routes traces to Tempo, metrics to Prometheus and logs to Loki (or any other backend). Changing where data goes is a configuration change, not a code change.",
      },
      {
        label: "Vendor independence",
        text: "OpenTelemetry decouples instrumentation from backends. Instrument once, export to any combination of Grafana, Datadog, Splunk or your own stack \u2014 by updating collector configuration, not source code.",
      },
    ],
    note: "OTel provides the plumbing for observability. It ensures telemetry data is high-quality and consistent, allowing teams to focus on analysis rather than maintenance of proprietary agents.",
  },

  // ------------------------------------------------------------------
  // 4 — OBSERVABILITY BY DESIGN
  // ------------------------------------------------------------------
  {
    id: "observability-by-design",
    number: 4,
    title: "Observability by Design",
    image: "/info/obsbydesign.png",
    intro:
      "Most organizations have telemetry. Few have good telemetry. When every team invents its own attribute names, metric formats and logging conventions, the data becomes impossible to correlate across services. Dashboards break when one team calls it \"user_id\" and another calls it \"userId\". The root cause is not a lack of data \u2014 it is a lack of shared structure. Observability by design means defining your telemetry schema before writing the instrumentation code.",
    slideTitle: "From Ad-Hoc Strings to a Schema Contract",
    points: [
      {
        label: "Semantic Conventions solve naming chaos",
        text: "OpenTelemetry defines a standard registry of attribute names for common concepts: HTTP methods, database operations, messaging systems, and more. When everyone uses the same names, signals from different teams and languages become instantly comparable.",
      },
      {
        label: "Schema-first with OTel Weaver",
        text: "This demo uses Weaver to go one step further: all custom attributes are defined in a YAML registry and code-generated into type-safe constants for Go, Python and TypeScript. No hardcoded strings, no typos, one source of truth.",
        subPoints: [
          "Attribute definitions live in semconv/models/ \u2014 the registry is the contract.",
          "Code generation produces constants, metric constructors and documentation from the same schema.",
          "Grafana dashboards are auto-generated from metric definitions \u2014 the dashboard always matches the code.",
        ],
      },
      {
        label: "Quality is a force multiplier",
        text: "Well-structured telemetry makes dashboards reusable, alerts reliable, and incidents faster to resolve. The investment is in naming and structure up front, which pays back every time someone debugs a production issue.",
      },
    ],
    note: "The difference between a team that spends 10 minutes on an incident and one that spends 4 hours is rarely tooling. It is whether the telemetry was designed to answer the questions they need to ask.",
  },

  // ------------------------------------------------------------------
  // 5 — WHAT THIS DEMO SHOWS
  // ------------------------------------------------------------------
  {
    id: "what-we-built",
    number: 5,
    title: "What This Demo Shows",
    image: "/info/demo.png",
    imageAlt: "Distributed trace flowing through frontend, API and pricing service",
    intro:
      "Spaceport is a fictional booking system for interplanetary travel, built specifically to demonstrate observability in practice. Three services \u2014 a React frontend, a Go API and a Python pricing service \u2014 are all instrumented with OpenTelemetry. Every booking you place generates real traces, metrics and logs that flow through the same pipeline a production system would use.",
    slideTitle: "Three Services, Three Languages, Full Observability",
    points: [
      {
        label: "Distributed tracing end-to-end",
        text: "A single booking creates a trace that starts in the browser, crosses the Go API, reaches the Python pricing service, and returns. The full chain is visible as one trace in Grafana Tempo.",
      },
      {
        label: "Business metrics tied to technical signals",
        text: "The demo tracks bookings by status and seat class, pricing failures, page views and frontend booking outcomes \u2014 all as OTel metrics with semantic convention attributes, visible in Prometheus and auto-generated Grafana dashboards.",
      },
      {
        label: "Chaos engineering with observable feedback",
        text: "The chaos menu injects failures and latency into the pricing service. Spans get chaos events, error counters spike, and dashboards react in real-time \u2014 showing how observability catches problems the moment they happen.",
      },
      {
        label: "Backend-agnostic by design",
        text: "Every service exports standard OTLP \u2014 the demo has no opinion on which backend receives the data. Point the OTLP endpoint at anything that speaks OTLP. The application code stays the same.",
      },
    ],
    note: "Try it: book a flight, trigger chaos from the menu, then open Grafana to follow the trace through all three services. That is the workflow this demo is designed to teach.",
  },

  // ------------------------------------------------------------------
  // 6 — FROM ALERT TO ROOT CAUSE
  // ------------------------------------------------------------------
  {
    id: "alerting",
    number: 6,
    title: "From Alert to Root Cause",
    image: "/info/alert.png",
    intro:
      "OpenTelemetry delivers the raw material \u2014 high-quality, correlated telemetry. But the alert decisions happen in the backends that receive it: Prometheus, Grafana, Honeycomb, Datadog, or any platform that speaks OTLP. Every modern observability platform has some form of alerting, and the quality of that alerting is directly determined by the quality of the telemetry feeding it. Inconsistent naming, missing context, or uncorrelated signals make alerts noisy and investigations slow.",
    slideTitle: "Metrics Alert, Traces Explain",
    points: [
      {
        label: "Metrics trigger, traces explain",
        text: "Metrics are numerical and cheap to query in real-time \u2014 they are the natural input for alert rules. When an alert fires, the correlated trace context lets an engineer jump directly from the alert to the specific request that failed, and the log entry that explains why.",
      },
      {
        label: "Threshold alerts cause fatigue",
        text: "Alerting on CPU > 80% or disk > 90% generates noise that may not reflect actual user impact. Teams learn to ignore these alerts \u2014 which means real problems also get ignored.",
      },
      {
        label: "SLOs measure what users experience",
        text: "A Service Level Objective defines reliability from the user\u2019s perspective: 99.9% of requests under 500ms, for example. An error budget tracks how much failure is acceptable. Alert when the budget burns too fast, not when a single metric crosses a line.",
      },
      {
        label: "Telemetry quality decides alerting quality",
        text: "Well-structured telemetry with consistent attributes makes alerts precise and investigations fast. Poor naming and missing context make the same alert engine produce noise. The investment in semantic conventions and schema-first instrumentation pays off directly in the alerting layer.",
      },
    ],
    note: "This demo produces the metrics (booking error rate, request latency, pricing failures) and correlated traces that a backend would consume for SLO-based alerting. The alert rules themselves live in whichever platform you point the OTLP endpoint at.",
  },

  // ------------------------------------------------------------------
  // 7 — KEEP LEARNING
  // ------------------------------------------------------------------
  {
    id: "keep-learning",
    number: 7,
    title: "Keep Learning",
    intro:
      "The best way to learn observability is to instrument real code and explore the data. Everything in this demo is open source and designed to run locally on Kubernetes. Fork it, break it, add a new service, define new attributes \u2014 and watch the telemetry follow.",
    slideTitle: "Your Next Steps",
    points: [
      {
        label: "Run the full stack locally",
        text: "ObservabilityStack gives you Grafana, Loki, Prometheus, Tempo and an OTel Collector on Kubernetes, deployed with ArgoCD. Spaceport plugs in as a demo workload.",
      },
      {
        label: "Explore the schema-first workflow",
        text: "Edit an attribute in semconv/models/, run make generate, and see the change propagate to Go constants, Python constants and Grafana dashboards automatically.",
      },
      {
        label: "Read the specifications",
        text: "OpenTelemetry is backed by detailed, public specs. Understanding the data model \u2014 spans, metrics, logs, resources, and OTLP \u2014 makes everything else click.",
      },
    ],
    links: [
      {
        label: "ObservabilityStack",
        url: "https://github.com/fiddeb/observabilitystack",
        description: "Local Kubernetes lab with ArgoCD, Grafana, Loki, Prometheus, Tempo.",
      },
      {
        label: "Spaceport",
        url: "https://github.com/fiddeb/spaceport",
        description: "Source code for this demo \u2014 Go, Python, React, Weaver semconv.",
      },
      {
        label: "OpenTelemetry",
        url: "https://opentelemetry.io",
        description: "Specifications, SDKs and getting started guides.",
      },
      {
        label: "Semantic Conventions",
        url: "https://opentelemetry.io/docs/specs/semconv/",
        description: "The standardized attribute naming registry.",
      },
      {
        label: "OTel Weaver",
        url: "https://github.com/open-telemetry/weaver",
        description: "Schema-driven code generation for semantic conventions.",
      },
      {
        label: "OTel Collector",
        url: "https://opentelemetry.io/docs/collector/",
        description: "Configuration, deployment patterns and component reference.",
      },
    ],
  },
];
