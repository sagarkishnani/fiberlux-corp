import { useEffect, useRef, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import { LuArrowRight } from "react-icons/lu";
import type { HomeQuery } from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { iconFor } from "./solucionesIcons";

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
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

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
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
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
                  </div>

                  {/* Escena (SPEC 108 · step 9). */}
                  <div className="relative flex items-center justify-center border-white/[0.08] p-7 md:border-l md:p-10 lg:p-12" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
