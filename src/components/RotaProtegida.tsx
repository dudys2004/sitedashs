import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  slug: string; // ex: "MLN" | "MLN-2"
}

export function RotaProtegida({ children, slug }: Props) {
  const { sessao } = useAuth();

  // Sem sessão → redireciona para login
  if (!sessao) return <Navigate to="/login" replace />;

  // Master tem acesso a tudo
  if (sessao.tipo === "master") return <>{children}</>;

  // Verifica se o usuário tem permissão para esta página
  const paginas = (sessao.paginas ?? []).map((p) => p.trim().toUpperCase());
  if (!paginas.includes(slug.toUpperCase())) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
