import { Outlet, Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ChaosMenu } from "@/components/ChaosMenu";

export default function App() {
  const { currencies, selectedCurrency, setSelectedCurrency } = useCurrency();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
            <span>🛸</span>
            <span>Spaceport</span>
          </Link>
          <div className="flex items-center gap-4">
            <ChaosMenu />
            <Link to="/currencies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Currencies
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Spaceport © 2387 — All routes subject to gravitational delays
      </footer>
    </div>
  );
}
