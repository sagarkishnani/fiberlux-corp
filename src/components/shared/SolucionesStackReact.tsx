import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import { LuArrowRight } from "react-icons/lu";
import type { HomeQuery } from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { iconFor } from "./solucionesIcons";
import { escenaPara } from "./soluciones-escenas";
import { CSS_SOLUCIONES, TiltEscena } from "./soluciones-escenas/base";
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

/** Texto → slug: sin tildes, en minúsculas y con guiones. */
function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Anclas de las cards, en el orden en que llegan las categorías.
 *
 * Salen del último tramo de la URL de la categoría (`/soluciones/data-center`
 * → `data-center`) para que el hash que queda en la barra al usar el rail
 * se lea, en vez de un `#soluciones-cat-1`. Se calculan a partir de los campos
 * SIN traducir: así la misma card tiene la misma ancla en ES y en EN, y un
 * enlace compartido funciona en los dos idiomas.
 *
 * Si dos categorías cayeran en el mismo slug —o ninguna tuviera URL ni título—
 * se numeran, que una página no puede tener dos ids iguales.
 */
function anclas(items: any[]): string[] {
  const vistos = new Set<string>();
  return items.map((it, i) => {
    const desdeUrl = (it?.url || "")
      .split(/[?#]/)[0]
      .replace(/\/+$/, "")
      .split("/")
      .pop();
    let id =
      slugify(desdeUrl || "") || slugify(it?.tabLabel || it?.title || "") || `solucion-${i + 1}`;
    if (vistos.has(id)) id = `${id}-${i + 1}`;
    vistos.add(id);
    return id;
  });
}

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
  const alFallarWebgl = useCallback(() => setSinWebgl(true), []);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement | null>(null);
  /* Riel de avance compacto (mobile): la barra se rellena desde CSS leyendo
     `--sol-p`, así el bucle de scroll no dispara renders de React. */
  const barraRef = useRef<HTMLDivElement | null>(null);
  const [pillIndex, setPillIndex] = useState(0);
  /* El bucle sólo corre donde se usa: por debajo de `lg` no hay rail lateral y
     es donde vive el indicador. */
  const [compacto, setCompacto] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(max-width: 1023.98px)");
    if (!mq) return;
    const sync = () => setCompacto(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

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

  /* ── Avance continuo con el scroll (mobile) ──
     En vez de saltar de card en card, se mide dónde cae el centro del viewport
     entre los centros de las cards: sale un índice con decimales (2.37 = a un
     tercio de camino entre la tercera y la cuarta). Ese valor se suaviza con un
     lerp por frame — de ahí la sensación de arrastre, tipo scroll jack — y se
     publica como custom property: la barra crece sola y cada card se enciende
     según lo cerca que esté del centro. Nada de esto pasa por el estado de
     React salvo el índice redondeado que rotula la píldora. */
  useEffect(() => {
    if (N === 0 || !compacto) return;
    const section = sectionRef.current;
    if (!section) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let raf = 0;
    let suave = -1; // -1 = aún sin primer valor: engancha sin animar desde 0

    /** Índice fraccional de la card que ocupa el centro del viewport. */
    const objetivo = () => {
      const nodes = cardRefs.current.filter(Boolean) as HTMLElement[];
      if (nodes.length === 0) return 0;
      const centro = window.innerHeight / 2;
      const centros = nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      if (centro <= centros[0]) return 0;
      const ultimo = centros.length - 1;
      if (centro >= centros[ultimo]) return ultimo;
      for (let i = 0; i < ultimo; i++) {
        if (centro >= centros[i] && centro <= centros[i + 1]) {
          const tramo = Math.max(1, centros[i + 1] - centros[i]);
          return i + (centro - centros[i]) / tramo;
        }
      }
      return 0;
    };

    const frame = () => {
      const t = objetivo();
      if (suave < 0 || reduce) suave = t;
      else {
        suave += (t - suave) * 0.14;
        if (Math.abs(t - suave) < 0.001) suave = t;
      }

      // Barra: la primera card ya deja un tramo encendido, la última la llena.
      barraRef.current?.style.setProperty(
        "--sol-p",
        String(N > 1 ? Math.min(1, (suave + 1) / N) : 1),
      );

      // Cercanía de cada card al centro (1 = centrada, 0 = lejos).
      const vh = window.innerHeight;
      (cardRefs.current.filter(Boolean) as HTMLElement[]).forEach((n) => {
        const r = n.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - vh / 2);
        const cerca = Math.max(0, Math.min(1, 1 - d / (vh * 0.6)));
        n.style.setProperty("--sol-cerca", cerca.toFixed(3));
      });

      setPillIndex((prev) => {
        const idx = Math.min(N - 1, Math.max(0, Math.round(suave)));
        return prev === idx ? prev : idx;
      });

      raf = requestAnimationFrame(frame);
    };

    /* Fuera de pantalla no hay nada que animar: el bucle se apaga. */
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !raf) raf = requestAnimationFrame(frame);
        else if (!entry.isIntersecting && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { rootMargin: "150px 0px" },
    );
    io.observe(section);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      (cardRefs.current.filter(Boolean) as HTMLElement[]).forEach((n) =>
        n.style.removeProperty("--sol-cerca"),
      );
    };
  }, [N, compacto]);

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

  const ids = anclas(items as any[]);
  const sectionTitle = (tField(services as any, "title", locale) || "").trim();

  /** CTA "Conoce más" de una categoría. Se pinta en dos sitios distintos: en
      la columna de texto en desktop y al pie de la card en mobile, donde la
      escena va antes que el botón. */
  const renderCta = (it: any, className = "") =>
    it?.url ? (
      <a
        href={withBase(it.url)}
        className={`group inline-flex items-center gap-3 text-[15px] font-semibold text-brand-purple-light transition-colors hover:text-white ${className}`}
      >
        {t("sol.cta", locale)}
        <LuArrowRight
          className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1.5"
          strokeWidth={2}
        />
      </a>
    ) : null;

  /** Nombre corto de la categoría: el del chip si el cliente lo cargó. */
  const shortLabel = (it: any) =>
    (tField(it, "tabLabel", locale) || "").trim() || (tField(it, "title", locale) || "").trim();

  return (
    <section
      id="soluciones-stack"
      ref={sectionRef}
      className="relative bg-greyscale-darkest scroll-mt-24"
    >
      {/* ── Fondo ──
          La capa se queda pegada al viewport mientras la sección pasa, igual
          que en la referencia: así el shader dibuja siempre sobre un lienzo del
          tamaño de la pantalla (si se estirara a las cuatro cards, el patrón
          saldría deformado y costaría cuatro veces más píxeles).
          Ojo: nada de `overflow-hidden` en la sección — rompería tanto este
          `sticky` como el del rail. */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          {sinWebgl ? (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 90% at 8% 88%, rgba(150,35,122,0.42) 0%, rgba(101,15,80,0.16) 38%, transparent 68%)",
              }}
            />
          ) : (
            <AuroraRibbons onUnsupported={alFallarWebgl} />
          )}
          {/* Velo de legibilidad: el texto va sobre el fondo, no al revés. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,10,10,0.86) 0%, rgba(10,10,10,0.55) 30%, rgba(10,10,10,0.55) 70%, rgba(10,10,10,0.88) 100%)",
            }}
          />
          {/* Grano. */}
          <div
            className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
            style={{ backgroundImage: GRANO, backgroundSize: "160px 160px" }}
          />
        </div>
      </div>

      <div className="site-container relative z-10 py-20 md:py-28 lg:py-32">
        {/* Encabezado. */}
        <header data-reveal="up" data-reveal-stagger="0.1">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/45 md:text-sm">
            {t("sol.eyebrow", locale)}
          </p>
          <h2
            className="mt-4 text-[30px] font-medium leading-[1.12] text-white md:text-[44px]"
            data-tina-field={tinaField(services as any, "title")}
          >
            {sectionTitle}
          </h2>
        </header>

        <div className="mt-10 lg:mt-16 lg:grid lg:grid-cols-[minmax(0,266px)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
          {/* Rail de categorías (desktop). */}
          <nav className="hidden lg:block" aria-label={t("sol.rail.aria", locale)}>
            <ul className="sticky top-32">
              {items.map((it, i) => {
                const Icon = iconFor(it?.tabIcon);
                const on = i === activeIndex;
                return (
                  <li key={i}>
                    <a
                      href={`#${ids[i]}`}
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
            {/* ── Indicador de avance (mobile/tablet) ──
                En pantallas chicas el rail de categorías está oculto y las
                cuatro cards se leían como un scroll plano, sin saber por dónde
                se va. Esta píldora se queda pegada arriba mientras la sección
                pasa: nombre de la categoría en curso, contador y una barra de
                cuatro tramos que se van encendiendo. Cada tramo es además un
                atajo para saltar a esa card. */}
            <div className="sticky top-4 z-20 -mb-2 lg:hidden">
              <div className="rounded-2xl border border-white/10 bg-[#0d0b0d]/85 px-4 py-3 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.95)] backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const ActivoIcon = iconFor(items[pillIndex]?.tabIcon);
                    return (
                      <ActivoIcon
                        key={`ico-${pillIndex}`}
                        className="sol-pill-in h-4 w-4 shrink-0 text-[#c65fac]"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    );
                  })()}
                  <span
                    key={`tit-${pillIndex}`}
                    className="sol-pill-in min-w-0 flex-1 truncate text-[13px] leading-none text-white/90"
                  >
                    {shortLabel(items[pillIndex])}
                  </span>
                  <span className="font-mono text-[11px] leading-none tabular-nums text-white/45">
                    {String(pillIndex + 1).padStart(2, "0")}/{String(N).padStart(2, "0")}
                  </span>
                </div>

                {/* Barra: una sola pista continua. El relleno lo gobierna
                    `--sol-p` (frame a frame, con lerp) y las marcas sólo
                    separan visualmente una categoría de la siguiente. */}
                <div ref={barraRef} className="relative mt-3 h-1 w-full rounded-full bg-white/[0.12]">
                  <span aria-hidden="true" className="sol-barra-fill absolute inset-y-0 left-0 rounded-full" />
                  {Array.from({ length: Math.max(0, N - 1) }).map((_, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className="absolute inset-y-0 w-[2px] bg-[#0d0b0d]"
                      style={{ left: `calc(${((i + 1) / N) * 100}% - 1px)` }}
                    />
                  ))}
                  {/* Atajos: cada tramo salta a su card. El `before` estira el
                      área de toque más allá de los 4px de la barra. */}
                  <div className="absolute inset-0 flex">
                    {items.map((it2, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={goTo(i)}
                        aria-label={shortLabel(it2)}
                        aria-current={i === pillIndex ? "true" : undefined}
                        className="relative h-full flex-1 before:absolute before:inset-x-0 before:-inset-y-3 before:content-['']"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {items.map((it, i) => (
              <article
                key={i}
                id={ids[i]}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                data-reveal="up"
                className="sol-card scroll-mt-28 rounded-xl border border-white/[0.08] bg-black/25"
              >
                <div className="flex flex-col md:grid md:grid-cols-2">
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

                    {/* CTA (desktop): al pie de la columna de texto. */}
                    {renderCta(it, "mt-3 hidden md:inline-flex")}
                  </div>

                  {/* Escena animada de la categoría. */}
                  <div className="relative flex items-center justify-center border-white/[0.08] p-7 md:border-l md:p-10 lg:p-12">
                    {(() => {
                      const Escena = escenaPara(it?.tabIcon, i);
                      return (
                        <div className="w-full max-w-[400px]">
                          <TiltEscena>
                            <Escena activo={!!enPantalla[i]} locale={locale} />
                          </TiltEscena>
                        </div>
                      );
                    })()}
                  </div>

                  {/* CTA (mobile): después de la escena, como en la referencia. */}
                  {it?.url ? (
                    <div className="px-7 pb-7 md:hidden">{renderCta(it)}</div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Animaciones de las escenas: van aquí porque `global.css` no se
          empaqueta en este repo (mismo motivo que en Beneficios). */}
      <style dangerouslySetInnerHTML={{ __html: CSS_SOLUCIONES }} />

      {/* Chrome de las cards en mobile/tablet. Doble clase (`.sol-card.sol-card`)
          para ganarle en especificidad a las utilidades de Tailwind sin recurrir
          a `!important`. Desktop se queda como estaba: allí el rail lateral ya
          dice dónde estás y el borde tenue es parte del diseño. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@media (max-width: 1023.98px) {
  /* Sobre el fondo casi negro un borde al 8% desaparecía y la card se leía
     como texto suelto: sube el borde, el relleno pasa a degradado y una
     sombra baja la despega del fondo. */
  .sol-card.sol-card {
    border-color: rgba(255,255,255,0.14);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.012) 100%),
      rgba(10,10,10,0.55);
    /* --sol-cerca (0→1) lo escribe el bucle de scroll: la card se enciende
       de forma continua conforme se acerca al centro del viewport, en vez de
       saltar entre estados. */
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,calc(0.06 + 0.04 * var(--sol-cerca, 0))),
      0 0 0 1px rgba(198,95,172, calc(0.42 * var(--sol-cerca, 0))),
      0 26px 60px -32px rgba(150,35,122, calc(0.55 * var(--sol-cerca, 0))),
      0 18px 44px -30px rgba(0,0,0,0.95);
  }
}
/* Relleno de la barra. Sin transición CSS a propósito: la suavidad ya viene
   del lerp por frame; encadenar las dos lo dejaría flotando por detrás. */
.sol-barra-fill {
  width: calc(var(--sol-p, 0) * 100%);
  background: linear-gradient(90deg, #96237A 0%, #d246ac 100%);
  box-shadow: 0 0 12px rgba(210,70,172,0.45);
}
/* Rótulo de la píldora: entra con un fundido corto al cambiar de categoría. */
.sol-pill-in { animation: solPillIn .38s cubic-bezier(.22,.61,.36,1) both; }
@keyframes solPillIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .sol-pill-in { animation: none; }
}
`,
        }}
      />

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
