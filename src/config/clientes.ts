// Parte VISUAL por cliente (tema + logo). A parte sensível (login, senha, qual
// planilha) vive na planilha central + Apps Script, não aqui.
//
// Para adicionar um cliente novo: acrescente uma entrada com a chave = slug
// (o mesmo slug cadastrado na planilha central) e coloque a logo em
// public/logos/<SLUG>.<ext>.

export interface Tema {
  nome: string;
  logo: string; // caminho em /public, ex: "/logos/MLN.png"
  corPrimaria: string;
  corFundo: string;
  corSuperficie: string;
  corTexto: string;
  corTextoSuave: string;
}

export const TEMAS: Record<string, Tema> = {
  MLN: {
    nome: "MLN",
    logo: "/logos/MLN.png",
    corPrimaria: "#1d6b5f",     // verde escuro (mármore)
    corFundo: "#0a1917",        // preto bem escuro
    corSuperficie: "#0f2925",   // um pouco mais claro
    corTexto: "#f0f4f2",        // branco elegante
    corTextoSuave: "#a8bfb9",   // cinza médio quente
  },
};

// Tema neutro usado quando o slug não tem entrada específica.
export const TEMA_PADRAO: Tema = {
  nome: "Dashboard",
  logo: "",
  corPrimaria: "#2563eb",
  corFundo: "#0f172a",
  corSuperficie: "#1e293b",
  corTexto: "#e2e8f0",
  corTextoSuave: "#94a3b8",
};

export function temaDoSlug(slug: string): Tema {
  return TEMAS[slug] ?? { ...TEMA_PADRAO, nome: slug };
}
