import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminListarUsuarios, adminCriarUsuario, adminDeletarUsuario } from "../lib/api";
import type { UsuarioAdmin } from "../lib/types";

export function AdminPanel() {
  const { sessao, sair } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [novoLogin, setNovoLogin] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novasPaginas, setNovasPaginas] = useState("MLN");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const masterToken = sessao?.masterToken || "";

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    setCarregando(true);
    const resp = await adminListarUsuarios(masterToken);
    setCarregando(false);
    if (resp.ok && resp.usuarios) {
      setUsuarios(resp.usuarios);
    } else {
      setErro(resp.erro || "Erro ao carregar usuários.");
    }
  }

  async function aocriar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    if (!novoLogin || !novaSenha || !novasPaginas) {
      setErro("Preencha todos os campos.");
      return;
    }

    setCarregando(true);
    const resp = await adminCriarUsuario(masterToken, novoLogin, novaSenha, novasPaginas);
    setCarregando(false);

    if (resp.ok) {
      setMensagem("Usuário criado com sucesso!");
      setNovoLogin("");
      setNovaSenha("");
      setNovasPaginas("MLN");
      carregarUsuarios();
    } else {
      setErro(resp.erro || "Erro ao criar usuário.");
    }
  }

  async function deletarUsuario(login: string) {
    if (!confirm(`Tem certeza que quer deletar ${login}?`)) return;

    setCarregando(true);
    const resp = await adminDeletarUsuario(masterToken, login);
    setCarregando(false);

    if (resp.ok) {
      setMensagem("Usuário deletado!");
      carregarUsuarios();
    } else {
      setErro(resp.erro || "Erro ao deletar usuário.");
    }
  }

  function sairEVoltar() {
    sair();
    navigate("/");
  }

  if (sessao?.tipo !== "master") return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cor-fundo)" }}>
      <header
        className="border-b border-white/5 backdrop-blur"
        style={{ backgroundColor: "color-mix(in srgb, var(--cor-fundo) 85%, transparent)" }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold" style={{ color: "var(--cor-texto)" }}>
            Painel de Administração
          </h1>
          <button
            onClick={sairEVoltar}
            className="rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-white/10 transition hover:ring-white/30"
            style={{ color: "var(--cor-texto-suave)" }}
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {/* Criar usuário */}
        <section
          className="rounded-2xl p-6 ring-1 ring-white/5"
          style={{ backgroundColor: "var(--cor-superficie)" }}
        >
          <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--cor-texto)" }}>
            Criar novo usuário
          </h2>

          <form onSubmit={aocriar} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--cor-texto-suave)" }}>
                  Login
                </label>
                <input
                  type="text"
                  value={novoLogin}
                  onChange={(e) => setNovoLogin(e.target.value)}
                  placeholder="ex: maria"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--cor-texto-suave)" }}>
                  Senha
                </label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="ex: senha123"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--cor-texto-suave)" }}>
                  Página(s) (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={novasPaginas}
                  onChange={(e) => setNovasPaginas(e.target.value)}
                  placeholder="ex: MLN,FOO"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {erro && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 ring-1 ring-red-500/20">
                {erro}
              </p>
            )}
            {mensagem && (
              <p className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400 ring-1 ring-green-500/20">
                {mensagem}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {carregando ? "Criando..." : "Criar usuário"}
            </button>
          </form>
        </section>

        {/* Lista de usuários */}
        <section
          className="rounded-2xl p-6 ring-1 ring-white/5"
          style={{ backgroundColor: "var(--cor-superficie)" }}
        >
          <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--cor-texto)" }}>
            Usuários cadastrados ({usuarios.length})
          </h2>

          {carregando && <p style={{ color: "var(--cor-texto-suave)" }}>Carregando...</p>}

          {!carregando && usuarios.length === 0 && (
            <p style={{ color: "var(--cor-texto-suave)" }}>Nenhum usuário cadastrado.</p>
          )}

          {!carregando && usuarios.length > 0 && (
            <div className="space-y-2">
              {usuarios.map((u) => (
                <div
                  key={u.login}
                  className="flex items-center justify-between rounded-lg border border-white/5 p-3"
                  style={{ backgroundColor: "var(--cor-fundo)" }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--cor-texto)" }}>
                      {u.nome} ({u.login})
                    </p>
                    <p className="text-xs" style={{ color: "var(--cor-texto-suave)" }}>
                      Páginas: {u.paginas || "—"}
                    </p>
                    {!u.ativo && (
                      <p className="text-xs text-yellow-400">⚠️ Inativo</p>
                    )}
                  </div>
                  <button
                    onClick={() => deletarUsuario(u.login)}
                    disabled={carregando}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 ring-1 ring-red-500/20 transition hover:ring-red-500/50 disabled:opacity-60"
                  >
                    Deletar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
