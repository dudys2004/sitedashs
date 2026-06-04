import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RotaProtegida } from "./components/RotaProtegida";
import { RotaAdminProtegida } from "./components/RotaAdminProtegida";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { AdminPanel } from "./pages/AdminPanel";
import { NaoEncontrado } from "./pages/NaoEncontrado";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/admin"
            element={
              <RotaAdminProtegida>
                <AdminPanel />
              </RotaAdminProtegida>
            }
          />
          <Route
            path="/:slug"
            element={
              <RotaProtegida>
                <Dashboard />
              </RotaProtegida>
            }
          />
          <Route path="/404" element={<NaoEncontrado />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
