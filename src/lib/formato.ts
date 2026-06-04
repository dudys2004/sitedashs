const fmtBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const fmtCompacto = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function moeda(v: number): string {
  return fmtBRL.format(v ?? 0);
}

export function moedaCompacta(v: number): string {
  return "R$ " + fmtCompacto.format(v ?? 0);
}

export function numero(v: number): string {
  return new Intl.NumberFormat("pt-BR").format(v ?? 0);
}
