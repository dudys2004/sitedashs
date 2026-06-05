import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { moeda } from "../lib/formato";

interface GraficoPizzaProps {
  dados: Array<{ categoria: string; valor: number; percentual: number }>;
  titulo?: string;
}

const CORES = ["#1a5c4e", "#7c9e98"];
const VERDE = "#1a5c4e";
const BORDA = "#d1d5db";

export function GraficoPizza({ dados, titulo = "Faturamento por categoria" }: GraficoPizzaProps) {
  const dadosPizza = dados.map((d) => ({ name: d.categoria, value: d.valor, percentual: d.percentual }));

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentual }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600}>
        {`${percentual.toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="rounded-lg border p-5" style={{ borderColor: BORDA, backgroundColor: "#fff" }}>
      <h3 className="mb-4 text-sm font-semibold" style={{ color: VERDE }}>
        {titulo}
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={dadosPizza}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            labelLine={false}
            label={renderLabel}
          >
            {dadosPizza.map((_, i) => (
              <Cell key={i} fill={CORES[i % CORES.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => moeda(value as number)}
            contentStyle={{ borderRadius: 8, border: `1px solid ${BORDA}`, fontSize: 12 }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#6b7280" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
