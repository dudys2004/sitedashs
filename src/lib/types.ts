export interface KPIsDRE {
  faturamentoBruto: number;
  despesasVariaveisDiretas: number;
  lucroBruto: number;
  outasDespesasVariaveis: number;
  margemDeContribuicao: number;
  ebitda: number;
  resultadoLiquido: number;
  saldoFinal: number;
  despesasVariaveisDiretasPerc: number;
  lucroBrutoPerc: number;
  outasDespesasVariaveisPerc: number;
  margemDeContribuicaoPerc: number;
  ebitdaPerc: number;
  resultadoLiquidoPerc: number;
  saldoFinalPerc: number;
}

export interface DREPorMes {
  mes: string;
  label: string;
  unidade: string;
  faturamentoBruto: number;
  despesasVariaveisDiretas: number;
  lucroBruto: number;
  outasDespesasVariaveis: number;
  margemDeContribuicao: number;
  ebitda: number;
  resultadoLiquido: number;
  saldoFinal: number;
}

export type Categoria = { categoria: string; valor: number; percentual: number };

export interface DREData {
  moeda: string;
  atualizadoEm: string;
  // Competência
  unidades: string[];
  mesesDisponiveis: string[];
  kpis: KPIsDRE;
  porMes: DREPorMes[];
  receitaPorCategoria: Categoria[];
  despesasPorCategoria: Categoria[];
  rawMeses: DREPorMes[];
  // Caixa
  unidadesCaixa: string[];
  mesesDisponiveisCaixa: string[];
  porMesCaixa: DREPorMes[];
  rawMesesCaixa: DREPorMes[];
  receitaPorCategoriaCaixa: Categoria[];
  despesasPorCategoriaCaixa: Categoria[];
}

export interface ProducaoItem {
  cliente: string;
  ambiente: string;
  statusMarcos: number;
  statusMarcosLabel: string;
  previsaoEntrega: string;
  observacao: string;
  dataAtualizacao?: string;
  // Colunas analíticas
  bairro: string;
  status: string;
  montador: string;
  profissional: string;
  material: string;
}

export interface ProducaoData {
  atualizadoEm: string;
  clientes: ProducaoItem[];
}
