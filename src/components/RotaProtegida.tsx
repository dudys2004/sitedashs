import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

// Bloqueia /:slug sem sessão válida e impede que um usuário logado acesse o
// slug de outro cliente (redireciona ao dashboard dele).
export function RotaProtegida({ children }: { children: ReactNode }) {
  const { sessao } = useAuth();
  const { slug } = useParams();

  if (!sessao) {
    return <Navigate to="/" replace />;
  }
  if (slug && slug !== sessao.cliente.slug) {
    return <Navigate to={`/${sessao.cliente.slug}`} replace />;
  }
  return <>{children}</>;
}
