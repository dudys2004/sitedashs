import type { DREData } from "./types";

const meses = [
  ["2025-08", "ago/25"], ["2025-09", "set/25"], ["2025-10", "out/25"],
  ["2025-11", "nov/25"], ["2025-12", "dez/25"], ["2026-01", "jan/26"],
  ["2026-02", "fev/26"], ["2026-03", "mar/26"], ["2026-04", "abr/26"],
  ["2026-05", "mai/26"],
];

const porMes = meses.map(([mes, label]) => ({
  mes, label, unidade: "Consolidado",
  faturamentoBruto: 404598, despesasVariaveisDiretas: 150027,
  lucroBruto: 254571, outasDespesasVariaveis: 28476,
  margemDeContribuicao: 226095, ebitda: 138884,
  resultadoLiquido: 117622, saldoFinal: 114738,
}));

const receitas = [
  { categoria: "Venda de Produtos", valor: 334330, percentual: 82.6 },
  { categoria: "Venda de Serviços", valor: 70268, percentual: 17.4 },
];

const despesas = [
  { categoria: "Compra de Mercadoria", valor: 115624, percentual: 28.6 },
  { categoria: "Salários", valor: 36832, percentual: 9.1 },
  { categoria: "Insumos", valor: 26776, percentual: 6.6 },
  { categoria: "Montador", valor: 25500, percentual: 6.3 },
  { categoria: "Serviços de Terceiros", valor: 7072, percentual: 1.7 },
  { categoria: "Impostos", valor: 4713, percentual: 1.2 },
  { categoria: "Comissão Arquiteto", valor: 2900, percentual: 0.7 },
  { categoria: "Manutenção de Veículos", valor: 1649, percentual: 0.4 },
  { categoria: "Comissão Vendedor", valor: 980, percentual: 0.2 },
];

const kpis = {
  faturamentoBruto: 404598, despesasVariaveisDiretas: 150027,
  lucroBruto: 254571, outasDespesasVariaveis: 28476,
  margemDeContribuicao: 226095, ebitda: 138884,
  resultadoLiquido: 117622, saldoFinal: 114738,
  despesasVariaveisDiretasPerc: 37.08, lucroBrutoPerc: 62.92,
  outasDespesasVariaveisPerc: 7.04, margemDeContribuicaoPerc: 55.88,
  ebitdaPerc: 34.34, resultadoLiquidoPerc: 29.06, saldoFinalPerc: 28.36,
};

const unidades = ["Consolidado", "Leão do Norte", "Prime", "PM"];
const mesesDisp = meses.map(([m]) => m);

export const MOCK_DRE_MLN: DREData = {
  moeda: "BRL",
  atualizadoEm: new Date().toISOString(),
  unidades, mesesDisponiveis: mesesDisp,
  kpis, porMes, rawMeses: porMes,
  receitaPorCategoria: receitas, despesasPorCategoria: despesas,
  // Caixa = mesmo dado no mock
  unidadesCaixa: unidades, mesesDisponiveisCaixa: mesesDisp,
  porMesCaixa: porMes, rawMesesCaixa: porMes,
  receitaPorCategoriaCaixa: receitas, despesasPorCategoriaCaixa: despesas,
};
