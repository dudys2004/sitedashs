import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  adminListarUsuarios, adminCriarUsuario, adminEditarUsuario,
  adminDeletarUsuario, adminListarPaginas, mensagemErro,
} from "../lib/api";
import type { UsuarioAdmin, PaginaDisponivel } from "../lib/types";

const BG   = "#0f172a";
const CARD = "#1e293b";
const BORD = "#334155";
const TEXT = "#f1f5f9";
const MUTED = "#94a3b8";
const ACCENT = "#6366f1";

// ── Componentes auxiliares ─────────────────────────────────────────

function Input({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  const [foco, setFoco] = useState(false);
  return (
    <div>
      <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 500, color: MUTED }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "8px 12px", borderRadius: 8,
          border: `1px solid ${foco ? ACCENT : BORD}`,
          backgroundColor: BG, color: TEXT, outline: "none", fontSize: 13,
          boxSizing: "border-box",
        }}
        onFocus={() => setFoco(true)}
        onBlur={() => setFoco(false)}
      />
    </div>
  );
}

function PaginasCheckbox({ paginas, selecionadas, onChange }: {
  paginas: PaginaDisponivel[];
  selecionadas: string[];
  onChange: (novas: string[]) => void;
}) {
  function toggle(slug: string) {
    onChange(selecionadas.includes(slug)
      ? selecionadas.filter(p => p !== slug)
      : [...selecionadas, slug]
    );
  }
  return (
    <div>
      <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 500, color: MUTED }}>
        Páginas com acesso
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {paginas.map(p => {
          const marcada = selecionadas.includes(p.slug);
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => toggle(p.slug)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                cursor: "pointer", border: `1px solid ${marcada ? ACCENT : BORD}`,
                backgroundColor: marcada ? `${ACCENT}22` : "transparent",
                color: marcada ? "#a5b4fc" : MUTED,
                transition: "all 0.15s",
              }}
            >
              {marcada ? "✓ " : ""}{p.nome}
            </button>
          );
        })}
        {paginas.length === 0 && (
          <span style={{ color: MUTED, fontSize: 12 }}>Carregando páginas...</span>
        )}
      </div>
    </div>
  );
}

// ── AdminPanel principal ───────────────────────────────────────────
export function AdminPanel() {
  const { sessao, sair } = useAuth();
  const navigate = useNavigate();

  const [usuarios, setUsuarios]   = useState<UsuarioAdmin[]>([]);
  const [paginas, setPaginas]     = useState<PaginaDisponivel[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Formulário criar
  const [cLogin, setCLogin]   = useState("");
  const [cSenha, setCSenha]   = useState("");
  const [cNome, setCNome]     = useState("");
  const [cPags, setCPags]     = useState<string[]>([]);

  // Formulário editar
  const [editando, setEditando]   = useState<UsuarioAdmin | null>(null);
  const [eLogin, setELogin]       = useState("");
  const [eSenha, setESenha]       = useState("");
  const [eNome, setENome]         = useState("");
  const [ePags, setEPags]         = useState<string[]>([]);

  const [msg, setMsg]   = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const token = sessao?.masterToken ?? "";

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setCarregando(true);
    const [rU, rP] = await Promise.all([adminListarUsuarios(token), adminListarPaginas()]);
    setCarregando(false);
    if (rU.ok && rU.usuarios) setUsuarios(rU.usuarios);
    if (rP.ok && rP.paginas)  setPaginas(rP.paginas);
  }

  function feedback(tipo: "ok" | "erro", texto: string) {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 4000);
  }

  async function aoCriar(e: React.FormEvent) {
    e.preventDefault();
    if (!cLogin || !cSenha || cPags.length === 0) {
      return feedback("erro", "Preencha login, senha e selecione ao menos uma página.");
    }
    setCarregando(true);
    const r = await adminCriarUsuario(token, cLogin, cSenha, cPags.join(","), cNome || cLogin);
    setCarregando(false);
    if (r.ok) {
      feedback("ok", "Usuário criado com sucesso!");
      setCLogin(""); setCSenha(""); setCNome(""); setCPags([]);
      carregar();
    } else {
      feedback("erro", mensagemErro(r.erro));
    }
  }

  async function aoEditar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setCarregando(true);
    const r = await adminEditarUsuario(token, editando.login, eLogin, eSenha, ePags.join(","), eNome);
    setCarregando(false);
    if (r.ok) {
      feedback("ok", "Usuário atualizado com sucesso!");
      setEditando(null);
      carregar();
    } else {
      feedback("erro", mensagemErro(r.erro));
    }
  }

  async function aoDeletar(login: string) {
    if (!confirm(`Deseja realmente deletar o usuário "${login}"?`)) return;
    setCarregando(true);
    const r = await adminDeletarUsuario(token, login);
    setCarregando(false);
    if (r.ok) { feedback("ok", "Usuário deletado."); carregar(); }
    else feedback("erro", mensagemErro(r.erro));
  }

  function iniciarEdicao(u: UsuarioAdmin) {
    setEditando(u);
    setELogin(u.login);
    setESenha("");
    setENome(u.nome);
    setEPags(u.paginas ? u.paginas.split(",").map(p => p.trim()).filter(Boolean) : []);
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function sairEVoltar() { sair(); navigate("/login"); }

  if (sessao?.tipo !== "master") return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG, color: TEXT }}>

      {/* Header */}
      <header style={{
        borderBottom: `1px solid ${BORD}`,
        backgroundColor: CARD,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: `${ACCENT}22`, border: `1px solid ${ACCENT}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Painel Administrativo</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={sairEVoltar}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                border: `1px solid ${BORD}`, color: MUTED, backgroundColor: "transparent",
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORD; e.currentTarget.style.color = MUTED; }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Feedback global */}
        {msg && (
          <div style={{
            padding: "12px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            backgroundColor: msg.tipo === "ok" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${msg.tipo === "ok" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: msg.tipo === "ok" ? "#6ee7b7" : "#f87171",
          }}>
            {msg.tipo === "ok" ? "✓ " : "⚠ "}{msg.texto}
          </div>
        )}

        {/* ── Páginas disponíveis ── */}
        <section style={{ backgroundColor: CARD, borderRadius: 16, padding: 24, border: `1px solid ${BORD}` }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: TEXT }}>Páginas</h2>
          <p style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>
            Acesse as páginas disponíveis no sistema
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {paginas.length === 0 && (
              <p style={{ color: MUTED, fontSize: 13 }}>Carregando páginas...</p>
            )}
            {paginas.map(p => (
              <a
                key={p.slug}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 18px", borderRadius: 10,
                  border: `1px solid ${BORD}`, textDecoration: "none",
                  backgroundColor: "transparent", transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = ACCENT;
                  e.currentTarget.style.backgroundColor = `${ACCENT}0f`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = BORD;
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: 0 }}>{p.nome}</p>
                  <p style={{ fontSize: 11, color: MUTED, margin: "2px 0 0" }}>{p.url}</p>
                </div>
                <span style={{ color: MUTED, fontSize: 16, marginLeft: 8 }}>↗</span>
              </a>
            ))}
          </div>
        </section>

        {/* ── Formulário criar / editar ── */}
        <section style={{ backgroundColor: CARD, borderRadius: 16, padding: 24, border: `1px solid ${BORD}` }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: TEXT }}>
            {editando ? `Editando usuário: ${editando.login}` : "Criar novo usuário"}
          </h2>

          <form onSubmit={editando ? aoEditar : aoCriar}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 16 }}>
              <Input
                label={editando ? "Novo login (deixe para manter)" : "Login *"}
                value={editando ? eLogin : cLogin}
                onChange={editando ? setELogin : setCLogin}
                placeholder={editando ? editando.login : "ex: joao"}
              />
              <Input
                label={editando ? "Nova senha (deixe em branco para manter)" : "Senha *"}
                value={editando ? eSenha : cSenha}
                onChange={editando ? setESenha : setCSenha}
                type="password"
                placeholder={editando ? "••••••" : "ex: senha123"}
              />
              <Input
                label="Nome"
                value={editando ? eNome : cNome}
                onChange={editando ? setENome : setCNome}
                placeholder={editando ? editando.nome : "ex: João Silva"}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <PaginasCheckbox
                paginas={paginas}
                selecionadas={editando ? ePags : cPags}
                onChange={editando ? setEPags : setCPags}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                disabled={carregando}
                style={{
                  padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  backgroundColor: editando ? "#059669" : ACCENT,
                  color: "#fff", border: "none", cursor: carregando ? "not-allowed" : "pointer",
                  opacity: carregando ? 0.6 : 1,
                }}
              >
                {carregando ? "Salvando..." : editando ? "Salvar alterações" : "Criar usuário"}
              </button>

              {editando && (
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  style={{
                    padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                    backgroundColor: "transparent", color: MUTED,
                    border: `1px solid ${BORD}`, cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ── Lista de usuários ── */}
        <section style={{ backgroundColor: CARD, borderRadius: 16, padding: 24, border: `1px solid ${BORD}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>
              Usuários cadastrados
              <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 20, backgroundColor: `${ACCENT}22`, color: "#a5b4fc", fontSize: 12 }}>
                {usuarios.length}
              </span>
            </h2>
            <button
              onClick={carregar}
              disabled={carregando}
              style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, border: `1px solid ${BORD}`, backgroundColor: "transparent", color: MUTED, cursor: "pointer" }}
            >
              ↻ Atualizar
            </button>
          </div>

          {carregando && <p style={{ color: MUTED, fontSize: 13 }}>Carregando...</p>}

          {!carregando && usuarios.length === 0 && (
            <p style={{ color: MUTED, fontSize: 13 }}>Nenhum usuário cadastrado ainda.</p>
          )}

          {!carregando && usuarios.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORD}` }}>
                    {["Nome", "Login", "Senha Hash", "Páginas com acesso", "Status", "Ações"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: MUTED, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.login} style={{ borderBottom: `1px solid ${BORD}22` }}>
                      <td style={{ padding: "12px 12px", color: TEXT, fontWeight: 500 }}>{u.nome}</td>
                      <td style={{ padding: "12px 12px", color: MUTED }}>{u.login}</td>
                      <td style={{ padding: "12px 12px", color: MUTED, fontSize: 11, fontFamily: "monospace", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={u.senha_hash}>{u.senha_hash}</td>
                      <td style={{ padding: "12px 12px" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {(u.paginas || "").split(",").filter(Boolean).map(p => (
                            <span key={p} style={{
                              padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                              backgroundColor: `${ACCENT}18`, color: "#a5b4fc", border: `1px solid ${ACCENT}33`,
                            }}>{p.trim()}</span>
                          ))}
                          {!u.paginas && <span style={{ color: MUTED, fontSize: 11 }}>Nenhuma</span>}
                        </div>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{
                          padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                          backgroundColor: u.ativo ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: u.ativo ? "#6ee7b7" : "#f87171",
                          border: `1px solid ${u.ativo ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                        }}>
                          {u.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => iniciarEdicao(u)}
                            style={{
                              padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                              border: `1px solid rgba(99,102,241,0.3)`, color: "#a5b4fc",
                              backgroundColor: "transparent", cursor: "pointer",
                            }}
                          >Editar</button>
                          <button
                            onClick={() => aoDeletar(u.login)}
                            style={{
                              padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                              border: `1px solid rgba(239,68,68,0.3)`, color: "#f87171",
                              backgroundColor: "transparent", cursor: "pointer",
                            }}
                          >Deletar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
