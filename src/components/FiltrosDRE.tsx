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

function labelMes(mesStr: string): string {
  if (!mesStr) return "";
  const [ano, mes] = mesStr.split("-");
  return `${MESES_PTBR[parseInt(mes,10)-1]}/${ano}`;
}

function adicionarMeses(mesStr: string, n: number): string {
  const [ano, mes] = mesStr.split("-");
  let m = parseInt(mes, 10) + n;
  let a = parseInt(ano, 10);
  while (m > 12) { m -= 12; a++; }
  while (m < 1)  { m += 12; a--; }
  return `${a}-${String(m).padStart(2,"0")}`;
}

const VERDE = "#1a5c4e";
const TEXTO = "#1a1a1a";
const TEXTO_SUAVE = "#6b7280";

const selectStyle: React.CSSProperties = {
  borderColor: VERDE,
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 13,
  color: TEXTO,
  backgroundColor: "#fff",
  outline: "none",
  cursor: "pointer",
};

const btnStyle = (active?: boolean): React.CSSProperties => ({
  borderColor: VERDE,
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: 8,
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 500,
  color: active ? "#fff" : VERDE,
  backgroundColor: active ? VERDE : "#fff",
  cursor: "pointer",
  transition: "all 0.15s",
});

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
  const ultimoMes = mesesOrdenados[mesesOrdenados.length - 1] ?? "";
  const penultimoMes = ultimoMes ? adicionarMeses(ultimoMes, -1) : "";

  const isMesAtualAtivo = mesInicial === ultimoMes && mesFinal === ultimoMes;
  const isMesAnteriorAtivo = mesInicial === penultimoMes && mesFinal === penultimoMes;

  const handleMesAtual = () => {
    onMesInicialChange(ultimoMes);
    onMesFinalChange(ultimoMes);
  };

  const handleMesAnterior = () => {
    onMesInicialChange(penultimoMes);
    onMesFinalChange(penultimoMes);
  };

  return (
    <div className="flex flex-wrap items-end gap-6">
      {/* Filtro por data */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: TEXTO_SUAVE }}>
          Filtro por data:
        </span>
        <div className="flex items-center gap-2">
          <select
            value={mesInicial}
            onChange={(e) => onMesInicialChange(e.target.value)}
            style={selectStyle}
          >
            {mesesOrdenados.map((m) => (
              <option key={m} value={m}>{labelMes(m)}</option>
            ))}
          </select>
          <span style={{ color: TEXTO_SUAVE, fontWeight: 600 }}>—</span>
          <select
            value={mesFinal}
            onChange={(e) => onMesFinalChange(e.target.value)}
            style={selectStyle}
          >
            {mesesOrdenados.map((m) => (
              <option key={m} value={m}>{labelMes(m)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtro por visualização */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: TEXTO_SUAVE }}>
          Filtro por visualização:
        </span>
        <div className="flex gap-2">
          <button onClick={handleMesAtual} style={btnStyle(isMesAtualAtivo)}>
            Mês Atual
          </button>
          <button onClick={handleMesAnterior} style={btnStyle(isMesAnteriorAtivo)}>
            Mês Anterior
          </button>
        </div>
      </div>

      {/* Filtro por unidade */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: TEXTO_SUAVE }}>
          Filtro por unidade:
        </span>
        <select
          value={unidade}
          onChange={(e) => onUnidadeChange(e.target.value)}
          style={selectStyle}
        >
          {unidades.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Caixa / Competência */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: TEXTO_SUAVE }}>
          Visualização:
        </span>
        <div className="flex gap-2">
          <button onClick={() => onModoChange("competencia")} style={btnStyle(modo === "competencia")}>
            Competência
          </button>
          <button onClick={() => onModoChange("caixa")} style={btnStyle(modo === "caixa")}>
            Caixa
          </button>
        </div>
      </div>
    </div>
  );
}
