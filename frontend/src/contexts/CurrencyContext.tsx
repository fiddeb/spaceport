import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { tracer } from "@/instrumentation";
import { Spinner } from "@/components/ui/spinner";

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

interface CurrencyContextValue {
  currencies: Currency[];
  selectedCurrency: string;
  setSelectedCurrency: (code: string) => void;
  convert: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrencyState] = useState("UNC");
  const [loaded, setLoaded] = useState(false);
  const prevCurrency = useRef(selectedCurrency);

  useEffect(() => {
    fetch("/api/currencies")
      .then((r) => r.json())
      .then((data: { currencies: Currency[] } | Currency[]) => {
        const list = Array.isArray(data) ? data : data.currencies;
        setCurrencies(list);
        setLoaded(true);
      })
      .catch(() => {
        // Fallback: UNC at rate 1
        setCurrencies([{ code: "UNC", name: "Universal Credits", symbol: "UNC", rate: 1 }]);
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

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return (
    <CurrencyContext.Provider
      value={{ currencies, selectedCurrency, setSelectedCurrency, convert }}
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
