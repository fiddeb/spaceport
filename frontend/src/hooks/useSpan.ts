import { useEffect, useRef } from "react";
import { tracer } from "@/instrumentation";
import type { Span } from "@opentelemetry/api";
import { SpanStatusCode } from "@opentelemetry/api";

/**
 * Starts an OTel span on mount, ends it on unmount.
 * Returns the span ref so callers can add events/attributes.
 */
export function useSpan(
  name: string,
  attributes?: Record<string, string | number>,
) {
  const spanRef = useRef<Span | null>(null);

  useEffect(() => {
    const span = tracer.startSpan(name, {
      attributes: attributes ?? {},
    });
    spanRef.current = span;

    return () => {
      span.end();
      spanRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return spanRef;
}

export { SpanStatusCode };
