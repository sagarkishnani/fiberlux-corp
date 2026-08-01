import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery } from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import { useSlider, type SliderEffect } from "../../hooks/useSlider";
import SliderArrows from "./SliderArrows";

/* ── Props ── */
interface SolucionesSliderProps {
  query: string;
  variables: { relativePath: string };
  data: HomeQuery;
  locale?: Locale;
  autoplay?: boolean;
  intervalMs?: number;
  effect?: SliderEffect;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/* Prefixes an internal path with BASE_URL so it resolves under a subpath deploy. */
function withBase(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

/* A bullet that just signals "there's more" — rendered as the muted label, not a line. */
const isMoreLabel = (b: string) => /^y\s*m[aá]s/i.test(b.trim());

/* Decorative background glows (static assets, not CMS-driven). */
const GLOW_PLANET = withBase("/images/soluciones/planet.svg");
const GLOW_LINE = withBase("/images/soluciones/line.svg");
/* Textura negra tileada sobre cada card (Figma: opacity 8% + blend overlay). */
const CARD_TEXTURE = withBase("/images/soluciones/black.png");

export default function SolucionesSliderReact({
  query,
  variables,
  data: initialData,
  locale = "es",
  autoplay = true,
  intervalMs = 6000,
  effect = "none",
}: SolucionesSliderProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });

  const services = data?.home?.services || initialData?.home?.services;
  const items = (services?.items || []).filter(Boolean) as NonNullable<
    NonNullable<typeof services>["items"]
  >;

  const enough = items.length > 1;

  /* Embla slider: left-aligned cards, one per arrow, autoplay w/ loop. */
  const slider = useSlider({
    align: "start",
    loop: false,
    autoplay: autoplay && enough,
    intervalMs,
    effect,
    // Permite que la última card se alinee a la izquierda (sin cortar la anterior).
    containScroll: false,
  });
  const { activeIndex } = slider;

  const hasItems = items.length > 0;
  if (!hasItems) return null;

  const active = items[Math.min(activeIndex, items.length - 1)];
  const activeTina = services?.items?.[Math.min(activeIndex, items.length - 1)];
  const sectionTitle = (tField(services as any, "title", locale) || "").trim();

  const arrowsPill = (
    <SliderArrows
      canPrev={slider.canPrev}
      canNext={slider.canNext}
      onPrev={slider.prev}
      onNext={slider.next}
    />
  );

  /* ── A single solution card ──
     Active card gets the magenta gradient (CSS) + white text; inactive cards are
     flat and muted. "Conoce más →" and the number share the bottom row. */
  const renderCard = (item: (typeof items)[number], i: number) => {
    const tinaItem = services?.items?.[i];
    const bullets = ((locale === "en" && (item as any)?.bullets_en?.length ? (item as any).bullets_en : item?.bullets) || []).filter(Boolean) as string[];
    const lines = bullets.filter((b) => !isMoreLabel(b));
    const hasMore = bullets.some(isMoreLabel);
    const url = item?.url || "";
    const isActive = i === activeIndex;

    return (
      <div
        className={`sol-card relative flex h-full min-h-[360px] md:min-h-[620px] flex-col overflow-hidden rounded-[30px] border-[1.5px] px-8 py-9 md:px-10 md:py-10 transition-colors duration-500 ${
          isActive ? "sol-card-active border-white/30" : "border-white/[0.10]"
        }`}
      >
        {/* Figma: textura negra tileada, opacity 8% + blend overlay (oscurece/da grano). */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] rounded-[30px] opacity-[0.08] mix-blend-overlay"
          style={{ backgroundImage: `url(${CARD_TEXTURE})`, backgroundRepeat: "repeat", backgroundSize: "auto" }}
        />
        <div className="relative z-10 flex h-full flex-col">
          {/* Subservices as bulleted lines */}
          <ul
            className="space-y-3 md:space-y-3.5"
            data-tina-field={tinaItem ? tinaField(tinaItem, "bullets") : undefined}
          >
            {lines.map((line, bIdx) => (
              <li
                key={bIdx}
                className={`flex gap-3 text-[16px] md:text-[19px] leading-[1.4] ${
                  isActive ? "text-white" : "text-white/40"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-[0.5em] h-[5px] w-[5px] shrink-0 rounded-full ${
                    isActive ? "bg-white" : "bg-white/40"
                  }`}
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          {/* "Y más" — only when the card's content includes it */}
          {hasMore && (
            <p className={`mt-6 text-[16px] md:text-[18px] ${isActive ? "text-white/70" : "text-white/35"}`}>
              {locale === "en" ? "And more" : "Y más"}
            </p>
          )}

          {/* Bottom row: number (left) + "Conoce más →" (right) */}
          <div className="mt-auto flex items-center justify-between gap-4 pt-8 md:pt-10">
            <span
              className={`text-[24px] md:text-[30px] font-normal leading-none tracking-wide ${
                isActive ? "text-white/80" : "text-white/25"
              }`}
              data-tina-field={tinaItem ? tinaField(tinaItem, "number") : undefined}
            >
              {item?.number}
            </span>

            {url && (
              <a
                href={withBase(url)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-[15px] md:text-[17px] font-medium transition-colors ${
                  isActive
                    ? "bg-white text-[#3B0E30] hover:bg-white/90"
                    : "bg-white/10 text-white/45 hover:bg-white/15"
                }`}
                data-tina-field={tinaItem ? tinaField(tinaItem, "url") : undefined}
              >
                {locale === "en" ? "Learn more" : "Conoce más"}
                <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ── Carousel viewport (Embla): shows ~1 card + peek of the next ── */
  const carousel = (
    <div
      ref={slider.viewportRef}
      className="overflow-hidden py-2 select-none sol-carousel"
      style={{ cursor: "grab" }}
    >
      <div className="flex items-stretch gap-6">
        {items.map((item, i) => (
          <div key={i} className="sol-slide shrink-0 w-[86%] lg:w-[80%] min-[1440px]:w-[52%]">
            {renderCard(item, i)}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section id="soluciones-cards" className="relative bg-greyscale-darkest pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden scroll-mt-24">
      {/* SPEC 55: 3 vectores blur. Bloom magenta grande y brillante (fiel a la
          referencia): el principal sube desde abajo-centro por detrás de la card
          activa; line como streak arriba-izq; tercer bloom detrás de la peek/derecha.
          Cada uno con máscara radial (evita el corte rectangular del blur del SVG).
          El wrapper añade una máscara vertical que DESVANECE los blooms hacia los
          bordes superior/inferior de la sección, para que no se corten en seco contra
          las secciones vecinas (integración entre bloques). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 9%, #000 82%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 9%, #000 82%, transparent 100%)",
        }}
      >
        {/* 1) Bloom principal: abajo-centro-izquierda, sube tras la card activa. */}
        <img
          src={GLOW_PLANET}
          alt=""
          draggable={false}
          className="absolute -bottom-[6%] left-[3%] w-[94vw] max-w-[1360px] select-none opacity-[0.32]"
          style={{
            filter: "saturate(1.18) brightness(1.14)",
            WebkitMaskImage: "radial-gradient(closest-side, #000 66%, transparent 100%)",
            maskImage: "radial-gradient(closest-side, #000 66%, transparent 100%)",
          }}
        />
        {/* 2) Streak secundario arriba-izquierda. */}
        <img
          src={GLOW_LINE}
          alt=""
          draggable={false}
          className="absolute -top-[12%] -left-[4%] w-[460px] max-w-[46vw] select-none opacity-[0.18]"
          style={{
            WebkitMaskImage: "radial-gradient(closest-side, #000 48%, transparent 100%)",
            maskImage: "radial-gradient(closest-side, #000 48%, transparent 100%)",
          }}
        />
        {/* 3) Tercer bloom: detrás de la card activa/peek, zona derecha. */}
        <img
          src={GLOW_PLANET}
          alt=""
          draggable={false}
          className="absolute top-[26%] right-[-14%] w-[58vw] max-w-[880px] select-none opacity-[0.26]"
          style={{
            filter: "saturate(1.12) brightness(1.08)",
            WebkitMaskImage: "radial-gradient(closest-side, #000 60%, transparent 100%)",
            maskImage: "radial-gradient(closest-side, #000 60%, transparent 100%)",
          }}
        />
      </div>
      {/* obs_16: efecto grano sutil sobre toda la sección. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 site-container lg:flex lg:items-center lg:gap-16">
        {/* Left column: eyebrow + active-solution title + description + arrows */}
        <div className="lg:w-[40%] lg:shrink-0">
          {sectionTitle && (
            <p
              className="mb-5 font-mono text-[13px] uppercase tracking-[0.2em] text-white/45"
              data-tina-field={services ? tinaField(services, "title") : undefined}
            >
              [ {sectionTitle.toUpperCase()} ]
            </p>
          )}
          {/* Alto fijo en móvil: el título/descripción varían de largo por slide
              (el más largo es "Data Center, Cloud y Continuidad de Negocio") y ese
              reflujo por slide se percibía como lag en celulares de bajo rendimiento.
              Se fija la altura del bloque (y se baja el título a 30px en móvil) para
              que el carrusel de abajo no se mueva al cambiar de slide. En desktop
              (lg) el layout es de 2 columnas y no aplica. */}
          <div className="min-h-[208px] md:min-h-0">
            <div data-reveal="down">
              <h2
                key={`t-${activeIndex}`}
                className="sol-fade text-[30px] md:text-[52px] leading-[1.05] font-semibold text-white max-w-[14ch]"
                data-tina-field={activeTina ? tinaField(activeTina, "title") : undefined}
              >
                {tField(active as any, "title", locale)}
              </h2>
            </div>
            {active?.description && (
              <div data-reveal="up" data-reveal-delay="0.1">
                <p
                  key={`d-${activeIndex}`}
                  className="sol-fade mt-5 text-[16px] md:text-[18px] leading-relaxed text-white/60 max-w-[32ch]"
                  data-tina-field={activeTina ? tinaField(activeTina, "description") : undefined}
                >
                  {tField(active as any, "description", locale)}
                </p>
              </div>
            )}
          </div>
          {items.length > 1 && <div className="hidden lg:block mt-9">{arrowsPill}</div>}
        </div>

        {/* Right column: carousel */}
        <div className="lg:flex-1 lg:min-w-0 mt-8 lg:mt-0" data-reveal="up" data-reveal-delay="0.15">{carousel}</div>

        {/* Mobile arrows: below the carousel, left-aligned */}
        {items.length > 1 && <div className="lg:hidden mt-8">{arrowsPill}</div>}
      </div>

      <style>{`
        /* El desvanecimiento por posición lo maneja el tween opacity (Embla).
           Además, una máscara suave SOLO en el borde derecho evita que la card
           que asoma se corte en seco contra el borde del viewport. */
        .sol-carousel {
          -webkit-mask-image: linear-gradient(to right, #000 0%, #000 88%, transparent 100%);
          mask-image: linear-gradient(to right, #000 0%, #000 88%, transparent 100%);
        }
        /* SPEC 55: TODAS las cards son glass parejo (base oscura translúcida +
           backdrop-blur + brillo blanco sutil arriba). El magenta NO se hornea en
           la card: proviene de los vectores de fondo que se ven a través del glass. */
        /* Card inactiva/peek: aubergine glass tenue (NO negro) — dark #3B0E30 con un
           dejo de magenta abajo; el bloom de fondo suma magenta en los bordes. */
        .sol-card {
          background:
            radial-gradient(130% 96% at 50% 100%,
              rgba(90,22,74,0.40) 0%,
              rgba(59,14,48,0.50) 46%,
              rgba(38,11,32,0.56) 82%);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        /* Card activa: fill del Figma — radial gradient #3B0E30 → #96237A → #3B0E30
           (aubergine arriba/bordes, magenta vivo abajo-centro). Glass: brillo blanco
           arriba + backdrop-blur + borde blanco; el bloom de fondo suma brillo abajo. */
        .sol-card-active {
          background:
            radial-gradient(136% 94% at 50% 97%,
              rgba(150,35,122,0.52) 0%,
              rgba(107,22,84,0.40) 36%,
              rgba(59,14,48,0.42) 74%);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          box-shadow: 0 16px 46px -30px rgba(150,35,122,0.45);
        }
        @keyframes sol-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .sol-fade { animation: sol-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) { .sol-fade { animation: none; } }
      `}</style>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Diseño anterior (SPEC 35) — reutilizar luego.
   Se conserva comentado por pedido del cliente ("comentar el código para no
   perderlo"). Renderizaba cada card con una onda magenta de fondo (desde el
   campo `icon` del CMS), la etiqueta "Y más…" fija, "Conoce más" encima del
   número y los bullets como líneas de texto sin viñeta.

   // Prefija la ruta de media del CMS con BASE_URL.
   function resolveIcon(icon?: string | null): string | null {
     if (!icon) return null;
     if (/^https?:\/\//.test(icon)) return icon;
     return `${BASE}${icon.startsWith("/") ? "" : "/"}${icon}`;
   }

   // Card del diseño anterior:
   const renderCardLegacy = (item, i) => {
     const tinaItem = services?.items?.[i];
     const bullets = ((locale === "en" && (item as any)?.bullets_en?.length ? (item as any).bullets_en : item?.bullets) || []).filter(Boolean) as string[];
     const lines = bullets.filter((b) => !isMoreLabel(b));
     const onda = resolveIcon(item?.icon);
     const url = item?.url || "";

     return (
       <div className="relative flex h-full min-h-[320px] md:min-h-[520px] flex-col overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#15131B] px-8 py-8 md:px-10 md:py-10">
         {onda && (
           <img
             src={onda}
             alt=""
             aria-hidden="true"
             className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-70"
             draggable={false}
           />
         )}
         <div className="relative z-10 flex h-full flex-col">
           <ul className="space-y-1.5" data-tina-field={tinaItem ? tinaField(tinaItem, "bullets") : undefined}>
             {lines.map((line, bIdx) => (
               <li key={bIdx} className="text-[16px] leading-[1.5] text-white/85">{line}</li>
             ))}
           </ul>
           <p className="mt-6 text-[16px] text-white/45">{locale === "en" ? "And more…" : "Y más…"}</p>
           {url && (
             <a href={`${BASE}${url.startsWith("/") ? "" : "/"}${url}`} className="mt-6 inline-flex w-fit items-center text-[16px] font-medium text-[#d885c4] underline-offset-[5px] transition-colors hover:text-white hover:underline" data-tina-field={tinaItem ? tinaField(tinaItem, "url") : undefined}>
               {locale === "en" ? "Learn more" : "Conoce más"}
             </a>
           )}
           <span className="mt-auto pt-8 md:pt-10 text-[48px] md:text-[64px] font-semibold leading-none text-white/20" data-tina-field={tinaItem ? tinaField(tinaItem, "number") : undefined}>
             {item?.number}
           </span>
         </div>
       </div>
     );
   };

   // El carousel y el layout de izquierda del diseño anterior eran iguales,
   // pero SIN el eyebrow "[ SOLUCIONES ]" y con la opacidad de peek aplicada al
   // wrapper de cada slide (opacity: i === activeIndex ? 1 : 0.35).
──────────────────────────────────────────────────────────────────────────── */
