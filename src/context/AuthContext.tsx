import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { login as apiLogin } from "../lib/api";
import type { ClienteSessao, RespostaLogin } from "../lib/types";

interface Sessao {
  tipo: "master" | "usuario";
  cliente: ClienteSessao;
  paginas?: string[];
  masterToken?: string;
}

interface AuthContextValor {
  sessao: Sessao | null;
  entrar: (usuario: string, senha: string) => Promise<RespostaLogin>;
  sair: () => void;
}

const CHAVE = "site-dashs:sessao";
const AuthContext = createContext<AuthContextValor | null>(null);

function lerSessao(): Sessao | null {
  try { const s = localStorage.getItem(CHAVE); return s ? JSON.parse(s) : null; }
  catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(lerSessao);

  const entrar = useCallback(async (usuario: string, senha: string): Promise<RespostaLogin> => {
    const resp = await apiLogin(usuario, senha);
    if (resp.ok) {
      const nova: Sessao = { tipo: resp.tipo, cliente: resp.cliente, paginas: resp.paginas, masterToken: resp.masterToken };
      localStorage.setItem(CHAVE, JSON.stringify(nova));
      setSessao(nova);
    }
    return resp;
  }, []);

  const sair = useCallback(() => {
    localStorage.removeItem(CHAVE);
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
