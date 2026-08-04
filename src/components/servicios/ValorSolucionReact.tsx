import { useEffect, useRef, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type {
  ServiceQuery,
  ServiceQueryVariables,
} from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import DesafioWidget from "./DesafioWidget";

interface ValorSolucionProps {
  query: string;
  variables: ServiceQueryVariables;
  data: ServiceQuery;
  locale?: Locale;
}

interface Card {
  heading?: string | null;
  text?: string | null;
  tags?: (string | null)[] | null;
  image?: string | null;
}

/* Widget interactivo por categoría dentro del card "El desafío" (SPEC 93).
   La clave es el slug del servicio (variables.relativePath sin ".json").
   Los slugs sin entrada (p. ej. conectividad-empresarial) conservan la onda. */
export interface WidgetConfig {
  type: "toggle" | "stats" | "chat";
  hint?: string;
  onLabel?: string;
  before?: { confianza: string; trend: string; dir: "up" | "down" };
  after?: { confianza: string; trend: string; dir: "up" | "down" };
  messages?: { from: "user" | "agent"; text: string; time: string }[];
}

const WIDGETS: Record<string, WidgetConfig> = {
  "data-center-cloud": { type: "toggle", hint: "Proteger", onLabel: "PROTEGIDO" },
  "ciberseguridad-gestionada": {
    type: "stats",
    hint: "Mejorar",
    before: { confianza: "22%", trend: "↓ 32%", dir: "down" },
    after: { confianza: "100%", trend: "↑ 54%", dir: "up" },
  },
  "servicios-gestionados": {
    type: "chat",
    messages: [
      { from: "user", text: "¡Hola! Quiero crear un nuevo proyecto.", time: "Hace 1 min" },
      { from: "agent", text: "¡Genial, ¿en qué te puedo asistir?", time: "Hace 1 min" },
    ],
  },
};

export default function ValorSolucionReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: ValorSolucionProps) {
  const { data } = useTina<ServiceQuery>({ query, variables, data: initialData });

  const sectionRef = useRef<HTMLElement>(null);
  const industriesRef = useRef<HTMLElement>(null);
  const barsRef = useRef<SVGSVGElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Scroll-linked sequential reveal: as the card scrolls up through the
  // viewport, the diagonal bars rise into place one after another (bar 1,
  // then bar 2, …), each over its own slice of the scroll progress.
  useEffect(() => {
    const card = industriesRef.current;
    const svg = barsRef.current;
    if (!card || !svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Order the bars left → right by their geometric center-x, so the reveal
    // sweeps across the card in that direction (getBBox ignores CSS transforms).
    const bars = Array.from(
      svg.querySelectorAll<SVGPathElement>("[data-op]")
    ).sort((a, b) => {
      const ba = a.getBBox();
      const bb = b.getBBox();
      return ba.x + ba.width / 2 - (bb.x + bb.width / 2);
    });
    const n = bars.length;
    const OFFSET = 150; // user units each bar starts below its resting place
    // Play the whole sequence early — as the card rises into view — so the
    // bars have all settled well before the card starts leaving the screen.
    const WIN_START = 0.0; // scroll-progress where bar 1 begins to rise
    const WIN_END = 0.5; // scroll-progress where the last bar finishes (~centered)
    const step = (WIN_END - WIN_START) / n;
    const DUR = step * 1.7; // overlap so the sequence flows smoothly
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = card.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when the card's top hits the bottom of the viewport, 1 once it has
      // scrolled fully past — the sequence plays across this range.
      const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      bars.forEach((bar, i) => {
        const start = WIN_START + i * step;
        const lp = Math.min(1, Math.max(0, (p - start) / DUR));
        const e = easeOut(lp);
        bar.style.transform = `translateY(${(1 - e) * OFFSET}px)`;
        bar.style.opacity = String(Number(bar.dataset.op || 1) * e);
      });
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const valor = data?.service?.valor;
  if (!valor) return null;

  const cards = (valor.cards || []).filter(Boolean) as Card[];
  if (cards.length === 0) return null;

  const [challenge, solution, industries] = cards;
  const vis = inView ? "is-visible" : "";

  // Widget interactivo del card "El desafío" según la categoría (SPEC 93).
  const slug = (variables?.relativePath || "").replace(/\.json$/, "");
  const widget = WIDGETS[slug];

  return (
    <section
      ref={sectionRef}
      className={`valor-section bg-greyscale-darkest py-16 md:py-24 ${vis}`}
    >
      <div className="max-w-[1264px] mx-auto px-6 md:px-16">
        {/* Section heading */}
        {valor.title && (
          <h2
            className="valor-fade text-[28px] md:text-[44px] leading-[1.15] font-semibold text-greyscale-white text-center"
            style={{ ["--d" as any]: "0s" }}
            data-tina-field={tinaField(valor, "title")}
          >
            {tField(valor as any, "title", locale)}
          </h2>
        )}
        {valor.subtitle && (
          <p
            className="valor-fade mt-3 text-body-md text-greyscale-light text-center max-w-[640px] mx-auto"
            style={{ ["--d" as any]: "0.08s" }}
            data-tina-field={tinaField(valor, "subtitle")}
          >
            {tField(valor as any, "subtitle", locale)}
          </p>
        )}

        {/* Bento */}
        <div className="mt-10 md:mt-14 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          {/* ── Left — El desafío (tall, dark purple + wave) ── */}
          {challenge && (
            <article
              className="valor-card relative lg:row-span-2 flex flex-col overflow-hidden rounded-[28px] border border-white/[0.08] min-h-[300px] lg:min-h-[560px] p-7 md:p-9 bg-[radial-gradient(120%_90%_at_15%_0%,#4a1240_0%,#2c0a26_45%,#180614_100%)]"
              style={{ ["--d" as any]: "0.15s" }}
            >
              {challenge.heading && (
                <h3
                  className="text-[22px] md:text-[26px] font-semibold text-greyscale-white mb-3"
                  data-tina-field={tinaField(challenge as any, "heading")}
                >
                  {tField(challenge as any, "heading", locale)}
                </h3>
              )}
              {challenge.text && (
                <p
                  className="text-body-sm md:text-body-md text-white/70 max-w-[420px]"
                  data-tina-field={tinaField(challenge as any, "text")}
                >
                  {tField(challenge as any, "text", locale)}
                </p>
              )}
              {widget ? (
                <div className="mt-8 flex flex-1 items-center justify-center">
                  <DesafioWidget slug={slug} config={widget} />
                </div>
              ) : challenge.image ? (
                <img
                  src={challenge.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="valor-wave pointer-events-none absolute inset-x-0 bottom-6 md:bottom-10 w-full px-6 opacity-90"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
            </article>
          )}

          {/* ── Right top — Nuestra solución (editable: heading + text + tag chips) ── */}
          {solution && (
            <article
              className="valor-card relative overflow-hidden rounded-[28px] border border-white/10 bg-[#D5A7CA] p-7 md:p-9"
              style={{ ["--d" as any]: "0.27s" }}
            >
              {solution.heading && (
                <h3
                  className="text-[22px] md:text-[26px] font-semibold text-[#3B0E30] mb-3"
                  data-tina-field={tinaField(solution as any, "heading")}
                >
                  {tField(solution as any, "heading", locale)}
                </h3>
              )}
              {solution.text && (
                <p
                  className="text-body-sm md:text-body-md text-[#3B0E30]/80 max-w-[560px]"
                  data-tina-field={tinaField(solution as any, "text")}
                >
                  {tField(solution as any, "text", locale)}
                </p>
              )}
              {(() => {
                const tags = (solution.tags || []).filter(Boolean) as string[];
                if (tags.length === 0) return null;
                return (
                  <ul
                    className="mt-5 flex flex-wrap gap-2"
                    data-tina-field={tinaField(solution as any, "tags")}
                  >
                    {tags.map((tag, t) => (
                      <li
                        key={t}
                        className="inline-flex items-center rounded-full border border-[#3B0E30]/25 bg-white/40 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-[#3B0E30]"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </article>
          )}

          {/* ── Right bottom — Industrias destacadas (magenta + arrow) ── */}
          {industries && (
            <article
              ref={industriesRef}
              className="valor-card relative flex flex-col justify-start overflow-hidden rounded-[28px] min-h-[240px] p-7 md:p-9 bg-[linear-gradient(135deg,#9E2680_0%,#7c1c64_60%,#651551_100%)]"
              style={{ ["--d" as any]: "0.39s" }}
            >
              {/* industrias.svg — diagonal bars that rise on scroll (parallax) */}
              <svg
                ref={barsRef}
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 579 434"
                preserveAspectRatio="xMidYMid slice"
                fill="none"
                aria-hidden="true"
              >
                <path
                  data-order="0" data-op="0.45"
                  opacity="0.45"
                  d="M437.342 278.326C461.445 254.223 461.444 215.143 437.341 191.04C413.238 166.937 374.159 166.937 350.056 191.04L21.0575 520.038C-3.04571 544.142 -3.04538 583.221 21.0578 607.324C45.1611 631.427 84.2401 631.427 108.343 607.324L437.342 278.326Z"
                  fill="#D5A7CA"
                  style={{ willChange: "transform" }}
                />
                <path
                  data-order="1" data-op="0.2"
                  opacity="0.2"
                  d="M709.67 103.755L709.67 103.755C685.567 79.6513 646.487 79.6513 622.384 103.755L189.234 536.905C165.131 561.008 165.131 600.087 189.234 624.191C213.337 648.294 252.416 648.294 276.52 624.191L709.67 191.04C733.773 166.937 733.773 127.858 709.67 103.755Z"
                  fill="#F3E4EF"
                  style={{ willChange: "transform" }}
                />
                <path
                  data-order="2" data-op="0.2"
                  opacity="0.2"
                  d="M811.47 187.972L811.469 187.971C787.366 163.868 748.287 163.868 724.184 187.971L291.033 621.122C266.93 645.225 266.93 684.304 291.034 708.408C315.137 732.511 354.216 732.511 378.319 708.408L811.47 275.257C835.573 251.154 835.573 212.075 811.47 187.972Z"
                  fill="#F3E4EF"
                  style={{ willChange: "transform" }}
                />
                <path
                  data-order="3" data-op="0.2"
                  opacity="0.2"
                  d="M126.681 318.921L126.681 318.921C102.577 294.818 63.4984 294.818 39.3951 318.921L-367.671 725.987C-391.774 750.09 -391.774 789.169 -367.671 813.273L-367.671 813.273C-343.567 837.376 -304.488 837.376 -280.385 813.273L126.681 406.207C150.784 382.104 150.784 343.025 126.681 318.921Z"
                  fill="#F3E4EF"
                  style={{ willChange: "transform" }}
                />
                <path
                  data-order="4" data-op="0.2"
                  opacity="0.2"
                  d="M73.837 275.91C97.9402 251.807 97.9399 212.727 73.8367 188.624C49.7335 164.521 10.6544 164.521 -13.4488 188.624L-420.515 595.69C-444.618 619.793 -444.618 658.873 -420.515 682.976C-396.411 707.079 -357.332 707.079 -333.229 682.976L73.837 275.91Z"
                  fill="#F3E4EF"
                  style={{ willChange: "transform" }}
                />
              </svg>
              {/* diagonal light stripe */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(122deg, transparent 38%, rgba(255,255,255,0.10) 50%, transparent 62%)",
                }}
              />
              <div className="relative z-10 max-w-[85%]">
                {industries.heading && (
                  <h3
                    className="text-[22px] md:text-[26px] font-semibold text-white mb-3"
                    data-tina-field={tinaField(industries as any, "heading")}
                  >
                    {tField(industries as any, "heading", locale)}
                  </h3>
                )}
                {industries.text && (
                  <p
                    className="text-body-sm text-white/85"
                    data-tina-field={tinaField(industries as any, "text")}
                  >
                    {tField(industries as any, "text", locale)}
                  </p>
                )}
              </div>
            </article>
          )}
        </div>
      </div>

      <style>{`
        /* Scroll-reveal: fade + rise, staggered via --d */
        .valor-fade, .valor-card {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease var(--d, 0s),
            transform 0.7s ease var(--d, 0s), box-shadow 0.4s ease;
        }
        .valor-section.is-visible .valor-fade,
        .valor-section.is-visible .valor-card {
          opacity: 1;
          transform: translateY(0);
        }

        /* Wave "signal" draws itself left → right once revealed */
        .valor-wave {
          clip-path: inset(0 100% 0 0);
          transition: clip-path 1.1s ease 0.5s;
        }
        .valor-section.is-visible .valor-wave {
          clip-path: inset(0 0 0 0);
        }

        /* Hover: lift + magenta glow (immediate, no reveal delay) */
        @media (hover: hover) {
          .valor-section.is-visible .valor-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 24px 60px -18px rgba(150, 35, 122, 0.55);
            transition-delay: 0s;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .valor-fade, .valor-card {
            opacity: 1;
            transform: none;
            transition: box-shadow 0.4s ease;
          }
          .valor-wave { clip-path: none; transition: none; }
          .valor-section.is-visible .valor-card:hover { transform: none; }
        }
      `}</style>
    </section>
  );
}
