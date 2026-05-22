import { useEffect, useRef, useState, useCallback } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery } from "../../../tina/__generated__/types";

/* ── Props ── */
interface StickyCardsProps {
  query: string;
  variables: { relativePath: string };
  data: HomeQuery;
}

/* ── SVG visuals placeholder ── */
const CARD_VISUALS: React.FC<{ className?: string }>[] = [
  // 01 — Shield toggle
  ({ className }) => (
    <svg className={className} viewBox="0 0 420 380" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="210" cy="190" rx="170" ry="160" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <ellipse cx="210" cy="190" rx="130" ry="120" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <ellipse cx="210" cy="190" rx="90" ry="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <rect x="115" y="155" rx="40" width="190" height="80" fill="rgba(80,8,55,0.7)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      <circle cx="270" cy="195" r="32" fill="rgba(240,196,232,0.3)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <path d="M262 187v-3a8 8 0 0116 0v3m-18 0h20a2.5 2.5 0 012.5 2.5v10a2.5 2.5 0 01-2.5 2.5h-20a2.5 2.5 0 01-2.5-2.5v-10a2.5 2.5 0 012.5-2.5z" stroke="rgba(240,196,232,0.6)" strokeWidth="1.8" fill="none" />
    </svg>
  ),
  // 02 — Bar chart
  ({ className }) => (
    <svg className={className} viewBox="0 0 420 380" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="240" width="50" rx="14" height="100" fill="rgba(80,8,55,0.5)" />
      <rect x="125" y="180" width="50" rx="14" height="160" fill="rgba(80,8,55,0.5)" />
      <rect x="190" y="130" width="50" rx="14" height="210" fill="rgba(80,8,55,0.55)" />
      <rect x="255" y="200" width="50" rx="14" height="140" fill="rgba(80,8,55,0.45)" />
      <rect x="320" y="160" width="50" rx="14" height="180" fill="rgba(80,8,55,0.5)" />
      <circle cx="350" cy="310" r="22" fill="white" />
      <path d="M343 310l5-5 5 5m-5-5v10" stroke="#96237A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(45 348 310)" />
    </svg>
  ),
  // 03 — Telefonía
  ({ className }) => (
    <svg className={className} viewBox="0 0 420 380" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="210" cy="190" r="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <circle cx="210" cy="190" r="85" fill="rgba(80,8,55,0.3)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      <rect x="170" y="165" rx="10" width="80" height="50" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      <text x="210" y="196" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="14" fontFamily="system-ui">Telefonía</text>
      <rect x="70" y="105" rx="8" width="38" height="38" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <rect x="320" y="280" rx="8" width="38" height="38" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    </svg>
  ),
  // 04 — Cloud
  ({ className }) => (
    <svg className={className} viewBox="0 0 420 380" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="210" cy="200" r="130" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <circle cx="210" cy="200" r="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <path d="M130 230c0-44 36-80 80-80 33 0 61 20 73 48a53 53 0 11-7 105H148c-24 0-43-15-48-35a47 47 0 0130-38z" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" />
      <circle cx="210" cy="215" r="18" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      <ellipse cx="210" cy="222" rx="5" ry="10" fill="rgba(255,255,255,0.08)" />
    </svg>
  ),
  // 05 — 5G
  ({ className }) => (
    <svg className={className} viewBox="0 0 420 380" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="210" cy="190" r="140" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <circle cx="210" cy="190" r="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <circle cx="210" cy="190" r="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <rect x="170" y="150" rx="20" width="80" height="80" fill="rgba(240,196,232,0.12)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
      <text x="210" y="200" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="32" fontWeight="bold" fontFamily="system-ui">5G</text>
      <rect x="70" y="270" rx="8" width="38" height="38" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <rect x="320" y="85" rx="8" width="38" height="38" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <rect x="315" y="285" rx="8" width="38" height="38" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
    </svg>
  ),
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function StickyCardsReact({
  query,
  variables,
  data: initialData,
}: StickyCardsProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });

  const services = data?.home?.services || initialData?.home?.services;
  const sectionTitle = services?.title || "Servicios de conectividad empresarial";
  const items = (services?.items || []).filter(Boolean);

  const [isMobile, setIsMobile] = useState(false);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const currentScales = useRef<number[]>([]);
  const currentOverlays = useRef<number[]>([]);
  const rafId = useRef<number>(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    currentScales.current = items.map(() => 0.93);
    currentOverlays.current = items.map(() => 0);
  }, [items.length]);

  const animate = useCallback(() => {
    if (isMobile) return;

    cardsRef.current.forEach((wrapper, i) => {
      if (!wrapper) return;
      const card = wrapper.querySelector<HTMLElement>(".sc-inner");
      const overlay = wrapper.querySelector<HTMLElement>(".sc-overlay");
      if (!card) return;

      const stickyTop = 100 + i * 20;
      const rect = wrapper.getBoundingClientRect();
      const distanceToStick = rect.top - stickyTop;

      // Scale
      let targetScale: number;
      if (distanceToStick > 0) {
        const progress = Math.min(1, Math.max(0, 1 - distanceToStick / 500));
        targetScale = 0.93 + progress * 0.07;
      } else {
        targetScale = 1;
      }
      currentScales.current[i] = lerp(currentScales.current[i], targetScale, 0.06);
      card.style.transform = `scale(${currentScales.current[i]})`;

      // Overlay
      if (overlay && i < items.length - 1) {
        const nextWrapper = cardsRef.current[i + 1];
        if (!nextWrapper) return;
        const nextRect = nextWrapper.getBoundingClientRect();
        let targetOverlay = 0;
        if (distanceToStick <= 0 && nextRect.top < window.innerHeight * 0.7) {
          targetOverlay = Math.min(
            0.55,
            Math.max(0, ((window.innerHeight * 0.7 - nextRect.top) / 250) * 0.55)
          );
        }
        currentOverlays.current[i] = lerp(currentOverlays.current[i], targetOverlay, 0.06);
        overlay.style.opacity = String(currentOverlays.current[i]);
      }
    });

    rafId.current = requestAnimationFrame(animate);
  }, [isMobile, items.length]);

  useEffect(() => {
    if (isMobile) return;
    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [isMobile, animate]);

  if (items.length === 0) return null;

  return (
    <section className="relative bg-[#0a0a0a] py-20 lg:py-32">
      <div className="max-w-[972px] mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="text-center mb-14 lg:mb-20">
          <h2
            className="font-sans text-white text-subtitle-lg leading-[1.1] tracking-[-0.02em]"
            data-tina-field={tinaField(services, "title")}
          >
            {sectionTitle}
          </h2>
        </div>

        {/* Cards */}
        <div className="relative">
          {items.map((item, index) => {
            if (!item) return null;
            const bullets = (item.bullets || []).filter(Boolean);
            const Visual = CARD_VISUALS[index % CARD_VISUALS.length];

            return (
              <div
                key={index}
                ref={(el) => { cardsRef.current[index] = el; }}
                style={
                  isMobile
                    ? { position: "relative" as const, marginBottom: 20 }
                    : {
                        position: "sticky" as const,
                        top: `${100 + index * 20}px`,
                        marginBottom: 64,
                        zIndex: index + 1,
                      }
                }
              >
                <div
                  className="sc-inner relative overflow-hidden"
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "321px 1fr",
                    height: isMobile ? "auto" : "490px",
                    borderRadius: 16,
                    border: "1px solid #C4C4C4",
                    padding: 4,
                    background: "#0a0a0a",
                    transform: "scale(0.93)",
                    willChange: "transform",
                  }}
                >
                  {/* ── Left: Info ── */}
                  <div
                    style={{
                      background: "#FFD4F4",
                      borderRadius: "12px 0 0 12px",
                      padding: "40px 24px",
                    }}
                    className="flex flex-col justify-between"
                  >
                    <div>
                      <h3
                        className="text-body-lg leading-[1.2] mb-2 text-brand-purple-dark"
                        style={{ fontSize: 26 }}
                        data-tina-field={tinaField(item, "title")}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="leading-relaxed mb-5 text-brand-purple-dark text-body-md"
                        data-tina-field={tinaField(item, "description")}
                      >
                        {item.description}
                      </p>
                      {bullets.length > 0 && (
                        <ul className="space-y-2 text-brand-purple-dark">
                          {bullets.map((bullet, bIdx) => (
                            <li
                              key={bIdx}
                              className="flex items-start gap-2"
                              style={{ lineHeight: 1.45 }}
                            >
                              <span
                                className="shrink-0 rounded-full"
                                style={{
                                  width: 5,
                                  height: 5,
                                  marginTop: 6,
                                  background: "rgba(108,25,88,0.45)",
                                }}
                              />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-subtitle-md" style={{ marginTop: 24 }}>
                      <span
                        className="font-bold text-brand-purple/70"
                        data-tina-field={tinaField(item, "number")}
                      >
                        {item.number}
                      </span>
                    </div>
                  </div>

                  {/* ── Right: Visual ── */}
                  <div
                    className="relative overflow-hidden flex items-center justify-center"
                    style={{
                      background: "#6C1958",
                      borderRadius: "0 12px 12px 0",
                      minHeight: isMobile ? 260 : "auto",
                    }}
                  >
                    {/* Círculos concéntricos */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div style={{ width: 340, height: 340, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.04)" }} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div style={{ width: 240, height: 240, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div style={{ width: 140, height: 140, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)" }} />
                    </div>

                    {item.icon ? (
                      <img
                        src={item.icon}
                        alt={item.title || ""}
                        className="relative z-10 object-contain"
                        style={{ width: "75%", height: "75%" }}
                      />
                    ) : (
                      <Visual className="relative z-10 w-full h-full p-4" />
                    )}
                  </div>

                  {/* Overlay */}
                  {index < items.length - 1 && (
                    <div
                      className="sc-overlay absolute inset-0 pointer-events-none z-20"
                      style={{
                        background: "#0a0a0a",
                        opacity: 0,
                        borderRadius: 16,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}