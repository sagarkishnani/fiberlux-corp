import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import {
  LuZap,
  LuShield,
  LuCloud,
  LuSettings,
  LuUsersRound,
  LuNetwork,
  LuServer,
  LuGlobe,
  LuHeadset,
  LuDatabase,
  LuWifi,
  LuArrowRight,
} from "react-icons/lu";
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

/** Set cerrado de íconos de categoría (`tabIcon` en Tina). Trazo (outline),
    como la referencia: se usa Lucide en vez de Font Awesome sólido. */
const ICONS: Record<string, IconType> = {
  rayo: LuZap,
  escudo: LuShield,
  nube: LuCloud,
  engranaje: LuSettings,
  personas: LuUsersRound,
  red: LuNetwork,
  servidor: LuServer,
  globo: LuGlobe,
  soporte: LuHeadset,
  datos: LuDatabase,
  wifi: LuWifi,
};
const iconFor = (key?: string | null): IconType => ICONS[key || ""] || LuZap;

/** Palancas de animación del bloque (SPEC 103). */
const PARAMS = {
  /** Barrido de luz: duración del scan que revela la nueva solución. */
  scanMs: 560,
  /** Retardo del pulso del ícono (cuando el barrido llega a la mitad visual). */
  iconPulseDelayMs: 300,
  /** Retardo acumulado por chip de subservicio, en ms. */
  rowStaggerMs: 45,
  /** Indicador deslizante de la píldora activa, en ms. */
  indicatorMs: 480,
  /** Vida propia de la card visual: flotación y tilt 3D con el cursor. */
  floatMs: 7000,
  floatPx: 10,
  /** Giro máximo del tilt por eje, en grados (sutil: solo insinúa el 3D). */
  tiltMaxDeg: 2.5,
  /** Perspectiva del tilt: a mayor distancia, menos deformación. */
  tiltPerspectivePx: 1600,
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
  /* Carta que está saliendo del mazo: se mantiene montada encima mientras dura
     la animación de baraja y luego se desmonta. */
  const [leaving, setLeaving] = useState<{ idx: number; dir: number } | null>(null);
  const leaveTimer = useRef<number | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* Cambia de categoría con wrap circular (la última vuelve a la primera). */
  const goTo = useCallback(
    (next: number, direction?: number) => {
      if (N === 0) return;
      const target = ((next % N) + N) % N;
      setActiveIndex((prev) => {
        if (prev === target) return prev;
        const d = direction ?? (target > prev ? 1 : -1);
        setDir(d);
        // La carta anterior se va al mazo mientras la nueva entra.
        setLeaving({ idx: prev, dir: d });
        if (leaveTimer.current != null) window.clearTimeout(leaveTimer.current);
        leaveTimer.current = window.setTimeout(() => setLeaving(null), PARAMS.scanMs);
        return target;
      });
    },
    [N],
  );

  useEffect(
    () => () => {
      if (leaveTimer.current != null) window.clearTimeout(leaveTimer.current);
    },
    [],
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

  /* Ancho del mazo: la barra de luz se desplaza por transform (GPU), así que
     necesita el ancho en px. */
  const deckRef = useRef<HTMLDivElement | null>(null);
  const [deckW, setDeckW] = useState(0);
  useEffect(() => {
    const el = deckRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDeckW(el.offsetWidth));
    ro.observe(el);
    setDeckW(el.offsetWidth);
    return () => ro.disconnect();
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
    el.style.transform = `perspective(${PARAMS.tiltPerspectivePx}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
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
  const sectionTitle = (tField(services as any, "title", locale) || "").trim();

  const eyebrowLabel = locale === "en" ? "SOLUTIONS" : "SOLUCIONES";
  const ctaLabel = locale === "en" ? "Learn more" : "Conoce más";
  const prevLabel = locale === "en" ? "Previous solution" : "Solución anterior";
  const nextLabel = locale === "en" ? "Next solution" : "Solución siguiente";
  const tooltipLabel = locale === "en" ? "See more" : "Ver más";


  /* Una carta del mazo. `state` decide la animación: "in" (entra desde el mazo)
     o "out" (sale hacia el mazo); la saliente se pinta absoluta encima y sin
     interacción hasta que termina. */
  const renderCard = (i: number, state: "in" | "out", d: number) => {
    const it = items[i];
    const itTina = services?.items?.[i];
    const subs = (it?.bullets || []).filter(Boolean) as {
      label?: string | null;
      url?: string | null;
    }[];
    const Icon = iconFor(it?.tabIcon);
    const leavingCard = state === "out";

    return (
      <div
        key={`${state}-${i}`}
        {...(leavingCard
          ? { "aria-hidden": true as const }
          : {
              id: "sol-panel",
              role: "tabpanel",
              "aria-labelledby": `sol-tab-${i}`,
              onPointerDown,
              onPointerMove,
              onPointerUp,
              onPointerCancel: onPointerUp,
            })}
        style={{
          touchAction: "pan-y",
          background: "linear-gradient(135deg, #24101F 0%, #180B15 55%, #120810 100%)",
          ["--sol-scan-ms" as any]: `${PARAMS.scanMs}ms`,
        }}
        className={`${
          leavingCard
            ? `sol-wipe ${d >= 0 ? "is-fwd" : "is-back"} pointer-events-none absolute inset-0 z-20`
            : "relative z-10"
        } overflow-hidden rounded-[22px] border border-white/[0.08] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.85)]`}
      >
        <div className="grid lg:min-h-[620px] lg:grid-cols-[1.16fr_0.84fr]">
          {/* Columna izquierda */}
          <div className="order-2 flex flex-col justify-center p-7 md:p-10 lg:order-1 lg:p-12">
            <h3
              className="text-[24px] font-semibold leading-[1.15] text-white md:text-[32px]"
              data-tina-field={itTina ? tinaField(itTina, "title") : undefined}
            >
              {tField(it as any, "title", locale)}
            </h3>

            {it?.description && (
              <p
                className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-white/55"
                data-tina-field={itTina ? tinaField(itTina, "description") : undefined}
              >
                {tField(it as any, "description", locale)}
              </p>
            )}

            {/* Subservicios como chips. */}
            {subs.length > 0 && (
              <ul className={`mt-7 flex flex-wrap gap-3 ${leavingCard ? "" : "sol-stagger"}`}>
                {subs.map((sub, k) => {
                  const label = tField(sub as any, "label", locale);
                  const href = sub?.url ? withBase(sub.url) : null;
                  const chip = (
                    <>
                      <span
                        aria-hidden="true"
                        className="h-[6px] w-[6px] shrink-0 rounded-full bg-brand-purple-light"
                      />
                      {label}
                    </>
                  );
                  const chipClass =
                    "inline-flex items-center gap-2.5 rounded-full border border-white/[0.07] bg-[#2A1024]/70 px-5 py-2.5 text-[14px] leading-[1.35] text-white/85 transition-colors";
                  return (
                    <li
                      key={k}
                      className="sol-row"
                      style={{ animationDelay: `${k * PARAMS.rowStaggerMs}ms` }}
                    >
                      {href && !leavingCard ? (
                        <a
                          href={href}
                          className={`${chipClass} outline-none hover:border-brand-purple-light/40 hover:bg-[#3A1531]/80 hover:text-white focus-visible:border-brand-purple-light/60`}
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
            {it?.url && (
              <a
                href={withBase(it.url)}
                tabIndex={leavingCard ? -1 : undefined}
                className="group mt-9 inline-flex items-center gap-2.5 self-start text-[15px] font-medium text-brand-purple-light transition-colors hover:text-white"
                data-tina-field={itTina ? tinaField(itTina, "url") : undefined}
              >
                {ctaLabel}
                <LuArrowRight
                  aria-hidden="true"
                  className="text-[13px] transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>
            )}
          </div>

          {/* Columna derecha: mitad a sangre con el ícono de la categoría. */}
          <div
            className="relative order-1 min-h-[280px] overflow-hidden border-t border-white/[0.07] lg:order-2 lg:border-l lg:border-t-0"
            style={{
              background:
                "radial-gradient(125% 125% at 12% 0%, #A9258A 0%, #7A1A63 38%, #4A1039 68%, #320B29 100%)",
            }}
          >
            <div
              className="sol-float absolute inset-0 flex items-center justify-center"
              style={{
                ["--sol-float-ms" as any]: `${PARAMS.floatMs}ms`,
                ["--sol-float-px" as any]: `${PARAMS.floatPx}px`,
              }}
              onPointerMove={leavingCard ? undefined : onCardMove}
              onPointerLeave={leavingCard ? undefined : onCardLeave}
            >
              <div ref={leavingCard ? undefined : tiltRef} className="sol-tilt relative">
                {/* Dos cuadrados rotados translúcidos detrás del ícono. */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                  {[0, 1].map((k) => (
                    <div
                      key={k}
                      className="absolute left-1/2 top-1/2 border border-white/[0.16] bg-white/[0.06]"
                      style={{
                        width: `${200 + k * 30}px`,
                        height: `${200 + k * 30}px`,
                        borderRadius: "48px",
                        transform: `translate(-50%, -50%) rotate(${k * 22 - 14}deg)`,
                      }}
                    />
                  ))}
                </div>

                {/* Tile del ícono. */}
                <div
                  className={`${leavingCard ? "" : "sol-icon-pulse"} relative flex h-[124px] w-[124px] items-center justify-center rounded-[34px] bg-gradient-to-b from-white to-[#EFD5E8] text-[46px] text-brand-purple-darkest shadow-[0_20px_50px_-14px_rgba(0,0,0,0.55)] md:h-[150px] md:w-[150px] md:rounded-[40px] md:text-[56px]`}
                  style={{ ["--sol-pulse-delay" as any]: `${PARAMS.iconPulseDelayMs}ms` }}
                >
                  <Icon aria-hidden="true" strokeWidth={1.9} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                  className={`relative z-10 inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border px-5 py-3 text-[14px] font-medium transition-colors ${
                    isActive
                      ? "border-transparent text-white"
                      : "border-white/[0.09] bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white/90"
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    strokeWidth={2}
                    className={`text-[17px] ${
                      isActive ? "text-brand-purple-light" : "text-brand-purple/70"
                    }`}
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

          {/* Capas del stack: las siguientes soluciones asomando detrás, como
              tarjetas escalonadas a la derecha (la más lejana se pinta primero).
              Arrancan pasada la mitad del panel para no meterse bajo la columna
              de texto, y quedan casi tan altas como la tarjeta activa. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 right-0 hidden sm:block"
          >
            <div
              className="absolute inset-y-[22px] left-16 right-[-58px] rounded-[22px] border border-white/[0.05]"
              style={{ background: "linear-gradient(160deg, #4A1039 0%, #2A0A22 100%)" }}
            />
            <div
              className="absolute inset-y-[11px] left-8 right-[-30px] rounded-[22px] border border-white/[0.08]"
              style={{ background: "linear-gradient(160deg, #6B1758 0%, #340C2A 100%)" }}
            />
          </div>

          {/* Mazo: la carta activa y, mientras dura el barrido, la anterior
              recortándose detrás de la línea de luz. */}
          <div ref={deckRef} className="relative">
            {renderCard(idx, "in", dir)}
            {leaving && renderCard(leaving.idx, "out", leaving.dir)}
            {leaving && deckW > 0 && (
              <div
                aria-hidden="true"
                className={`sol-scan-bar ${leaving.dir >= 0 ? "is-fwd" : "is-back"}`}
                style={{
                  ["--sol-scan-ms" as any]: `${PARAMS.scanMs}ms`,
                  ["--sol-scan-w" as any]: `${deckW}px`,
                }}
              />
            )}
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
        /* ── Barrido de luz (scan) ──
           Una línea de luz cruza el mazo y va recortando la tarjeta anterior a
           su paso, de modo que la nueva (que está debajo, quieta) queda
           revelada detrás del barrido. is-fwd va de izquierda a derecha;
           is-back (flecha de retroceso) al revés. */
        @keyframes sol-wipe-fwd {
          from { clip-path: inset(0 0 0 0); }
          to   { clip-path: inset(0 0 0 100%); }
        }
        @keyframes sol-wipe-back {
          from { clip-path: inset(0 0 0 0); }
          to   { clip-path: inset(0 100% 0 0); }
        }
        .sol-wipe.is-fwd {
          animation: sol-wipe-fwd var(--sol-scan-ms, 560ms) cubic-bezier(0.42, 0.02, 0.35, 1) both;
        }
        .sol-wipe.is-back {
          animation: sol-wipe-back var(--sol-scan-ms, 560ms) cubic-bezier(0.42, 0.02, 0.35, 1) both;
        }

        .sol-scan-bar {
          position: absolute;
          top: -10px;
          bottom: -10px;
          left: 0;
          z-index: 30;
          width: 2px;
          pointer-events: none;
          border-radius: 2px;
          background: linear-gradient(
            to bottom,
            rgba(243, 228, 239, 0) 0%,
            #f3e4ef 14%,
            #ffffff 50%,
            #f3e4ef 86%,
            rgba(243, 228, 239, 0) 100%
          );
          box-shadow:
            0 0 22px 4px rgba(243, 228, 239, 0.85),
            0 0 60px 16px rgba(150, 35, 122, 0.8);
          will-change: transform, opacity;
        }
        /* Estela: banda magenta que arrastra la línea. */
        .sol-scan-bar::before {
          content: "";
          position: absolute;
          top: 10px;
          bottom: 10px;
          width: 140px;
          pointer-events: none;
        }
        .sol-scan-bar.is-fwd::before {
          right: 0;
          background: linear-gradient(
            90deg,
            rgba(150, 35, 122, 0) 0%,
            rgba(150, 35, 122, 0.28) 65%,
            rgba(213, 167, 202, 0.32) 100%
          );
        }
        .sol-scan-bar.is-back::before {
          left: 0;
          background: linear-gradient(
            270deg,
            rgba(150, 35, 122, 0) 0%,
            rgba(150, 35, 122, 0.28) 65%,
            rgba(213, 167, 202, 0.32) 100%
          );
        }
        @keyframes sol-scan-fwd {
          from { transform: translate3d(0, 0, 0); opacity: 0; }
          12%  { opacity: 1; }
          88%  { opacity: 1; }
          to   { transform: translate3d(var(--sol-scan-w, 100%), 0, 0); opacity: 0; }
        }
        @keyframes sol-scan-back {
          from { transform: translate3d(var(--sol-scan-w, 100%), 0, 0); opacity: 0; }
          12%  { opacity: 1; }
          88%  { opacity: 1; }
          to   { transform: translate3d(0, 0, 0); opacity: 0; }
        }
        .sol-scan-bar.is-fwd {
          animation: sol-scan-fwd var(--sol-scan-ms, 560ms) cubic-bezier(0.42, 0.02, 0.35, 1) both;
        }
        .sol-scan-bar.is-back {
          animation: sol-scan-back var(--sol-scan-ms, 560ms) cubic-bezier(0.42, 0.02, 0.35, 1) both;
        }

        /* Pulso del ícono cuando el barrido llega a la mitad visual. */
        @keyframes sol-icon-pulse {
          0%   { transform: scale(1); box-shadow: 0 20px 50px -14px rgba(0, 0, 0, 0.55); }
          45%  { transform: scale(1.055); box-shadow: 0 20px 50px -14px rgba(0, 0, 0, 0.55), 0 0 0 14px rgba(243, 228, 239, 0.14); }
          100% { transform: scale(1); box-shadow: 0 20px 50px -14px rgba(0, 0, 0, 0.55), 0 0 0 30px rgba(243, 228, 239, 0); }
        }
        .sol-icon-pulse {
          animation: sol-icon-pulse 560ms ease-out var(--sol-pulse-delay, 300ms) both;
        }

        @keyframes sol-row-in {
          from { opacity: 0; transform: translate3d(14px, 0, 0); }
          to   { opacity: 1; transform: none; }
        }
        .sol-stagger .sol-row {
          animation: sol-row-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
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
          .sol-wipe,
          .sol-scan-bar,
          .sol-icon-pulse,
          .sol-stagger .sol-row,
          .sol-float {
            animation: none !important;
          }
          .sol-wipe,
          .sol-scan-bar {
            display: none !important;
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
