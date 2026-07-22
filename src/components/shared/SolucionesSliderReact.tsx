import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery } from "../../../tina/__generated__/types";
import { useDragSlider } from "../../hooks/useDragSlider";

/* ── Props ── */
interface SolucionesSliderProps {
  query: string;
  variables: { relativePath: string };
  data: HomeQuery;
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

export default function SolucionesSliderReact({
  query,
  variables,
  data: initialData,
}: SolucionesSliderProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });

  const services = data?.home?.services || initialData?.home?.services;
  const items = (services?.items || []).filter(Boolean) as NonNullable<
    NonNullable<typeof services>["items"]
  >;

  /* Shared drag/scroll engine: left-aligned cards, one card per arrow.
     momentum:false → a drag settles at most one card in the gesture direction
     (no velocity fling). With these wide cards the fling projection overshot two
     cards on a short drag (card 1 → card 3); this keeps dragging one card at a
     time, matching the arrows. */
  const slider = useDragSlider({
    slideSelector: ".sol-slide",
    align: "start",
    momentum: false,
    itemCount: items.length,
  });
  const { activeIndex, atStart, atEnd } = slider;

  const hasItems = items.length > 0;
  if (!hasItems) return null;

  const active = items[Math.min(activeIndex, items.length - 1)];
  const activeTina = services?.items?.[Math.min(activeIndex, items.length - 1)];
  const sectionTitle = (services?.title || "").trim();

  /* ── Prev/Next pill ── */
  const arrowsPill = (
    <div className="inline-flex rounded-[12px] border-2 border-[#282445] bg-[#141223] overflow-hidden shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]">
      <button
        type="button"
        onClick={slider.prev}
        disabled={atStart}
        aria-label="Anterior"
        className={`w-[49px] h-[49px] flex items-center justify-center transition-colors ${
          !atStart ? "text-white hover:bg-white/5" : "text-white/30 cursor-default"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={slider.next}
        disabled={atEnd}
        aria-label="Siguiente"
        className={`w-[49px] h-[49px] flex items-center justify-center transition-colors ${
          !atEnd ? "bg-[#96237A] text-white hover:bg-[#650F50]" : "bg-[#96237A]/40 text-white/40 cursor-default"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );

  /* ── A single solution card ──
     Active card gets the magenta gradient (CSS) + white text; inactive cards are
     flat and muted. "Conoce más →" and the number share the bottom row. */
  const renderCard = (item: (typeof items)[number], i: number) => {
    const tinaItem = services?.items?.[i];
    const bullets = (item?.bullets || []).filter(Boolean) as string[];
    const lines = bullets.filter((b) => !isMoreLabel(b));
    const hasMore = bullets.some(isMoreLabel);
    const url = item?.url || "";
    const isActive = i === activeIndex;

    return (
      <div
        className={`relative flex h-full min-h-[360px] md:min-h-[560px] flex-col overflow-hidden rounded-[24px] border px-8 py-9 md:px-10 md:py-10 transition-colors duration-500 ${
          isActive
            ? "border-white/20 sol-card-active"
            : "border-white/[0.10] bg-white/[0.03] backdrop-blur-sm"
        }`}
      >
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
              Y más
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
                className={`inline-flex items-center gap-2 whitespace-nowrap text-[16px] md:text-[19px] font-medium transition-colors ${
                  isActive ? "text-white hover:text-[#d885c4]" : "text-white/35"
                }`}
                data-tina-field={tinaItem ? tinaField(tinaItem, "url") : undefined}
              >
                Conoce más
                <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ── Carousel viewport: shows ~1 card + peek of the next ── */
  const carousel = (
    <div
      ref={slider.ref}
      className="flex items-stretch gap-6 overflow-x-auto snap-x snap-mandatory py-2 select-none sol-carousel"
      style={{ cursor: "grab" }}
      {...slider.handlers}
    >
      {items.map((item, i) => (
        <div key={i} className="sol-slide snap-start shrink-0 w-[86%] md:w-[66%]">
          {renderCard(item, i)}
        </div>
      ))}
      {/* Trailing spacer: lets the LAST card left-align (and become active) just
          like the others. Width = one viewport minus one card+gap, so max scroll
          lands exactly on the last card. Excluded from snapping. */}
      {items.length > 1 && (
        <div
          aria-hidden="true"
          className="shrink-0 w-[calc(14%-24px)] md:w-[calc(34%-24px)]"
        />
      )}
    </div>
  );

  return (
    <section className="relative bg-greyscale-darkest pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Decorative background glows (planet + line), behind all content.
          A radial mask fades each image toward its own box edges so the SVG's
          blurred ellipse never shows a hard rectangular cut. */}
      <img
        src={GLOW_PLANET}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute -bottom-[22%] -left-[14%] z-0 w-[72vw] max-w-[960px] select-none opacity-90"
        style={{
          WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
          maskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
        }}
      />
      <img
        src={GLOW_LINE}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute -top-[14%] -left-[4%] z-0 w-[420px] max-w-[46vw] select-none opacity-60"
        style={{
          WebkitMaskImage: "radial-gradient(closest-side, #000 45%, transparent 100%)",
          maskImage: "radial-gradient(closest-side, #000 45%, transparent 100%)",
        }}
      />
      {/* SPEC 55: tercer vector — planet reusado detrás de la card activa / zona
          derecha, para que el glass deje ver el magenta (reemplaza el glow radial
          CSS suelto anterior). */}
      <img
        src={GLOW_PLANET}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute top-1/2 right-[-10%] z-0 w-[52vw] max-w-[760px] -translate-y-1/2 select-none opacity-80"
        style={{
          WebkitMaskImage: "radial-gradient(closest-side, #000 52%, transparent 100%)",
          maskImage: "radial-gradient(closest-side, #000 52%, transparent 100%)",
        }}
      />
      {/* obs_16: efecto grano sutil sobre toda la sección. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 site-container md:flex md:items-center md:gap-10 lg:gap-16">
        {/* Left column: eyebrow + active-solution title + description + arrows */}
        <div className="md:w-[40%] md:shrink-0">
          {sectionTitle && (
            <p
              className="mb-5 font-mono text-[13px] uppercase tracking-[0.2em] text-white/45"
              data-tina-field={services ? tinaField(services, "title") : undefined}
            >
              [ {sectionTitle.toUpperCase()} ]
            </p>
          )}
          <h2
            key={`t-${activeIndex}`}
            className="sol-fade text-[34px] md:text-[52px] leading-[1.05] font-semibold text-white max-w-[14ch]"
            data-tina-field={activeTina ? tinaField(activeTina, "title") : undefined}
          >
            {active?.title}
          </h2>
          {active?.description && (
            <p
              key={`d-${activeIndex}`}
              className="sol-fade mt-5 text-[16px] md:text-[18px] leading-relaxed text-white/60 max-w-[32ch]"
              data-tina-field={activeTina ? tinaField(activeTina, "description") : undefined}
            >
              {active.description}
            </p>
          )}
          {items.length > 1 && <div className="hidden md:block mt-9">{arrowsPill}</div>}
        </div>

        {/* Right column: carousel */}
        <div className="md:flex-1 md:min-w-0 mt-8 md:mt-0">{carousel}</div>

        {/* Mobile arrows: below the carousel, left-aligned */}
        {items.length > 1 && <div className="md:hidden mt-8">{arrowsPill}</div>}
      </div>

      <style>{`
        /* obs_18: la card que se esconde a la derecha se desvanece (sin corte brusco). */
        .sol-carousel {
          scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch;
          -webkit-mask-image: linear-gradient(to right, #000 0%, #000 86%, transparent 100%);
          mask-image: linear-gradient(to right, #000 0%, #000 86%, transparent 100%);
        }
        .sol-carousel::-webkit-scrollbar { display: none; }
        /* Active card = GLASS (obs_10/16): base semi-transparente + backdrop-blur
           para que el glow magenta de la derecha se desenfoque detrás; brillo
           blanco arriba (lado opuesto al degradé) tipo glass; degradé magenta
           multi-tono (violeta → magenta → oscuro) que la hace visible aun en
           bajo brillo. */
        .sol-card-active {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 14%, rgba(255,255,255,0) 26%),
            radial-gradient(122% 88% at 50% 127%,
              rgba(185,50,148,0.90) 0%,
              rgba(146,36,120,0.70) 26%,
              rgba(84,30,88,0.46) 52%,
              rgba(26,15,32,0.22) 78%),
            rgba(12,10,16,0.42);
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.14);
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
     const bullets = (item?.bullets || []).filter(Boolean) as string[];
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
           <p className="mt-6 text-[16px] text-white/45">Y más…</p>
           {url && (
             <a href={`${BASE}${url.startsWith("/") ? "" : "/"}${url}`} className="mt-6 inline-flex w-fit items-center text-[16px] font-medium text-[#d885c4] underline-offset-[5px] transition-colors hover:text-white hover:underline" data-tina-field={tinaItem ? tinaField(tinaItem, "url") : undefined}>
               Conoce más
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
