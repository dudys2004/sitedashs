import type { DREData, ProducaoData, RespostaLogin, UsuarioAdmin, PaginaDisponivel } from "./types";
import { MOCK_DRE_MLN } from "./mockDashboard";

const URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;

async function post<T>(body: object): Promise<T> {
  if (!URL) throw new Error("sem_url");
  const r = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
    redirect: "follow",
  });
  return r.json();
}

// ── DRE ────────────────────────────────────────────────────────────
export async function carregarDREMLN(): Promise<{ ok: boolean; dashboard?: DREData; erro?: string }> {
  if (!URL) { await delay(600); return { ok: true, dashboard: MOCK_DRE_MLN }; }
  try { return await post({ acao: "carregar_dre_mln" }); }
  catch { return { ok: false, erro: "falha_conexao" }; }
}

// ── Produção ────────────────────────────────────────────────────────
export async function carregarProducaoMLN(): Promise<{ ok: boolean; producao?: ProducaoData; erro?: string }> {
  if (!URL) { await delay(600); return { ok: true, producao: { atualizadoEm: new Date().toISOString(), clientes: [] } }; }
  try { return await post({ acao: "carregar_producao_mln" }); }
  catch { return { ok: false, erro: "falha_conexao" }; }
}

// ── Auth ────────────────────────────────────────────────────────────
export async function login(usuario: string, senha: string): Promise<RespostaLogin> {
  if (!URL) {
    await delay(450);
    if (usuario.trim().toLowerCase() === "dudys" && senha === "312311")
      return { ok: true, tipo: "master", cliente: { slug: "admin", nome: "Administrador" }, masterToken: "master-token-12345" };
    return { ok: false, erro: "credenciais_invalidas" };
  }
  try { return await post({ acao: "login", login: usuario, senha }); }
  catch { return { ok: false, erro: "falha_conexao" }; }
}

// ── Admin ───────────────────────────────────────────────────────────
export async function adminListarUsuarios(token: string): Promise<{ ok: boolean; usuarios?: UsuarioAdmin[]; erro?: string }> {
  try { return await post({ acao: "admin_listar", masterToken: token }); }
  catch { return { ok: false, erro: "falha_conexao" }; }
}

export async function adminCriarUsuario(token: string, login: string, senha: string, paginas: string, nome: string): Promise<{ ok: boolean; erro?: string }> {
  try { return await post({ acao: "admin_criar", masterToken: token, login, senha, paginas, nome }); }
  catch { return { ok: false, erro: "falha_conexao" }; }
}

export async function adminEditarUsuario(token: string, login: string, novoLogin: string, senha: string, paginas: string, nome: string): Promise<{ ok: boolean; erro?: string }> {
  try { return await post({ acao: "admin_editar", masterToken: token, login, novoLogin, senha, paginas, nome }); }
  catch { return { ok: false, erro: "falha_conexao" }; }
}

export async function adminDeletarUsuario(token: string, login: string): Promise<{ ok: boolean; erro?: string }> {
  try { return await post({ acao: "admin_deletar", masterToken: token, login }); }
  catch { return { ok: false, erro: "falha_conexao" }; }
}

// Páginas disponíveis — definidas no frontend (fonte da verdade)
export const PAGINAS_DISPONIVEIS: PaginaDisponivel[] = [
  { slug: "MLN",   nome: "MLN",   url: "/mln"   },
  { slug: "MLN-2", nome: "MLN-2", url: "/mln-2" },
];

export async function adminListarPaginas(): Promise<{ ok: boolean; paginas?: PaginaDisponivel[] }> {
  return { ok: true, paginas: PAGINAS_DISPONIVEIS };
}

// ── Util ─────────────────────────────────────────────────────────────
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export function mensagemErro(erro?: string): string {
  const map: Record<string, string> = {
    credenciais_invalidas:  "Usuário ou senha incorretos.",
    usuario_inativo:        "Este usuário está inativo.",
    falha_conexao:          "Falha na conexão. Tente novamente.",
    login_ja_existe:        "Este login já está em uso.",
    campos_obrigatorios:    "Preencha todos os campos obrigatórios.",
    nao_autorizado:         "Sem permissão para esta ação.",
    usuario_nao_encontrado: "Usuário não encontrado.",
  };
  return map[erro ?? ""] ?? "Erro desconhecido. Tente novamente.";
}
