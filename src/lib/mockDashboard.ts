import type { RespostaLogin } from "./types";

// Dados de exemplo para desenvolver/testar o front SEM o Apps Script publicado.
// Usado apenas quando VITE_APPS_SCRIPT_URL está vazio (modo mock).
// Credencial de teste: login "mln" / senha "1234".
const meses = [
  ["2025-08", "ago/25"],
  ["2025-09", "set/25"],
  ["2025-10", "out/25"],
  ["2025-11", "nov/25"],
  ["2025-12", "dez/25"],
  ["2026-01", "jan/26"],
  ["2026-02", "fev/26"],
  ["2026-03", "mar/26"],
  ["2026-04", "abr/26"],
  ["2026-05", "mai/26"],
];

const porMes = meses.map(([mes, label], i) => {
  const entradas = 220000 + i * 9000 + (i % 3) * 12000;
  const saidas = 180000 + i * 7000 + (i % 2) * 9000;
  return { mes, label, entradas, saidas, saldo: entradas - saidas };
});

const totalEntradas = porMes.reduce((s, m) => s + m.entradas, 0);
const totalSaidas = porMes.reduce((s, m) => s + m.saidas, 0);

export const MOCK_LOGIN_OK: RespostaLogin = {
  ok: true,
  tipo: "usuario",
  cliente: { slug: "MLN", nome: "MLN" },
  dashboard: {
    moeda: "BRL",
    atualizadoEm: new Date().toISOString(),
    unidades: ["Leão do Norte", "Prime", "PM"],
    kpis: {
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      qtdLancamentos: 1284,
    },
    porMes,
    porClassificacao: [
      { classificacao: "Folha de pagamento", saidas: 392000 },
      { classificacao: "Impostos", saidas: 168000 },
      { classificacao: "Fornecedores", saidas: 254000 },
      { classificacao: "Combustível", saidas: 73000 },
      { classificacao: "Aluguel", saidas: 96000 },
      { classificacao: "Outros", saidas: 121000 },
    ],
    porUnidade: [
      { unidade: "Leão do Norte", entradas: 1380000, saidas: 1010000 },
      { unidade: "Prime", entradas: 720000, saidas: 560000 },
      { unidade: "PM", entradas: 410000, saidas: 330000 },
    ],
  },
};
