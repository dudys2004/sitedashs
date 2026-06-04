import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminListarUsuarios, adminCriarUsuario, adminEditarUsuario, adminDeletarUsuario, adminListarPaginas } from "../lib/api";
import type { UsuarioAdmin } from "../lib/types";

interface Pagina {
  slug: string;
  nome: string;
  url: string;
}

export function AdminPanel() {
  const { sessao, sair } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [paginas, setPaginas] = useState<Pagina[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Formulário de criar
  const [novoLogin, setNovoLogin] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novasPaginas, setNovasPaginas] = useState("MLN");
  const [novoNome, setNovoNome] = useState("");

  // Edição
  const [editando, setEditando] = useState<UsuarioAdmin | null>(null);
  const [editLogin, setEditLogin] = useState("");
  const [editSenha, setEditSenha] = useState("");
  const [editPaginas, setEditPaginas] = useState("");
  const [editNome, setEditNome] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const masterToken = sessao?.masterToken || "";

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);
    const respUsers = await adminListarUsuarios(masterToken);
    const respPaginas = await adminListarPaginas();
    setCarregando(false);

    if (respUsers.ok && respUsers.usuarios) {
      setUsuarios(respUsers.usuarios);
    }
    if (respPaginas.ok && respPaginas.paginas) {
      setPaginas(respPaginas.paginas);
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
    const resp = await adminCriarUsuario(masterToken, novoLogin, novaSenha, novasPaginas, novoNome || novoLogin);
    setCarregando(false);

    if (resp.ok) {
      setMensagem("Usuário criado com sucesso!");
      setNovoLogin("");
      setNovaSenha("");
      setNovasPaginas("MLN");
      setNovoNome("");
      carregarDados();
    } else {
      setErro(resp.erro || "Erro ao criar usuário.");
    }
  }

  async function aoEditar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando || !editLogin) return;
    setErro(null);
    setMensagem(null);

    setCarregando(true);
    const resp = await adminEditarUsuario(masterToken, editando.login, editLogin, editSenha, editPaginas, editNome);
    setCarregando(false);

    if (resp.ok) {
      setMensagem("Usuário atualizado com sucesso!");
      setEditando(null);
      carregarDados();
    } else {
      setErro(resp.erro || "Erro ao editar usuário.");
    }
  }

  async function deletarUsuario(login: string) {
    if (!confirm(`Tem certeza que quer deletar ${login}?`)) return;

    setCarregando(true);
    const resp = await adminDeletarUsuario(masterToken, login);
    setCarregando(false);

    if (resp.ok) {
      setMensagem("Usuário deletado!");
      carregarDados();
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
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

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Links de acesso rápido às páginas */}
        {!editando && paginas.length > 0 && (
          <section
            className="rounded-2xl p-6 ring-1 ring-white/5"
            style={{ backgroundColor: "var(--cor-superficie)" }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--cor-texto)" }}>
              Dashboards Disponíveis
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {paginas.map((p) => (
                <a
                  key={p.slug}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-white/10 p-4 transition hover:border-white/30 hover:bg-white/5"
                >
                  <span style={{ color: "var(--cor-texto)" }}>{p.nome}</span>
                  <span style={{ color: "var(--cor-texto-suave)", fontSize: "12px" }}>→</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Criar usuário */}
        {!editando && (
          <section
            className="rounded-2xl p-6 ring-1 ring-white/5"
            style={{ backgroundColor: "var(--cor-superficie)" }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--cor-texto)" }}>
              Criar novo usuário
            </h2>

            <form onSubmit={aocriar} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                    Páginas
                  </label>
                  <input
                    type="text"
                    value={novasPaginas}
                    onChange={(e) => setNovasPaginas(e.target.value)}
                    placeholder="ex: MLN,FOO"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--cor-texto-suave)" }}>
                    Nome (opcional)
                  </label>
                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="ex: Maria Silva"
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
        )}

        {/* Editar usuário */}
        {editando && (
          <section
            className="rounded-2xl p-6 ring-1 ring-white/5"
            style={{ backgroundColor: "var(--cor-superficie)" }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--cor-texto)" }}>
              Editando: {editando.login}
            </h2>

            <form onSubmit={aoEditar} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--cor-texto-suave)" }}>
                    Novo login (se mudar)
                  </label>
                  <input
                    type="text"
                    value={editLogin}
                    onChange={(e) => setEditLogin(e.target.value)}
                    placeholder={editando.login}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--cor-texto-suave)" }}>
                    Nova senha (deixe em branco para manter)
                  </label>
                  <input
                    type="password"
                    value={editSenha}
                    onChange={(e) => setEditSenha(e.target.value)}
                    placeholder="••••••"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--cor-texto-suave)" }}>
                    Páginas
                  </label>
                  <input
                    type="text"
                    value={editPaginas}
                    onChange={(e) => setEditPaginas(e.target.value)}
                    placeholder={editando.paginas || "MLN"}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--cor-texto-suave)" }}>
                    Nome
                  </label>
                  <input
                    type="text"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    placeholder={editando.nome}
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

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={carregando}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-60"
                >
                  {carregando ? "Salvando..." : "Salvar mudanças"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="rounded-lg px-4 py-2 text-sm font-medium ring-1 ring-white/10 transition hover:ring-white/30"
                  style={{ color: "var(--cor-texto-suave)" }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        )}

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
                    {!u.ativo && <p className="text-xs text-yellow-400">⚠️ Inativo</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditando(u);
                        setEditLogin(u.login);
                        setEditSenha("");
                        setEditPaginas(u.paginas);
                        setEditNome(u.nome);
                        setErro(null);
                        setMensagem(null);
                      }}
                      disabled={carregando}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20 transition hover:ring-blue-500/50 disabled:opacity-60"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deletarUsuario(u.login)}
                      disabled={carregando}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 ring-1 ring-red-500/20 transition hover:ring-red-500/50 disabled:opacity-60"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
