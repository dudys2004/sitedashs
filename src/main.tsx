import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardMLN } from "./pages/DashboardMLN";
import { DashboardProducao } from "./pages/DashboardProducao";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/mln" element={<DashboardMLN />} />
        <Route path="/mln-2" element={<DashboardProducao />} />
        <Route path="*" element={<Navigate to="/mln" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
