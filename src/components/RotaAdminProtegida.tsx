import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export function RotaAdminProtegida({ children }: { children: ReactNode }) {
  const { sessao } = useAuth();

  if (!sessao || sessao.tipo !== "master") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
