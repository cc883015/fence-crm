import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LangProvider } from "./context/LangContext.jsx";
import AdminLayout, { RequireAdmin } from "./components/AdminLayout.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import AdminBoard from "./pages/AdminBoard.jsx";
import NewCustomerWizard from "./pages/NewCustomerWizard.jsx";
import CustomerDetail from "./pages/CustomerDetail.jsx";
import Enquiries from "./pages/Enquiries.jsx";
import Reports from "./pages/Reports.jsx";
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
              <Route index element={<AdminBoard />} />
              <Route path="enquiries" element={<Enquiries />} />
              <Route path="new" element={<NewCustomerWizard />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LangProvider>
    </AuthProvider>
  </React.StrictMode>
);
