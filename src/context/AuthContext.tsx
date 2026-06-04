import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as apiLogin } from "../lib/api";
import type { ClienteSessao, Dashboard, RespostaLogin } from "../lib/types";

interface Sessao {
  cliente: ClienteSessao;
  dashboard: Dashboard;
}

interface AuthContextValor {
  sessao: Sessao | null;
  entrar: (usuario: string, senha: string) => Promise<RespostaLogin>;
  sair: () => void;
}

const CHAVE_SESSAO = "site-dashs:sessao";

const AuthContext = createContext<AuthContextValor | null>(null);

function lerSessaoSalva(): Sessao | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE_SESSAO);
    return bruto ? (JSON.parse(bruto) as Sessao) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(lerSessaoSalva);

  const entrar = useCallback(async (usuario: string, senha: string) => {
    const resp = await apiLogin(usuario, senha);
    if (resp.ok) {
      const nova: Sessao = { cliente: resp.cliente, dashboard: resp.dashboard };
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(nova));
      setSessao(nova);
    }
    return resp;
  }, []);

  const sair = useCallback(() => {
    sessionStorage.removeItem(CHAVE_SESSAO);
    setSessao(null);
  }, []);

  const valor = useMemo(() => ({ sessao, entrar, sair }), [sessao, entrar, sair]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValor {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
