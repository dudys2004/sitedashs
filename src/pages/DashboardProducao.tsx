import { useEffect, useState, useMemo, useRef } from "react";
import { carregarProducaoMLN } from "../lib/api";
import type { ProducaoData, ProducaoItem } from "../lib/types";

const VERDE = "#1a5c4e";
const BG = "#f4f4f0";

// Cor baseada no número do status (para badge visual)
const STATUS_CORES: Record<number, string> = {
  1: "#f59e0b",
  2: "#3b82f6",
  3: "#8b5cf6",
  4: "#10b981",
};
function corStatus(n: number) { return STATUS_CORES[n] ?? "#9ca3af"; }

// Verifica se item está concluído (pelo número ou pelo texto)
function isConcluido(item: ProducaoItem) {
  return item.statusMarcos === 4 ||
    item.statusMarcosLabel.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes("conclui");
}

function isAtrasado(item: ProducaoItem) {
  if (isConcluido(item)) return false;
  if (!item.previsaoEntrega) return false;
  return new Date(item.previsaoEntrega) < new Date();
}

function diasDiff(dateStr: string): number {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const data = new Date(dateStr); data.setHours(0, 0, 0, 0);
  return Math.round((data.getTime() - hoje.getTime()) / 86_400_000);
}

type Col = "cliente" | "ambiente" | "statusMarcos" | "previsaoEntrega" | "observacao";

export function DashboardProducao() {
  const [dados, setDados] = useState<ProducaoData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  // Dropdown pesquisável
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ordenação da tabela
  const [ordCol, setOrdCol] = useState<Col>("previsaoEntrega");
  const [ordDir, setOrdDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    document.documentElement.style.setProperty("--cor-primaria", VERDE);
    document.documentElement.style.setProperty("--cor-fundo", BG);
    document.documentElement.style.setProperty("--cor-superficie", "#ffffff");
    document.documentElement.style.setProperty("--cor-texto", "#1a1a1a");
    document.documentElement.style.setProperty("--cor-texto-suave", "#6b7280");
  }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAberto(false);
        setBusca("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Animação de progresso
  useEffect(() => {
    if (!carregando) return;
    const t = setInterval(() => {
      setProgresso((p) => { if (p >= 90) { clearInterval(t); return 90; } return Math.min(90, p + Math.random() * 12 + 4); });
    }, 250);
    return () => clearInterval(t);
  }, [carregando]);

  useEffect(() => {
    carregarProducaoMLN().then((resp) => {
      if (resp.ok && resp.producao) {
        setDados(resp.producao);
        const primeiro = [...new Set(resp.producao.clientes.map((i) => i.cliente))].sort()[0] ?? "";
        setClienteSelecionado(primeiro);
      } else {
        setErro(resp.erro ?? "Erro desconhecido");
      }
      setProgresso(100);
      setTimeout(() => setCarregando(false), 300);
    });
  }, []);

  // Lista de todos os clientes únicos
  const todosClientes = useMemo(() => {
    if (!dados) return [];
    return [...new Set(dados.clientes.map((i) => i.cliente))].sort();
  }, [dados]);

  // Clientes filtrados pela busca no dropdown
  const clientesDropdown = useMemo(() =>
    busca ? todosClientes.filter((c) => c.toLowerCase().includes(busca.toLowerCase())) : todosClientes,
    [todosClientes, busca]);

  // Dados do cliente selecionado com ordenação aplicada
  const dadosCliente = useMemo(() => {
    if (!dados || !clienteSelecionado) return [];
    const items = dados.clientes.filter((i) => i.cliente === clienteSelecionado);
    return [...items].sort((a, b) => {
      let va: string | number = "", vb: string | number = "";
      if (ordCol === "cliente")         { va = a.cliente;         vb = b.cliente; }
      if (ordCol === "ambiente")        { va = a.ambiente;        vb = b.ambiente; }
      if (ordCol === "statusMarcos")    { va = a.statusMarcos;    vb = b.statusMarcos; }
      if (ordCol === "previsaoEntrega") { va = a.previsaoEntrega; vb = b.previsaoEntrega; }
      if (ordCol === "observacao")      { va = a.observacao;      vb = b.observacao; }
      if (va < vb) return ordDir === "asc" ? -1 : 1;
      if (va > vb) return ordDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [dados, clienteSelecionado, ordCol, ordDir]);

  // KPIs — filtrados pelo cliente selecionado
  const stats = useMemo(() => ({
    total:       dadosCliente.length,
    concluidos:  dadosCliente.filter(isConcluido).length,
    emAndamento: dadosCliente.filter((i) => !isConcluido(i)).length,
    atrasados:   dadosCliente.filter(isAtrasado).length,
  }), [dadosCliente]);

  // ---- Relatórios adicionais ----------------------------------------

  // R1 – Próximas entregas do cliente (não concluídas, ordenadas por data)
  const proximasEntregas = useMemo(() =>
    dadosCliente.filter((i) => !isConcluido(i)).sort((a, b) => a.previsaoEntrega.localeCompare(b.previsaoEntrega)),
    [dadosCliente]);

  // R2 – Visão geral de todos os clientes
  const resumoClientes = useMemo(() => {
    if (!dados) return [];
    const map: Record<string, { total: number; concluidos: number; atrasados: number }> = {};
    dados.clientes.forEach((item) => {
      if (!map[item.cliente]) map[item.cliente] = { total: 0, concluidos: 0, atrasados: 0 };
      map[item.cliente].total++;
      if (isConcluido(item)) map[item.cliente].concluidos++;
      if (isAtrasado(item))  map[item.cliente].atrasados++;
    });
    return Object.entries(map)
      .map(([cliente, s]) => ({ cliente, ...s, emAndamento: s.total - s.concluidos }))
      .sort((a, b) => b.atrasados - a.atrasados || a.cliente.localeCompare(b.cliente));
  }, [dados]);

  // R3 – Todos os itens em atraso (visão global)
  const itensAtrasados = useMemo(() => {
    if (!dados) return [];
    return dados.clientes.filter(isAtrasado).sort((a, b) => a.previsaoEntrega.localeCompare(b.previsaoEntrega));
  }, [dados]);

  // Clique no cabeçalho da tabela
  function toggleSort(col: Col) {
    if (ordCol === col) setOrdDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setOrdCol(col); setOrdDir("asc"); }
  }

  function iconeSort(col: Col) {
    if (ordCol !== col) return <span style={{ opacity: 0.3, marginLeft: 4, fontSize: 11 }}>⇅</span>;
    return <span style={{ marginLeft: 4, fontSize: 11 }}>{ordDir === "asc" ? "↑" : "↓"}</span>;
  }

  // ---- Loading --------------------------------------------------------
  if (carregando) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6" style={{ backgroundColor: BG }}>
        <img src="/logos/MLN.png" alt="MLN" style={{ height: 90, opacity: 0.9 }} />
        <div style={{ width: 280, textAlign: "center" }}>
          <div style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 999, overflow: "hidden", marginBottom: 10 }}>
            <div style={{ height: "100%", width: `${progresso}%`, backgroundColor: VERDE, borderRadius: 999, transition: "width 0.25s ease" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: VERDE }}>{Math.round(progresso)}%</p>
          <p className="mt-1 text-xs" style={{ color: "#9ca3af" }}>Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: BG }}>
        <p className="text-base font-medium" style={{ color: "#dc2626" }}>{erro ?? "Dados indisponíveis"}</p>
      </div>
    );
  }

  // ---- Render ---------------------------------------------------------
  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>

      {/* ── Header ── */}
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
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-6 px-6 py-6">
          {/* Logo */}
          <div style={{ position: "relative", width: 90, flexShrink: 0, alignSelf: "stretch" }}>
            <img
              src="/logos/MLN.png"
              alt="Logo MLN"
              style={{
                height: 112, width: "auto", objectFit: "contain",
                position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.22))", zIndex: 20,
              }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>

          {/* Título */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "#9ca3af" }}>
              Marmoaria Leão do Norte
            </p>
            <h1 className="text-3xl font-bold" style={{ color: VERDE }}>
              Acompanhamento de Produção
            </h1>
          </div>

          {/* Botão Financeiro */}
          <div className="ml-auto">
            <a
              href="/mln"
              className="px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
              style={{ backgroundColor: "#f0f0f0", color: VERDE }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e5e5e5")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
            >
              ← Financeiro
            </a>
          </div>
        </div>
      </header>

      {/* ── Corpo ── */}
      <main className="mx-auto max-w-[1400px] px-6 pb-12 pt-10">

        {/* ── Filtro — dropdown pesquisável ── */}
        <div className="mb-8">
          <label className="block text-sm font-semibold mb-3" style={{ color: VERDE }}>
            Selecione o Cliente
          </label>

          <div ref={dropdownRef} style={{ position: "relative", maxWidth: 420 }}>
            {/* Trigger */}
            <button
              type="button"
              onClick={() => { setDropdownAberto((o) => !o); setBusca(""); }}
              style={{
                width: "100%", padding: "11px 16px",
                backgroundColor: "#ffffff", border: `1.5px solid ${dropdownAberto ? VERDE : "#d1d5db"}`,
                borderRadius: 8, textAlign: "left", cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                transition: "border-color 0.15s",
              }}
            >
              <span style={{ fontWeight: 500, color: clienteSelecionado ? "#1a1a1a" : "#9ca3af" }}>
                {clienteSelecionado || "Selecione um cliente"}
              </span>
              <span style={{ color: "#9ca3af", fontSize: 11, marginLeft: 8 }}>
                {dropdownAberto ? "▲" : "▼"}
              </span>
            </button>

            {/* Painel */}
            {dropdownAberto && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                backgroundColor: "#ffffff", border: "1px solid #e5e7eb",
                borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                zIndex: 50, overflow: "hidden",
              }}>
                {/* Campo de busca */}
                <div style={{ padding: "8px 8px 6px", borderBottom: "1px solid #f3f4f6" }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Pesquisar cliente..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 12px",
                      border: "1px solid #e5e7eb", borderRadius: 6,
                      fontSize: 13, outline: "none",
                    }}
                  />
                </div>

                {/* Lista */}
                <div style={{ overflowY: "auto", maxHeight: 240 }}>
                  {clientesDropdown.length === 0 ? (
                    <div style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 13 }}>
                      Nenhum cliente encontrado
                    </div>
                  ) : (
                    clientesDropdown.map((cliente) => (
                      <button
                        key={cliente}
                        type="button"
                        onClick={() => { setClienteSelecionado(cliente); setDropdownAberto(false); setBusca(""); }}
                        style={{
                          width: "100%", padding: "10px 16px", textAlign: "left",
                          cursor: "pointer", border: "none", fontSize: 14,
                          backgroundColor: cliente === clienteSelecionado ? VERDE + "12" : "transparent",
                          color: cliente === clienteSelecionado ? VERDE : "#1a1a1a",
                          fontWeight: cliente === clienteSelecionado ? 600 : 400,
                          borderLeft: cliente === clienteSelecionado ? `3px solid ${VERDE}` : "3px solid transparent",
                        }}
                        onMouseEnter={(e) => { if (cliente !== clienteSelecionado) e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = cliente === clienteSelecionado ? VERDE + "12" : "transparent"; }}
                      >
                        {cliente}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
          {[
            { label: "Total de Projetos",  valor: stats.total,       cor: VERDE },
            { label: "Concluídos",         valor: stats.concluidos,  cor: "#10b981" },
            { label: "Em Andamento",       valor: stats.emAndamento, cor: "#3b82f6" },
            { label: "Atrasados",          valor: stats.atrasados,   cor: "#ef4444" },
          ].map(({ label, valor, cor }) => (
            <div key={label} className="p-6 rounded-xl" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#9ca3af" }}>{label}</p>
              <p className="text-4xl font-bold mt-2" style={{ color: cor }}>{valor}</p>
            </div>
          ))}
        </div>

        {/* ── Tabela ── */}
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {(
                    [
                      { col: "cliente"         as Col, label: "Cliente" },
                      { col: "ambiente"        as Col, label: "Ambiente" },
                      { col: "statusMarcos"    as Col, label: "Status" },
                      { col: "previsaoEntrega" as Col, label: "Previsão de Entrega" },
                      { col: "observacao"      as Col, label: "Observação" },
                    ]
                  ).map(({ col, label }) => (
                    <th
                      key={col}
                      className="px-6 py-4 text-left font-semibold select-none"
                      style={{ color: VERDE, cursor: "pointer", whiteSpace: "nowrap" }}
                      onClick={() => toggleSort(col)}
                    >
                      {label}{iconeSort(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dadosCliente.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center" style={{ color: "#9ca3af" }}>
                      Nenhum dado disponível para este cliente
                    </td>
                  </tr>
                ) : (
                  dadosCliente.map((item, idx) => {
                    const atrasado = isAtrasado(item);
                    const diff = item.previsaoEntrega ? diasDiff(item.previsaoEntrega) : null;
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid #f3f4f6",
                          backgroundColor: atrasado ? "rgba(239,68,68,0.04)" : undefined,
                        }}
                      >
                        <td className="px-6 py-4 font-medium">{item.cliente}</td>
                        <td className="px-6 py-4">{item.ambiente}</td>
                        <td className="px-6 py-4">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: corStatus(item.statusMarcos) + "20",
                              color: corStatus(item.statusMarcos),
                            }}
                          >
                            {item.statusMarcosLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4" style={{ whiteSpace: "nowrap" }}>
                          {item.previsaoEntrega
                            ? new Date(item.previsaoEntrega + "T12:00:00").toLocaleDateString("pt-BR")
                            : "—"}
                          {atrasado && diff !== null && (
                            <span
                              className="ml-2 px-2 py-0.5 rounded text-xs font-semibold"
                              style={{ backgroundColor: "#fee2e2", color: "#ef4444" }}
                            >
                              {Math.abs(diff)}d de atraso
                            </span>
                          )}
                          {!atrasado && !isConcluido(item) && diff !== null && diff <= 7 && (
                            <span
                              className="ml-2 px-2 py-0.5 rounded text-xs font-semibold"
                              style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
                            >
                              {diff}d restantes
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs" style={{ color: "#6b7280", maxWidth: 280 }}>
                          {item.observacao || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Relatórios Adicionais ── */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6" style={{ color: VERDE }}>
            Relatórios Adicionais
          </h2>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* R1 — Próximas Entregas do cliente selecionado */}
            <div className="rounded-xl border p-6" style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}>
              <h3 className="font-semibold mb-1" style={{ color: VERDE }}>
                Próximas Entregas — {clienteSelecionado}
              </h3>
              <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>
                Projetos em andamento, ordenados pela data de entrega
              </p>
              {proximasEntregas.length === 0 ? (
                <p className="text-sm" style={{ color: "#9ca3af" }}>Nenhum projeto em andamento.</p>
              ) : (
                <div className="space-y-2">
                  {proximasEntregas.map((item, i) => {
                    const diff = item.previsaoEntrega ? diasDiff(item.previsaoEntrega) : null;
                    const atrasado = isAtrasado(item);
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b"
                        style={{ borderColor: "#f3f4f6" }}
                      >
                        <div>
                          <p className="text-sm font-medium">{item.ambiente}</p>
                          <p className="text-xs" style={{ color: "#9ca3af" }}>{item.statusMarcosLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs" style={{ color: "#6b7280" }}>
                            {item.previsaoEntrega
                              ? new Date(item.previsaoEntrega + "T12:00:00").toLocaleDateString("pt-BR")
                              : "—"}
                          </p>
                          {diff !== null && (
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: atrasado ? "#fee2e2" : diff <= 7 ? "#fef3c7" : "#f0fdf4",
                                color: atrasado ? "#ef4444" : diff <= 7 ? "#d97706" : "#16a34a",
                              }}
                            >
                              {atrasado ? `${Math.abs(diff)}d atraso` : diff === 0 ? "Hoje" : `${diff}d`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* R2 — Visão geral de todos os clientes */}
            <div className="rounded-xl border p-6" style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}>
              <h3 className="font-semibold mb-1" style={{ color: VERDE }}>
                Visão Geral — Todos os Clientes
              </h3>
              <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>
                Resumo de status por cliente (ordenado por atrasos)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <th className="pb-2 text-left font-semibold" style={{ color: "#6b7280" }}>Cliente</th>
                      <th className="pb-2 text-center font-semibold" style={{ color: "#6b7280" }}>Total</th>
                      <th className="pb-2 text-center font-semibold" style={{ color: "#10b981" }}>Concluídos</th>
                      <th className="pb-2 text-center font-semibold" style={{ color: "#3b82f6" }}>Andamento</th>
                      <th className="pb-2 text-center font-semibold" style={{ color: "#ef4444" }}>Atrasados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumoClientes.map(({ cliente, total, concluidos, emAndamento, atrasados }) => (
                      <tr
                        key={cliente}
                        style={{
                          borderBottom: "1px solid #f3f4f6",
                          backgroundColor: cliente === clienteSelecionado ? VERDE + "08" : undefined,
                        }}
                      >
                        <td className="py-2 pr-3 font-medium" style={{ color: cliente === clienteSelecionado ? VERDE : "#1a1a1a" }}>
                          {cliente}
                          {cliente === clienteSelecionado && (
                            <span className="ml-1 text-xs" style={{ color: VERDE }}>●</span>
                          )}
                        </td>
                        <td className="py-2 text-center">{total}</td>
                        <td className="py-2 text-center font-semibold" style={{ color: "#10b981" }}>{concluidos}</td>
                        <td className="py-2 text-center" style={{ color: "#3b82f6" }}>{emAndamento}</td>
                        <td className="py-2 text-center">
                          {atrasados > 0
                            ? <span className="font-semibold" style={{ color: "#ef4444" }}>{atrasados}</span>
                            : <span style={{ color: "#9ca3af" }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* R3 — Itens em atraso (global) */}
          <div className="mt-6 rounded-xl border p-6" style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}>
            <h3 className="font-semibold mb-1" style={{ color: VERDE }}>
              Itens em Atraso — Todos os Clientes
              {itensAtrasados.length > 0 && (
                <span
                  className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: "#fee2e2", color: "#ef4444" }}
                >
                  {itensAtrasados.length}
                </span>
              )}
            </h3>
            <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>
              Todos os projetos não concluídos com data de entrega vencida
            </p>
            {itensAtrasados.length === 0 ? (
              <p className="text-sm" style={{ color: "#10b981" }}>✓ Nenhum item em atraso.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#fef2f2" }}>
                      <th className="px-4 py-3 text-left font-semibold" style={{ color: "#ef4444" }}>Cliente</th>
                      <th className="px-4 py-3 text-left font-semibold" style={{ color: "#ef4444" }}>Ambiente</th>
                      <th className="px-4 py-3 text-left font-semibold" style={{ color: "#ef4444" }}>Status</th>
                      <th className="px-4 py-3 text-left font-semibold" style={{ color: "#ef4444" }}>Previsão</th>
                      <th className="px-4 py-3 text-left font-semibold" style={{ color: "#ef4444" }}>Dias em Atraso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensAtrasados.map((item, i) => {
                      const diff = Math.abs(diasDiff(item.previsaoEntrega));
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td className="px-4 py-3 font-medium">{item.cliente}</td>
                          <td className="px-4 py-3">{item.ambiente}</td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ backgroundColor: corStatus(item.statusMarcos) + "20", color: corStatus(item.statusMarcos) }}
                            >
                              {item.statusMarcosLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3" style={{ color: "#6b7280" }}>
                            {new Date(item.previsaoEntrega + "T12:00:00").toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-semibold"
                              style={{ backgroundColor: "#fee2e2", color: "#ef4444" }}
                            >
                              {diff} {diff === 1 ? "dia" : "dias"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="pb-6 text-center text-xs mt-6" style={{ color: "#9ca3af" }}>
        Atualizado em {new Date(dados.atualizadoEm).toLocaleString("pt-BR")}
      </footer>
    </div>
  );
}
