"""Tests for the pricing service endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient

from pricing_service.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.anyio
async def test_health(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_currencies(client: AsyncClient):
    resp = await client.get("/currencies")
    assert resp.status_code == 200
    data = resp.json()
    codes = [c["code"] for c in data["currencies"]]
    assert len(codes) == 8
    assert "UNC" in codes
    assert "REP" in codes


@pytest.mark.anyio
async def test_price_default_currency(client: AsyncClient):
    resp = await client.get("/price/1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["departure_id"] == 1
    assert len(data["prices"]) == 3
    for p in data["prices"]:
        assert p["currency"] == "UNC"
        assert "base_price" in p
        assert "total_price" in p
        assert "promo_applied" in p
        assert "seat_class" in p


@pytest.mark.anyio
async def test_price_with_currency_conversion(client: AsyncClient):
    resp_unc = await client.get("/price/1")
    resp_rep = await client.get("/price/1?currency=REP")
    assert resp_unc.status_code == 200
    assert resp_rep.status_code == 200

    for p in resp_rep.json()["prices"]:
        assert p["currency"] == "REP"


@pytest.mark.anyio
async def test_price_unknown_currency(client: AsyncClient):
    resp = await client.get("/price/1?currency=FAKE")
    assert resp.status_code == 400


@pytest.mark.anyio
async def test_recommendations(client: AsyncClient):
    resp = await client.get("/recommendations/1")
    assert resp.status_code == 200
    data = resp.json()
    recs = data["recommendations"]
    assert 2 <= len(recs) <= 3
    for r in recs:
        assert r["departure_id"] != 1
        assert "destination" in r
        assert "reason" in r


@pytest.mark.anyio
async def test_chaos_failure(client: AsyncClient):
    # Activate 2 failures
    resp = await client.post("/simulate-failure", json={"count": 2})
    assert resp.status_code == 200

    # First two calls should fail
    r1 = await client.get("/price/1")
    assert r1.status_code == 500

    r2 = await client.get("/price/1")
    assert r2.status_code == 500

    # Third call should succeed
    r3 = await client.get("/price/1")
    assert r3.status_code == 200


@pytest.mark.anyio
async def test_chaos_latency(client: AsyncClient):
    import time

    # Activate 1 latency injection of 200ms
    resp = await client.post("/simulate-latency", json={"count": 1, "latency_ms": 200})
    assert resp.status_code == 200

    start = time.monotonic()
    r = await client.get("/price/1")
    elapsed = time.monotonic() - start
    assert r.status_code == 200
    # Should take at least 200ms (injected) + 50ms (baseline)
    assert elapsed >= 0.2
