interface Props {
  titulo: string;
  valor: string;
  destaque?: "positivo" | "negativo" | "neutro";
}

export function CardKPI({ titulo, valor, destaque = "neutro" }: Props) {
  const cor =
    destaque === "positivo"
      ? "#22c55e"
      : destaque === "negativo"
        ? "#ef4444"
        : "var(--cor-texto)";

  return (
    <div
      className="rounded-2xl p-5 shadow-lg ring-1 ring-white/5"
      style={{ backgroundColor: "var(--cor-superficie)" }}
    >
      <p
        className="text-sm font-medium"
        style={{ color: "var(--cor-texto-suave)" }}
      >
        {titulo}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: cor }}>
        {valor}
      </p>
    </div>
  );
}
