#!/usr/bin/env bash
set -euo pipefail

# ── Spaceport Dev Environment ────────────────────────────────
# Starts all three services for local development:
#   1. Pricing Service  (Python/FastAPI)  :8000
#   2. API              (Go)              :8080
#   3. Frontend         (Vite/React)      :5175
#
# Usage:  ./dev.sh          Start all services (OTel export disabled)
#         ./dev.sh stop     Kill running dev processes
#
# To export telemetry to a local collector:
#   OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 ./dev.sh
# ─────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")" && pwd)"
PIDFILE="$ROOT/.dev-pids"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
DIM='\033[2m'
RESET='\033[0m'

cleanup() {
  echo ""
  echo -e "${CYAN}Shutting down…${RESET}"
  if [[ -f "$PIDFILE" ]]; then
    while IFS= read -r pid; do
      kill "$pid" 2>/dev/null && echo -e "  ${DIM}stopped PID $pid${RESET}" || true
    done < "$PIDFILE"
    rm -f "$PIDFILE"
  fi
  # Kill any remaining child processes
  jobs -p 2>/dev/null | xargs -r kill 2>/dev/null || true
  wait 2>/dev/null || true
  echo -e "${GREEN}All services stopped.${RESET}"
}

stop_existing() {
  if [[ -f "$PIDFILE" ]]; then
    echo -e "${CYAN}Stopping previous dev session…${RESET}"
    while IFS= read -r pid; do
      kill "$pid" 2>/dev/null || true
    done < "$PIDFILE"
    rm -f "$PIDFILE"
    sleep 1
  fi
}

# Kill any process listening on the given port
free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo -e "  ${DIM}Freeing port $port (PIDs: $pids)${RESET}"
    echo "$pids" | xargs kill 2>/dev/null || true
    sleep 1
  fi
}

if [[ "${1:-}" == "stop" ]]; then
  stop_existing
  exit 0
fi

stop_existing
trap cleanup EXIT INT TERM

# ── OTel: disable export unless user provides an endpoint ──
if [[ -z "${OTEL_EXPORTER_OTLP_ENDPOINT:-}" ]]; then
  export OTEL_TRACES_EXPORTER=none
  export OTEL_METRICS_EXPORTER=none
  export OTEL_LOGS_EXPORTER=none
  OTEL_STATUS="disabled ${DIM}(set OTEL_EXPORTER_OTLP_ENDPOINT to enable)${RESET}"
else
  OTEL_STATUS="→ $OTEL_EXPORTER_OTLP_ENDPOINT"
fi

echo -e "${CYAN}━━━ Spaceport Dev Environment ━━━${RESET}"
echo -e "  ${DIM}OTel: ${OTEL_STATUS}${RESET}"
echo ""

# ── 1. Pricing Service (Python FastAPI) ──────────────────────
free_port 8000
echo -e "${GREEN}▸ Starting pricing-service${RESET} ${DIM}(port 8000)${RESET}"
(
  cd "$ROOT/pricing-service"
  export OTEL_SERVICE_NAME=spaceport-pricing-service
  uv run uvicorn pricing_service.main:app \
    --host 127.0.0.1 --port 8000 --reload \
    2>&1 | sed "s/^/  ${DIM}[pricing]${RESET} /"
) &
echo $! >> "$PIDFILE"

# Give pricing a moment to bind
sleep 2

# ── 2. API (Go) ─────────────────────────────────────────────
free_port 8080
echo -e "${GREEN}▸ Starting api${RESET} ${DIM}(port 8080)${RESET}"
(
  cd "$ROOT/api"
  export PRICING_SERVICE_URL="http://localhost:8000"
  export SPACEPORT_FRONTEND_ORIGIN="http://127.0.0.1:5175"
  export OTEL_SERVICE_NAME=spaceport-api
  go run . 2>&1 | sed "s/^/  ${DIM}[api]${RESET}      /"
) &
echo $! >> "$PIDFILE"

sleep 2

# ── 3. Frontend (Vite) ──────────────────────────────────────
free_port 5175
echo -e "${GREEN}▸ Starting frontend${RESET} ${DIM}(port 5175)${RESET}"
(
  cd "$ROOT/frontend"  export VITE_SPACEPORT_ENV=local  npx vite --host 127.0.0.1 --port 5175 --strictPort \
    2>&1 | sed "s/^/  ${DIM}[frontend]${RESET} /"
) &
echo $! >> "$PIDFILE"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${GREEN}Frontend${RESET}   http://127.0.0.1:5175"
echo -e "  ${GREEN}API${RESET}        http://127.0.0.1:8080"
echo -e "  ${GREEN}Pricing${RESET}    http://127.0.0.1:8000"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${DIM}Press Ctrl+C to stop all services${RESET}"
echo ""

wait
