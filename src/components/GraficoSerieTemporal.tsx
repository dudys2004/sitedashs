import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import type { DREPorMes } from "../lib/types";
import { moeda } from "../lib/formato";

interface GraficoSerieTemporalProps {
  dados: DREPorMes[];
  titulo?: string;
}

const VERDE = "#1a5c4e";
const BORDA = "#d1d5db";

function formatarMilhares(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)} mil`;
  return moeda(v);
}

export function GraficoSerieTemporal({
  dados,
  titulo = "Histórico de Faturamento bruto",
}: GraficoSerieTemporalProps) {
  const mediaMargem =
    dados.length > 0
      ? dados.reduce((s, d) => s + d.margemDeContribuicao, 0) / dados.length
      : 0;

  const dadosFormatados = dados.map((d) => ({
    mes: d.label,
    "Faturamento Bruto": d.faturamentoBruto,
    "Despesas Fixas": d.margemDeContribuicao - d.ebitda,
    "Margem Contribuição": d.margemDeContribuicao,
    "Média Margem": Math.round(mediaMargem),
  }));

  return (
    <div
      className="rounded-lg border p-5"
      style={{ borderColor: BORDA, backgroundColor: "#fff" }}
    >
      <h3 className="mb-4 text-sm font-semibold" style={{ color: VERDE }}>
        {titulo}
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={dadosFormatados} margin={{ top: 24, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="mes" tick={{ fill: "#6b7280", fontSize: 11 }} />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: `1px solid ${BORDA}`, fontSize: 12 }}
            formatter={(value) => moeda(value as number)}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: "#6b7280" }}
          />
          <Bar dataKey="Faturamento Bruto" fill={VERDE} fillOpacity={0.85} radius={[3,3,0,0]}>
            <LabelList
              dataKey="Faturamento Bruto"
              position="top"
              formatter={formatarMilhares}
              style={{ fontSize: 10, fill: "#374151" }}
            />
          </Bar>
          <Line
            type="monotone"
            dataKey="Despesas Fixas"
            stroke="#ef4444"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="Margem Contribuição"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="Média Margem"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            activeDot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
