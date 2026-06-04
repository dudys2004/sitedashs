import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { mensagemErro } from "../lib/api";

export function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const resp = await entrar(usuario, senha);
    setCarregando(false);
    if (resp.ok) {
      navigate(`/${resp.cliente.slug}`);
    } else {
      setErro(mensagemErro(resp.erro));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 ring-1 ring-blue-500/30">
            <svg
              className="h-7 w-7 text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <rect x="7" y="10" width="3" height="7" />
              <rect x="12" y="6" width="3" height="11" />
              <rect x="17" y="13" width="3" height="4" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-100">Portal de Dashboards</h1>
          <p className="mt-1 text-sm text-slate-400">Entre para acessar seu painel</p>
        </div>

        <form
          onSubmit={aoEnviar}
          className="space-y-4 rounded-2xl bg-slate-900 p-6 shadow-xl ring-1 ring-white/5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Usuário
            </label>
            <input
              type="text"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Senha
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {erro && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-red-500/20">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
