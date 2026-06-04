import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { temaDoSlug } from "../config/clientes";
import { aplicarTema } from "../styles/tema";
import { CardKPI } from "../components/CardKPI";
import {
  GraficoDespesasClassificacao,
  GraficoFluxoMensal,
  GraficoPorUnidade,
} from "../components/Graficos";
import { moeda, numero } from "../lib/formato";

// Mostra a logo do cliente; se o arquivo ainda não existir, cai para um
// "selo" com as iniciais do nome (placeholder até a logo ser enviada).
function Logo({ src, nome }: { src: string; nome: string }) {
  const [falhou, setFalhou] = useState(!src);
  if (falhou) {
    return (
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
        style={{ backgroundColor: "var(--cor-primaria)" }}
      >
        {nome.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={`Logo ${nome}`}
      className="h-12 w-auto max-w-[160px] object-contain"
      onError={() => setFalhou(true)}
    />
  );
}

export function Dashboard() {
  const { sessao, sair } = useAuth();
  const navigate = useNavigate();

  const slug = sessao?.cliente.slug ?? "";
  const tema = temaDoSlug(slug);

  useEffect(() => {
    aplicarTema(tema);
  }, [tema]);

  if (!sessao) return null;
  const { dashboard, cliente } = sessao;
  const { kpis } = dashboard;

  function sairEVoltar() {
    sair();
    navigate("/");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cor-fundo)" }}>
      <header
        className="sticky top-0 z-10 border-b border-white/5 backdrop-blur"
        style={{ backgroundColor: "color-mix(in srgb, var(--cor-fundo) 85%, transparent)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo src={tema.logo} nome={cliente.nome} />
            <div>
              <h1
                className="text-lg font-semibold leading-tight"
                style={{ color: "var(--cor-texto)" }}
              >
                {cliente.nome}
              </h1>
              <p className="text-xs" style={{ color: "var(--cor-texto-suave)" }}>
                Painel financeiro
              </p>
            </div>
          </div>
          <button
            onClick={sairEVoltar}
            className="rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-white/10 transition hover:ring-white/30"
            style={{ color: "var(--cor-texto-suave)" }}
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <CardKPI titulo="Total de entradas" valor={moeda(kpis.totalEntradas)} destaque="positivo" />
          <CardKPI titulo="Total de saídas" valor={moeda(kpis.totalSaidas)} destaque="negativo" />
          <CardKPI
            titulo="Saldo"
            valor={moeda(kpis.saldo)}
            destaque={kpis.saldo >= 0 ? "positivo" : "negativo"}
          />
          <CardKPI titulo="Lançamentos" valor={numero(kpis.qtdLancamentos)} />
        </section>

        <section>
          <GraficoFluxoMensal dados={dashboard.porMes} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GraficoDespesasClassificacao dados={dashboard.porClassificacao} />
          <GraficoPorUnidade dados={dashboard.porUnidade} />
        </section>

        <p className="text-center text-xs" style={{ color: "var(--cor-texto-suave)" }}>
          Atualizado em{" "}
          {new Date(dashboard.atualizadoEm).toLocaleString("pt-BR")} ·{" "}
          {dashboard.unidades.join(" · ")}
        </p>
      </main>
    </div>
  );
}
