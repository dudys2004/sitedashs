import { Link } from "react-router-dom";

export function NaoEncontrado() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <p className="text-5xl font-bold text-slate-700">404</p>
      <p className="mt-3 text-slate-400">Página não encontrada.</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
      >
        Voltar ao login
      </Link>
    </div>
  );
}
