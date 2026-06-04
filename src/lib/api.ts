import type { RespostaLogin, UsuarioAdmin } from "./types";

// FORÇAR MOCK (vazio para ativar)
const URL_APPS_SCRIPT = "";

export async function login(usuario: string, senha: string): Promise<RespostaLogin> {
  // Se URL_APPS_SCRIPT vazio, usa mock
  if (!URL_APPS_SCRIPT) {
    await new Promise((r) => setTimeout(r, 450));

    const loginNorm = usuario.trim().toLowerCase();

    // Mock simples - qualquer login com senha "1234" funciona
    if (senha === "1234") {
      return {
        ok: true,
        tipo: "usuario",
        cliente: { slug: "MLN", nome: loginNorm.toUpperCase() },
        paginas: ["MLN"],
        dashboard: {
          moeda: "BRL",
          atualizadoEm: new Date().toISOString(),
          unidades: ["Teste"],
          kpis: {
            totalEntradas: 50000,
            totalSaidas: 30000,
            saldo: 20000,
            qtdLancamentos: 150,
          },
          porMes: [
            { mes: "2025-01", label: "jan/25", entradas: 5000, saidas: 3000, saldo: 2000 },
            { mes: "2025-02", label: "fev/25", entradas: 5500, saidas: 3200, saldo: 2300 },
          ],
          porClassificacao: [
            { classificacao: "Teste", saidas: 30000 },
          ],
          porUnidade: [
            { unidade: "Teste", entradas: 50000, saidas: 30000 },
          ],
        },
      };
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
