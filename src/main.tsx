import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RotaProtegida } from "./components/RotaProtegida";
import { RotaAdminProtegida } from "./components/RotaAdminProtegida";
import { Login } from "./pages/Login";
import { AdminPanel } from "./pages/AdminPanel";
import { DashboardMLN } from "./pages/DashboardMLN";
import { DashboardProducao } from "./pages/DashboardProducao";
import { NaoEncontrado } from "./pages/NaoEncontrado";
import "./index.css";

// Subdomínio mln.nortemconsultoria.com.br → MLN_2
const isMlnSubdomain =
  typeof window !== "undefined" &&
  window.location.hostname === "mln.nortemconsultoria.com.br";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Protegidas por login */}
          <Route path="/mln"   element={<RotaProtegida slug="MLN">  <DashboardMLN />   </RotaProtegida>} />
          <Route path="/mln-2" element={<RotaProtegida slug="MLN-2"><DashboardProducao /></RotaProtegida>} />

          {/* Login e Admin */}
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <RotaAdminProtegida>
                <AdminPanel />
              </RotaAdminProtegida>
            }
          />

          {/* 404 */}
          <Route path="/404" element={<NaoEncontrado />} />

          {/* Redirect padrão */}
          <Route path="*" element={<Navigate to={isMlnSubdomain ? "/mln-2" : "/mln"} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
