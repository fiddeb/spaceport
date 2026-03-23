import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ChaosMenu() {
  const [status, setStatus] = useState<string | null>(null);

  async function trigger(endpoint: string, body: object, label: string, successMsg?: string) {
    setStatus(`${label}…`);
    try {
      const resp = await fetch(`/chaos/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setStatus(successMsg ?? `${label} ✓`);
    } catch {
      setStatus(`${label} failed`);
    }
    setTimeout(() => setStatus(null), successMsg ? 4000 : 2000);
  }

  async function triggerApi(endpoint: string, body: object, label: string, successMsg?: string) {
    setStatus(`${label}…`);
    try {
      const resp = await fetch(`/api-chaos/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setStatus(successMsg ?? `${label} ✓`);
    } catch {
      setStatus(`${label} failed`);
    }
    setTimeout(() => setStatus(null), successMsg ? 4000 : 2000);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
          {status ?? "⚡ Chaos"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Error Injection</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => trigger("simulate-failure", { count: 1 }, "1 failure")}>
          Fail next request
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => trigger("simulate-failure", { count: 3 }, "3 failures", "For a moment, nothing happened. Then, after a second or so, nothing continued to happen")}>
          Fail next 3 requests
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Latency Injection</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => trigger("simulate-latency", { count: 1, latency_ms: 2000 }, "2s latency ×1")}>
          2s latency — next request
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => trigger("simulate-latency", { count: 5, latency_ms: 2000 }, "2s latency ×5")}>
          2s latency — next 5 requests
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>CORS Injection</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => triggerApi("simulate-cors-block", { count: 1 }, "CORS block ×1", "Next API request will be rejected with 403 Forbidden")}>
          Block next request (CORS 403)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => triggerApi("simulate-cors-block", { count: 3 }, "CORS block ×3", "Next 3 API requests will be rejected with 403 Forbidden")}>
          Block next 3 requests (CORS 403)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
