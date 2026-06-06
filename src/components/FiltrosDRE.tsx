import { useMemo } from "react";

interface FiltrosDREProps {
  mesesDisponiveis: string[];
  mesInicial: string;
  mesFinal: string;
  unidade: string;
  unidades: string[];
  modo: "competencia" | "caixa";
  onMesInicialChange: (mes: string) => void;
  onMesFinalChange: (mes: string) => void;
  onUnidadeChange: (unidade: string) => void;
  onModoChange: (modo: "competencia" | "caixa") => void;
}

const MESES_PTBR = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const VERDE = "#1a5c4e";

function labelMes(mesStr: string): string {
  if (!mesStr) return "";
  const [ano, mes] = mesStr.split("-");
  return `${MESES_PTBR[parseInt(mes,10)-1]}/${ano.slice(-2)}`;
}

function adicionarMeses(mesStr: string, n: number): string {
  const [ano, mes] = mesStr.split("-");
  let m = parseInt(mes, 10) + n;
  let a = parseInt(ano, 10);
  while (m > 12) { m -= 12; a++; }
  while (m < 1)  { m += 12; a--; }
  return `${a}-${String(m).padStart(2,"0")}`;
}

// Toggle segmentado estilo iOS/profissional
function SegmentedControl({
  opcoes,
  ativo,
  onChange,
}: {
  opcoes: { label: string; value: string }[];
  ativo: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{
      display: "inline-flex",
      backgroundColor: "#eef2f0",
      borderRadius: 8,
      padding: 3,
      gap: 2,
    }}>
      {opcoes.map(({ label, value }) => {
        const isActive = ativo === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            style={{
              padding: "5px 16px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
              backgroundColor: isActive ? "#fff" : "transparent",
              color: isActive ? VERDE : "#6b7280",
              boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)" : "none",
              whiteSpace: "nowrap",
              lineHeight: "1.4",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// Select elegante
function SelectElegante({
  value,
  onChange,
  opcoes,
  minWidth,
}: {
  value: string;
  onChange: (v: string) => void;
  opcoes: { label: string; value: string }[];
  minWidth?: number;
}) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          border: "1.5px solid #e5e7eb",
          borderRadius: 7,
          padding: "5px 30px 5px 12px",
          fontSize: 12,
          fontWeight: 500,
          color: "#374151",
          backgroundColor: "#fff",
          outline: "none",
          cursor: "pointer",
          minWidth: minWidth ?? 90,
          transition: "border-color 0.15s",
        }}
        onFocus={e => (e.target.style.borderColor = VERDE)}
        onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
      >
        {opcoes.map(({ label, value: v }) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
      <span style={{
        position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", fontSize: 9, color: "#9ca3af",
      }}>▼</span>
    </div>
  );
}

// Label de grupo
function GroupLabel({ children }: { children: string }) {
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 600,
      color: "#9ca3af",
      textTransform: "uppercase",
      letterSpacing: "0.6px",
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

// Grupo de filtro
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <GroupLabel>{label}</GroupLabel>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

// Divisor vertical
function Divider() {
  return (
    <div style={{
      width: 1, height: 36,
      backgroundColor: "#e5e7eb",
      alignSelf: "flex-end",
      flexShrink: 0,
      marginBottom: 2,
    }} />
  );
}

export function FiltrosDRE({
  mesesDisponiveis,
  mesInicial,
  mesFinal,
  unidade,
  unidades,
  modo,
  onMesInicialChange,
  onMesFinalChange,
  onUnidadeChange,
  onModoChange,
}: FiltrosDREProps) {
  const mesesOrdenados = useMemo(() => [...mesesDisponiveis].sort(), [mesesDisponiveis]);
  const ultimoMes    = mesesOrdenados[mesesOrdenados.length - 1] ?? "";
  const penultimoMes = ultimoMes ? adicionarMeses(ultimoMes, -1) : "";

  const isMesAtualAtivo    = mesInicial === ultimoMes    && mesFinal === ultimoMes;
  const isMesAnteriorAtivo = mesInicial === penultimoMes && mesFinal === penultimoMes;
  const atalhoAtivo = isMesAtualAtivo ? "atual" : isMesAnteriorAtivo ? "anterior" : "";

  function handleAtalho(v: string) {
    if (v === "atual")    { onMesInicialChange(ultimoMes);    onMesFinalChange(ultimoMes); }
    if (v === "anterior") { onMesInicialChange(penultimoMes); onMesFinalChange(penultimoMes); }
  }

  const opcoesMeses = mesesOrdenados.map(m => ({ label: labelMes(m), value: m }));

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      alignItems: "flex-end",
      gap: 16,
      padding: "14px 0",
    }}>

      {/* ── Período customizado ── */}
      <FilterGroup label="Período">
        <SelectElegante
          value={mesInicial}
          onChange={onMesInicialChange}
          opcoes={opcoesMeses}
        />
        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>até</span>
        <SelectElegante
          value={mesFinal}
          onChange={onMesFinalChange}
          opcoes={opcoesMeses}
        />
      </FilterGroup>

      <Divider />

      {/* ── Visualização + Competência/Caixa lado a lado ── */}
      <FilterGroup label="Visualização">
        <SegmentedControl
          opcoes={[
            { label: "Mês atual",    value: "atual"    },
            { label: "Mês anterior", value: "anterior" },
          ]}
          ativo={atalhoAtivo}
          onChange={handleAtalho}
        />
        <SegmentedControl
          opcoes={[
            { label: "Competência", value: "competencia" },
            { label: "Caixa",       value: "caixa"       },
          ]}
          ativo={modo}
          onChange={(v) => onModoChange(v as "competencia" | "caixa")}
        />
      </FilterGroup>

      {/* ── Unidade por último (só se houver mais de uma) ── */}
      {unidades.length > 1 && (
        <>
          <Divider />
          <FilterGroup label="Unidade">
            <SelectElegante
              value={unidade}
              onChange={onUnidadeChange}
              opcoes={unidades.map(u => ({ label: u, value: u }))}
              minWidth={120}
            />
          </FilterGroup>
        </>
      )}

    </div>
  );
}
