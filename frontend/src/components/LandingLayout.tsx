import { Outlet, Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";

export function LandingLayout() {
  const { currencies, selectedCurrency, setSelectedCurrency } = useCurrency();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="fixed top-0 z-40 w-full border-b border-border/50 bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
            <span>🛸</span>
            <span>Spaceport</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/departures"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Departures
            </Link>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Spaceport © 2387 — All routes subject to gravitational delays
      </footer>
    </div>
  );
}
