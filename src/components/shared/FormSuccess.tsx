interface FormSuccessProps {
  title?: string;
  subtitle?: string;
  correlativo?: string;
}

export function FormSuccess({
  title = "¡Formulario enviado!",
  subtitle = "Tu solicitud ha sido registrada correctamente.",
  correlativo,
}: FormSuccessProps) {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 160px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "480px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "rgba(34,197,94,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#1A1A1A",
            fontFamily: "Poppins, sans-serif",
            margin: "0 0 8px",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "#5B5B5B",
            lineHeight: 1.6,
            fontFamily: "Poppins, sans-serif",
            margin: 0,
          }}
        >
          {subtitle}
        </p>
        {correlativo && (
          <span
            style={{
              display: "inline-block",
              marginTop: "16px",
              padding: "6px 16px",
              borderRadius: "20px",
              backgroundColor: "#F3E5F0",
              color: "#96237A",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "Poppins, sans-serif",
            }}
          >
            N° {correlativo}
          </span>
        )}
      </div>
    </div>
  );
}
