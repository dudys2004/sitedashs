import { useEffect, useState, useMemo } from "react";
import { carregarDREMLN } from "../lib/api";
import type { DREData, DREPorMes, KPIsDRE } from "../lib/types";
import { FiltrosDRE } from "../components/FiltrosDRE";
import { KPIsDREComponent } from "../components/KPIsDRE";
import { GraficoSerieTemporal } from "../components/GraficoSerieTemporal";
import { GraficoPizza } from "../components/GraficoPizza";
import { TabelaDespesas } from "../components/TabelaDespesas";

const VERDE = "#1a5c4e";
const BG = "#f4f4f0";


const kpisZerado: KPIsDRE = {
  faturamentoBruto: 0, despesasVariaveisDiretas: 0, lucroBruto: 0,
  outasDespesasVariaveis: 0, margemDeContribuicao: 0, ebitda: 0,
  resultadoLiquido: 0, saldoFinal: 0,
  despesasVariaveisDiretasPerc: 0, lucroBrutoPerc: 0, outasDespesasVariaveisPerc: 0,
  margemDeContribuicaoPerc: 0, ebitdaPerc: 0, resultadoLiquidoPerc: 0, saldoFinalPerc: 0,
};

export function DashboardMLN() {
  const [dados, setDados] = useState<DREData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [mesInicial, setMesInicial] = useState("");
  const [mesFinal, setMesFinal] = useState("");
  const [unidade, setUnidade] = useState("Consolidado");
  const [modo, setModo] = useState<"competencia" | "caixa">("competencia");

  // Força tema claro na página
  useEffect(() => {
    document.documentElement.style.setProperty("--cor-primaria", VERDE);
    document.documentElement.style.setProperty("--cor-fundo", BG);
    document.documentElement.style.setProperty("--cor-superficie", "#ffffff");
    document.documentElement.style.setProperty("--cor-texto", "#1a1a1a");
    document.documentElement.style.setProperty("--cor-texto-suave", "#6b7280");
  }, []);

  // Animação de progresso falsa enquanto carrega
  useEffect(() => {
    if (!carregando) return;
    const timer = setInterval(() => {
      setProgresso((p) => {
        if (p >= 90) { clearInterval(timer); return 90; }
        return Math.min(90, p + Math.random() * 12 + 4);
      });
    }, 250);
    return () => clearInterval(timer);
  }, [carregando]);

  useEffect(() => {
    carregarDREMLN().then((resp) => {
      if (resp.ok && resp.dashboard) {
        setDados(resp.dashboard);
        const meses = [...resp.dashboard.mesesDisponiveis].sort();
        const ultimo = meses[meses.length - 1] ?? "";
        setMesInicial(ultimo);
        setMesFinal(ultimo);
      } else {
        setErro(resp.erro ?? "Erro desconhecido");
      }
      setProgresso(100);
      setTimeout(() => setCarregando(false), 300);
    });
  }, []);

  const dadosFiltrados = useMemo(() => {
    if (!dados || !mesInicial || !mesFinal) return null;

    const porMesFonte = modo === "caixa" ? (dados.porMesCaixa ?? dados.porMes) : dados.porMes;
    const rawFonte    = modo === "caixa" ? (dados.rawMesesCaixa ?? dados.rawMeses) : dados.rawMeses;
    const mesesFonte  = modo === "caixa" ? (dados.mesesDisponiveisCaixa ?? dados.mesesDisponiveis) : dados.mesesDisponiveis;

    const mesesSel = mesesFonte.filter((m) => m >= mesInicial && m <= mesFinal);
    const isFiltrado = (m: { mes: string; unidade: string }) =>
      (unidade === "Consolidado" || m.unidade === unidade) && mesesSel.includes(m.mes);

    const porMesFiltrado = porMesFonte.filter(isFiltrado);

    // KPIs agregados do período
    const kpis = { ...kpisZerado };
    porMesFiltrado.forEach((m) => {
      kpis.faturamentoBruto          += m.faturamentoBruto;
      kpis.despesasVariaveisDiretas  += m.despesasVariaveisDiretas;
      kpis.lucroBruto                += m.lucroBruto;
      kpis.outasDespesasVariaveis    += m.outasDespesasVariaveis;
      kpis.margemDeContribuicao      += m.margemDeContribuicao;
      kpis.ebitda                    += m.ebitda;
      kpis.resultadoLiquido          += m.resultadoLiquido;
      kpis.saldoFinal                += m.saldoFinal;
    });
    const base = kpis.faturamentoBruto || 1;
    kpis.despesasVariaveisDiretasPerc = (kpis.despesasVariaveisDiretas / base) * 100;
    kpis.lucroBrutoPerc              = (kpis.lucroBruto / base) * 100;
    kpis.outasDespesasVariaveisPerc  = (kpis.outasDespesasVariaveis / base) * 100;
    kpis.margemDeContribuicaoPerc    = (kpis.margemDeContribuicao / base) * 100;
    kpis.ebitdaPerc                  = (kpis.ebitda / base) * 100;
    kpis.resultadoLiquidoPerc        = (kpis.resultadoLiquido / base) * 100;
    kpis.saldoFinalPerc              = (kpis.saldoFinal / base) * 100;

    // Categorias calculadas a partir do rawMeses filtrado pelo período
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawFiltrado = (rawFonte as any[]).filter(isFiltrado);

    const totRec = rawFiltrado.reduce(
      (acc, m) => ({ prod: acc.prod + (m.vendaProdutos || 0), serv: acc.serv + (m.vendaServicos || 0) }),
      { prod: 0, serv: 0 }
    );
    const totalRec = totRec.prod + totRec.serv || 1;
    const receitaCats = [
      { categoria: "Venda de Serviços", valor: Math.round(totRec.serv), percentual: Math.round(totRec.serv / totalRec * 1000) / 10 },
      { categoria: "Venda de Produtos", valor: Math.round(totRec.prod), percentual: Math.round(totRec.prod / totalRec * 1000) / 10 },
    ].filter((c) => c.valor > 0).sort((a, b) => b.valor - a.valor);

    const totDesp = rawFiltrado.reduce(
      (acc, m) => ({
        cmv:    acc.cmv    + (m.cmv    || 0),
        csv:    acc.csv    + (m.csv    || 0),
        odv:    acc.odv    + (m.odv    || 0),
        imp:    acc.imp    + (m.impostos || 0),
        fixo:   acc.fixo   + (m.despFixa || 0),
        naoD:   acc.naoD   + (m.naoDesembolsavel || 0),
        posL:   acc.posL   + (m.posLucro || 0),
      }),
      { cmv: 0, csv: 0, odv: 0, imp: 0, fixo: 0, naoD: 0, posL: 0 }
    );
    const totalDesp = Object.values(totDesp).reduce((s: number, v) => s + (v as number), 0) || 1;
    const pct = (v: number) => Math.round(v / totalDesp * 1000) / 10;
    const despesasCats = [
      { categoria: "Custo das Mercadorias Vendidas", valor: Math.round(totDesp.cmv),  percentual: pct(totDesp.cmv)  },
      { categoria: "Custo dos Serviços Vendidos",    valor: Math.round(totDesp.csv),  percentual: pct(totDesp.csv)  },
      { categoria: "Impostos sobre Vendas",          valor: Math.round(totDesp.imp),  percentual: pct(totDesp.imp)  },
      { categoria: "Outras Despesas Variáveis",      valor: Math.round(totDesp.odv),  percentual: pct(totDesp.odv)  },
      { categoria: "Despesas Fixas",                 valor: Math.round(totDesp.fixo), percentual: pct(totDesp.fixo) },
      { categoria: "Não Desembolsáveis",             valor: Math.round(totDesp.naoD), percentual: pct(totDesp.naoD) },
      { categoria: "Pagamentos Após o Lucro",        valor: Math.round(totDesp.posL), percentual: pct(totDesp.posL) },
    ].filter((c) => c.valor > 0).sort((a, b) => b.valor - a.valor);

    // Histórico: últimos 12 meses para o gráfico de barras — 1 entrada por mês
    const histRaw = porMesFonte.filter(
      (m) => (unidade === "Consolidado" || m.unidade === unidade) && m.mes <= mesFinal
    );
    const histMap: Record<string, DREPorMes> = {};
    histRaw.forEach((m) => {
      if (!histMap[m.mes]) {
        histMap[m.mes] = { ...m };
      } else {
        const a = histMap[m.mes];
        a.faturamentoBruto        += m.faturamentoBruto;
        a.despesasVariaveisDiretas += m.despesasVariaveisDiretas;
        a.lucroBruto              += m.lucroBruto;
        a.outasDespesasVariaveis  += m.outasDespesasVariaveis;
        a.margemDeContribuicao    += m.margemDeContribuicao;
        a.ebitda                  += m.ebitda;
        a.resultadoLiquido        += m.resultadoLiquido;
        a.saldoFinal              += m.saldoFinal;
      }
    });
    const porMesHistorico = Object.values(histMap)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-12);

    return { kpis, porMes: porMesFiltrado, porMesHistorico, receitaCats, despesasCats };
  }, [dados, mesInicial, mesFinal, unidade, modo]);

  if (carregando) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6" style={{ backgroundColor: BG }}>
        <img src="/logos/MLN.png" alt="MLN" style={{ height: 90, opacity: 0.9 }} />
        <div style={{ width: 280, textAlign: "center" }}>
          <div style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 999, overflow: "hidden", marginBottom: 10 }}>
            <div
              style={{
                height: "100%",
                width: `${progresso}%`,
                backgroundColor: VERDE,
                borderRadius: 999,
                transition: "width 0.25s ease",
              }}
            />
          </div>
          <p className="text-sm font-semibold" style={{ color: VERDE }}>
            {Math.round(progresso)}%
          </p>
          <p className="mt-1 text-xs" style={{ color: "#9ca3af" }}>Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (erro || !dados || !dadosFiltrados) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: BG }}>
        <p className="text-base font-medium" style={{ color: "#dc2626" }}>
          {erro ?? "Dados indisponíveis"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>

      {/* Seta discreta lateral → MLN_2 */}
      <a
        href="/mln-2"
        title="Acompanhamento de Produção"
        style={{
          position: "fixed", right: 0, top: "50%", transform: "translateY(-50%)",
          backgroundColor: VERDE, color: "#ffffff",
          width: 22, padding: "22px 0",
          borderRadius: "6px 0 0 6px",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50, textDecoration: "none",
          opacity: 0.45, fontSize: 18, lineHeight: 1,
          boxShadow: "-2px 2px 10px rgba(0,0,0,0.18)",
          transition: "opacity 0.2s, width 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.width = "34px"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.45"; e.currentTarget.style.width = "22px"; }}
      >
        ›
      </a>

      {/* Header com textura de mármore */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          borderColor: "#c8bfb0",
          backgroundImage: `
            repeating-linear-gradient(-62deg, transparent 0px, transparent 7px, rgba(160,160,160,0.07) 7px, rgba(160,160,160,0.07) 8px),
            repeating-linear-gradient(28deg,  transparent 0px, transparent 12px, rgba(180,180,180,0.05) 12px, rgba(180,180,180,0.05) 13px),
            repeating-linear-gradient(-30deg, transparent 0px, transparent 20px, rgba(140,140,140,0.04) 20px, rgba(140,140,140,0.04) 21px),
            radial-gradient(ellipse at 20% 50%, rgba(230,230,230,0.4) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(215,215,215,0.25) 0%, transparent 50%),
            linear-gradient(135deg, #fafafa 0%, #ffffff 35%, #f7f7f7 65%, #fdfdfd 100%)
          `,
          backgroundColor: "#ffffff",
        }}
      >
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-6 px-4 py-3 sm:px-6 sm:py-4">
          <img
            src="/logos/MLN.png"
            alt="Logo MLN"
            style={{
              height: 68,
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.22))",
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <h1 className="text-2xl font-bold" style={{ color: VERDE }}>
            Marmoaria Leão do Norte
          </h1>

          <div className="ml-auto">
            <FiltrosDRE
              mesesDisponiveis={modo === "caixa" ? (dados.mesesDisponiveisCaixa ?? dados.mesesDisponiveis) : dados.mesesDisponiveis}
              mesInicial={mesInicial}
              mesFinal={mesFinal}
              unidade={unidade}
              unidades={["Consolidado", ...(modo === "caixa" ? (dados.unidadesCaixa ?? dados.unidades) : dados.unidades).filter((u) => u !== "Consolidado" && u !== "Geral")]}
              modo={modo}
              onMesInicialChange={setMesInicial}
              onMesFinalChange={setMesFinal}
              onUnidadeChange={setUnidade}
              onModoChange={setModo}
            />
          </div>
        </div>
      </header>

      {/* Corpo principal: 2 colunas */}
      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-5 px-6 pb-5 pt-10 lg:grid-cols-[400px_1fr]">
        {/* Coluna esquerda: KPIs */}
        <aside>
          <KPIsDREComponent kpis={dadosFiltrados.kpis} />
        </aside>

        {/* Coluna direita: gráficos */}
        <div className="flex flex-col gap-5">
          <GraficoSerieTemporal dados={dadosFiltrados.porMesHistorico} />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <GraficoPizza
              dados={dadosFiltrados.receitaCats}
              titulo="Faturamento por categoria"
            />
            <TabelaDespesas
              dados={dadosFiltrados.despesasCats}
              titulo="Despesas por categoria"
              limite={10}
            />
          </div>
        </div>
      </main>

      <footer className="pb-4 text-center text-xs" style={{ color: "#9ca3af" }}>
        Atualizado em {new Date(dados.atualizadoEm).toLocaleString("pt-BR")}
      </footer>
    </div>
  );
}
