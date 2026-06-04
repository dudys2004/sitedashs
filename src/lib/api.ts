import type { RespostaLogin, UsuarioAdmin } from "./types";
import { MOCK_LOGIN_OK } from "./mockDashboard";

const URL_APPS_SCRIPT = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;

export async function login(usuario: string, senha: string): Promise<RespostaLogin> {
  if (!URL_APPS_SCRIPT) {
    await new Promise((r) => setTimeout(r, 450));
    const loginNorm = usuario.trim().toLowerCase();
    // Master mock: dudys / 312311
    if (loginNorm === "dudys" && senha === "312311") {
      return {
        ok: true,
        tipo: "master",
        cliente: { slug: "admin", nome: "Administrador" },
        masterToken: "mock-master-token",
      };
    }
    // Usuário normal mock: mln / 1234
    if (loginNorm === "mln" && senha === "1234") {
      return MOCK_LOGIN_OK;
    }
    return { ok: false, erro: "credenciais_invalidas" };
  }

  try {
    const resp = await fetch(URL_APPS_SCRIPT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ acao: "login", login: usuario, senha }),
      redirect: "follow",
    });
    const data = (await resp.json()) as RespostaLogin;
    return data;
  } catch {
    return { ok: false, erro: "falha_conexao" };
  }
}

export async function adminListarUsuarios(masterToken: string): Promise<{ ok: boolean; usuarios?: UsuarioAdmin[]; erro?: string }> {
  if (!URL_APPS_SCRIPT) {
    return { ok: true, usuarios: [] };
  }

  try {
    const resp = await fetch(URL_APPS_SCRIPT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ acao: "admin_listar", masterToken }),
      redirect: "follow",
    });
    return await resp.json();
  } catch {
    return { ok: false, erro: "falha_conexao" };
  }
}

export async function adminCriarUsuario(masterToken: string, login: string, senha: string, paginas: string, nome?: string): Promise<{ ok: boolean; erro?: string; mensagem?: string }> {
  if (!URL_APPS_SCRIPT) {
    return { ok: true, mensagem: "Usuario criado (modo mock)" };
  }

  try {
    const resp = await fetch(URL_APPS_SCRIPT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ acao: "admin_criar", masterToken, login, senha, paginas, nome }),
      redirect: "follow",
    });
    return await resp.json();
  } catch {
    return { ok: false, erro: "falha_conexao" };
  }
}

export async function adminEditarUsuario(
  masterToken: string,
  login: string,
  novoLogin: string,
  senha: string,
  paginas: string,
  nome: string
): Promise<{ ok: boolean; erro?: string; mensagem?: string }> {
  if (!URL_APPS_SCRIPT) {
    return { ok: true, mensagem: "Usuario editado (modo mock)" };
  }

  try {
    const resp = await fetch(URL_APPS_SCRIPT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ acao: "admin_editar", masterToken, login, novoLogin, senha, paginas, nome }),
      redirect: "follow",
    });
    return await resp.json();
  } catch {
    return { ok: false, erro: "falha_conexao" };
  }
}

export async function adminDeletarUsuario(masterToken: string, login: string): Promise<{ ok: boolean; erro?: string; mensagem?: string }> {
  if (!URL_APPS_SCRIPT) {
    return { ok: true, mensagem: "Usuario deletado (modo mock)" };
  }

  try {
    const resp = await fetch(URL_APPS_SCRIPT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ acao: "admin_deletar", masterToken, login }),
      redirect: "follow",
    });
    return await resp.json();
  } catch {
    return { ok: false, erro: "falha_conexao" };
  }
}

export async function adminListarPaginas(): Promise<{ ok: boolean; paginas?: Array<{ slug: string; nome: string; url: string }>; erro?: string }> {
  if (!URL_APPS_SCRIPT) {
    return { ok: true, paginas: [{ slug: "MLN", nome: "MLN", url: "/MLN" }] };
  }

  try {
    const resp = await fetch(URL_APPS_SCRIPT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ acao: "admin_listar_paginas" }),
      redirect: "follow",
    });
    return await resp.json();
  } catch {
    return { ok: false, erro: "falha_conexao" };
  }
}

export function mensagemErro(codigo: string): string {
  switch (codigo) {
    case "credenciais_invalidas":
    case "nao_autorizado":
      return "Usuário ou senha incorretos.";
    case "usuario_inativo":
      return "Este acesso está desativado. Fale com o administrador.";
    case "falha_conexao":
      return "Não foi possível conectar ao servidor. Tente novamente.";
    default:
      return "Ocorreu um erro. Tente novamente.";
  }
}
