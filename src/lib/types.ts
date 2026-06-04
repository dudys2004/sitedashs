// Tipos compartilhados entre front e o formato JSON devolvido pelo Apps Script.

export interface PontoMes {
  mes: string; // "2025-08"
  label: string; // "ago/25"
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface PontoClassificacao {
  classificacao: string;
  saidas: number;
}

export interface PontoUnidade {
  unidade: string;
  entradas: number;
  saidas: number;
}

export interface Kpis {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  qtdLancamentos: number;
}

export interface Dashboard {
  moeda: string;
  atualizadoEm: string;
  unidades: string[];
  kpis: Kpis;
  porMes: PontoMes[];
  porClassificacao: PontoClassificacao[];
  porUnidade: PontoUnidade[];
}

export interface ClienteSessao {
  slug: string;
  nome: string;
}

export interface RespostaLoginOk {
  ok: true;
  tipo: 'master' | 'usuario';
  cliente: ClienteSessao;
  dashboard?: Dashboard;
  paginas?: string[];
  masterToken?: string;
}

export interface RespostaLoginErro {
  ok: false;
  erro: string;
}

export type RespostaLogin = RespostaLoginOk | RespostaLoginErro;

export interface UsuarioAdmin {
  login: string;
  nome: string;
  paginas: string;
  ativo: boolean;
}
