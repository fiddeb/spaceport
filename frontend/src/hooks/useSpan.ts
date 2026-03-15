import { useCallback, useEffect, useRef } from "react";
import { tracer } from "@/instrumentation";
import type { Span } from "@opentelemetry/api";
import { SpanStatusCode, context, trace } from "@opentelemetry/api";
import type { Context } from "@opentelemetry/api";

/**
 * Starts an OTel span on mount.
 * Call `endSpan()` after your data loads so the span gets exported
 * while the trace is still active. Unmount ends it as a safety net.
 */
export function useSpan(
  name: string,
  attributes?: Record<string, string | number>,
) {
  const spanRef = useRef<Span | null>(null);
  const contextRef = useRef<Context>(context.active());
  const endedRef = useRef(false);

  useEffect(() => {
    const span = tracer.startSpan(name, {
      attributes: attributes ?? {},
    });
    spanRef.current = span;
    contextRef.current = trace.setSpan(context.active(), span);
    endedRef.current = false;

    return () => {
      if (!endedRef.current) span.end();
      spanRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const endSpan = useCallback(() => {
    if (!endedRef.current && spanRef.current) {
      spanRef.current.end();
      endedRef.current = true;
    }
  }, []);

  return { spanRef, contextRef, endSpan };
}

export { SpanStatusCode };
