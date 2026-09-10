import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LangProvider } from "./context/LangContext.jsx";
import AdminLayout, { RequireAdmin } from "./components/AdminLayout.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import AdminAppointments from "./pages/AdminAppointments.jsx";
import DailyChecklist from "./pages/DailyChecklist.jsx";
import PriceGuide from "./pages/PriceGuide.jsx";
import LeadInbox from "./pages/LeadInbox.jsx";
import QuoteSummary from "./pages/QuoteSummary.jsx";
import QuickQuote from "./pages/QuickQuote.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <LangProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              {/* Default away from retired Orders board */}
              <Route index element={<Navigate to="inbox" replace />} />
              <Route path="checklist" element={<DailyChecklist />} />
              <Route path="prices" element={<PriceGuide />} />
              <Route path="appointments" element={<AdminAppointments />} />
              <Route path="quote-summary" element={<QuoteSummary />} />
              <Route path="quick-quote" element={<QuickQuote />} />
              <Route path="inbox" element={<LeadInbox />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LangProvider>
    </AuthProvider>
  </React.StrictMode>
);
