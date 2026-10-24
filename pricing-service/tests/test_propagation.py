"""Regression coverage for untrusted W3C trace headers (CVE-2026-114603)."""

import pytest
from httpx import ASGITransport, AsyncClient
from opentelemetry.trace import get_current_span
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

from pricing_service.main import app


TRACEPARENT = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"


def extract_span_context(tracestate):
    context = TraceContextTextMapPropagator().extract(
        {"traceparent": TRACEPARENT, "tracestate": tracestate}
    )
    return get_current_span(context).get_span_context()


@pytest.mark.parametrize("whitespace", [" ", "\t"])
def test_oversized_tracestate_is_rejected_before_parsing(whitespace):
    # A valid member padded past the header limit used to survive parsing.
    span_context = extract_span_context("vendor=value" + whitespace * 16384)
    assert span_context.is_valid
    assert not span_context.trace_state.items()


def test_tracestate_limit_applies_to_combined_header_fields():
    span_context = extract_span_context(
        ["first=value" + " " * 4096, "second=value" + "\t" * 4096]
    )
    assert span_context.is_valid
    assert not span_context.trace_state.items()


def test_valid_tracestate_is_preserved():
    span_context = extract_span_context("vendor=value")
    assert span_context.is_valid
    assert list(span_context.trace_state.items()) == [("vendor", "value")]


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
@pytest.mark.parametrize("whitespace", [" ", "\t"])
async def test_health_accepts_request_with_hostile_tracestate(whitespace):
    headers = {
        "traceparent": TRACEPARENT,
        "tracestate": "vendor=value" + whitespace * 16384 + "x",
    }
    # Verify the same propagator used by ASGI instrumentation discards the input.
    context = TraceContextTextMapPropagator().extract(headers)
    span_context = get_current_span(context).get_span_context()
    assert span_context.is_valid
    assert not span_context.trace_state.items()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
