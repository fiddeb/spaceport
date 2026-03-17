import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { tracer, tracedFetch } from "@/instrumentation";
import { trace, context } from "@opentelemetry/api";
import { Spinner } from "@/components/ui/spinner";

interface Currency {
  code: string;
  name: string;
  symbol: string;
  source?: string;
  rate: number;
  baseRate: number;
}

interface CurrencyContextValue {
  currencies: Currency[];
  selectedCurrency: string;
  setSelectedCurrency: (code: string) => void;
  convert: (amount: number) => string;
  refreshRates: () => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrencyState] = useState("UNC");
  const [loaded, setLoaded] = useState(false);
  const prevCurrency = useRef(selectedCurrency);

  useEffect(() => {
    const span = tracer.startSpan("app.load_currencies");
    const ctx = trace.setSpan(context.active(), span);
    tracedFetch("/api/currencies", undefined, ctx)
      .then((r) => r.json())
      .then((data: { currencies: Currency[] } | Currency[]) => {
        const raw = Array.isArray(data) ? data : data.currencies;
        const list = raw.map((c) => ({ ...c, baseRate: c.rate }));
        setCurrencies(list);
        setLoaded(true);
        span.end();
      })
      .catch(() => {
        span.end();
        // Fallback: UNC at rate 1
        setCurrencies([{ code: "UNC", name: "Universal Credits", symbol: "UNC", rate: 1, baseRate: 1 }]);
        setLoaded(true);
      });
  }, []);

  const setSelectedCurrency = useCallback(
    (code: string) => {
      const prev = prevCurrency.current;
      setSelectedCurrencyState(code);
      prevCurrency.current = code;

      if (prev !== code) {
        const span = tracer.startSpan("user.change_currency", {
          attributes: {
            "spaceport.pricing.base_currency": "UNC",
            "spaceport.pricing.display_currency": code,
          },
        });
        span.addEvent("exchange_completed");
        span.end();
      }
    },
    [],
  );

  const convert = useCallback(
    (amount: number): string => {
      const currency = currencies.find((c) => c.code === selectedCurrency);
      if (!currency) return `${amount.toFixed(2)} UNC`;
      const converted = amount * currency.rate;
      return `${converted.toFixed(2)} ${currency.code}`;
    },
    [currencies, selectedCurrency],
  );

  const refreshRates = useCallback(() => {
    setCurrencies((prev) => {
      const mutable = prev.filter((c) => c.code !== "UNC");
      // Pick 2–4 random currencies to fluctuate
      const shuffled = [...mutable].sort(() => Math.random() - 0.5);
      const picks = shuffled.slice(0, 2 + Math.floor(Math.random() * 3));
      const pickCodes = new Set(picks.map((c) => c.code));
      return prev.map((c) => {
        if (!pickCodes.has(c.code)) return c;
        // ±2% to ±8% change applied to current rate
        const delta = (Math.random() * 0.06 + 0.02) * (Math.random() < 0.5 ? 1 : -1);
        const newRate = Math.max(0.001, c.rate * (1 + delta));
        return { ...c, rate: Math.round(newRate * 10000) / 10000 };
      });
    });
  }, []);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return (
    <CurrencyContext.Provider
      value={{ currencies, selectedCurrency, setSelectedCurrency, convert, refreshRates }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
