import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  PontoClassificacao,
  PontoMes,
  PontoUnidade,
} from "../lib/types";
import { moeda, moedaCompacta } from "../lib/formato";

const CORES_PIZZA = [
  "#16a34a",
  "#0ea5e9",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#a3a3a3",
];

function Painel({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 shadow-lg ring-1 ring-white/5"
      style={{ backgroundColor: "var(--cor-superficie)" }}
    >
      <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--cor-texto)" }}>
        {titulo}
      </h3>
      {children}
    </div>
  );
}

const estiloTooltip = {
  backgroundColor: "var(--cor-fundo)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "var(--cor-texto)",
};

export function GraficoFluxoMensal({ dados }: { dados: PontoMes[] }) {
  return (
    <Painel titulo="Entradas × Saídas por mês">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={dados} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="gEntradas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gSaidas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" tick={{ fill: "var(--cor-texto-suave)", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "var(--cor-texto-suave)", fontSize: 12 }}
            tickFormatter={(v) => moedaCompacta(Number(v))}
            width={70}
          />
          <Tooltip contentStyle={estiloTooltip} formatter={(v) => moeda(Number(v))} />
          <Legend />
          <Area
            type="monotone"
            dataKey="entradas"
            name="Entradas"
            stroke="#22c55e"
            fill="url(#gEntradas)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="saidas"
            name="Saídas"
            stroke="#ef4444"
            fill="url(#gSaidas)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Painel>
  );
}

export function GraficoDespesasClassificacao({
  dados,
}: {
  dados: PontoClassificacao[];
}) {
  return (
    <Painel titulo="Despesas por classificação">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={dados}
            dataKey="saidas"
            nameKey="classificacao"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
          >
            {dados.map((_, i) => (
              <Cell key={i} fill={CORES_PIZZA[i % CORES_PIZZA.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={estiloTooltip} formatter={(v) => moeda(Number(v))} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Painel>
  );
}

export function GraficoPorUnidade({ dados }: { dados: PontoUnidade[] }) {
  return (
    <Painel titulo="Entradas × Saídas por unidade">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={dados} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="unidade" tick={{ fill: "var(--cor-texto-suave)", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "var(--cor-texto-suave)", fontSize: 12 }}
            tickFormatter={(v) => moedaCompacta(Number(v))}
            width={70}
          />
          <Tooltip contentStyle={estiloTooltip} formatter={(v) => moeda(Number(v))} />
          <Legend />
          <Bar dataKey="entradas" name="Entradas" fill="#22c55e" radius={[6, 6, 0, 0]} />
          <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Painel>
  );
}
