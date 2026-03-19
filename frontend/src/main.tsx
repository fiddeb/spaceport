import "./instrumentation";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import { LandingLayout } from "@/components/LandingLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LandingPage } from "@/pages/LandingPage";
import { DepartureListPage } from "@/pages/DepartureListPage";
import { DepartureDetailPage } from "@/pages/DepartureDetailPage";
import { BookingFormPage } from "@/pages/BookingFormPage";
import { ConfirmationPage } from "@/pages/ConfirmationPage";
import { CurrenciesPage } from "@/pages/CurrenciesPage";
import { InformationDeskPage } from "@/pages/InformationDeskPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <CurrencyProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<LandingLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/information" element={<InformationDeskPage />} />
            </Route>
            <Route element={<App />}>
              <Route path="/departures" element={<DepartureListPage />} />
              <Route path="/departures/:id" element={<DepartureDetailPage />} />
              <Route path="/book/:id" element={<BookingFormPage />} />
              <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
              <Route path="/currencies" element={<CurrenciesPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CurrencyProvider>
    </ErrorBoundary>
  </StrictMode>,
);
