import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";

export function CurrenciesPage() {
  const { currencies, refreshRates } = useCurrency();
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => {
      refreshRates();
      setRefreshing(false);
    }, 600);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <span className="text-lg">&larr;</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Currencies</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All rates are relative to UNC (Universal Neural Credits)
            </p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          {refreshing ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Updating…
            </span>
          ) : (
            "Refresh rates"
          )}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Code</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Source</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Rate</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Change</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((c, i) => {
              const changePct =
                c.baseRate && c.baseRate !== 0
                  ? ((c.rate - c.baseRate) / c.baseRate) * 100
                  : 0;
              const isBase = c.code === "UNC";
              return (
                <tr
                  key={c.code}
                  className={
                    i % 2 === 0 ? "bg-background" : "bg-muted/20"
                  }
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-foreground">{c.code}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.source ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    {isBase ? "1.0000" : c.rate.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isBase ? (
                      <span className="text-muted-foreground">—</span>
                    ) : Math.abs(changePct) < 0.001 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : changePct > 0 ? (
                      <span className="font-medium text-emerald-500">
                        ▲ +{changePct.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="font-medium text-red-500">
                        ▼ {changePct.toFixed(2)}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
