import type { CSSProperties } from "react";
import { tinaField } from "tinacms/dist/react";
import type { Locale } from "../../i18n/config";
import { tField } from "../../utils/i18n";

const ICONS: Record<string, string> = {
  consultoria: "M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M3 13h18",
  corporativo: "M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M3 13h18",
  banca: "M3 21h18M4 10h16M12 3l9 5H3l9-5zM6 10v8M10 10v8M14 10v8M18 10v8",
  gobierno: "M3 21h18M4 10h16M12 3l9 5H3l9-5zM6 10v8M10 10v8M14 10v8M18 10v8",
  salud: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8zM3.5 12h4l2-3 3 6 2-3h6",
  energia: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  mineria: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  educacion: "M22 10L12 5 2 10l10 5 10-5zM6 12v5c3 2 9 2 12 0v-5",
  tecnologia: "M4 5h16a1 1 0 0 1 1 1v10H3V6a1 1 0 0 1 1-1zM1 19h22",
  telecomunicaciones: "M4 5h16a1 1 0 0 1 1 1v10H3V6a1 1 0 0 1 1-1zM1 19h22",
  industria: "M2 20h20V9l-6 4V9l-6 4V4H2v16zM6 16h2M11 16h2M16 16h2",
  construccion: "M2 20h20V9l-6 4V9l-6 4V4H2v16zM6 16h2M11 16h2M16 16h2",
  agroindustria: "M2 20h20V9l-6 4V9l-6 4V4H2v16zM6 16h2M11 16h2M16 16h2",
  retail: "M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  restaurantes: "M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  servicios:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
};

function RubroTile({ item, locale }: { item: any; locale: Locale }) {
  return (
    <div className="flex w-24 shrink-0 cursor-default flex-col items-center gap-2.5 lg:w-[150px] lg:gap-4">
      <div className="grid h-[76px] w-[76px] place-items-center rounded-[18px] border border-white/10 bg-white/[.04] text-[#B9B2BA] lg:h-[116px] lg:w-[116px] lg:rounded-[24px]">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={ICONS[item.icon] || ICONS.servicios} />
        </svg>
      </div>
      <div className="whitespace-nowrap text-[13px] text-[#B9B2BA] lg:text-[15px]">{tField(item, "label", locale)}</div>
    </div>
  );
}

export default function RubrosV2({
  rubros,
  locale = "es",
  className = "",
}: {
  rubros: any;
  locale?: Locale;
  className?: string;
}) {
  const items = ((rubros?.items || []).filter(Boolean) as any[]);
  if (!items.length) return null;
  const rowA = [...items, ...items];
  const shifted = [...items.slice(4), ...items.slice(0, 4)];
  const rowB = [...shifted, ...shifted];

  return (
    <section
      className={`relative overflow-clip rounded-t-[24px] bg-fx-ink pb-[72px] pt-11 lg:rounded-t-[40px] lg:pb-40 lg:pt-[120px] ${className}`}
    >
      <div className="fx-container grid items-center gap-[25px] lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-14">
        <div data-reveal="up" data-reveal-distance="56" data-reveal-duration="1.2" data-reveal-ease="fx">
          <div className="font-mono text-[13px] font-medium tracking-[.2em] text-[#B9B2BA]" data-tina-field={tinaField(rubros, "eyebrow")}>
            {tField(rubros, "eyebrow", locale)}
          </div>
          <h2
            className="mb-0 mt-[18px] text-[34px] font-normal leading-[1.1] tracking-[-.025em] text-white lg:text-[56px]"
            data-tina-field={tinaField(rubros, "title")}
          >
            {tField(rubros, "title", locale)}
          </h2>
          <p className="mb-0 mt-6 text-[16px] leading-[1.7] text-fx-line-strong [text-wrap:pretty]" data-tina-field={tinaField(rubros, "description")}>
            {tField(rubros, "description", locale)}
          </p>
        </div>
        <div
          data-reveal="up"
          data-reveal-distance="56"
          data-reveal-duration="1.2"
          data-reveal-ease="fx"
          data-reveal-delay="0.12"
          className="flex min-w-0 flex-col gap-4 [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)] lg:gap-8"
        >
          <div className="fx-marquee flex w-max gap-2 pt-2 lg:gap-6" style={{ "--fx-marquee-duration": "46s" } as CSSProperties}>
            {rowA.map((item, i) => (
              <RubroTile key={i} item={item} locale={locale} />
            ))}
          </div>
          <div className="fx-marquee-reverse flex w-max gap-6 pt-2" style={{ "--fx-marquee-duration": "52s" } as CSSProperties}>
            {rowB.map((item, i) => (
              <RubroTile key={i} item={item} locale={locale} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
