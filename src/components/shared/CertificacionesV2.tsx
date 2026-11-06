import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import type { Locale } from "../../i18n/config";
import { tField } from "../../utils/i18n";
import { renderEmphasis } from "../../utils/emphasis";
import { Eyebrow } from "./fx/FxPrimitives";
import IsoSeal from "./fx/IsoSeal";

export interface CertItem {
  code?: string | null;
  norm?: string | null;
  norm_en?: string | null;
  label?: string | null;
  label_en?: string | null;
  ringText?: string | null;
  ringText_en?: string | null;
}

interface Props {
  eyebrow?: string;
  title: string;
  text: string;
  titleTinaField?: string;
  textTinaField?: string;
  items: CertItem[];
  locale?: Locale;
  sectionClassName?: string;
}

function splitNorm(norm: string) {
  const [name, ...rest] = norm.split(/\s+—\s+/);
  return { name: name || norm, desc: rest.join(" — ") };
}

export default function CertificacionesV2({
  eyebrow,
  title,
  text,
  titleTinaField,
  textTinaField,
  items: rawItems,
  locale = "es",
  sectionClassName = "mt-14 lg:mt-[140px]",
}: Props) {
  const items = rawItems.filter((c) => c?.code);
  const [active, setActive] = useState(0);
  const [rotated, setRotated] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inView = useInView(panelRef, { once: true, amount: 0.35 });

  useEffect(() => {
    if (items.length < 2) return;
    const id = window.setInterval(() => {
      setRotated(true);
      setActive((a) => (a + 1) % items.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [items.length]);

  if (!items.length) return null;

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
          <div className={small ? "w-[240px] max-w-full" : "w-[280px]"}>
            <IsoSeal cert={item} locale={locale} go={inView && on} tone="light" halo={!rotated} />
          </div>
          <div className={`relative font-semibold text-fx-ink ${small ? "mt-6 text-[16px]" : "mt-8 text-[18px]"}`}>{name}</div>
          {desc && <div className={`relative leading-[1.5] text-fx-body ${small ? "mt-1 text-[14px]" : "mt-1.5 text-[15px]"}`}>{desc}</div>}
        </div>
      );
    });

  return (
    <section className={sectionClassName}>
      <div className="fx-container lg:grid lg:grid-cols-2 lg:items-center lg:gap-20">
        <div data-reveal="up" data-reveal-distance="56" data-reveal-duration="1.2" data-reveal-ease="fx">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2
            className="mb-0 mt-3.5 text-[32px] font-normal leading-[1.12] tracking-[-.02em] text-fx-ink lg:mt-[18px] lg:text-[48px] lg:leading-[1.1]"
            data-tina-field={titleTinaField}
          >
            {renderEmphasis(title)}
          </h2>
          <p
            className="mb-0 mt-3.5 text-[15px] leading-[1.65] text-fx-body [text-wrap:pretty] lg:mt-6 lg:max-w-[520px] lg:text-[16px] lg:leading-[1.7]"
            data-tina-field={textTinaField}
          >
            {text}
          </p>
        </div>
        <div
          ref={panelRef}
          data-reveal="scale"
          data-reveal-duration="1.2"
          data-reveal-ease="fx"
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
