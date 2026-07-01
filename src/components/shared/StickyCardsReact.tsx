import { useEffect, useRef, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery } from "../../../tina/__generated__/types";

/* ── Props ── */
interface StickyCardsProps {
  query: string;
  variables: { relativePath: string };
  data: HomeQuery;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Detect reduced-motion preference.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    setRevealed(items.map(() => false));
  }, [items.length]);

  // Reveal each card once as it enters the viewport.
  useEffect(() => {
    if (reduceMotion) {
      setRevealed(items.map(() => true));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number((entry.target as HTMLElement).dataset.index);
          setRevealed((prev) => {
            if (prev[idx]) return prev;
            const next = [...prev];
            next[idx] = true;
            return next;
          });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    cardsRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [items.length, reduceMotion]);

  if (items.length === 0) return null;

  return (
    <section className="relative bg-[#0a0a0a] py-20 lg:py-32">
      {/* Keyframes for the subtle visual float — injected to avoid Tailwind JIT staleness. */}
      <style>{`
        @keyframes sc-float {
          0%   { transform: translateY(0); }
          50%  { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }
        .sc-card { opacity: 0; transform: translateY(28px); transition: opacity .7s ease, transform .7s ease; }
        .sc-card.is-revealed { opacity: 1; transform: translateY(0); }
        .sc-visual-img { animation: sc-float 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sc-card { opacity: 1 !important; transform: none !important; transition: none !important; }
          .sc-visual-img { animation: none !important; }
        }
      `}</style>

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

        {/* Cards — vertical stack */}
        <div className="flex flex-col gap-6 md:gap-8">
          {items.map((item, index) => {
            if (!item) return null;
            const bullets = (item.bullets || []).filter(Boolean);
            const icon = resolveIcon(item.icon);

            return (
              <div
                key={index}
                ref={(el) => { cardsRef.current[index] = el; }}
                data-index={index}
                className={`sc-card${revealed[index] ? " is-revealed" : ""}`}
                style={{ transitionDelay: reduceMotion ? "0ms" : "60ms" }}
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
                    style={{ borderRadius: 12 }}
                  >
                  {/* ── Visual (magenta panel SVG) — on top in mobile, right in desktop ── */}
                  <div
                    className="relative overflow-hidden order-first md:order-last"
                    style={{
                      background: "#96237A",
                      minHeight: 240,
                    }}
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
