import { useEffect, useState, useMemo, useRef } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { carregarProducaoMLN } from "../lib/api";
import type { ProducaoData, ProducaoItem } from "../lib/types";

const VERDE = "#1a5c4e";
const BG    = "#f4f4f0";

const CORES_PALETTE = [
  "#1a5c4e","#2ecc9b","#3b82f6","#f59e0b","#8b5cf6",
  "#ef4444","#ec4899","#14b8a6","#f97316","#06b6d4",
  "#84cc16","#a855f7","#6366f1","#0ea5e9","#d946ef",
];

const STATUS_CORES: Record<number, string> = {
  1: "#f59e0b", 2: "#3b82f6", 3: "#8b5cf6", 4: "#10b981",
};
function corStatus(n: number) { return STATUS_CORES[n] ?? "#9ca3af"; }

function isConcluido(item: ProducaoItem) {
  return item.statusMarcos === 4 ||
    item.statusMarcosLabel.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").includes("conclui");
}
function isAtrasado(item: ProducaoItem) {
  if (isConcluido(item)) return false;
  if (!item.previsaoEntrega) return false;
  return new Date(item.previsaoEntrega) < new Date();
}
function diasDiff(dateStr: string) {
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const data = new Date(dateStr); data.setHours(0,0,0,0);
  return Math.round((data.getTime() - hoje.getTime()) / 86_400_000);
}

// Conta ocorrências por campo, ignorando valores vazios
function contarPorCampo(items: ProducaoItem[], campo: keyof ProducaoItem) {
  const counts: Record<string, number> = {};
  items.forEach((item) => {
    const val = String(item[campo] ?? "").trim();
    if (!val) return;
    counts[val] = (counts[val] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// Agrupa fatia pequenas em "Outros" para não poluir pizza
function compactarPizza(dados: { name: string; value: number }[], limite = 8) {
  if (dados.length <= limite) return dados;
  const top = dados.slice(0, limite);
  const outros = dados.slice(limite).reduce((s, d) => s + d.value, 0);
  return [...top, { name: "Outros", value: outros }];
}

// Tooltip personalizado
const TooltipCustom = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { name: string } }[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:"8px 12px", fontSize:13 }}>
      <p style={{ fontWeight:600 }}>{payload[0].payload.name}</p>
      <p style={{ color: VERDE }}>{payload[0].value} registros</p>
    </div>
  );
};

// Card reutilizável para gráficos
function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-6" style={{ backgroundColor:"#ffffff", borderColor:"#e5e7eb" }}>
      <h3 className="font-semibold mb-1" style={{ color: VERDE }}>{title}</h3>
      {subtitle && <p className="text-xs mb-4" style={{ color:"#9ca3af" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

// Mensagem quando não há dados para o gráfico
function SemDados() {
  return <p className="py-8 text-center text-sm" style={{ color:"#9ca3af" }}>Sem dados disponíveis</p>;
}

type Col = "cliente" | "ambiente" | "statusMarcos" | "previsaoEntrega" | "observacao";

export function DashboardProducao() {
  const [dados, setDados]         = useState<ProducaoData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro]           = useState<string | null>(null);

  // Dropdown pesquisável
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [dropdownAberto, setDropdownAberto]         = useState(false);
  const [busca, setBusca]                           = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ordenação da tabela
  const [ordCol, setOrdCol] = useState<Col>("previsaoEntrega");
  const [ordDir, setOrdDir] = useState<"asc"|"desc">("asc");

  // CSS vars
  useEffect(() => {
    document.documentElement.style.setProperty("--cor-primaria",   VERDE);
    document.documentElement.style.setProperty("--cor-fundo",      BG);
    document.documentElement.style.setProperty("--cor-superficie",  "#ffffff");
    document.documentElement.style.setProperty("--cor-texto",      "#1a1a1a");
    document.documentElement.style.setProperty("--cor-texto-suave","#6b7280");
  }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAberto(false); setBusca("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Animação de progresso
  useEffect(() => {
    if (!carregando) return;
    const t = setInterval(() => {
      setProgresso(p => { if (p >= 90) { clearInterval(t); return 90; } return Math.min(90, p + Math.random()*12+4); });
    }, 250);
    return () => clearInterval(t);
  }, [carregando]);

  // Carrega dados
  useEffect(() => {
    carregarProducaoMLN().then(resp => {
      if (resp.ok && resp.producao) {
        setDados(resp.producao);
      } else {
        setErro(resp.erro ?? "Erro desconhecido");
      }
      setProgresso(100);
      setTimeout(() => setCarregando(false), 300);
    });
  }, []);

  // Lista de clientes únicos
  const todosClientes = useMemo(() => {
    if (!dados) return [];
    return [...new Set(dados.clientes.map(i => i.cliente))].sort();
  }, [dados]);

  // Clientes filtrados pela busca do dropdown
  const clientesDropdown = useMemo(() =>
    busca ? todosClientes.filter(c => c.toLowerCase().includes(busca.toLowerCase())) : todosClientes,
  [todosClientes, busca]);

  // Dados para tabela (filtrados + ordenados)
  const dadosTabela = useMemo(() => {
    if (!dados) return [];
    const items = clienteSelecionado
      ? dados.clientes.filter(i => i.cliente === clienteSelecionado)
      : dados.clientes;
    return [...items].sort((a, b) => {
      let va: string|number = "", vb: string|number = "";
      if (ordCol === "cliente")         { va = a.cliente;         vb = b.cliente; }
      if (ordCol === "ambiente")        { va = a.ambiente;        vb = b.ambiente; }
      if (ordCol === "statusMarcos")    { va = a.statusMarcos;    vb = b.statusMarcos; }
      if (ordCol === "previsaoEntrega") { va = a.previsaoEntrega; vb = b.previsaoEntrega; }
      if (ordCol === "observacao")      { va = a.observacao;      vb = b.observacao; }
      if (va < vb) return ordDir === "asc" ? -1 : 1;
      if (va > vb) return ordDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [dados, clienteSelecionado, ordCol, ordDir]);

  // KPIs (respeitam filtro)
  const stats = useMemo(() => ({
    total:       dadosTabela.length,
    concluidos:  dadosTabela.filter(isConcluido).length,
    emAndamento: dadosTabela.filter(i => !isConcluido(i)).length,
    atrasados:   dadosTabela.filter(isAtrasado).length,
  }), [dadosTabela]);

  // Dados para os gráficos (respeitam filtro)
  const dadosGraficos = useMemo(() =>
    clienteSelecionado ? dadosTabela : (dados?.clientes ?? []),
  [dadosTabela, clienteSelecionado, dados]);

  // Dados de cada gráfico
  const gBairro       = useMemo(() => compactarPizza(contarPorCampo(dadosGraficos, "bairro"),       10), [dadosGraficos]);
  const gStatus       = useMemo(() => contarPorCampo(dadosGraficos, "status"),                         [dadosGraficos]);
  const gMontador     = useMemo(() => compactarPizza(contarPorCampo(dadosGraficos, "montador"),     10), [dadosGraficos]);
  const gProfissional = useMemo(() => contarPorCampo(dadosGraficos, "profissional"),                    [dadosGraficos]);
  const gMaterial     = useMemo(() => contarPorCampo(dadosGraficos, "material"),                        [dadosGraficos]);
  const gAmbiente     = useMemo(() => contarPorCampo(dadosGraficos, "ambiente"),                        [dadosGraficos]);
  const gTop15        = useMemo(() => contarPorCampo(dados?.clientes ?? [], "cliente").slice(0, 15),    [dados]);

  // Helpers de ordenação
  function toggleSort(col: Col) {
    if (ordCol === col) setOrdDir(d => d === "asc" ? "desc" : "asc");
    else { setOrdCol(col); setOrdDir("asc"); }
  }
  function iconeSort(col: Col) {
    if (ordCol !== col) return <span style={{ opacity:0.3, marginLeft:4, fontSize:11 }}>⇅</span>;
    return <span style={{ marginLeft:4, fontSize:11 }}>{ordDir === "asc" ? "↑" : "↓"}</span>;
  }

  // Altura dinâmica para gráficos de barra horizontal
  function alturaBar(qtd: number) { return Math.max(180, qtd * 38 + 60); }

  // ---- Loading ---------------------------------------------------
  if (carregando) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6" style={{ backgroundColor:BG }}>
        <img src="/logos/MLN.png" alt="MLN" style={{ height:90, opacity:0.9 }} />
        <div style={{ width:280, textAlign:"center" }}>
          <div style={{ height:6, backgroundColor:"#e5e7eb", borderRadius:999, overflow:"hidden", marginBottom:10 }}>
            <div style={{ height:"100%", width:`${progresso}%`, backgroundColor:VERDE, borderRadius:999, transition:"width 0.25s ease" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color:VERDE }}>{Math.round(progresso)}%</p>
          <p className="mt-1 text-xs" style={{ color:"#9ca3af" }}>Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor:BG }}>
        <p className="text-base font-medium" style={{ color:"#dc2626" }}>{erro ?? "Dados indisponíveis"}</p>
      </div>
    );
  }

  // ---- Render ----------------------------------------------------
  return (
    <div className="min-h-screen" style={{ backgroundColor:BG }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          overflow:"visible", borderColor:"#c8bfb0",
          backgroundImage:`
            repeating-linear-gradient(-62deg, transparent 0px, transparent 7px, rgba(160,160,160,0.07) 7px, rgba(160,160,160,0.07) 8px),
            repeating-linear-gradient(28deg,  transparent 0px, transparent 12px, rgba(180,180,180,0.05) 12px, rgba(180,180,180,0.05) 13px),
            repeating-linear-gradient(-30deg, transparent 0px, transparent 20px, rgba(140,140,140,0.04) 20px, rgba(140,140,140,0.04) 21px),
            radial-gradient(ellipse at 20% 50%, rgba(230,230,230,0.4) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(215,215,215,0.25) 0%, transparent 50%),
            linear-gradient(135deg, #fafafa 0%, #ffffff 35%, #f7f7f7 65%, #fdfdfd 100%)
          `,
          backgroundColor:"#ffffff",
        }}
      >
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-6 px-6 py-6">
          {/* Logo */}
          <div style={{ position:"relative", width:90, flexShrink:0, alignSelf:"stretch" }}>
            <img
              src="/logos/MLN.png" alt="Logo MLN"
              style={{
                height:112, width:"auto", objectFit:"contain",
                position:"absolute", left:0, top:"50%", transform:"translateY(-50%)",
                filter:"drop-shadow(0 4px 8px rgba(0,0,0,0.22))", zIndex:20,
              }}
              onError={e => { (e.target as HTMLImageElement).style.display="none"; }}
            />
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold" style={{ color:VERDE }}>
            Marmoaria Leão do Norte
          </h1>

          {/* Botão Financeiro */}
          <div className="ml-auto">
            <a
              href="/mln"
              className="px-5 py-2.5 rounded-lg font-medium text-sm"
              style={{ backgroundColor:"#f0f0f0", color:VERDE }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor="#e5e5e5")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor="#f0f0f0")}
            >
              ← Financeiro
            </a>
          </div>
        </div>
      </header>

      {/* ── Corpo ── */}
      <main className="mx-auto max-w-[1400px] px-6 pb-12 pt-10">

        {/* ── Dropdown pesquisável ── */}
        <div className="mb-8">
          <label className="block text-sm font-semibold mb-3" style={{ color:VERDE }}>
            Filtrar por Cliente
          </label>

          <div ref={dropdownRef} style={{ position:"relative", maxWidth:420 }}>
            {/* Trigger */}
            <button
              type="button"
              onClick={() => { setDropdownAberto(o => !o); setBusca(""); }}
              style={{
                width:"100%", padding:"11px 16px",
                backgroundColor:"#ffffff", border:`1.5px solid ${dropdownAberto ? VERDE : "#d1d5db"}`,
                borderRadius:8, textAlign:"left", cursor:"pointer",
                display:"flex", justifyContent:"space-between", alignItems:"center",
                transition:"border-color 0.15s",
              }}
            >
              <span style={{ fontWeight:500, color: clienteSelecionado ? "#1a1a1a" : "#9ca3af" }}>
                {clienteSelecionado || "Todos os clientes"}
              </span>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {/* Botão de limpar */}
                {clienteSelecionado && (
                  <span
                    role="button"
                    title="Limpar filtro"
                    onClick={e => { e.stopPropagation(); setClienteSelecionado(""); }}
                    style={{
                      display:"inline-flex", alignItems:"center", justifyContent:"center",
                      width:18, height:18, borderRadius:"50%",
                      backgroundColor:"#e5e7eb", color:"#6b7280",
                      fontSize:11, fontWeight:700, cursor:"pointer", lineHeight:1,
                    }}
                  >
                    ×
                  </span>
                )}
                <span style={{ color:"#9ca3af", fontSize:11 }}>{dropdownAberto ? "▲" : "▼"}</span>
              </div>
            </button>

            {/* Painel */}
            {dropdownAberto && (
              <div style={{
                position:"absolute", top:"calc(100% + 4px)", left:0, right:0,
                backgroundColor:"#ffffff", border:"1px solid #e5e7eb",
                borderRadius:8, boxShadow:"0 6px 20px rgba(0,0,0,0.12)",
                zIndex:50, overflow:"hidden",
              }}>
                {/* Campo de busca */}
                <div style={{ padding:"8px 8px 6px", borderBottom:"1px solid #f3f4f6" }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Pesquisar cliente..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    style={{
                      width:"100%", padding:"8px 12px",
                      border:"1px solid #e5e7eb", borderRadius:6, fontSize:13, outline:"none",
                    }}
                  />
                </div>

                {/* Lista */}
                <div style={{ overflowY:"auto", maxHeight:240 }}>
                  {/* Opção "Todos" */}
                  {!busca && (
                    <button
                      type="button"
                      onClick={() => { setClienteSelecionado(""); setDropdownAberto(false); }}
                      style={{
                        width:"100%", padding:"10px 16px", textAlign:"left",
                        cursor:"pointer", border:"none", fontSize:14,
                        backgroundColor: !clienteSelecionado ? VERDE + "12" : "transparent",
                        color: !clienteSelecionado ? VERDE : "#6b7280",
                        fontWeight: !clienteSelecionado ? 600 : 400,
                        fontStyle:"italic",
                        borderLeft: !clienteSelecionado ? `3px solid ${VERDE}` : "3px solid transparent",
                        borderBottom:"1px solid #f3f4f6",
                      }}
                    >
                      Todos os clientes
                    </button>
                  )}

                  {clientesDropdown.length === 0 ? (
                    <div style={{ padding:"12px 16px", color:"#9ca3af", fontSize:13 }}>Nenhum cliente encontrado</div>
                  ) : (
                    clientesDropdown.map(cliente => (
                      <button
                        key={cliente}
                        type="button"
                        onClick={() => { setClienteSelecionado(cliente); setDropdownAberto(false); setBusca(""); }}
                        style={{
                          width:"100%", padding:"10px 16px", textAlign:"left",
                          cursor:"pointer", border:"none", fontSize:14,
                          backgroundColor: cliente === clienteSelecionado ? VERDE + "12" : "transparent",
                          color: cliente === clienteSelecionado ? VERDE : "#1a1a1a",
                          fontWeight: cliente === clienteSelecionado ? 600 : 400,
                          borderLeft: cliente === clienteSelecionado ? `3px solid ${VERDE}` : "3px solid transparent",
                        }}
                        onMouseEnter={e => { if (cliente !== clienteSelecionado) e.currentTarget.style.backgroundColor="#f9fafb"; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = cliente === clienteSelecionado ? VERDE+"12" : "transparent"; }}
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
            { label:"Total de Projetos",  valor:stats.total,       cor:VERDE },
            { label:"Concluídos",         valor:stats.concluidos,  cor:"#10b981" },
            { label:"Em Andamento",       valor:stats.emAndamento, cor:"#3b82f6" },
            { label:"Atrasados",          valor:stats.atrasados,   cor:"#ef4444" },
          ].map(({ label, valor, cor }) => (
            <div key={label} className="p-6 rounded-xl" style={{ backgroundColor:"#ffffff", border:"1px solid #e5e7eb" }}>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color:"#9ca3af" }}>{label}</p>
              <p className="text-4xl font-bold mt-2" style={{ color:cor }}>{valor}</p>
            </div>
          ))}
        </div>

        {/* ── Tabela ── */}
        <div className="rounded-xl border overflow-hidden mb-12" style={{ backgroundColor:"#ffffff", borderColor:"#e5e7eb" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor:"#f9fafb", borderBottom:"1px solid #e5e7eb" }}>
                  {([
                    { col:"cliente"         as Col, label:"Cliente" },
                    { col:"ambiente"        as Col, label:"Ambiente" },
                    { col:"statusMarcos"    as Col, label:"Status" },
                    { col:"previsaoEntrega" as Col, label:"Previsão de Entrega" },
                    { col:"observacao"      as Col, label:"Observação" },
                  ]).map(({ col, label }) => (
                    <th
                      key={col}
                      className="px-6 py-4 text-left font-semibold select-none"
                      style={{ color:VERDE, cursor:"pointer", whiteSpace:"nowrap" }}
                      onClick={() => toggleSort(col)}
                    >
                      {label}{iconeSort(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dadosTabela.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center" style={{ color:"#9ca3af" }}>
                      Nenhum dado disponível
                    </td>
                  </tr>
                ) : (
                  dadosTabela.map((item, idx) => {
                    const atrasado = isAtrasado(item);
                    const diff = item.previsaoEntrega ? diasDiff(item.previsaoEntrega) : null;
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom:"1px solid #f3f4f6",
                          backgroundColor: atrasado ? "rgba(239,68,68,0.04)" : undefined,
                        }}
                      >
                        <td className="px-6 py-4 font-medium">{item.cliente}</td>
                        <td className="px-6 py-4">{item.ambiente || "—"}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor:corStatus(item.statusMarcos)+"20", color:corStatus(item.statusMarcos) }}>
                            {item.statusMarcosLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4" style={{ whiteSpace:"nowrap" }}>
                          {item.previsaoEntrega
                            ? new Date(item.previsaoEntrega + "T12:00:00").toLocaleDateString("pt-BR")
                            : "—"}
                          {atrasado && diff !== null && (
                            <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold"
                              style={{ backgroundColor:"#fee2e2", color:"#ef4444" }}>
                              {Math.abs(diff)}d de atraso
                            </span>
                          )}
                          {!atrasado && !isConcluido(item) && diff !== null && diff <= 7 && diff >= 0 && (
                            <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold"
                              style={{ backgroundColor:"#fef3c7", color:"#d97706" }}>
                              {diff === 0 ? "Hoje" : `${diff}d restantes`}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs" style={{ color:"#6b7280", maxWidth:280 }}>
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

        {/* ══════════════════════════════════════════════
            GRÁFICOS E RELATÓRIOS
        ══════════════════════════════════════════════ */}
        <h2 className="text-xl font-bold mb-6" style={{ color:VERDE }}>
          Análises e Gráficos
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* ── 1. Pizza — BAIRRO ── */}
          <ChartCard title="Distribuição por Bairro" subtitle="Número de projetos por bairro">
            {gBairro.length === 0 ? <SemDados /> : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={gBairro} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ percent }) => percent > 0.04 ? `${(percent*100).toFixed(0)}%` : ""}
                    labelLine={false}
                  >
                    {gBairro.map((_, i) => <Cell key={i} fill={CORES_PALETTE[i % CORES_PALETTE.length]} />)}
                  </Pie>
                  <Tooltip content={<TooltipCustom />} />
                  <Legend formatter={v => <span style={{ fontSize:12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* ── 2. Barra — STATUS ── */}
          <ChartCard title="Projetos por Status" subtitle="Distribuição pelo campo STATUS">
            {gStatus.length === 0 ? <SemDados /> : (
              <ResponsiveContainer width="100%" height={alturaBar(gStatus.length)}>
                <BarChart data={gStatus} layout="vertical" margin={{ top:0, right:30, left:10, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize:11 }}
                    tickFormatter={v => v.length > 22 ? v.slice(0,22)+"…" : v} />
                  <Tooltip content={<TooltipCustom />} />
                  <Bar dataKey="value" fill={VERDE} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* ── 3. Pizza — MONTADOR ── */}
          <ChartCard title="Distribuição por Montador" subtitle="Projetos por montador responsável">
            {gMontador.length === 0 ? <SemDados /> : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={gMontador} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ percent }) => percent > 0.04 ? `${(percent*100).toFixed(0)}%` : ""}
                    labelLine={false}
                  >
                    {gMontador.map((_, i) => <Cell key={i} fill={CORES_PALETTE[i % CORES_PALETTE.length]} />)}
                  </Pie>
                  <Tooltip content={<TooltipCustom />} />
                  <Legend formatter={v => <span style={{ fontSize:12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* ── 4. Barra — PROFISSIONAL ── */}
          <ChartCard title="Projetos por Profissional" subtitle="Distribuição pelo campo PROFISSIONAL">
            {gProfissional.length === 0 ? <SemDados /> : (
              <ResponsiveContainer width="100%" height={alturaBar(gProfissional.length)}>
                <BarChart data={gProfissional} layout="vertical" margin={{ top:0, right:30, left:10, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize:11 }}
                    tickFormatter={v => v.length > 20 ? v.slice(0,20)+"…" : v} />
                  <Tooltip content={<TooltipCustom />} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* ── 5. Barra — MATERIAL ── */}
          <ChartCard title="Materiais Mais Utilizados" subtitle="Quais materiais tiveram mais projetos">
            {gMaterial.length === 0 ? <SemDados /> : (
              <ResponsiveContainer width="100%" height={alturaBar(Math.min(gMaterial.length, 12))}>
                <BarChart data={gMaterial.slice(0,12)} layout="vertical" margin={{ top:0, right:30, left:10, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize:11 }}
                    tickFormatter={v => v.length > 22 ? v.slice(0,22)+"…" : v} />
                  <Tooltip content={<TooltipCustom />} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* ── 6. Barra — AMBIENTE ── */}
          <ChartCard title="Ambientes com Mais Vendas" subtitle="Quais ambientes tiveram mais projetos">
            {gAmbiente.length === 0 ? <SemDados /> : (
              <ResponsiveContainer width="100%" height={alturaBar(Math.min(gAmbiente.length, 12))}>
                <BarChart data={gAmbiente.slice(0,12)} layout="vertical" margin={{ top:0, right:30, left:10, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize:11 }}
                    tickFormatter={v => v.length > 22 ? v.slice(0,22)+"…" : v} />
                  <Tooltip content={<TooltipCustom />} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

        </div>

        {/* ── 7. Top 15 Clientes (largura total) ── */}
        <div className="mt-6">
          <ChartCard title="Top 15 Clientes" subtitle="Clientes com maior número de projetos (visão geral)">
            {gTop15.length === 0 ? <SemDados /> : (
              <ResponsiveContainer width="100%" height={alturaBar(gTop15.length)}>
                <BarChart data={gTop15} layout="vertical" margin={{ top:0, right:40, left:10, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={200} tick={{ fontSize:12 }}
                    tickFormatter={v => v.length > 28 ? v.slice(0,28)+"…" : v} />
                  <Tooltip content={<TooltipCustom />} />
                  <Bar dataKey="value" radius={[0,4,4,0]}>
                    {gTop15.map((_, i) => <Cell key={i} fill={CORES_PALETTE[i % CORES_PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

      </main>

      <footer className="pb-6 text-center text-xs mt-6" style={{ color:"#9ca3af" }}>
        Atualizado em {new Date(dados.atualizadoEm).toLocaleString("pt-BR")}
      </footer>
    </div>
  );
}
