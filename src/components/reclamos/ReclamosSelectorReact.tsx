import { FaFileLines, FaScaleBalanced, FaTriangleExclamation } from "react-icons/fa6";

const cards = [
  {
    title: "Formulario de Reclamo",
    description: "Registre su reclamo sobre nuestros servicios de telecomunicaciones.",
    icon: FaFileLines,
    href: "reclamo",
  },
  {
    title: "Formulario de Apelación",
    description: "Presente un recurso de apelación contra una resolución emitida.",
    icon: FaScaleBalanced,
    href: "apelacion",
  },
  {
    title: "Formulario de Queja",
    description: "Interponga una queja por transgresión de normas de procedimiento.",
    icon: FaTriangleExclamation,
    href: "queja",
  },
];

export default function ReclamosSelectorReact() {
  const base = (import.meta as any).env?.BASE_URL || "/";

  return (
    <section style={{ padding: "80px 24px", maxWidth: "960px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "12px",
            fontWeight: 600,
            color: "#96237A",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "16px",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          — ATENCIÓN AL CLIENTE
        </span>
        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 500,
            color: "#1A1A1A",
            lineHeight: 1.2,
            fontFamily: "Poppins, sans-serif",
            fontStyle: "italic",
            margin: "0 0 16px",
          }}
        >
          Selecciona una opción
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#5B5B5B",
            lineHeight: 1.7,
            maxWidth: "500px",
            margin: "0 auto",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          Elige el tipo de formulario que deseas completar según tu necesidad.
        </p>
      </div>

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "24px",
        }}
      >
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <a
              key={i}
              href={`${base}reclamos/${card.href}`}
              style={{
                display: "block",
                padding: "32px 24px",
                borderRadius: "16px",
                backgroundColor: "#FBF7FA",
                border: "1px solid transparent",
                textDecoration: "none",
                transition: "all 0.25s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#96237A";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(150,35,122,0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  backgroundColor: "#F3E5F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <Icon size={22} color="#96237A" />
              </div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#1A1A1A",
                  margin: "0 0 8px",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "#5B5B5B",
                  lineHeight: 1.6,
                  margin: 0,
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                {card.description}
              </p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
