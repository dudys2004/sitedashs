import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardMLN } from "./pages/DashboardMLN";
import { DashboardProducao } from "./pages/DashboardProducao";
import "./index.css";

// Detecta subdomínio mln.nortemconsultoria.com.br → exibe MLN_2
const isMlnSubdomain = typeof window !== "undefined" &&
  window.location.hostname === "mln.nortemconsultoria.com.br";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/mln"   element={<DashboardMLN />} />
        <Route path="/mln-2" element={<DashboardProducao />} />
        <Route path="*" element={<Navigate to={isMlnSubdomain ? "/mln-2" : "/mln"} replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
