import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import { LuArrowRight } from "react-icons/lu";
import type { HomeQuery } from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { iconFor } from "./solucionesIcons";
import { escenaPara } from "./soluciones-escenas";
import { CSS_SOLUCIONES } from "./soluciones-escenas/base";
import AuroraRibbons from "../effects/AuroraRibbons";

/**
 * Bloque de soluciones — SPEC 108.
 *
 * Reemplaza al panel de tabs (`SolucionesPanel`, SPEC 103) por el esquema de la
 * referencia del cliente: un rail de categorías que queda fijo a la izquierda y
 * las cuatro cards apiladas pasando con el scroll. Cada card se parte por un
 * divisor vertical: a la izquierda el texto (título corto, descripción, chips
 * de subservicio y CTA) y a la derecha la escena animada de la categoría.
 *
 * La sección NO ancla el scroll: es alto natural, cuatro cards seguidas.
 */

interface Props {
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

/** Ancla de cada card: la usa el rail para llevar hasta ella. */
const cardId = (i: number) => `soluciones-cat-${i}`;

/** Chips de subservicio por card. La referencia muestra cuatro; el listado
    completo vive en la página de la categoría, detrás de "Conoce más". */
const MAX_CHIPS = 4;

/** Grano encima del fondo: rompe el banding del degradado y da la textura de
    la referencia. Es un ruido SVG tileado, no una imagen que haya que cargar. */
const GRANO =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

const CHIP_CLASS =
  "inline-flex items-center rounded-lg border border-white/[0.07] bg-[#151315] px-4 py-2.5 text-[14px] leading-[1.3] text-white/85 transition-colors";

export default function SolucionesStackReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: Props) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });

  const services = data?.home?.services || initialData?.home?.services;
  const items = (services?.items || []).filter(Boolean) as NonNullable<
    NonNullable<typeof services>["items"]
  >;
  const N = items.length;

  const [activeIndex, setActiveIndex] = useState(0);
  /* Qué escenas están en pantalla: las de fuera quedan pausadas para no gastar
     CPU en cuatro animaciones que nadie ve. */
  const [enPantalla, setEnPantalla] = useState<boolean[]>([]);
  /* Sin WebGL2 el fondo cae a un glow CSS: la sección se ve igual de oscura y
     morada, sólo que quieta. */
  const [sinWebgl, setSinWebgl] = useState(false);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  /* ── Tooltip "Ver más" con delay + lag (portado de SPEC 89/103) ──
     Solo en punteros finos: en táctil no hay hover que lo dispare y quedaría
     colgado tras un tap. */
  const finePointer = useRef(false);
  const reduceMotion = useRef(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tipTarget = useRef({ x: 0, y: 0 });
  const tipPos = useRef({ x: 0, y: 0 });
  const tipRaf = useRef<number | null>(null);
  const tipDelay = useRef<number | null>(null);
  const [tooltipOn, setTooltipOn] = useState(false);

  useEffect(() => {
    finePointer.current = window.matchMedia?.("(pointer: fine)").matches ?? false;
    reduceMotion.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    return () => {
      if (tipRaf.current != null) cancelAnimationFrame(tipRaf.current);
      if (tipDelay.current != null) clearTimeout(tipDelay.current);
    };
  }, []);

  const placeTip = () => {
    const el = tooltipRef.current;
    if (el) el.style.transform = `translate3d(${tipTarget.current.x}px, ${tipTarget.current.y}px, 0)`;
  };

  const runTipLoop = () => {
    const k = 0.06; // menor = más lag
    tipPos.current.x += (tipTarget.current.x - tipPos.current.x) * k;
    tipPos.current.y += (tipTarget.current.y - tipPos.current.y) * k;
    const el = tooltipRef.current;
    if (el) el.style.transform = `translate3d(${tipPos.current.x}px, ${tipPos.current.y}px, 0)`;
    tipRaf.current = requestAnimationFrame(runTipLoop);
  };

  const handleTipEnter = (e: ReactMouseEvent) => {
    if (!finePointer.current) return;
    tipTarget.current = { x: e.clientX, y: e.clientY };
    tipPos.current = { ...tipTarget.current };
    if (tipDelay.current != null) clearTimeout(tipDelay.current);
    tipDelay.current = window.setTimeout(() => {
      setTooltipOn(true);
      if (reduceMotion.current) placeTip();
      else if (tipRaf.current == null) tipRaf.current = requestAnimationFrame(runTipLoop);
    }, 140);
  };
  const handleTipMove = (e: ReactMouseEvent) => {
    if (!finePointer.current) return;
    tipTarget.current = { x: e.clientX, y: e.clientY };
    if (reduceMotion.current && tooltipOn) placeTip();
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

  /* ── Categoría activa ──
     La card que ocupa la banda central del viewport manda: con el margen
     recortado al 45% arriba y abajo, en cada momento hay una sola candidata y
     el rail no parpadea entre dos. */
  useEffect(() => {
    if (N === 0) return;
    const nodes = cardRefs.current.filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const i = nodes.indexOf(entry.target as HTMLElement);
          if (i >= 0) setActiveIndex(i);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    /* Segundo observador, con margen generoso: enciende la escena un poco antes
       de que la card entre y la apaga al salir. Va aparte del de la categoría
       activa porque ese recorta el viewport al 45% y aquí hace falta lo
       contrario. */
    const ioEscenas = new IntersectionObserver(
      (entries) => {
        setEnPantalla((prev) => {
          const next = [...prev];
          entries.forEach((entry) => {
            const i = nodes.indexOf(entry.target as HTMLElement);
            if (i >= 0) next[i] = entry.isIntersecting;
          });
          return next;
        });
      },
      { rootMargin: "200px 0px", threshold: 0 },
    );

    nodes.forEach((n) => {
      io.observe(n);
      ioEscenas.observe(n);
    });
    return () => {
      io.disconnect();
      ioEscenas.disconnect();
    };
  }, [N]);

  /** Lleva a una card con el scroll suave del sitio (Lenis), si está. */
  const goTo = (i: number) => (e: React.MouseEvent) => {
    const target = cardRefs.current[i];
    if (!target) return;
    e.preventDefault();
    const lenis = (window as any).__lenis;
    if (lenis?.scrollTo) lenis.scrollTo(target, { offset: -100 });
    else target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (N === 0) return null;

  const sectionTitle = (tField(services as any, "title", locale) || "").trim();

  /** Nombre corto de la categoría: el del chip si el cliente lo cargó. */
  const shortLabel = (it: any) =>
    (tField(it, "tabLabel", locale) || "").trim() || (tField(it, "title", locale) || "").trim();

  return (
    <section
      id="soluciones-stack"
      className="relative overflow-hidden bg-greyscale-darkest scroll-mt-24"
    >
      {/* ── Fondo ── */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        {sinWebgl ? (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 8% 88%, rgba(150,35,122,0.42) 0%, rgba(101,15,80,0.16) 38%, transparent 68%)",
            }}
          />
        ) : (
          <AuroraRibbons onUnsupported={() => setSinWebgl(true)} />
        )}
        {/* Velo de legibilidad: el texto va sobre el fondo, no al revés. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.62) 22%, rgba(10,10,10,0.62) 78%, rgba(10,10,10,0.94) 100%)",
          }}
        />
        {/* Grano. */}
        <div
          className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
          style={{ backgroundImage: GRANO, backgroundSize: "160px 160px" }}
        />
      </div>

      <div className="container-xl relative z-10 py-20 md:py-28 lg:py-32">
        {/* Encabezado. */}
        <header data-reveal="up" data-reveal-stagger="0.1">
          <p className="font-mono text-[12px] uppercase tracking-[0.35em] text-white/45">
            {t("sol.eyebrow", locale)}
          </p>
          <h2
            className="mt-5 heading-xl text-white"
            data-tina-field={tinaField(services as any, "title")}
          >
            {sectionTitle}
          </h2>
        </header>

        <div className="mt-12 lg:mt-16 lg:grid lg:grid-cols-[minmax(0,266px)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
          {/* Rail de categorías (desktop). */}
          <nav className="hidden lg:block" aria-label={t("sol.rail.aria", locale)}>
            <ul className="sticky top-28">
              {items.map((it, i) => {
                const Icon = iconFor(it?.tabIcon);
                const on = i === activeIndex;
                return (
                  <li key={i}>
                    <a
                      href={`#${cardId(i)}`}
                      onClick={goTo(i)}
                      aria-current={on ? "true" : undefined}
                      className="group flex items-center gap-3 py-4 transition-opacity duration-300"
                      style={{ opacity: on ? 1 : 0.35 }}
                    >
                      <Icon
                        className="h-[18px] w-[18px] shrink-0 transition-colors duration-300"
                        style={{ color: on ? "#c65fac" : "#96237A" }}
                        strokeWidth={2}
                      />
                      <span className="text-[15px] leading-snug text-white">
                        {shortLabel(it)}
                      </span>
                    </a>
                    <span
                      aria-hidden="true"
                      className="block h-px w-full transition-colors duration-300"
                      style={{
                        background: on ? "rgba(198,95,172,0.45)" : "rgba(255,255,255,0.08)",
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Cards apiladas. */}
          <div className="flex flex-col gap-8 md:gap-12 lg:gap-16">
            {items.map((it, i) => (
              <article
                key={i}
                id={cardId(i)}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                data-reveal="up"
                className="scroll-mt-28 border border-white/[0.08] bg-black/25"
              >
                <div className="grid md:grid-cols-2">
                  {/* Texto. */}
                  <div className="flex min-h-[300px] flex-col justify-center gap-5 p-7 md:min-h-[440px] md:p-10 lg:p-12">
                    <h3
                      className="text-[30px] font-semibold leading-[1.15] text-white md:text-[36px]"
                      data-tina-field={tinaField(it as any, "title")}
                    >
                      {shortLabel(it)}
                    </h3>
                    <p
                      className="max-w-[34ch] text-[15px] leading-relaxed text-white/60 md:text-[16px]"
                      data-tina-field={tinaField(it as any, "description")}
                    >
                      {tField(it as any, "description", locale)}
                    </p>

                    {/* Subservicios: los primeros cuatro. */}
                    <ul className="mt-2 flex flex-wrap gap-2.5">
                      {(it?.bullets || [])
                        .filter(Boolean)
                        .slice(0, MAX_CHIPS)
                        .map((b: any, j: number) => {
                          const label = tField(b, "label", locale);
                          if (!label) return null;
                          return (
                            <li key={j}>
                              {b?.url ? (
                                <a
                                  href={withBase(b.url)}
                                  className={`${CHIP_CLASS} hover:border-brand-purple/60 hover:bg-[#1c1220]`}
                                  onMouseEnter={handleTipEnter}
                                  onMouseMove={handleTipMove}
                                  onMouseLeave={handleTipLeave}
                                >
                                  {label}
                                </a>
                              ) : (
                                <span className={`${CHIP_CLASS} cursor-default`}>{label}</span>
                              )}
                            </li>
                          );
                        })}
                    </ul>

                    {/* CTA a la página de la categoría. */}
                    {it?.url ? (
                      <a
                        href={withBase(it.url)}
                        className="group mt-3 inline-flex items-center gap-3 text-[15px] font-semibold text-brand-purple-light transition-colors hover:text-white"
                      >
                        {t("sol.cta", locale)}
                        <LuArrowRight
                          className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1.5"
                          strokeWidth={2}
                        />
                      </a>
                    ) : null}
                  </div>

                  {/* Escena animada de la categoría. */}
                  <div className="relative flex items-center justify-center border-white/[0.08] p-7 md:border-l md:p-10 lg:p-12">
                    {(() => {
                      const Escena = escenaPara(it?.tabIcon, i);
                      return (
                        <div className="w-full max-w-[400px]">
                          <Escena activo={!!enPantalla[i]} locale={locale} />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Animaciones de las escenas: van aquí porque `global.css` no se
          empaqueta en este repo (mismo motivo que en Beneficios). */}
      <style dangerouslySetInnerHTML={{ __html: CSS_SOLUCIONES }} />

      {/* Tooltip "Ver más": sigue al cursor con retraso. */}
      <div
        ref={tooltipRef}
        aria-hidden="true"
        className={`pointer-events-none fixed left-0 top-0 z-[70] hidden select-none rounded-full border border-white/10 bg-[#1c1220]/90 px-4 py-1.5 text-[12px] text-white/90 backdrop-blur-sm transition-opacity duration-200 lg:block ${
          tooltipOn ? "opacity-100" : "opacity-0"
        }`}
        style={{ marginLeft: 16, marginTop: 14 }}
      >
        {t("sol.vermas", locale)}
      </div>
    </section>
  );
}
