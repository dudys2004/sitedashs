import { useEffect, useState, useMemo } from "react";
import { carregarProducaoMLN } from "../lib/api";
import type { ProducaoData } from "../lib/types";

const VERDE = "#1a5c4e";
const BG = "#f4f4f0";

const STATUS_MARCOS_LABELS: Record<number, string> = {
  1: "Planejamento",
  2: "Em Desenvolvimento",
  3: "Testes",
  4: "Concluído",
};

const STATUS_MARCOS_CORES: Record<number, string> = {
  1: "#f59e0b",
  2: "#3b82f6",
  3: "#8b5cf6",
  4: "#10b981",
};

export function DashboardProducao() {
  const [dados, setDados] = useState<ProducaoData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    document.documentElement.style.setProperty("--cor-primaria", VERDE);
    document.documentElement.style.setProperty("--cor-fundo", BG);
    document.documentElement.style.setProperty("--cor-superficie", "#ffffff");
    document.documentElement.style.setProperty("--cor-texto", "#1a1a1a");
    document.documentElement.style.setProperty("--cor-texto-suave", "#6b7280");
  }, []);

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
    carregarProducaoMLN().then((resp) => {
      if (resp.ok && resp.producao) {
        setDados(resp.producao);
        if (resp.producao.clientes.length > 0) {
          setClienteSelecionado(resp.producao.clientes[0].cliente);
        }
      } else {
        setErro(resp.erro ?? "Erro desconhecido");
      }
      setProgresso(100);
      setTimeout(() => setCarregando(false), 300);
    });
  }, []);

  const clientesFiltrados = useMemo(() => {
    if (!dados) return [];
    return dados.clientes
      .map((item) => item.cliente)
      .filter((cliente, idx, arr) => arr.indexOf(cliente) === idx)
      .filter((cliente) =>
        cliente.toLowerCase().includes(busca.toLowerCase())
      )
      .sort();
  }, [dados, busca]);

  const dadosClienteSelecionado = useMemo(() => {
    if (!dados || !clienteSelecionado) return [];
    return dados.clientes.filter((item) => item.cliente === clienteSelecionado);
  }, [dados, clienteSelecionado]);

  const estatisticas = useMemo(() => {
    if (!dadosClienteSelecionado) return null;

    const total = dadosClienteSelecionado.length;
    const concluidos = dadosClienteSelecionado.filter((item) => item.statusMarcos === 4).length;
    const emProgresso = dadosClienteSelecionado.filter((item) => item.statusMarcos < 4).length;
    const atrasados = dadosClienteSelecionado.filter((item) => {
      if (item.statusMarcos === 4) return false;
      if (!item.previsaoEntrega) return false;
      const prev = new Date(item.previsaoEntrega);
      return prev < new Date();
    }).length;

    return { total, concluidos, emProgresso, atrasados };
  }, [dadosClienteSelecionado]);

  const statusPorMarcos = useMemo(() => {
    if (!dados) return {};
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    dados.clientes.forEach((item) => {
      counts[item.statusMarcos as keyof typeof counts]++;
    });
    return counts;
  }, [dados]);

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

  if (erro || !dados) {
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
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          overflow: "visible",
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
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-6 px-6 py-4">
          <div style={{ position: "relative", width: 80, flexShrink: 0, alignSelf: "stretch" }}>
            <img
              src="/logos/MLN.png"
              alt="Logo MLN"
              style={{
                height: 96,
                width: "auto",
                objectFit: "contain",
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.22))",
                zIndex: 20,
              }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: VERDE }}>
            Acompanhamento de Produção
          </h1>
          <div className="ml-auto flex gap-3">
            <a
              href="/mln"
              className="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              style={{
                backgroundColor: "#f0f0f0",
                color: VERDE,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e5e5e5")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
            >
              ← Financeiro
            </a>
          </div>
        </div>
      </header>

      {/* Corpo principal */}
      <main className="mx-auto max-w-[1400px] px-6 pb-10 pt-10">
        {/* Filtro de Cliente */}
        <div className="mb-8">
          <label className="block text-sm font-semibold mb-3" style={{ color: VERDE }}>
            Selecione o Cliente
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Pesquisar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border"
              style={{
                borderColor: "#d1d5db",
                backgroundColor: "#ffffff",
              }}
            />
            <select
              value={clienteSelecionado}
              onChange={(e) => setClienteSelecionado(e.target.value)}
              className="px-4 py-3 rounded-lg border"
              style={{
                borderColor: "#d1d5db",
                backgroundColor: "#ffffff",
                minWidth: "250px",
              }}
            >
              {clientesFiltrados.map((cliente) => (
                <option key={cliente} value={cliente}>
                  {cliente}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cartões de Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
              <p className="text-xs font-medium" style={{ color: "#6b7280" }}>Total de Projetos</p>
              <p className="text-3xl font-bold mt-2" style={{ color: VERDE }}>{estatisticas.total}</p>
            </div>
            <div className="p-6 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
              <p className="text-xs font-medium" style={{ color: "#6b7280" }}>Concluídos</p>
              <p className="text-3xl font-bold mt-2" style={{ color: "#10b981" }}>{estatisticas.concluidos}</p>
            </div>
            <div className="p-6 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
              <p className="text-xs font-medium" style={{ color: "#6b7280" }}>Em Progresso</p>
              <p className="text-3xl font-bold mt-2" style={{ color: "#3b82f6" }}>{estatisticas.emProgresso}</p>
            </div>
            <div className="p-6 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
              <p className="text-xs font-medium" style={{ color: "#6b7280" }}>Atrasados</p>
              <p className="text-3xl font-bold mt-2" style={{ color: "#ef4444" }}>{estatisticas.atrasados}</p>
            </div>
          </div>
        )}

        {/* Tabela de Produção */}
        <div className="bg-white rounded-lg border" style={{ borderColor: "#e5e7eb", overflow: "hidden" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: VERDE }}>Cliente</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: VERDE }}>Ambiente</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: VERDE }}>Status</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: VERDE }}>Previsão</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: VERDE }}>Observação</th>
                </tr>
              </thead>
              <tbody>
                {dadosClienteSelecionado.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center" style={{ color: "#9ca3af" }}>
                      Nenhum dado disponível para este cliente
                    </td>
                  </tr>
                ) : (
                  dadosClienteSelecionado.map((item, idx) => {
                    const isAtrasado = item.statusMarcos < 4 && new Date(item.previsaoEntrega) < new Date();
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor: isAtrasado ? "rgba(239, 68, 68, 0.05)" : undefined,
                        }}
                      >
                        <td className="px-6 py-4">{item.cliente}</td>
                        <td className="px-6 py-4">{item.ambiente}</td>
                        <td className="px-6 py-4">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: STATUS_MARCOS_CORES[item.statusMarcos] + "20",
                              color: STATUS_MARCOS_CORES[item.statusMarcos],
                            }}
                          >
                            {STATUS_MARCOS_LABELS[item.statusMarcos]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            {new Date(item.previsaoEntrega).toLocaleDateString("pt-BR")}
                            {isAtrasado && (
                              <span className="ml-2" style={{ color: "#ef4444", fontWeight: "600" }}>⚠ Atrasado</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs" style={{ color: "#6b7280" }}>{item.observacao}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráficos e Relatórios */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-6" style={{ color: VERDE }}>
            Relatórios Adicionais
          </h2>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Distribuição por Status */}
            <div className="bg-white p-6 rounded-lg border" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="font-semibold mb-4" style={{ color: VERDE }}>
                Distribuição por Status
              </h3>
              <div className="space-y-3">
                {Object.entries(STATUS_MARCOS_LABELS).map(([status, label]) => {
                  const count = statusPorMarcos[parseInt(status)] || 0;
                  const total = dados.clientes.length || 1;
                  const percentage = (count / total) * 100;
                  return (
                    <div key={status}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{label}</span>
                        <span className="text-sm" style={{ color: "#6b7280" }}>
                          {count} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <div style={{ height: 8, backgroundColor: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${percentage}%`,
                            backgroundColor: STATUS_MARCOS_CORES[parseInt(status)],
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ambientes */}
            <div className="bg-white p-6 rounded-lg border" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="font-semibold mb-4" style={{ color: VERDE }}>
                Distribuição por Ambiente
              </h3>
              <div className="space-y-2">
                {Object.entries(
                  dados.clientes.reduce((acc: Record<string, number>, item) => {
                    acc[item.ambiente] = (acc[item.ambiente] || 0) + 1;
                    return acc;
                  }, {})
                )
                  .sort(([, a], [, b]) => b - a)
                  .map(([ambiente, count]) => (
                    <div key={ambiente} className="flex justify-between text-sm py-2 border-b border-gray-100">
                      <span>{ambiente}</span>
                      <span className="font-semibold" style={{ color: VERDE }}>
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="pb-4 text-center text-xs mt-10" style={{ color: "#9ca3af" }}>
        Atualizado em {new Date(dados.atualizadoEm).toLocaleString("pt-BR")}
      </footer>
    </div>
  );
}
