import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery } from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";

/* ── Props ── */
interface SolucionesScrollProps {
  query: string;
  variables: { relativePath: string };
  data: HomeQuery;
  locale?: Locale;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/* Prefixes an internal path with BASE_URL so it resolves under a subpath deploy. */
function withBase(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

/* A two-digit index label ("01", "02"…). */
const pad2 = (n: number) => String(n + 1).padStart(2, "0");

/* Alto de scroll (en viewports) por categoría. Más recorrido ⇒ más suave. */
const VH_PER_CATEGORY = 1.15;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function SolucionesScrollReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: SolucionesScrollProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });

  const services = data?.home?.services || initialData?.home?.services;
  const items = (services?.items || []).filter(Boolean) as NonNullable<
    NonNullable<typeof services>["items"]
  >;

  const [activeIndex, setActiveIndex] = useState(0);
  const N = items.length;

  /* Refs de elementos que animo de forma CONTINUA por rAF (sin re-render). */
  const trackRef = useRef<HTMLElement | null>(null);
  const bgNumRef = useRef<HTMLDivElement | null>(null); // número gigante de fondo (parallax)
  const glowRef = useRef<HTMLDivElement | null>(null); // glow reactivo
  const railFillRef = useRef<HTMLDivElement | null>(null); // relleno del riel de progreso
  const fgRef = useRef<HTMLDivElement | null>(null); // contenido izq (título/descr/botón): envelope
  const listRef = useRef<HTMLUListElement | null>(null); // lista derecha: envelope
  const reduceRef = useRef(false);
  const snapTimer = useRef<number | null>(null);

  /* ── Motor scroll: progreso continuo → dirige todo por refs ──
     progress ∈ [0,1] sobre el track. cont = progress·(N-1) es la posición
     continua; el índice activo es round(cont) y `frac` (distancia al centro de
     la categoría) maneja el crossfade direccional (envelope). Se escribe estilo
     directo en los nodos (no re-render por frame). rAF-throttled, no bloquea el
     scroll nativo (compatible con Lenis). */
  useEffect(() => {
    if (N <= 1) return;
    const track = trackRef.current;
    if (!track) return;

    let ticking = false;
    const apply = () => {
      ticking = false;
      const total = track.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const scrolled = -track.getBoundingClientRect().top;
      const progress = clamp(scrolled / total, 0, 1);
      const cont = progress * (N - 1);
      const idx = clamp(Math.round(cont), 0, N - 1);
      const frac = cont - idx; // [-0.5, 0.5]
      const envelope = 1 - Math.min(1, Math.abs(frac) * 2); // 1 centro → 0 borde
      const reduce = reduceRef.current;

      // Número gigante de fondo: parallax vertical continuo.
      if (bgNumRef.current) {
        bgNumRef.current.style.transform = `translate3d(0, ${(-progress * 140).toFixed(1)}px, 0)`;
      }
      // Glow: sube y crece con el progreso.
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(0, ${(progress * 180).toFixed(1)}px, 0) scale(${(1 + progress * 0.18).toFixed(3)})`;
      }
      // Riel de progreso: relleno continuo.
      if (railFillRef.current) {
        railFillRef.current.style.transform = `scaleY(${progress.toFixed(4)})`;
      }
      // Envelope direccional del contenido (crossfade + slide con el scroll).
      const slide = reduce ? 0 : (-frac * 34).toFixed(1);
      const op = reduce ? 1 : envelope.toFixed(3);
      if (fgRef.current) {
        fgRef.current.style.opacity = String(op);
        fgRef.current.style.transform = `translate3d(0, ${slide}px, 0)`;
      }
      if (listRef.current) {
        listRef.current.style.opacity = String(op);
        listRef.current.style.transform = `translate3d(0, ${slide}px, 0)`;
      }

      setActiveIndex((prev) => (prev === idx ? prev : idx));
    };
    const onScroll = () => {
      scheduleSnap();
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    /* ── Snap suave por proximidad ──
       Al quedar quieto el scroll, si estamos entre categorías, encajamos en la
       más cercana usando Lenis (sin pelear con el smooth-scroll global). */
    const scheduleSnap = () => {
      if (snapTimer.current != null) window.clearTimeout(snapTimer.current);
      snapTimer.current = window.setTimeout(runSnap, 160);
    };
    const runSnap = () => {
      const total = track.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const rectTop = track.getBoundingClientRect().top;
      const scrolled = -rectTop;
      const progress = clamp(scrolled / total, 0, 1);
      if (progress <= 0.001 || progress >= 0.999) return; // libre en los extremos
      const cont = progress * (N - 1);
      const idx = clamp(Math.round(cont), 0, N - 1);
      const frac = cont - idx;
      if (Math.abs(frac) < 0.04) return; // ya está prácticamente encajado
      const trackTopAbs = rectTop + window.scrollY;
      const targetProgress = idx / (N - 1);
      const targetY = Math.round(trackTopAbs + targetProgress * total);
      const lenis = (window as any).__lenis;
      if (lenis?.scrollTo) lenis.scrollTo(targetY, { duration: 0.5 });
      else window.scrollTo({ top: targetY, behavior: "smooth" });
    };

    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (snapTimer.current != null) window.clearTimeout(snapTimer.current);
    };
  }, [N]);

  /* ── Tooltip "Ver más" con delay + lag ── */
  const finePointer = useRef(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const delayRef = useRef<number | null>(null);
  const [tooltipOn, setTooltipOn] = useState(false);

  useEffect(() => {
    finePointer.current =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches;
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (delayRef.current != null) clearTimeout(delayRef.current);
    };
  }, []);

  const runLoop = () => {
    const k = 0.12; // menor = más lag
    pos.current.x += (target.current.x - pos.current.x) * k;
    pos.current.y += (target.current.y - pos.current.y) * k;
    const el = tooltipRef.current;
    if (el) el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
    rafRef.current = requestAnimationFrame(runLoop);
  };

  const handleListEnter = (e: ReactMouseEvent) => {
    if (!finePointer.current) return;
    target.current = { x: e.clientX, y: e.clientY };
    pos.current = { ...target.current };
    if (delayRef.current != null) clearTimeout(delayRef.current);
    delayRef.current = window.setTimeout(() => {
      setTooltipOn(true);
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(runLoop);
    }, 140);
  };
  const handleListMove = (e: ReactMouseEvent) => {
    if (!finePointer.current) return;
    target.current = { x: e.clientX, y: e.clientY };
  };
  const handleListLeave = () => {
    if (delayRef.current != null) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    setTooltipOn(false);
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const tooltipLabel = locale === "en" ? "See more" : "Ver más";

  if (items.length === 0) return null;
  const active = items[Math.min(activeIndex, N - 1)];
  const activeTina = services?.items?.[Math.min(activeIndex, N - 1)];
  const sectionTitle = (tField(services as any, "title", locale) || "").trim();

  const subservicios = (active?.bullets || []).filter(Boolean) as {
    label?: string | null;
    label_en?: string | null;
    url?: string | null;
  }[];

  const ctaLabel = locale === "en" ? "Learn more" : "Conoce más";

  /* Transición CSS del odómetro (número) — rueda por categoría, alineado. */
  const numTransition =
    "transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none";

  return (
    <section
      ref={trackRef}
      id="soluciones-scroll"
      className="relative bg-greyscale-darkest"
      style={{ height: `${N * VH_PER_CATEGORY * 100}svh` }}
    >
      <div className="sticky top-0 flex min-h-[100svh] items-center overflow-hidden">
        {/* Glow magenta reactivo. */}
        <div
          ref={glowRef}
          aria-hidden="true"
          className="pointer-events-none absolute -top-[14%] -left-[8%] z-0 h-[560px] w-[680px] rounded-full opacity-40 blur-[130px] will-change-transform"
          style={{ background: "radial-gradient(circle, #96237A 0%, transparent 70%)" }}
        />

        {/* Número gigante de fondo (protagonista + parallax). Rueda su valor con
            el odómetro y deriva de forma continua con el scroll. */}
        <div
          ref={bgNumRef}
          aria-hidden="true"
          className="pointer-events-none absolute right-[2%] top-1/2 z-0 -translate-y-1/2 select-none will-change-transform"
        >
          <div
            className="relative overflow-hidden font-semibold leading-none text-white/[0.05]"
            style={{ height: "1em", fontSize: "min(42vw, 640px)" }}
          >
            <div
              className={numTransition}
              style={{ transform: `translateY(-${activeIndex}em)` }}
            >
              {items.map((it, i) => (
                <div key={i} style={{ height: "1em", lineHeight: 1 }}>
                  {it?.number}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full site-container py-10 md:py-20 lg:flex lg:items-center lg:gap-14">
          {/* Riel de progreso vertical (desktop). */}
          <div
            aria-hidden="true"
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 h-[320px] items-stretch"
          >
            <div className="relative w-px bg-white/12">
              <div
                ref={railFillRef}
                className="absolute inset-x-0 top-0 h-full origin-top bg-gradient-to-b from-brand-purple to-white/70 will-change-transform"
                style={{ transform: "scaleY(0)" }}
              />
              {items.map((_, i) => {
                const on = i <= activeIndex;
                return (
                  <span
                    key={i}
                    className={`absolute -left-[3px] h-[7px] w-[7px] -translate-y-1/2 rounded-full transition-colors duration-500 ${
                      on ? "bg-white" : "bg-white/25"
                    }`}
                    style={{ top: `${(i / (N - 1)) * 100}%` }}
                  />
                );
              })}
            </div>
          </div>

          {/* ── Columna izquierda ── */}
          <div className="lg:w-[42%] lg:shrink-0 lg:pl-10">
            {sectionTitle && (
              <p
                className="mb-6 font-mono text-[13px] uppercase tracking-[0.2em] text-white/45"
                data-tina-field={services ? tinaField(services, "title") : undefined}
              >
                [ {sectionTitle.toUpperCase()} ]
              </p>
            )}

            {/* Número crisp en flujo (odómetro, rueda alineado con el título). */}
            <div
              aria-hidden="true"
              className="relative overflow-hidden text-[52px] md:text-[92px] font-semibold leading-none text-white"
              style={{ height: "1em" }}
            >
              <div className={numTransition} style={{ transform: `translateY(-${activeIndex}em)` }}>
                {items.map((it, i) => (
                  <div key={i} style={{ height: "1em", lineHeight: 1 }}>
                    {it?.number}
                  </div>
                ))}
              </div>
            </div>

            {/* Bloque con envelope (opacidad/slide continuos por scroll). */}
            <div ref={fgRef} className="will-change-transform">
              <h2
                className="mt-3 md:mt-4 text-[26px] md:text-[44px] leading-[1.1] font-semibold text-white max-w-[14ch]"
                data-tina-field={activeTina ? tinaField(activeTina, "title") : undefined}
              >
                {tField(active as any, "title", locale)}
              </h2>

              {active?.description && (
                <p
                  className="mt-3 md:mt-5 text-[15px] md:text-[18px] leading-relaxed text-white/60 max-w-[34ch]"
                  data-tina-field={activeTina ? tinaField(activeTina, "description") : undefined}
                >
                  {tField(active as any, "description", locale)}
                </p>
              )}

              {active?.url && (
                <a
                  href={withBase(active.url)}
                  className="mt-6 md:mt-9 inline-flex items-center rounded-full border border-white/50 px-6 md:px-7 py-2.5 md:py-3 text-[15px] md:text-[16px] font-medium text-white transition-colors hover:bg-white hover:text-[#3B0E30]"
                  data-tina-field={activeTina ? tinaField(activeTina, "url") : undefined}
                >
                  {ctaLabel}
                </a>
              )}
            </div>
          </div>

          {/* ── Columna derecha: subservicios ── */}
          <div
            className="lg:flex-1 lg:min-w-0 mt-7 lg:mt-0"
            onMouseEnter={handleListEnter}
            onMouseMove={handleListMove}
            onMouseLeave={handleListLeave}
          >
            <ul
              ref={listRef}
              className="border-t border-white/12 will-change-transform sol-stagger"
            >
              {subservicios.map((sub, i) => {
                const label = tField(sub as any, "label", locale);
                const href = sub?.url ? withBase(sub.url) : null;
                const rowInner = (
                  <div className="flex items-center gap-6 py-3.5 md:py-6">
                    <span className="font-mono text-[13px] tabular-nums text-white/35 transition-colors group-hover:text-white/70">
                      {pad2(i)}
                    </span>
                    <span className="ml-auto text-right text-[17px] md:text-[19px] text-white/85 transition-colors group-hover:text-white">
                      {label}
                    </span>
                  </div>
                );
                return (
                  <li
                    key={`${activeIndex}-${i}`}
                    className="sol-row border-b border-white/12"
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
                    {href ? (
                      <a href={href} className="group block outline-none focus-visible:text-white">
                        {rowInner}
                      </a>
                    ) : (
                      <div className="cursor-default">{rowInner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Tooltip "Ver más" flotante. */}
      <div
        ref={tooltipRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[90] will-change-transform"
        style={{ transform: "translate3d(-200px, -200px, 0)" }}
      >
        <div
          className={`-translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 px-3.5 py-1.5 text-[13px] font-medium text-[#3B0E30] shadow-lg transition-opacity duration-200 ${
            tooltipOn ? "opacity-100" : "opacity-0"
          }`}
        >
          <span aria-hidden="true" className="mr-1">↵</span>
          {tooltipLabel}
        </div>
      </div>

      <style>{`
        @keyframes sol-row-in {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: none; }
        }
        .sol-stagger .sol-row { animation: sol-row-in 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .sol-stagger .sol-row { animation: none; }
        }
      `}</style>
    </section>
  );
}
