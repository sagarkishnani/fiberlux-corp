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
  FaArrowRight,
} from "react-icons/fa6";
import type { IconType } from "react-icons";
import type { HomeQuery } from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import SliderSideArrows from "./SliderSideArrows";

/**
 * Panel de soluciones — SPEC 103.
 *
 * Chips de categoría (tabs) + panel de detalle presentado como un **stack de
 * tarjetas** (las siguientes soluciones asoman detrás): a la izquierda título,
 * descripción, subservicios como chips y CTA tipo link; a la derecha la mitad a
 * sangre con el ícono de la categoría sobre degradado magenta. Se navega por
 * chips, flechas laterales (SPEC 94) y arrastre. Sección de alto normal: a
 * diferencia de `SolucionesScrollReact` (SPEC 89) NO ancla el scroll.
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
  /** Retardo acumulado por chip de subservicio, en ms. */
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

  /* Trae el tab activo a la vista cuando la tira scrollea (mobile).
     Se mueve el scroll horizontal de la tira a mano (no `scrollIntoView`, que
     también movería el scroll vertical de la página). */
  const stripWrapRef = useRef<HTMLDivElement | null>(null);
  const firstTabRun = useRef(true);
  useEffect(() => {
    if (firstTabRun.current) {
      firstTabRun.current = false;
      return;
    }
    const wrap = stripWrapRef.current;
    const el = tabRefs.current[Math.min(activeIndex, N - 1)];
    if (!wrap || !el || wrap.scrollWidth <= wrap.clientWidth) return;
    const left = el.offsetLeft - (wrap.clientWidth - el.offsetWidth) / 2;
    wrap.scrollTo({ left: Math.max(0, left), behavior: reduceMotion ? "auto" : "smooth" });
  }, [activeIndex, N, reduceMotion]);

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

  const eyebrowLabel = locale === "en" ? "SOLUTIONS" : "SOLUCIONES";
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
        className="pointer-events-none absolute -left-[10%] top-[4%] h-[520px] w-[620px] rounded-full opacity-40 blur-[130px]"
        style={{ background: "radial-gradient(circle, #96237A 0%, transparent 70%)" }}
      />

      <div className="relative z-10 site-container py-14 md:py-20 lg:py-24">
        {/* ── Encabezado ── */}
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/45 md:text-sm">
          [ {eyebrowLabel} ]
        </p>
        {sectionTitle && (
          <h2
            className="mt-3 text-[30px] font-semibold leading-[1.12] text-white md:text-[44px]"
            data-tina-field={services ? tinaField(services, "title") : undefined}
          >
            {sectionTitle}
          </h2>
        )}

        {/* ── Chips de categoría ── */}
        <div
          ref={stripWrapRef}
          className="sol-tabs-wrap -mx-4 mb-7 mt-7 overflow-x-auto px-4 pb-1 md:mx-0 md:mb-9 md:mt-9 md:px-0"
        >
          <div
            ref={tabsRef}
            role="tablist"
            aria-label={sectionTitle || eyebrowLabel}
            onKeyDown={onTabsKeyDown}
            className="sol-tabs relative flex w-max gap-2.5 md:w-auto md:flex-wrap"
          >
            {/* Chip de fondo que se desliza al activo. */}
            <div
              aria-hidden="true"
              className="sol-indicator pointer-events-none absolute inset-y-0 left-0 rounded-full border border-brand-purple bg-brand-purple/[0.14]"
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
              // Nombre corto del chip si el cliente lo cargó; si no, el título.
              const chipLabel =
                (tField(it as any, "tabLabel", locale) || "").trim() ||
                tField(it as any, "title", locale);
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
                  className={`relative z-10 inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] font-medium transition-colors md:text-[14px] ${
                    isActive
                      ? "border-transparent text-white"
                      : "border-white/[0.1] bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/85"
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    className={`text-[14px] ${isActive ? "text-brand-purple" : "text-white/40"}`}
                  />
                  {chipLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Panel: stack de tarjetas ──
            Wrapper `relative` HERMANO del panel: de él cuelgan las flechas
            laterales (SPEC 94) y las capas del stack, que asoman por la derecha. */}
        <div className="relative">
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

          {/* Capas del stack (las siguientes soluciones asomando detrás). */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-y-[9px] left-16 right-[-14px] rounded-[22px] border border-white/[0.08] bg-[#4A0F3C]" />
            <div className="absolute inset-y-[18px] left-24 right-[-28px] rounded-[22px] border border-white/[0.05] bg-[#310A28]" />
          </div>

          <div
            id="sol-panel"
            role="tabpanel"
            aria-labelledby={`sol-tab-${idx}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ touchAction: "pan-y" }}
            className="relative z-10 overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#130810]"
          >
            <div className="grid lg:grid-cols-2">
              {/* Columna izquierda (crossfade + slide direccional al cambiar). */}
              <div
                key={`txt-${idx}`}
                className="sol-enter order-2 p-7 md:p-10 lg:order-1 lg:p-12"
                style={{
                  ["--sol-dx" as any]: `${dir >= 0 ? PARAMS.slideX : -PARAMS.slideX}px`,
                  ["--sol-ms" as any]: `${PARAMS.textMs}ms`,
                }}
              >
                <h3
                  className="text-[24px] font-semibold leading-[1.15] text-white md:text-[32px]"
                  data-tina-field={activeTina ? tinaField(activeTina, "title") : undefined}
                >
                  {tField(active as any, "title", locale)}
                </h3>

                {active?.description && (
                  <p
                    className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-white/55"
                    data-tina-field={activeTina ? tinaField(activeTina, "description") : undefined}
                  >
                    {tField(active as any, "description", locale)}
                  </p>
                )}

                {/* Subservicios como chips. */}
                {subservicios.length > 0 && (
                  <ul className="sol-stagger mt-7 flex flex-wrap gap-2.5">
                    {subservicios.map((sub, i) => {
                      const label = tField(sub as any, "label", locale);
                      const href = sub?.url ? withBase(sub.url) : null;
                      const chip = (
                        <>
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-purple"
                          />
                          {label}
                        </>
                      );
                      const chipClass =
                        "inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3.5 py-2 text-[13px] leading-none text-white/80 transition-colors";
                      return (
                        <li
                          key={i}
                          className="sol-row"
                          style={{ animationDelay: `${i * PARAMS.rowStaggerMs}ms` }}
                        >
                          {href ? (
                            <a
                              href={href}
                              className={`${chipClass} outline-none hover:border-brand-purple hover:bg-brand-purple/10 hover:text-white focus-visible:border-brand-purple`}
                              onMouseEnter={handleTipEnter}
                              onMouseMove={handleTipMove}
                              onMouseLeave={handleTipLeave}
                            >
                              {chip}
                            </a>
                          ) : (
                            <span className={`${chipClass} cursor-default`}>{chip}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* CTA tipo link con flecha. */}
                {active?.url && (
                  <a
                    href={withBase(active.url)}
                    className="group mt-8 inline-flex items-center gap-2.5 text-[15px] font-medium text-white transition-colors hover:text-brand-purple-light"
                    data-tina-field={activeTina ? tinaField(activeTina, "url") : undefined}
                  >
                    {ctaLabel}
                    <FaArrowRight
                      aria-hidden="true"
                      className="text-[13px] transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </a>
                )}
              </div>

              {/* Columna derecha: mitad a sangre con el ícono de la categoría. */}
              <div
                key={`card-${idx}`}
                className="sol-card relative order-1 min-h-[260px] overflow-hidden lg:order-2 lg:min-h-[420px]"
                style={{
                  background: "linear-gradient(150deg, #96237A 0%, #650F50 52%, #3B0E30 100%)",
                  ["--sol-card-ms" as any]: `${PARAMS.cardMs}ms`,
                  ["--sol-card-scale" as any]: String(PARAMS.cardScaleFrom),
                  ["--sol-card-blur" as any]: `${PARAMS.cardBlurPx}px`,
                }}
              >
                <div
                  className="sol-float absolute inset-0 flex items-center justify-center"
                  style={{
                    ["--sol-float-ms" as any]: `${PARAMS.floatMs}ms`,
                    ["--sol-float-px" as any]: `${PARAMS.floatPx}px`,
                  }}
                  onPointerMove={onCardMove}
                  onPointerLeave={onCardLeave}
                >
                  <div ref={tiltRef} className="sol-tilt relative">
                    {/* Cuadrados rotados translúcidos detrás del ícono. */}
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                      {[0, 1, 2, 3].map((k) => (
                        <div
                          key={k}
                          className="absolute left-1/2 top-1/2 rounded-[30%] border border-white/15 bg-white/[0.07]"
                          style={{
                            width: `${150 + k * 26}px`,
                            height: `${150 + k * 26}px`,
                            transform: `translate(-50%, -50%) rotate(${k * 14 - 21}deg)`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Tile del ícono. */}
                    <div className="relative flex h-[108px] w-[108px] items-center justify-center rounded-[28px] bg-gradient-to-b from-white to-[#F3E4EF] text-[40px] text-brand-purple-darkest shadow-[0_18px_45px_-12px_rgba(0,0,0,0.5)] md:h-[124px] md:w-[124px] md:text-[46px]">
                      <ActiveIcon aria-hidden="true" />
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
        .sol-tabs-wrap {
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .sol-tabs-wrap::-webkit-scrollbar { display: none; }
        @media (max-width: 767px) {
          .sol-tabs-wrap {
            -webkit-mask-image: linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%);
            mask-image: linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%);
          }
        }
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
