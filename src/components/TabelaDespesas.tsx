import { moeda } from "../lib/formato";

interface TabelaDespesasProps {
  dados: Array<{ categoria: string; valor: number; percentual: number }>;
  titulo?: string;
  limite?: number;
}

const VERDE = "#1a5c4e";
const BORDA = "#d1d5db";
const TEXTO = "#1a1a1a";
const TEXTO_SUAVE = "#6b7280";

export function TabelaDespesas({ dados, limite = 10 }: TabelaDespesasProps) {
  const lista = dados.slice(0, limite);
  const maxValor = Math.max(...lista.map((d) => d.valor), 1);

  return (
    <div className="rounded-lg border p-5" style={{ borderColor: BORDA, backgroundColor: "#fff" }}>
      {/* Cabeçalho */}
      <div
        className="mb-3 flex items-center justify-between rounded px-3 py-2"
        style={{ backgroundColor: VERDE }}
      >
        <span className="text-xs font-bold uppercase tracking-wide text-white">
          Classificação Despesas
        </span>
        <span className="text-xs font-bold uppercase tracking-wide text-white">
          Valor Despesas ▼
        </span>
      </div>

      {/* Linhas */}
      <div className="space-y-2">
        {lista.map((item, idx) => {
          const barraLarg = (item.valor / maxValor) * 100;
          return (
            <div key={item.categoria} className="flex items-center gap-2 text-sm">
              <span className="w-5 text-right text-xs" style={{ color: TEXTO_SUAVE }}>
                {idx + 1}.
              </span>
              <span className="flex-1 truncate" style={{ color: TEXTO }}>
                {item.categoria}
              </span>
              <span className="w-28 text-right text-xs font-medium" style={{ color: TEXTO }}>
                {moeda(item.valor)}
              </span>
              <div className="w-20 overflow-hidden rounded-sm" style={{ height: 10, backgroundColor: "#f3f4f6" }}>
                <div
                  style={{ width: `${barraLarg}%`, height: "100%", backgroundColor: "#ef4444", borderRadius: 2 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé */}
      <div className="mt-3 flex justify-end">
        <span className="text-xs" style={{ color: TEXTO_SUAVE }}>
          1 - {lista.length} / {dados.length}
        </span>
      </div>
    </div>
  );
}
