import "./instrumentation";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { DepartureListPage } from "@/pages/DepartureListPage";
import { DepartureDetailPage } from "@/pages/DepartureDetailPage";
import { BookingFormPage } from "@/pages/BookingFormPage";
import { ConfirmationPage } from "@/pages/ConfirmationPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <CurrencyProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<App />}>
              <Route path="/" element={<DepartureListPage />} />
              <Route path="/departures/:id" element={<DepartureDetailPage />} />
              <Route path="/book/:id" element={<BookingFormPage />} />
              <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CurrencyProvider>
    </ErrorBoundary>
  </StrictMode>,
);
