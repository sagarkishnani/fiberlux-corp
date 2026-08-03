import { useEffect, useRef, useState } from "react";
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

/* Alto de scroll (en unidades de viewport) que ocupa cada categoría antes de
   pasar a la siguiente. Menor a 1 ⇒ el scroll-jack se siente más ágil. */
const VH_PER_CATEGORY = 0.8;

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
  const trackRef = useRef<HTMLElement | null>(null);
  const N = items.length;

  /* ── Motor scroll-jack ──
     El <section> mide N × VH_PER_CATEGORY viewports de alto y su panel interno
     queda pinned (sticky). El progreso del scroll dentro del track (0..1) se
     reparte en N segmentos iguales → categoría activa. rAF-throttled: no bloquea
     el scroll nativo, solo mapea posición (compatible con Lenis). */
  useEffect(() => {
    if (N <= 1) return;
    const track = trackRef.current;
    if (!track) return;

    let ticking = false;
    const compute = () => {
      ticking = false;
      const total = track.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const scrolled = -track.getBoundingClientRect().top;
      const progress = clamp(scrolled / total, 0, 1);
      const idx = clamp(Math.floor(progress * N), 0, N - 1);
      setActiveIndex((prev) => (prev === idx ? prev : idx));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [N]);

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

  return (
    <section
      ref={trackRef}
      id="soluciones-scroll"
      className="relative bg-greyscale-darkest"
      style={{ height: `${N * VH_PER_CATEGORY * 100}svh` }}
    >
      {/* Panel pinned: queda fijo mientras se recorre el track. */}
      <div className="sticky top-0 flex min-h-[100svh] items-center overflow-hidden">
        {/* Glow magenta superior-izquierda (referencia Figma). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[10%] -left-[8%] z-0 h-[520px] w-[620px] rounded-full opacity-40 blur-[120px]"
          style={{ background: "radial-gradient(circle, #96237A 0%, transparent 70%)" }}
        />

        <div className="relative z-10 w-full site-container py-16 md:py-20 lg:flex lg:items-center lg:gap-16">
        {/* ── Columna izquierda: categoría activa ── */}
        <div className="lg:w-[42%] lg:shrink-0">
          {sectionTitle && (
            <p
              className="mb-6 font-mono text-[13px] uppercase tracking-[0.2em] text-white/45"
              data-tina-field={services ? tinaField(services, "title") : undefined}
            >
              [ {sectionTitle.toUpperCase()} ]
            </p>
          )}

          <div key={`l-${activeIndex}`} className="solscroll-fade">
            <span
              className="block text-[64px] md:text-[88px] font-semibold leading-none text-white"
              data-tina-field={activeTina ? tinaField(activeTina, "number") : undefined}
            >
              {active?.number}
            </span>

            <h2
              className="mt-4 text-[30px] md:text-[44px] leading-[1.08] font-semibold text-white max-w-[14ch]"
              data-tina-field={activeTina ? tinaField(activeTina, "title") : undefined}
            >
              {tField(active as any, "title", locale)}
            </h2>

            {active?.description && (
              <p
                className="mt-5 text-[16px] md:text-[18px] leading-relaxed text-white/60 max-w-[34ch]"
                data-tina-field={activeTina ? tinaField(activeTina, "description") : undefined}
              >
                {tField(active as any, "description", locale)}
              </p>
            )}

            {active?.url && (
              <a
                href={withBase(active.url)}
                className="mt-9 inline-flex items-center rounded-full border border-white/50 px-7 py-3 text-[16px] font-medium text-white transition-colors hover:bg-white hover:text-[#3B0E30]"
                data-tina-field={activeTina ? tinaField(activeTina, "url") : undefined}
              >
                {ctaLabel}
              </a>
            )}
          </div>
        </div>

        {/* ── Columna derecha: subservicios de la categoría activa ── */}
        <div className="lg:flex-1 lg:min-w-0 mt-12 lg:mt-0">
          <ul key={`r-${activeIndex}`} className="solscroll-fade border-t border-white/12">
            {subservicios.map((sub, i) => {
              const label = tField(sub as any, "label", locale);
              return (
                <li key={i} className="border-b border-white/12">
                  <div className="flex items-center gap-6 py-5 md:py-6">
                    <span className="font-mono text-[13px] tabular-nums text-white/35">
                      {pad2(i)}
                    </span>
                    <span className="ml-auto text-right text-[17px] md:text-[19px] text-white/85">
                      {label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        </div>
      </div>

      <style>{`
        @keyframes solscroll-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: none; }
        }
        .solscroll-fade { animation: solscroll-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .solscroll-fade { animation: none; }
        }
      `}</style>
    </section>
  );
}
