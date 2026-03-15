import { useEffect, useRef } from "react";
import { tracer } from "@/instrumentation";
import type { Span } from "@opentelemetry/api";
import { SpanStatusCode, context, trace } from "@opentelemetry/api";
import type { Context } from "@opentelemetry/api";

/**
 * Starts an OTel span on mount, ends it on unmount.
 * Returns the span ref so callers can add events/attributes.
 * Also exposes a `contextRef` that can be used with `context.with()`
 * to propagate trace context into child fetches.
 */
export function useSpan(
  name: string,
  attributes?: Record<string, string | number>,
) {
  const spanRef = useRef<Span | null>(null);
  const contextRef = useRef<Context>(context.active());

  useEffect(() => {
    const span = tracer.startSpan(name, {
      attributes: attributes ?? {},
    });
    spanRef.current = span;
    contextRef.current = trace.setSpan(context.active(), span);

    return () => {
      span.end();
      spanRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return { spanRef, contextRef };
}

export { SpanStatusCode };
