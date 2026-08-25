import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import {
  FaBolt,
  FaShieldHalved,
  FaCloud,
  FaGears,
  FaNetworkWired,
  FaServer,
  FaGlobe,
  FaHeadset,
  FaDatabase,
  FaWifi,
  FaCheck,
} from "react-icons/fa6";
import type { IconType } from "react-icons";
import type { HomeQuery } from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import { buttonClass } from "./Button";
import SliderSideArrows from "./SliderSideArrows";

/**
 * Panel de soluciones — SPEC 103.
 *
 * Píldoras de categoría (tabs) + panel de detalle en dos columnas (texto y
 * checklist de subservicios a la izquierda, card visual a la derecha) +
 * flechas circulares a los costados. Sección de alto normal: a diferencia de
 * `SolucionesScrollReact` (SPEC 89) NO ancla el scroll de la página.
 */

interface SolucionesPanelProps {
  query: string;
  variables: { relativePath: string };
  data: HomeQuery;
  locale?: Locale;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Prefija una ruta interna con BASE_URL (deploy bajo subpath). */
function withBase(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Set cerrado de íconos de categoría (`tabIcon` en Tina). */
const ICONS: Record<string, IconType> = {
  rayo: FaBolt,
  escudo: FaShieldHalved,
  nube: FaCloud,
  engranaje: FaGears,
  red: FaNetworkWired,
  servidor: FaServer,
  globo: FaGlobe,
  soporte: FaHeadset,
  datos: FaDatabase,
  wifi: FaWifi,
};
const iconFor = (key?: string | null): IconType => ICONS[key || ""] || FaBolt;

/** Palancas de animación del bloque (SPEC 103). */
const PARAMS = {
  /** Desplazamiento de entrada del texto, en px (signo = dirección del cambio). */
  slideX: 30,
  /** Duración del crossfade del texto y de la lista, en ms. */
  textMs: 520,
  /** Retardo acumulado por fila del checklist, en ms. */
  rowStaggerMs: 45,
  /** Entrada de la card visual: duración, escala inicial y blur inicial. */
  cardMs: 640,
  cardScaleFrom: 0.94,
  cardBlurPx: 10,
  /** Indicador deslizante de la píldora activa, en ms. */
  indicatorMs: 480,
  /** Vida propia de la card visual: flotación y tilt 3D con el cursor. */
  floatMs: 7000,
  floatPx: 10,
  tiltMaxDeg: 7,
};

export default function SolucionesPanelReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: SolucionesPanelProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });

  const services = data?.home?.services || initialData?.home?.services;
  const items = (services?.items || []).filter(Boolean) as NonNullable<
    NonNullable<typeof services>["items"]
  >;
  const N = items.length;

  /* `dir` = dirección del último cambio (+1 adelante / -1 atrás): alimenta el
     crossfade direccional del paso 7. */
  const [activeIndex, setActiveIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* Cambia de categoría con wrap circular (la última vuelve a la primera). */
  const goTo = useCallback(
    (next: number, direction?: number) => {
      if (N === 0) return;
      const target = ((next % N) + N) % N;
      setActiveIndex((prev) => {
        if (prev === target) return prev;
        setDir(direction ?? (target > prev ? 1 : -1));
        return target;
      });
    },
    [N],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1, -1), [goTo, activeIndex]);
  const goNext = useCallback(() => goTo(activeIndex + 1, 1), [goTo, activeIndex]);

  /* ←/→ sobre la tira de tabs: mueve la categoría y el foco (patrón WAI-ARIA). */
  const onTabsKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const target = ((activeIndex + delta) % N + N) % N;
    goTo(target, delta);
    tabRefs.current[target]?.focus();
  };

  /* ── Indicador deslizante de la píldora activa ──
     Se mide el tab activo (offsetLeft/offsetWidth relativos a la tira, que es
     `relative`) y se anima el pill de fondo. Se re-mide en resize y cuando
     cambian los items (fuentes/idioma). */
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const tabsRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState({ x: 0, w: 0, ready: false });

  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs.current[Math.min(activeIndex, N - 1)];
      if (!el) return;
      setIndicator({ x: el.offsetLeft, w: el.offsetWidth, ready: true });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex, N, locale]);

  /* Re-mide cuando el scroll horizontal de la tira cambia el layout (mobile). */
  useEffect(() => {
    const strip = tabsRef.current;
    if (!strip) return;
    const ro = new ResizeObserver(() => {
      const el = tabRefs.current[Math.min(activeIndex, N - 1)];
      if (el) setIndicator({ x: el.offsetLeft, w: el.offsetWidth, ready: true });
    });
    ro.observe(strip);
    return () => ro.disconnect();
  }, [activeIndex, N]);

  /* ── Tilt 3D de la card visual (solo punteros finos) ──
     Se escribe la transform directamente sobre el nodo (sin re-render) y se
     resetea al salir. La flotación va por CSS sobre el wrapper, para que tilt y
     flotación no se pisen. */
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const finePointer = useRef(false);

  useEffect(() => {
    finePointer.current =
      typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
  }, []);

  const onCardMove = (e: ReactPointerEvent) => {
    if (!finePointer.current || reduceMotion) return;
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // [-0.5, 0.5]
    const py = (e.clientY - r.top) / r.height - 0.5;
    const ry = (px * PARAMS.tiltMaxDeg * 2).toFixed(2);
    const rx = (-py * PARAMS.tiltMaxDeg * 2).toFixed(2);
    el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };
  const onCardLeave = () => {
    const el = tiltRef.current;
    if (el) el.style.transform = "";
  };

  /* ── Tooltip "Ver más" con delay + lag (portado de SPEC 89) ──
     Solo en punteros finos: aparece tras un delay y persigue al cursor con un
     lerp más lento que el puntero. */
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tipTarget = useRef({ x: 0, y: 0 });
  const tipPos = useRef({ x: 0, y: 0 });
  const tipRaf = useRef<number | null>(null);
  const tipDelay = useRef<number | null>(null);
  const [tooltipOn, setTooltipOn] = useState(false);

  useEffect(
    () => () => {
      if (tipRaf.current != null) cancelAnimationFrame(tipRaf.current);
      if (tipDelay.current != null) clearTimeout(tipDelay.current);
    },
    [],
  );

  const runTipLoop = () => {
    const k = 0.06; // menor = más lag
    tipPos.current.x += (tipTarget.current.x - tipPos.current.x) * k;
    tipPos.current.y += (tipTarget.current.y - tipPos.current.y) * k;
    const el = tooltipRef.current;
    if (el) el.style.transform = `translate3d(${tipPos.current.x}px, ${tipPos.current.y}px, 0)`;
    tipRaf.current = requestAnimationFrame(runTipLoop);
  };

  /** Coloca el tooltip sin interpolar (usado con prefers-reduced-motion). */
  const placeTip = () => {
    const el = tooltipRef.current;
    if (el) el.style.transform = `translate3d(${tipTarget.current.x}px, ${tipTarget.current.y}px, 0)`;
  };

  const handleTipEnter = (e: ReactMouseEvent) => {
    if (!finePointer.current) return;
    tipTarget.current = { x: e.clientX, y: e.clientY };
    tipPos.current = { ...tipTarget.current };
    if (tipDelay.current != null) clearTimeout(tipDelay.current);
    tipDelay.current = window.setTimeout(() => {
      setTooltipOn(true);
      // Con reduced-motion no se abre el bucle de persecución: el tooltip se
      // coloca directamente en el cursor.
      if (reduceMotion) placeTip();
      else if (tipRaf.current == null) tipRaf.current = requestAnimationFrame(runTipLoop);
    }, 140);
  };
  const handleTipMove = (e: ReactMouseEvent) => {
    if (!finePointer.current) return;
    tipTarget.current = { x: e.clientX, y: e.clientY };
    if (reduceMotion && tooltipOn) placeTip();
  };
  const handleTipLeave = () => {
    if (tipDelay.current != null) {
      clearTimeout(tipDelay.current);
      tipDelay.current = null;
    }
    setTooltipOn(false);
    if (tipRaf.current != null) {
      cancelAnimationFrame(tipRaf.current);
      tipRaf.current = null;
    }
  };

  /* ── Arrastre horizontal ──
     Umbral por eje dominante: solo dispara si el gesto es más horizontal que
     vertical, para no competir con el scroll de la página en táctil
     (`touch-action: pan-y` deja el scroll vertical al navegador). */
  const drag = useRef({ x: 0, y: 0, active: false, fired: false });
  const DRAG_THRESHOLD = 60;

  const onPointerDown = (e: ReactPointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, active: true, fired: false };
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d.active || d.fired) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) < DRAG_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
    d.fired = true;
    if (dx < 0) goNext();
    else goPrev();
  };
  const onPointerUp = () => {
    drag.current.active = false;
  };

  if (N === 0) return null;

  const idx = Math.min(activeIndex, N - 1);
  const active = items[idx];
  const activeTina = services?.items?.[idx];
  const sectionTitle = (tField(services as any, "title", locale) || "").trim();

  const ctaLabel = locale === "en" ? "Learn more" : "Conoce más";
  const prevLabel = locale === "en" ? "Previous solution" : "Solución anterior";
  const nextLabel = locale === "en" ? "Next solution" : "Solución siguiente";
  const tooltipLabel = locale === "en" ? "See more" : "Ver más";

  const subservicios = (active?.bullets || []).filter(Boolean) as {
    label?: string | null;
    url?: string | null;
  }[];

  const ActiveIcon = iconFor(active?.tabIcon);

  return (
    <section id="soluciones-panel" className="relative overflow-hidden bg-greyscale-darkest">
      {/* Glow magenta de ambiente. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[10%] top-[6%] h-[520px] w-[620px] rounded-full opacity-40 blur-[130px]"
        style={{ background: "radial-gradient(circle, #96237A 0%, transparent 70%)" }}
      />

      <div className="relative z-10 site-container py-14 md:py-20 lg:py-24">
        {sectionTitle && (
          <p
            className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-white/50 md:text-sm"
            data-tina-field={services ? tinaField(services, "title") : undefined}
          >
            [ {sectionTitle.toUpperCase()} ]
          </p>
        )}

        {/* ── Tira de píldoras de categoría ── */}
        <div className="mb-8 md:mb-10">
          <div
            ref={tabsRef}
            role="tablist"
            aria-label={sectionTitle || "Soluciones"}
            onKeyDown={onTabsKeyDown}
            className="sol-tabs relative flex gap-2.5 md:gap-3"
          >
            {/* Pill de fondo que se desliza a la píldora activa. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 rounded-full border border-brand-purple bg-brand-purple/20 sol-indicator"
              style={{
                transform: `translate3d(${indicator.x}px, 0, 0)`,
                width: `${indicator.w}px`,
                opacity: indicator.ready ? 1 : 0,
                transitionDuration: `${PARAMS.indicatorMs}ms`,
              }}
            />
            {items.map((it, i) => {
              const Icon = iconFor(it?.tabIcon);
              const isActive = i === idx;
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  id={`sol-tab-${i}`}
                  aria-selected={isActive}
                  aria-controls="sol-panel"
                  tabIndex={isActive ? 0 : -1}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  onClick={() => goTo(i)}
                  className={`relative z-10 inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border px-5 py-3 text-[14px] font-medium transition-colors md:text-[15px] ${
                    isActive
                      ? "border-transparent text-white"
                      : "border-white/[0.12] bg-white/[0.04] text-white/70 hover:border-white/25 hover:text-white"
                  }`}
                >
                  <Icon aria-hidden="true" className="text-[15px]" />
                  {tField(it as any, "title", locale)}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Panel de detalle ── */}
        {/* Wrapper `relative` HERMANO del panel: las flechas cuelgan de aquí para
            que ningún `overflow-hidden` interno las recorte (SPEC 94). */}
        <div className="relative">
          {/* Navegación circular: siempre habilitadas (de la última vuelve a la
              primera), por eso `canPrev`/`canNext` son constantes. */}
          {N > 1 && (
            <SliderSideArrows
              canPrev
              canNext
              onPrev={goPrev}
              onNext={goNext}
              labelPrev={prevLabel}
              labelNext={nextLabel}
            />
          )}
          <div
            id="sol-panel"
            role="tabpanel"
            aria-labelledby={`sol-tab-${idx}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ touchAction: "pan-y" }}
            className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:p-10 lg:p-12"
          >
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
              {/* Columna izquierda (crossfade + slide direccional al cambiar). */}
              <div
                key={`txt-${idx}`}
                className="sol-enter"
                style={{
                  ["--sol-dx" as any]: `${dir >= 0 ? PARAMS.slideX : -PARAMS.slideX}px`,
                  ["--sol-ms" as any]: `${PARAMS.textMs}ms`,
                }}
              >
                <h2
                  className="text-[28px] font-semibold leading-[1.1] text-white md:text-[42px]"
                  data-tina-field={activeTina ? tinaField(activeTina, "title") : undefined}
                >
                  {tField(active as any, "title", locale)}
                </h2>

                {active?.description && (
                  <p
                    className="mt-3 text-[16px] font-medium leading-snug text-brand-purple-light md:text-[18px]"
                    data-tina-field={activeTina ? tinaField(activeTina, "description") : undefined}
                  >
                    {tField(active as any, "description", locale)}
                  </p>
                )}

                {active?.body && (
                  <p
                    className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-white/65 md:text-[16px]"
                    data-tina-field={activeTina ? tinaField(activeTina, "body") : undefined}
                  >
                    {tField(active as any, "body", locale)}
                  </p>
                )}

                {/* Checklist de subservicios (2 columnas en lg+). */}
                {subservicios.length > 0 && (
                  <ul className="sol-stagger mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    {subservicios.map((sub, i) => {
                      const label = tField(sub as any, "label", locale);
                      const href = sub?.url ? withBase(sub.url) : null;
                      const inner = (
                        <span className="flex items-start gap-3">
                          <span
                            aria-hidden="true"
                            className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-purple/25 text-[10px] text-brand-purple-light"
                          >
                            <FaCheck />
                          </span>
                          <span className="text-[15px] leading-snug text-white/85">{label}</span>
                        </span>
                      );
                      return (
                        <li
                          key={i}
                          className="sol-row"
                          style={{ animationDelay: `${i * PARAMS.rowStaggerMs}ms` }}
                        >
                          {href ? (
                            <a
                              href={href}
                              className="group block outline-none focus-visible:underline"
                              onMouseEnter={handleTipEnter}
                              onMouseMove={handleTipMove}
                              onMouseLeave={handleTipLeave}
                            >
                              {inner}
                            </a>
                          ) : (
                            <div className="cursor-default">{inner}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {active?.url && (
                  <a
                    href={withBase(active.url)}
                    className={buttonClass("primary", "mt-8")}
                    data-tina-field={activeTina ? tinaField(activeTina, "url") : undefined}
                  >
                    {ctaLabel}
                  </a>
                )}
              </div>

              {/* Columna derecha: card visual (entra con escala + blur, flota y
                  hace tilt 3D con el cursor). */}
              <div
                className="sol-float relative"
                style={{ ["--sol-float-ms" as any]: `${PARAMS.floatMs}ms`, ["--sol-float-px" as any]: `${PARAMS.floatPx}px` }}
                onPointerMove={onCardMove}
                onPointerLeave={onCardLeave}
              >
                <div ref={tiltRef} className="sol-tilt">
                  <div
                    key={`card-${idx}`}
                    className="sol-card relative flex aspect-[4/5] max-h-[520px] w-full flex-col justify-between overflow-hidden rounded-[24px] p-7 md:p-9"
                    style={{
                      background:
                        "linear-gradient(150deg, #96237A 0%, #650F50 45%, #3B0E30 100%)",
                      ["--sol-card-ms" as any]: `${PARAMS.cardMs}ms`,
                      ["--sol-card-scale" as any]: String(PARAMS.cardScaleFrom),
                      ["--sol-card-blur" as any]: `${PARAMS.cardBlurPx}px`,
                    }}
                  >
                    {/* Capas de cuadrados rotados. */}
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                      {[0, 1, 2, 3].map((k) => (
                        <div
                          key={k}
                          className="absolute left-1/2 top-1/2 rounded-[26%] border border-white/10 bg-white/[0.06]"
                          style={{
                            width: `${52 + k * 9}%`,
                            aspectRatio: "1",
                            transform: `translate(-50%, -50%) rotate(${k * 13 - 20}deg)`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Ícono grande. */}
                    <div className="relative flex flex-1 items-center justify-center">
                      <div className="flex h-[104px] w-[104px] items-center justify-center rounded-[26px] bg-white/90 text-[42px] text-brand-purple-darkest shadow-[0_18px_50px_-12px_rgba(0,0,0,0.55)] md:h-[124px] md:w-[124px] md:text-[50px]">
                        <ActiveIcon aria-hidden="true" />
                      </div>
                    </div>

                    {/* Pie: eyebrow mono + nombre. */}
                    <div className="relative text-center">
                      {active?.eyebrow && (
                        <p
                          className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/70 md:text-xs"
                          data-tina-field={activeTina ? tinaField(activeTina, "eyebrow") : undefined}
                        >
                          {tField(active as any, "eyebrow", locale)}
                        </p>
                      )}
                      <p className="mt-2 text-[22px] font-semibold text-white md:text-[26px]">
                        {tField(active as any, "title", locale)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip "Ver más" flotante (sigue al cursor con lag). */}
      <div
        ref={tooltipRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[90] will-change-transform"
        style={{ transform: "translate3d(-200px, -200px, 0)" }}
      >
        <div
          className={`-translate-x-1/2 -translate-y-1/2 rounded-[8px] bg-white/95 px-3.5 py-1.5 text-[13px] font-medium text-[#3B0E30] shadow-lg transition-opacity duration-200 ${
            tooltipOn ? "opacity-100" : "opacity-0"
          }`}
        >
          <span aria-hidden="true" className="mr-1">↵</span>
          {tooltipLabel}
        </div>
      </div>

      <style>{`
        .sol-indicator {
          transition-property: transform, width, opacity;
          transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes sol-enter-in {
          from { opacity: 0; transform: translate3d(var(--sol-dx, 30px), 0, 0); }
          to   { opacity: 1; transform: none; }
        }
        .sol-enter {
          animation: sol-enter-in var(--sol-ms, 520ms) cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes sol-row-in {
          from { opacity: 0; transform: translate3d(var(--sol-dx, 30px), 0, 0); }
          to   { opacity: 1; transform: none; }
        }
        .sol-stagger .sol-row {
          animation: sol-row-in 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes sol-card-in {
          from {
            opacity: 0;
            transform: scale(var(--sol-card-scale, 0.94));
            filter: blur(var(--sol-card-blur, 10px));
          }
          to { opacity: 1; transform: none; filter: none; }
        }
        .sol-card {
          animation: sol-card-in var(--sol-card-ms, 640ms) cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes sol-float {
          0%, 100% { transform: translate3d(0, calc(var(--sol-float-px, 10px) * -0.5), 0); }
          50%      { transform: translate3d(0, calc(var(--sol-float-px, 10px) * 0.5), 0); }
        }
        .sol-float {
          animation: sol-float var(--sol-float-ms, 7000ms) ease-in-out infinite;
          will-change: transform;
        }
        .sol-tilt {
          transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
          transform-style: preserve-3d;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .sol-enter,
          .sol-stagger .sol-row,
          .sol-card,
          .sol-float {
            animation: none !important;
          }
          .sol-indicator { transition: none !important; }
          .sol-tilt {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}
