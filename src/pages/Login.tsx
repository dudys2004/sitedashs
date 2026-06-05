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
      navigate(resp.tipo === "master" ? "/admin" : `/${resp.cliente.slug}`);
    } else {
      setErro(mensagemErro(resp.erro));
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "#0f172a" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img
            src="/logos/logo nortem.png"
            alt="Nortem"
            style={{ height: 72, width: "auto", margin: "0 auto 16px", display: "block" }}
          />
          <h1 className="text-xl font-semibold" style={{ color: "#f1f5f9" }}>Portal Nortem</h1>
          <p className="mt-1 text-sm" style={{ color: "#94a3b8" }}>Entre para acessar seu painel</p>
        </div>

        {/* Formulário */}
        <form
          onSubmit={aoEnviar}
          className="space-y-4 rounded-2xl p-6"
          style={{ backgroundColor: "#1e293b", boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 20px 40px rgba(0,0,0,0.4)" }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "#cbd5e1" }}>Usuário</label>
            <input
              type="text"
              autoComplete="username"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              required
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                border: "1px solid #334155", backgroundColor: "#0f172a",
                color: "#f1f5f9", outline: "none", fontSize: 14,
              }}
              onFocus={e => (e.target.style.borderColor = "#6366f1")}
              onBlur={e => (e.target.style.borderColor = "#334155")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "#cbd5e1" }}>Senha</label>
            <input
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                border: "1px solid #334155", backgroundColor: "#0f172a",
                color: "#f1f5f9", outline: "none", fontSize: 14,
              }}
              onFocus={e => (e.target.style.borderColor = "#6366f1")}
              onBlur={e => (e.target.style.borderColor = "#334155")}
            />
          </div>

          {erro && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            style={{
              width: "100%", padding: "10px", borderRadius: 8,
              backgroundColor: carregando ? "#4338ca" : "#6366f1",
              color: "#fff", fontWeight: 600, fontSize: 14,
              border: "none", cursor: carregando ? "not-allowed" : "pointer",
              opacity: carregando ? 0.7 : 1, transition: "background-color 0.15s",
            }}
            onMouseEnter={e => { if (!carregando) (e.currentTarget.style.backgroundColor = "#4f46e5"); }}
            onMouseLeave={e => { if (!carregando) (e.currentTarget.style.backgroundColor = "#6366f1"); }}
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
