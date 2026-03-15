import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { trace } from "@opentelemetry/api";
import { SpanStatusCode } from "@opentelemetry/api";
import { Button } from "@/components/ui/button";
import { logger, SeverityNumber } from "@/instrumentation";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const span = trace.getActiveSpan();
    if (span) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    }
    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      body: `Uncaught error: ${error.message}`,
      attributes: { "exception.type": error.name, "exception.message": error.message },
    });
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center">
          <div className="text-6xl">🛸</div>
          <h1 className="text-2xl font-bold text-foreground">
            Navigation system offline — captain lost in time anomaly
          </h1>
          <p className="text-muted-foreground">
            Our engineers have been dispatched to the nearest wormhole.
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = "/";
            }}
          >
            Return to Spaceport
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
