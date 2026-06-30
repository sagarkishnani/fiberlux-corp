import { useTina, tinaField } from "tinacms/dist/react";

interface InfoAbonadosProps {
  query: string;
  variables: { relativePath: string };
  data: any;
}

/* ── Icon components ── */
const DocumentIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#96237A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#96237A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const ScaleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#96237A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18" /><path d="M3 7h18" />
    <path d="M6 7l-3 9h6L6 7Z" /><path d="M18 7l-3 9h6l-3-9Z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#96237A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

const FolderIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#96237A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z" />
  </svg>
);

const CertificateIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#96237A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const iconMap: Record<string, React.FC> = {
  document: DocumentIcon,
  shield: ShieldIcon,
  scale: ScaleIcon,
  clipboard: ClipboardIcon,
  folder: FolderIcon,
  certificate: CertificateIcon,
};

/* ── Responsive CSS ── */
const responsiveStyles = `
.info-docs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (min-width: 640px) {
  .info-docs-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (min-width: 1024px) {
  .info-docs-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
`;

export default function InfoAbonadosReact({
  query,
  variables,
  data: initialData,
}: InfoAbonadosProps) {
  const { data } = useTina({ query, variables, data: initialData });
  const page = data?.infoAbonados || initialData?.infoAbonados;
  if (!page) return null;

  const sections = (page.sections || []).filter((s: any) => s && s.visible !== false);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: responsiveStyles }} />
      <section style={{ padding: "64px 0 80px", backgroundColor: "#ffffff", fontFamily: "Poppins, sans-serif" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

          {/* Page header */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h1
              style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 500, color: "#1A1A1A", marginBottom: "12px", lineHeight: '28px' }}
              data-tina-field={tinaField(page, "title")}
            >
              {page.title}
            </h1>
            {page.description && (
              <p
                style={{ fontSize: "14px", color: "#5B5B5B", maxWidth: "500px", margin: "24px auto", lineHeight: 1.7 }}
                data-tina-field={tinaField(page, "description")}
              >
                {page.description}
              </p>
            )}
          </div>

          {/* Sections */}
          {sections.map((section: any, i: number) => {
            const docs = (section.documents || []).filter((d: any) => d && d.visible !== false);
            return (
              <div key={i} style={{ marginBottom: "48px" }}>
                {section.title && (
                  <h2
                    style={{
                      fontSize: "clamp(22px, 3vw, 28px)",
                      fontWeight: 600,
                      color: "#1A1A1A",
                      textAlign: "center",
                      marginBottom: "24px",
                      fontStyle: "italic",
                    }}
                    data-tina-field={tinaField(section, "title")}
                  >
                    {section.title}
                  </h2>
                )}

                <div className="info-docs-grid">
                  {docs.map((doc: any, j: number) => {
                    const IconComp = iconMap[doc.icon || "document"] || DocumentIcon;
                    const hasUrl = doc.url && doc.url !== "#";

                    const card = (
                      <div
                        key={j}
                        style={{
                          backgroundColor: "#FBF7FA",
                          borderRadius: "16px",
                          padding: "24px",
                          display: "flex",
                          flexDirection: "column",
                          minHeight: "160px",
                          transition: "all 0.2s",
                          cursor: hasUrl ? "pointer" : "default",
                          border: "1px solid transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (hasUrl) {
                            e.currentTarget.style.borderColor = "#E8E1E5";
                            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "transparent";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        data-tina-field={tinaField(doc, "title")}
                      >
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            backgroundColor: "#FFD4F4",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "auto",
                          }}
                        >
                          <IconComp />
                        </div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A", marginTop: "16px", lineHeight: 1.4 }}>
                          {doc.title}
                        </p>
                      </div>
                    );

                    return hasUrl ? (
                      <a key={j} href={doc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        {card}
                      </a>
                    ) : (
                      <div key={j}>{card}</div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
