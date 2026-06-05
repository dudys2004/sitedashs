import type { KPIsDRE } from "../lib/types";
import { moeda } from "../lib/formato";

const VERDE = "#1a5c4e";
const BORDA = "#d1d5db";
const TEXTO = "#1a1a1a";
const TEXTO_SUAVE = "#6b7280";

// Card grande: Faturamento Bruto
function CardFaturamento({ valor }: { valor: number }) {
  return (
    <div
      className="rounded-lg border p-5 text-center"
      style={{ borderColor: BORDA, backgroundColor: "#fff" }}
    >
      <p className="mb-3 text-sm font-semibold" style={{ color: VERDE }}>
        Faturamento Bruto
      </p>
      <p className="text-4xl font-bold tracking-tight" style={{ color: TEXTO }}>
        {moeda(valor)}
      </p>
    </div>
  );
}

// Card menor: título + valor + variação + % receita
interface CardKPIProps {
  titulo: string;
  valor: number;
  percReceita: number;
  variacaoPerc?: number;
  negativo?: boolean;
}

function CardKPI({ titulo, valor, percReceita, variacaoPerc, negativo }: CardKPIProps) {
  const variacaoPositiva = variacaoPerc !== undefined ? variacaoPerc >= 0 : true;
  const corValor = negativo ? "#dc2626" : TEXTO;

  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: BORDA, backgroundColor: "#fff" }}
    >
      <p className="mb-2 text-xs font-semibold" style={{ color: VERDE }}>
        {titulo}
      </p>
      <p className="text-xl font-bold" style={{ color: corValor }}>
        {negativo ? "-" : ""}{moeda(valor)}
      </p>
      <div className="mt-2 flex items-center justify-between">
        {variacaoPerc !== undefined ? (
          <span
            className="text-xs font-medium"
            style={{ color: variacaoPositiva ? "#16a34a" : "#dc2626" }}
          >
            {variacaoPositiva ? "▲" : "▼"} {Math.abs(variacaoPerc).toFixed(1)}%
          </span>
        ) : (
          <span />
        )}
        <span className="text-xs" style={{ color: TEXTO_SUAVE }}>
          {negativo ? "-" : ""}{percReceita.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

interface KPIsDREProps {
  kpis: KPIsDRE;
  kpisAnterior?: KPIsDRE;
}

export function KPIsDREComponent({ kpis, kpisAnterior }: KPIsDREProps) {
  const variacao = (atual: number, anterior?: number) =>
    anterior && anterior !== 0
      ? ((atual - anterior) / Math.abs(anterior)) * 100
      : undefined;

  const base = kpis.faturamentoBruto || 1;

  return (
    <div className="flex flex-col gap-3">
      <CardFaturamento valor={kpis.faturamentoBruto} />

      <div className="grid grid-cols-2 gap-3">
        <CardKPI
          titulo="Despesas variáveis diretas"
          valor={kpis.despesasVariaveisDiretas}
          percReceita={(kpis.despesasVariaveisDiretas / base) * 100}
          variacaoPerc={variacao(kpis.despesasVariaveisDiretas, kpisAnterior?.despesasVariaveisDiretas)}
          negativo
        />
        <CardKPI
          titulo="Lucro Bruto"
          valor={kpis.lucroBruto}
          percReceita={(kpis.lucroBruto / base) * 100}
          variacaoPerc={variacao(kpis.lucroBruto, kpisAnterior?.lucroBruto)}
        />
        <CardKPI
          titulo="Outras despesas variáveis"
          valor={kpis.outasDespesasVariaveis}
          percReceita={(kpis.outasDespesasVariaveis / base) * 100}
          variacaoPerc={variacao(kpis.outasDespesasVariaveis, kpisAnterior?.outasDespesasVariaveis)}
          negativo
        />
        <CardKPI
          titulo="Margem de contribuição"
          valor={kpis.margemDeContribuicao}
          percReceita={(kpis.margemDeContribuicao / base) * 100}
          variacaoPerc={variacao(kpis.margemDeContribuicao, kpisAnterior?.margemDeContribuicao)}
        />
        <CardKPI
          titulo="Despesas fixas"
          valor={kpis.ebitda ? kpis.margemDeContribuicao - kpis.ebitda : 0}
          percReceita={kpis.ebitda ? ((kpis.margemDeContribuicao - kpis.ebitda) / base) * 100 : 0}
          variacaoPerc={undefined}
          negativo
        />
        <CardKPI
          titulo="Ebitda"
          valor={kpis.ebitda}
          percReceita={(kpis.ebitda / base) * 100}
          variacaoPerc={variacao(kpis.ebitda, kpisAnterior?.ebitda)}
        />
        <CardKPI
          titulo="Despesas após o lucro"
          valor={kpis.resultadoLiquido ? kpis.ebitda - kpis.resultadoLiquido : 0}
          percReceita={kpis.resultadoLiquido ? ((kpis.ebitda - kpis.resultadoLiquido) / base) * 100 : 0}
          variacaoPerc={undefined}
          negativo
        />
        <CardKPI
          titulo="Saldo final"
          valor={kpis.saldoFinal}
          percReceita={(kpis.saldoFinal / base) * 100}
          variacaoPerc={variacao(kpis.saldoFinal, kpisAnterior?.saldoFinal)}
        />
      </div>
    </div>
  );
}
