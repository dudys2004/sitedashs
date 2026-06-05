import type { DREData, ProducaoData } from "./types";
import { MOCK_DRE_MLN } from "./mockDashboard";

const URL_APPS_SCRIPT = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;

export async function carregarDREMLN(): Promise<{ ok: boolean; dashboard?: DREData; erro?: string }> {
  if (!URL_APPS_SCRIPT) {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true, dashboard: MOCK_DRE_MLN };
  }
  try {
    const resp = await fetch(URL_APPS_SCRIPT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ acao: "carregar_dre_mln" }),
      redirect: "follow",
    });
    return await resp.json();
  } catch {
    return { ok: false, erro: "falha_conexao" };
  }
}

export async function carregarProducaoMLN(): Promise<{ ok: boolean; producao?: ProducaoData; erro?: string }> {
  if (!URL_APPS_SCRIPT) {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true, producao: { atualizadoEm: new Date().toISOString(), clientes: [] } };
  }
  try {
    const resp = await fetch(URL_APPS_SCRIPT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ acao: "carregar_producao_mln" }),
      redirect: "follow",
    });
    return await resp.json();
  } catch {
    return { ok: false, erro: "falha_conexao" };
  }
}
