#!/usr/bin/env bash
# tests/telemetry/run.sh
#
# Telemetry conformance test:
#   1. Starts weaver registry live-check (gRPC :14317)
#   2. Starts the Pricing Service and API with OTLP pointed directly at Weaver
#   3. Runs k6 telemetry coverage test (all backend signals)
#   4. Starts OTLP HTTP→gRPC bridge + Vite frontend + runs Playwright (all frontend signals)
#   5. Stops weaver and saves a conformance report to tests/telemetry/report.txt
#
# Requirements: weaver, k6, uv, go, docker, npx
# Usage: bash tests/telemetry/run.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT_DIR="$ROOT/tests/telemetry"
REPORT_FILE="$SCRIPT_DIR/report.txt"
PIDFILE="$SCRIPT_DIR/.pids"

# Weaver ports — chosen to avoid conflicts with a running dev stack
WEAVER_GRPC_PORT=14317
WEAVER_ADMIN_PORT=14320

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
DIM='\033[2m'
RESET='\033[0m'

log()  { echo -e "${CYAN}$*${RESET}"; }
ok()   { echo -e "${GREEN}  ✓ $*${RESET}"; }
fail() { echo -e "${RED}  ✗ $*${RESET}" >&2; exit 1; }

# ── Dependency checks ─────────────────────────────────────────────────────────

for cmd in weaver k6 go uv docker npx; do
    command -v "$cmd" >/dev/null 2>&1 || fail "'$cmd' not found in PATH"
done

# ── Cleanup ───────────────────────────────────────────────────────────────────

BRIDGE_CONTAINER_ID=""

cleanup() {
    echo ""
    log "Cleaning up…"

    # Kill services FIRST — prevents export-retry noise after weaver stops
    for port in 8000 8080 5175; do
        pids=$(lsof -ti :"$port" 2>/dev/null || true)
        [[ -n "$pids" ]] && echo "$pids" | xargs kill 2>/dev/null || true
    done

    # Stop the OTLP HTTP→gRPC bridge container
    if [[ -n "$BRIDGE_CONTAINER_ID" ]]; then
        docker stop "$BRIDGE_CONTAINER_ID" >/dev/null 2>&1 || true
    fi

    # Stop weaver via admin endpoint so it can finalize the report
    curl -sf "http://localhost:${WEAVER_ADMIN_PORT}/stop" >/dev/null 2>&1 || true
    kill "$WEAVER_PID" 2>/dev/null || true

    if [[ -f "$PIDFILE" ]]; then
        rm -f "$PIDFILE"
    fi

    wait 2>/dev/null || true
    echo -e "${GREEN}Done.${RESET}"
}

trap cleanup EXIT INT TERM

rm -f "$PIDFILE"
> "$REPORT_FILE"

# ── Free ports used by services ───────────────────────────────────────────────

for port in 8000 8080 5175; do
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
        echo -e "  ${DIM}Freeing port $port${RESET}"
        echo "$pids" | xargs kill 2>/dev/null || true
        sleep 1
    fi
done

echo ""
log "━━━ Spaceport Telemetry Conformance Test ━━━"
echo ""

# ── 1. Weaver live-check ──────────────────────────────────────────────────────

log "▸ Starting weaver live-check"
echo -e "  ${DIM}Registry : semconv/models/${RESET}"
echo -e "  ${DIM}gRPC     : :${WEAVER_GRPC_PORT}   admin: :${WEAVER_ADMIN_PORT}${RESET}"
echo -e "  ${DIM}Report   : tests/telemetry/report.txt${RESET}"

weaver registry live-check \
    -r "$ROOT/semconv/models/" \
    -p "$ROOT/semconv/policies/" \
    --otlp-grpc-port "$WEAVER_GRPC_PORT" \
    --admin-port "$WEAVER_ADMIN_PORT" \
    --inactivity-timeout 120 \
    > "$REPORT_FILE" 2>&1 &
WEAVER_PID=$!
echo "$WEAVER_PID" >> "$PIDFILE"

# Wait for weaver admin port to be ready
for i in $(seq 1 15); do
    if curl -sf "http://localhost:${WEAVER_ADMIN_PORT}/stop" --max-time 0.2 >/dev/null 2>&1; then
        break
    fi
    if ! kill -0 "$WEAVER_PID" 2>/dev/null; then
        echo ""
        echo -e "${RED}Weaver exited unexpectedly. Output:${RESET}"
        cat "$REPORT_FILE" || true
        exit 1
    fi
    sleep 1
done
ok "weaver live-check started (PID $WEAVER_PID)"

# ── 2. Pricing Service ────────────────────────────────────────────────────────

log "▸ Starting pricing-service (port 8000)"
(
    cd "$ROOT/pricing-service"
    OTEL_SERVICE_NAME=spaceport-pricing-service \
    OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:${WEAVER_GRPC_PORT}" \
    uv run uvicorn pricing_service.main:app \
        --host 127.0.0.1 --port 8000 \
        2>&1 | sed $'s/^/  \033[2m[pricing]\033[0m /'
) &
echo $! >> "$PIDFILE"
sleep 3

# ── 3. API ────────────────────────────────────────────────────────────────────

log "▸ Starting api (port 8080)"
(
    cd "$ROOT/api"
    OTEL_SERVICE_NAME=spaceport-api \
    OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:${WEAVER_GRPC_PORT}" \
    PRICING_SERVICE_URL="http://localhost:8000" \
    SPACEPORT_FRONTEND_ORIGIN="http://127.0.0.1:5175" \
    go run . 2>&1 | sed $'s/^/  \033[2m[api]\033[0m      /'
) &
echo $! >> "$PIDFILE"

echo -e "  ${DIM}Waiting for API…${RESET}"
for i in $(seq 1 40); do
    if curl -fsS http://localhost:8080/api/departures >/dev/null 2>&1; then
        ok "API ready"
        break
    fi
    if [[ $i -eq 40 ]]; then
        fail "API did not become ready in time"
    fi
    sleep 1
done

# ── 4. Telemetry coverage test ─────────────────────────────────────────────────

echo ""
log "━━━ Running telemetry coverage test ━━━"
echo ""

k6 run \
    "$ROOT/tests/k6/telemetry-coverage.js"

# ── 5. OTLP HTTP→gRPC bridge (for browser SDK) ───────────────────────────────
# The browser SDK sends OTLP/HTTP via the Vite proxy to port 80.
# Weaver only speaks gRPC. This container bridges the gap.

log "▸ Starting OTLP HTTP→gRPC bridge (Docker)"
echo -e "  ${DIM}HTTP :80 → gRPC host:${WEAVER_GRPC_PORT}${RESET}"

BRIDGE_CONTAINER_ID=$(docker run -d \
    --rm \
    -p "80:80" \
    -v "${SCRIPT_DIR}/frontend-bridge.yaml:/etc/otelcol-contrib/config.yaml:ro" \
    otel/opentelemetry-collector-contrib:latest 2>&1)

sleep 3
ok "bridge started (${BRIDGE_CONTAINER_ID:0:12})"

# ── 6. Frontend (Vite dev server) ─────────────────────────────────────────────

log "▸ Starting frontend (port 5175)"
(
    cd "$ROOT/frontend"
    VITE_SPACEPORT_ENV=local \
    npx vite --host 127.0.0.1 --port 5175 --strictPort \
        2>&1 | sed $'s/^/  \033[2m[frontend]\033[0m /'
) &
echo $! >> "$PIDFILE"

echo -e "  ${DIM}Waiting for Vite…${RESET}"
for i in $(seq 1 30); do
    if curl -fsS http://localhost:5175 >/dev/null 2>&1; then
        ok "frontend ready"
        break
    fi
    if [[ $i -eq 30 ]]; then
        fail "Frontend did not become ready in time"
    fi
    sleep 1
done

# ── 7. k6 browser telemetry coverage test ────────────────────────────────────

echo ""
log "━━━ Running k6 browser telemetry coverage test ━━━"
echo ""

k6 run \
    -e FRONTEND_URL="http://localhost:5175" \
    -e PRICING_SERVICE_URL="http://localhost:8000" \
    "$ROOT/tests/k6/browser/telemetry-coverage.js"

# ── 8. Flush & stop ───────────────────────────────────────────────────────────

echo ""
echo -e "${DIM}Waiting for telemetry to flush (5s)…${RESET}"
sleep 5

log "━━━ Stopping weaver ━━━"
curl -sf "http://localhost:${WEAVER_ADMIN_PORT}/stop" >/dev/null 2>&1 || true

# Give weaver a moment to finalize the report
sleep 2

# ── 9. Report ─────────────────────────────────────────────────────────────────

VIOLATION_COUNT=$(grep -c '\[violation\]' "$REPORT_FILE" 2>/dev/null) || VIOLATION_COUNT=0
IMPROVEMENT_COUNT=$(grep -c '\[improvement\]' "$REPORT_FILE" 2>/dev/null) || IMPROVEMENT_COUNT=0

echo ""
log "━━━ Conformance Report ━━━"
echo -e "  Report    : ${CYAN}tests/telemetry/report.txt${RESET}"
if (( VIOLATION_COUNT > 0 )); then
    echo -e "  Violations: ${RED}${VIOLATION_COUNT}${RESET}"
else
    echo -e "  Violations: ${GREEN}0${RESET}"
fi
echo -e "  Improvmnts: ${DIM}${IMPROVEMENT_COUNT}${RESET}"
echo ""

if (( VIOLATION_COUNT > 0 )); then
    echo -e "${RED}Violations found — check report.txt${RESET}"
    echo ""
    grep '\[violation\]' "$REPORT_FILE" | sort -u | head -20 || true
    echo ""
    exit 1
else
    echo -e "${GREEN}All telemetry conforms to the registry.${RESET}"
fi
