import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Redireciona automaticamente baseado no hostname:
 * - admin.nortemconsultoria.com.br → /admin
 * - mln.nortemconsultoria.com.br → /MLN
 * - foo.nortemconsultoria.com.br → /FOO
 * etc.
 */
export function HostnameRedirector({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { sessao } = useAuth();

  useEffect(() => {
    const hostname = window.location.hostname;

    // Detecta se é um subdomínio de nortemconsultoria.com.br
    if (hostname.endsWith(".nortemconsultoria.com.br")) {
      const subdominio = hostname.split(".")[0].toUpperCase();

      // Se é "admin", vai pro /admin
      if (subdominio === "ADMIN") {
        if (!sessao || sessao.tipo !== "master") {
          // Sem sessão ou não é master, vai pro login
          navigate("/", { replace: true });
        } else {
          // Já é master, vai pro admin
          navigate("/admin", { replace: true });
        }
      } else {
        // Qualquer outro subdomínio (MLN, FOO, etc) vai pro /:slug
        if (!sessao) {
          // Sem sessão, vai pro login
          navigate("/", { replace: true });
        } else if (sessao.tipo === "master") {
          // Master logado num subdomínio específico, redireciona pro admin
          navigate("/admin", { replace: true });
        } else {
          // Usuário normal, vai pro dashboard dele
          navigate(`/${subdominio}`, { replace: true });
        }
      }
    }
  }, [navigate, sessao]);

  return <>{children}</>;
}
