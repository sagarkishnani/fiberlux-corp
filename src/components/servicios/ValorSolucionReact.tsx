import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
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
   Los slugs sin entrada conservan la onda estática. */
export interface WidgetConfig {
  type: "cloud-beam" | "fiber" | "multisede" | "shield-switch" | "noc";
  hint?: string;
  onLabel?: string;
  offLabel?: string;
  uptime?: string;
}

// Animación en loop por categoría (SPEC 95). Por defecto corren solas; el
// tooltip/click sólo reaparece con valor.desafioClickable = true, y sólo tiene
// efecto en los widgets con estado binario real (hint definido → shield-switch).
const WIDGETS: Record<string, WidgetConfig> = {
  "data-center": { type: "cloud-beam" },
  conectividad: { type: "multisede" },
  ciberseguridad: {
    type: "shield-switch",
    onLabel: "PROTEGIDO",
    offLabel: "EXPUESTO",
    hint: "Proteger",
  },
  /* SPEC 109: Infraestructura hereda el panel NOC que era de Servicios
     Gestionados y Comunicaciones estrena `fiber`, que existía sin uso. */
  infraestructura: { type: "noc", uptime: "99.98%" },
  comunicaciones: { type: "fiber" },
};

export default function ValorSolucionReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: ValorSolucionProps) {
  const { data } = useTina<ServiceQuery>({ query, variables, data: initialData });

  // Animación del card "El desafío" según la categoría (SPEC 93 → SPEC 95).
  const slug = (variables?.relativePath || "").replace(/\.json$/, "");
  const widget = WIDGETS[slug];
  // Loop por defecto; con desafioClickable = true vuelve la interacción (SPEC 95).
  const clickable = !!data?.service?.valor?.desafioClickable;
  // Sólo hay tooltip/cursor cuando la interacción está activa y el widget tiene
  // un estado togglable real (hint definido).
  const interactive = clickable && !!widget?.hint;

  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  /* Tooltip-hint que sigue el cursor sobre TODO el bloque "El desafío"
     (misma línea que el tooltip de Soluciones del home: delay 140ms + lag).
     Sólo en punteros finos; en touch se muestra una guía breve al entrar. */
  const finePointer = useRef(false);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const tipTarget = useRef({ x: 0, y: 0 });
  const tipPos = useRef({ x: 0, y: 0 });
  const tipRaf = useRef<number | null>(null);
  const tipDelay = useRef<number | null>(null);
  const [tipOn, setTipOn] = useState(false);
  const [guideOn, setGuideOn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    finePointer.current = window.matchMedia("(pointer: fine)").matches;
    // Touch (sin puntero fino): mostrar la guía unos segundos y ocultarla.
    if (interactive && !finePointer.current) {
      setGuideOn(true);
      const t = window.setTimeout(() => setGuideOn(false), 3200);
      return () => window.clearTimeout(t);
    }
    return () => {
      if (tipRaf.current != null) cancelAnimationFrame(tipRaf.current);
      if (tipDelay.current != null) clearTimeout(tipDelay.current);
    };
  }, [interactive]);

  const tipLoop = () => {
    const k = 0.06; // menor = más lag (persigue el cursor más lento)
    tipPos.current.x += (tipTarget.current.x - tipPos.current.x) * k;
    tipPos.current.y += (tipTarget.current.y - tipPos.current.y) * k;
    const el = tipRef.current;
    if (el) el.style.transform = `translate3d(${tipPos.current.x}px, ${tipPos.current.y}px, 0)`;
    tipRaf.current = requestAnimationFrame(tipLoop);
  };
  const onDesafioEnter = (e: ReactMouseEvent) => {
    if (!finePointer.current) return;
    tipTarget.current = { x: e.clientX, y: e.clientY };
    tipPos.current = { ...tipTarget.current };
    if (tipDelay.current != null) clearTimeout(tipDelay.current);
    tipDelay.current = window.setTimeout(() => {
      setTipOn(true);
      if (tipRaf.current == null) tipRaf.current = requestAnimationFrame(tipLoop);
    }, 140);
  };
  const onDesafioMove = (e: ReactMouseEvent) => {
    if (!finePointer.current) return;
    tipTarget.current = { x: e.clientX, y: e.clientY };
  };
  const onDesafioLeave = () => {
    if (tipDelay.current != null) {
      clearTimeout(tipDelay.current);
      tipDelay.current = null;
    }
    setTipOn(false);
    if (tipRaf.current != null) {
      cancelAnimationFrame(tipRaf.current);
      tipRaf.current = null;
    }
  };
  // El click sobre cualquier parte del bloque (misma superficie que el hover)
  // reenvía al control del widget; si ya cayó sobre él, lo maneja el propio botón.
  const onDesafioClick = (e: ReactMouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[role="switch"]')) return;
    const btn = e.currentTarget.querySelector<HTMLElement>('[role="switch"]');
    btn?.click();
  };

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

  const valor = data?.service?.valor;
  if (!valor) return null;

  const cards = (valor.cards || []).filter(Boolean) as Card[];
  if (cards.length === 0) return null;

  const [challenge, solution, industries] = cards;
  const vis = inView ? "is-visible" : "";

  return (
    <section
      ref={sectionRef}
      className={`valor-section bg-greyscale-darkest py-16 md:py-24 ${vis}`}
    >
      <div className="max-w-[1264px] mx-auto px-6 md:px-16">
        {/* Section heading */}
        {valor.title && (
          <h2
            className="valor-fade text-[28px] md:text-[44px] leading-[1.15] font-medium text-greyscale-white text-center"
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
              className={`valor-card relative lg:row-span-2 flex flex-col overflow-hidden rounded-[28px] border border-white/[0.08] min-h-[300px] lg:min-h-[560px] p-7 md:p-9 bg-[radial-gradient(120%_90%_at_15%_0%,#4a1240_0%,#2c0a26_45%,#180614_100%)]${
                interactive ? " cursor-pointer" : ""
              }`}
              style={{ ["--d" as any]: "0.15s" }}
              onMouseEnter={interactive ? onDesafioEnter : undefined}
              onMouseMove={interactive ? onDesafioMove : undefined}
              onMouseLeave={interactive ? onDesafioLeave : undefined}
              onClick={interactive ? onDesafioClick : undefined}
            >
              {/* Base "horizonte" magenta — línea gráfica compartida por todos los widgets (SPEC 95). */}
              {widget && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[42%] overflow-hidden rounded-b-[28px]"
                >
                  <svg
                    viewBox="0 0 600 240"
                    preserveAspectRatio="xMidYMax slice"
                    className="h-full w-full"
                    fill="none"
                  >
                    <defs>
                      <linearGradient id="dw-hill" x1="0" y1="0" x2="0.9" y2="1">
                        <stop offset="0" stopColor="#B23E97" />
                        <stop offset="1" stopColor="#7c1c64" />
                      </linearGradient>
                      <linearGradient id="dw-hill-sheen" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stopColor="rgba(255,255,255,0)" />
                        <stop offset="0.5" stopColor="rgba(255,255,255,0.28)" />
                        <stop offset="1" stopColor="rgba(255,255,255,0)" />
                      </linearGradient>
                      <clipPath id="dw-hill-clip">
                        <ellipse cx="300" cy="368" rx="470" ry="220" />
                      </clipPath>
                    </defs>
                    {/* Semiesfera magenta. */}
                    <ellipse cx="300" cy="368" rx="470" ry="220" fill="url(#dw-hill)" />
                    {/* Destello que barre la semiesfera (le da vida y profundidad). */}
                    <g clipPath="url(#dw-hill-clip)">
                      <rect
                        className="valor-hill-sheen"
                        x="0"
                        y="150"
                        width="150"
                        height="240"
                        fill="url(#dw-hill-sheen)"
                      />
                    </g>
                    {/* Línea del horizonte — base tenue. */}
                    <path
                      d="M-40 150 Q300 66 640 150"
                      fill="none"
                      stroke="rgba(213,167,202,0.28)"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              )}
              {challenge.heading && (
                <h3
                  className="relative z-10 text-[22px] md:text-[26px] font-medium text-greyscale-white mb-3"
                  data-tina-field={tinaField(challenge as any, "heading")}
                >
                  {tField(challenge as any, "heading", locale)}
                </h3>
              )}
              {challenge.text && (
                <p
                  className="relative z-10 text-body-sm md:text-body-md text-white/70 max-w-[420px]"
                  data-tina-field={tinaField(challenge as any, "text")}
                >
                  {tField(challenge as any, "text", locale)}
                </p>
              )}
              {/* Guía breve del hint en touch (sólo con interacción activa). */}
              {interactive && (
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-white/95 px-3 py-1.5 text-[13px] font-medium text-[#3B0E30] shadow-lg transition-opacity duration-300 ${
                    guideOn ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span className="mr-1">↵</span>
                  {widget?.hint}
                </span>
              )}
              {widget ? (
                <div className="relative z-10 mt-8 flex flex-1 items-center justify-center">
                  <DesafioWidget slug={slug} config={widget} clickable={clickable} />
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
                  className="text-[22px] md:text-[26px] font-medium text-[#3B0E30] mb-3"
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
              className="valor-card relative flex flex-col justify-start overflow-hidden rounded-[28px] min-h-[240px] p-7 md:p-9 bg-[linear-gradient(135deg,#9E2680_0%,#7c1c64_60%,#651551_100%)]"
              style={{ ["--d" as any]: "0.39s" }}
            >
              <div className="relative z-10 max-w-[85%]">
                {industries.heading && (
                  <h3
                    className="text-[22px] md:text-[26px] font-medium text-white mb-3"
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

      {/* Tooltip-hint flotante que sigue el cursor (sólo con interacción activa). */}
      {interactive && (
        <div
          ref={tipRef}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-[90] will-change-transform"
          style={{ transform: "translate3d(-200px, -200px, 0)" }}
        >
          <div
            className={`-translate-x-1/2 -translate-y-1/2 rounded-[8px] bg-white/95 px-3.5 py-1.5 text-[13px] font-medium text-[#3B0E30] shadow-lg transition-opacity duration-200 ${
              tipOn ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="mr-1">↵</span>
            {widget?.hint}
          </div>
        </div>
      )}

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

        /* Vida en la base "horizonte": destello que barre la semiesfera
           magenta (SPEC 95). La línea del horizonte queda apagada: sin luz
           viajera, para no sobrecargar de movimiento la sección. */
        @keyframes valor-sheen {
          0%   { transform: skewX(-20deg) translateX(-220px); opacity: 0; }
          18%  { opacity: 1; }
          82%  { opacity: 1; }
          100% { transform: skewX(-20deg) translateX(820px); opacity: 0; }
        }
        .valor-hill-sheen {
          transform: skewX(-20deg) translateX(-220px);
          animation: valor-sheen 6.5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .valor-fade, .valor-card {
            opacity: 1;
            transform: none;
            transition: box-shadow 0.4s ease;
          }
          .valor-wave { clip-path: none; transition: none; }
          .valor-section.is-visible .valor-card:hover { transform: none; }
          .valor-hill-sheen { animation: none; opacity: 0; }
        }
      `}</style>
    </section>
  );
}
