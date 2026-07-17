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

/* Prefixes the CMS media path with BASE_URL so it resolves under a subpath deploy. */
function resolveIcon(icon?: string | null): string | null {
  if (!icon) return null;
  if (/^https?:\/\//.test(icon)) return icon;
  return `${BASE}${icon.startsWith("/") ? "" : "/"}${icon}`;
}

/* A bullet that just signals "there's more" — rendered as the muted label, not a line. */
const isMoreLabel = (b: string) => /^y\s*m[aá]s/i.test(b.trim());

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

  /* Shared drag/scroll engine: left-aligned cards, one card per arrow. */
  const slider = useDragSlider({
    slideSelector: ".sol-slide",
    align: "start",
    itemCount: items.length,
  });
  const { activeIndex, atStart, atEnd } = slider;

  const hasItems = items.length > 0;
  if (!hasItems) return null;

  const active = items[Math.min(activeIndex, items.length - 1)];
  const activeTina = services?.items?.[Math.min(activeIndex, items.length - 1)];

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

  /* ── A single solution card ── */
  const renderCard = (item: (typeof items)[number], i: number) => {
    const tinaItem = services?.items?.[i];
    const bullets = (item?.bullets || []).filter(Boolean) as string[];
    const lines = bullets.filter((b) => !isMoreLabel(b));
    const onda = resolveIcon(item?.icon);
    const url = item?.url || "";

    return (
      <div className="relative flex h-full min-h-[320px] md:min-h-[520px] flex-col overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#15131B] px-8 py-8 md:px-10 md:py-10">
        {/* Decorative magenta wave (from the CMS `icon`, per-card editable) */}
        {onda && (
          <img
            src={onda}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-70"
            draggable={false}
          />
        )}

        {/* Content sits above the wave */}
        <div className="relative z-10 flex h-full flex-col">
          <ul
            className="space-y-1.5"
            data-tina-field={tinaItem ? tinaField(tinaItem, "bullets") : undefined}
          >
            {lines.map((line, bIdx) => (
              <li key={bIdx} className="text-[16px] leading-[1.5] text-white/85">
                {line}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-[16px] text-white/45">Y más…</p>

          {url && (
            <a
              href={`${BASE}${url.startsWith("/") ? "" : "/"}${url}`}
              className="mt-6 inline-flex w-fit items-center text-[16px] font-medium text-[#d885c4] underline-offset-[5px] transition-colors hover:text-white hover:underline"
              data-tina-field={tinaItem ? tinaField(tinaItem, "url") : undefined}
            >
              Conoce más
            </a>
          )}

          {/* Big number, anchored bottom-left */}
          <span
            className="mt-auto pt-8 md:pt-10 text-[48px] md:text-[64px] font-semibold leading-none text-white/20"
            data-tina-field={tinaItem ? tinaField(tinaItem, "number") : undefined}
          >
            {item?.number}
          </span>
        </div>
      </div>
    );
  };

  /* ── Carousel viewport: shows ~1 card + peek of the next ── */
  const carousel = (
    <div
      ref={slider.ref}
      className="flex items-stretch gap-6 overflow-x-auto snap-x snap-proximity py-2 select-none sol-carousel"
      style={{ cursor: "grab" }}
      {...slider.handlers}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="sol-slide snap-start shrink-0 w-[86%] md:w-[46%] transition-opacity duration-500 ease-out"
          style={{ opacity: i === activeIndex ? 1 : 0.35 }}
        >
          {renderCard(item, i)}
        </div>
      ))}
      {/* Trailing spacer: lets the LAST card left-align (and become active) just
          like the others. Width = one viewport minus one card+gap, so max scroll
          lands exactly on the last card. Excluded from snapping. */}
      {items.length > 1 && (
        <div
          aria-hidden="true"
          className="shrink-0 w-[calc(14%-24px)] md:w-[calc(54%-24px)]"
        />
      )}
    </div>
  );

  return (
    <section className="bg-greyscale-darkest pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      <div className="site-container md:flex md:items-center md:gap-10 lg:gap-16">
        {/* Left column: active-solution title + description + arrows (desktop) */}
        <div className="md:w-[38%] md:shrink-0">
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
        .sol-carousel { scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; }
        .sol-carousel::-webkit-scrollbar { display: none; }
        @keyframes sol-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .sol-fade { animation: sol-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) { .sol-fade { animation: none; } }
      `}</style>
    </section>
  );
}
