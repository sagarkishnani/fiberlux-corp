import { useEffect, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery } from "../../../tina/__generated__/types";

/* ── Props ── */
interface StickyCardsProps {
  query: string;
  variables: { relativePath: string };
  data: HomeQuery;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/* Sticky-stack tuning. */
const NAV_H = 64; // fixed site header height (h-16)
const STICK_TOP = 176; // where the first card pins, below the nav + sticky title band
const PEEK = 18; // each stacked card rests this much lower, so its top edge peeks

/* Prefixes the CMS media path with BASE_URL so it resolves under a subpath deploy. */
function resolveIcon(icon?: string | null): string | null {
  if (!icon) return null;
  if (/^https?:\/\//.test(icon)) return icon;
  return `${BASE}${icon.startsWith("/") ? "" : "/"}${icon}`;
}

export default function StickyCardsReact({
  query,
  variables,
  data: initialData,
}: StickyCardsProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });

  const services = data?.home?.services || initialData?.home?.services;
  const sectionTitle = services?.title || "Nuestras soluciones";
  const items = (services?.items || []).filter(Boolean);

  const [isMobile, setIsMobile] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 767px)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMobile = () => setIsMobile(mqMobile.matches);
    const applyMotion = () => setReduceMotion(mqMotion.matches);
    applyMobile();
    applyMotion();
    mqMobile.addEventListener("change", applyMobile);
    mqMotion.addEventListener("change", applyMotion);
    return () => {
      mqMobile.removeEventListener("change", applyMobile);
      mqMotion.removeEventListener("change", applyMotion);
    };
  }, []);

  if (items.length === 0) return null;

  // Sticky stacking only on desktop and when motion is allowed; otherwise a plain vertical stack.
  const stack = !isMobile && !reduceMotion;

  return (
    <section className="relative bg-[#0a0a0a] py-14 md:py-20 lg:py-32">
      {/* Keyframes for the subtle visual float — injected to avoid Tailwind JIT staleness. */}
      <style>{`
        @keyframes sc-float {
          0%   { transform: translateY(0); }
          50%  { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }
        .sc-visual-img { animation: sc-float 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sc-visual-img { animation: none !important; }
        }
      `}</style>

      <div className="max-w-[972px] mx-auto px-6 md:px-10">
        {/* Header — stays pinned below the nav while the cards stack behind it */}
        <div
          className="text-center bg-[#0a0a0a] pt-4 pb-8 md:pt-6 md:pb-10 mb-6"
          style={stack ? { position: "sticky", top: NAV_H, zIndex: 50 } : undefined}
        >
          <h2
            className="font-sans text-white text-subtitle-lg leading-[1.1] tracking-[-0.02em]"
            data-tina-field={tinaField(services, "title")}
          >
            {sectionTitle}
          </h2>
        </div>

        {/* Cards — sticky vertical stack (desktop) / plain stack (mobile) */}
        <div className="relative">
          {items.map((item, index) => {
            if (!item) return null;
            const bullets = (item.bullets || []).filter(Boolean);
            const icon = resolveIcon(item.icon);

            return (
              <div
                key={index}
                style={
                  stack
                    ? {
                        position: "sticky",
                        top: `${STICK_TOP + index * PEEK}px`,
                        marginBottom: 48,
                        zIndex: index + 1,
                      }
                    : { position: "relative", marginBottom: 24 }
                }
              >
                <div
                  className="sc-inner relative"
                  style={{
                    borderRadius: 16,
                    border: "1px solid #C4C4C4",
                    padding: 4,
                    background: "#0a0a0a",
                  }}
                >
                  <div
                    className="grid grid-cols-1 md:grid-cols-[321px_1fr] overflow-hidden"
                    style={{ borderRadius: 12, minHeight: isMobile ? undefined : 480 }}
                  >
                    {/* ── Visual (magenta panel SVG) — on top in mobile, right in desktop ── */}
                    <div
                      className="relative overflow-hidden order-first md:order-last"
                      style={{ background: "#96237A", minHeight: 240 }}
                    >
                      {icon && (
                        <img
                          src={icon}
                          alt={item.title || ""}
                          className="sc-visual-img absolute block"
                          style={{
                            top: -14,
                            left: -14,
                            width: "calc(100% + 28px)",
                            height: "calc(100% + 28px)",
                            objectFit: "cover",
                          }}
                        />
                      )}
                    </div>

                    {/* ── Info panel ── */}
                    <div
                      className="flex flex-col justify-between order-last md:order-first"
                      style={{
                        background: "#FFD4F4",
                        padding: "40px 24px",
                        minHeight: 240,
                      }}
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
                      <div
                        className="flex items-center justify-between text-subtitle-md"
                        style={{ marginTop: 24 }}
                      >
                        <span
                          className="font-bold text-brand-purple/70"
                          data-tina-field={tinaField(item, "number")}
                        >
                          {item.number}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
