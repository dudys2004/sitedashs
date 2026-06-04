import type { Tema } from "../config/clientes";

// Aplica as cores do cliente como variáveis CSS no :root. Os componentes usam
// essas variáveis (via classes utilitárias / style), então trocar de cliente
// troca o visual inteiro sem recriar componentes.
export function aplicarTema(tema: Tema) {
  const r = document.documentElement.style;
  r.setProperty("--cor-primaria", tema.corPrimaria);
  r.setProperty("--cor-fundo", tema.corFundo);
  r.setProperty("--cor-superficie", tema.corSuperficie);
  r.setProperty("--cor-texto", tema.corTexto);
  r.setProperty("--cor-texto-suave", tema.corTextoSuave);
}
