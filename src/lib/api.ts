import type { RespostaLogin } from "./types";
import { MOCK_LOGIN_OK } from "./mockDashboard";

// URL do Web App do Apps Script central. Em produção, definir em
// .env / variável de ambiente da Vercel: VITE_APPS_SCRIPT_URL=https://script.google.com/.../exec
const URL_APPS_SCRIPT = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;

/**
 * Autentica no Apps Script central enviando login+senha.
 *
 * Observação CORS: enviamos como text/plain (sem headers customizados) para
 * evitar o preflight OPTIONS, que o Apps Script não responde. O Apps Script
 * faz JSON.parse(e.postData.contents).
 */
export async function login(usuario: string, senha: string): Promise<RespostaLogin> {
  // Modo mock (sem Apps Script publicado): permite desenvolver/testar a UI.
  if (!URL_APPS_SCRIPT) {
    await new Promise((r) => setTimeout(r, 450));
    if (usuario.trim().toLowerCase() === "mln" && senha === "1234") {
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
