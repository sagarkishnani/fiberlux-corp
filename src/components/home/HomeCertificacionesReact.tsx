import { useEffect, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { tField } from "../../utils/i18n";
import { renderEmphasis } from "../../utils/emphasis";
import { Eyebrow } from "../shared/fx/FxPrimitives";

export interface CertItem {
  code?: string | null;
  norm?: string | null;
  norm_en?: string | null;
  label?: string | null;
  label_en?: string | null;
}

interface Props {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  locale?: Locale;
  certificaciones: { sectionTitle?: string | null; sectionTitle_en?: string | null; sectionDescription?: string | null; sectionDescription_en?: string | null; items: CertItem[] };
}

function splitNorm(norm: string) {
  const [name, ...rest] = norm.split(/\s+—\s+/);
  return { name: name || norm, desc: rest.join(" — ") };
}

function Seal({ code, small }: { code: string; small: boolean }) {
  return (
    <div className={`relative grid place-items-center ${small ? "h-[176px] w-[176px]" : "h-[220px] w-[220px]"}`}>
      <div className="fx-spin absolute inset-0 rounded-full border-[1.5px] border-dashed border-fx-lilac-strong" />
      <div className={`absolute rounded-full border border-fx-lilac ${small ? "inset-3.5" : "inset-[18px]"}`} />
      <div
        className={`absolute rounded-full bg-white ${small ? "inset-7 shadow-[0_16px_40px_-18px_rgba(150,33,122,.4)]" : "inset-9 shadow-[0_20px_50px_-20px_rgba(150,33,122,.4)]"}`}
      />
      <div className="relative text-center">
        <div className={`font-mono font-medium tracking-[.3em] text-fx-muted ${small ? "text-[11px]" : "text-[12px]"}`}>ISO</div>
        <div className={`font-semibold leading-[1.1] tracking-[-.02em] text-fx-purple ${small ? "text-[36px]" : "text-[44px]"}`}>{code}</div>
      </div>
    </div>
  );
}

export default function HomeCertificacionesReact({ query, variables, data: initialData, locale = "es", certificaciones }: Props) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });
  const intro = data?.home?.certificacionesIntro || initialData?.home?.certificacionesIntro;
  const items = certificaciones.items.filter((c) => c?.code);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % items.length), 5000);
    return () => window.clearInterval(id);
  }, [items.length]);

  if (!items.length) return null;
  const title = tField(intro, "title", locale) || tField(certificaciones, "sectionTitle", locale);
  const text = tField(intro, "text", locale) || tField(certificaciones, "sectionDescription", locale);
  const eyebrow = tField(intro, "eyebrow", locale);

  const slides = (small: boolean) =>
    items.map((item, i) => {
      const on = i === active;
      const { name, desc } = splitNorm(tField(item, "norm", locale) || `ISO ${item.code}`);
      return (
        <div
          key={i}
          className={`flex flex-col items-center justify-center text-center ${small ? "" : "absolute inset-0"}`}
          style={
            small
              ? { display: on ? "flex" : "none" }
              : {
                  opacity: on ? 1 : 0,
                  transform: `translateX(${on ? 0 : i < active ? -40 : 40}px)`,
                  transition: "opacity .6s, transform .8s cubic-bezier(.16,1,.3,1)",
                }
          }
          aria-hidden={!on}
        >
          <Seal code={item.code || ""} small={small} />
          <div className={`relative font-semibold text-fx-ink ${small ? "mt-6 text-[16px]" : "mt-8 text-[18px]"}`}>{name}</div>
          {desc && <div className={`relative leading-[1.5] text-fx-body ${small ? "mt-1 text-[14px]" : "mt-1.5 text-[15px]"}`}>{desc}</div>}
        </div>
      );
    });

  return (
    <section className="fx-container mt-14 lg:mt-[140px]">
      <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-20">
        <div data-reveal="up" data-reveal-distance="56" data-reveal-duration="1.2">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2
            className="mb-0 mt-3.5 text-[32px] font-normal leading-[1.12] tracking-[-.02em] text-fx-ink lg:mt-[18px] lg:text-[48px] lg:leading-[1.1]"
            data-tina-field={intro ? tinaField(intro as any, "title") : undefined}
          >
            {renderEmphasis(title)}
          </h2>
          <p
            className="mb-0 mt-3.5 text-[15px] leading-[1.65] text-fx-body [text-wrap:pretty] lg:mt-6 lg:max-w-[520px] lg:text-[16px] lg:leading-[1.7]"
            data-tina-field={intro ? tinaField(intro as any, "text") : undefined}
          >
            {text}
          </p>
        </div>
        <div
          data-reveal="scale"
          data-reveal-duration="1.2"
          className="relative mt-7 overflow-hidden rounded-[24px] border border-fx-line bg-white px-6 py-10 lg:mt-0 lg:h-[460px] lg:rounded-[32px] lg:p-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_35%,#FAF0F6,rgba(250,240,246,0))] lg:bg-[radial-gradient(50%_60%_at_50%_40%,#FAF0F6,rgba(250,240,246,0))]" />
          <div className="relative lg:hidden">{slides(true)}</div>
          <div className="hidden lg:block">{slides(false)}</div>
        </div>
      </div>
    </section>
  );
}
