import { Link } from "react-router-dom";

export function NaoEncontrado() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center" style={{ backgroundColor: "#0f172a" }}>
      <p style={{ fontSize: 72, fontWeight: 700, color: "#1e293b" }}>404</p>
      <p style={{ marginTop: 12, color: "#94a3b8" }}>Página não encontrada.</p>
      <Link to="/login" style={{ marginTop: 24, padding: "10px 20px", borderRadius: 8, backgroundColor: "#6366f1", color: "#fff", textDecoration: "none", fontWeight: 600 }}>
        Voltar ao login
      </Link>
    </div>
  );
}
