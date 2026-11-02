import type { ReactNode } from "react";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { localizedPath } from "../../utils/i18n";
import { fxAsset } from "../shared/fx/FxPrimitives";
import { renderInlineLinks } from "../shared/FormControls";

const REVEAL = { "data-reveal-distance": "56", "data-reveal-duration": "1.2", "data-reveal-ease": "fx" } as const;

interface LegalHeroProps {
  locale: Locale;
  section: string;
  title: string;
  eyebrow?: string;
  titleTinaField?: string;
  eyebrowTinaField?: string;
}

export function LegalShell({ children }: { children: ReactNode }) {
  return <div className="fx-container"><div className="mx-auto max-w-[1000px]">{children}</div></div>;
}

export function LegalIntro({ text }: { text: string }) {
  return (
    <div className="fx-intro mb-5 rounded-[28px] border border-fx-lilac bg-[#FAF0F6] p-5 text-[15px] leading-[1.75] text-fx-ink [text-wrap:pretty] lg:px-11 lg:py-10">
      <p>{renderInlineLinks(text)}</p>
    </div>
  );
}

export default function LegalHero({ locale, section, title, eyebrow, titleTinaField, eyebrowTinaField }: LegalHeroProps) {
  const cleanEyebrow = (eyebrow || "").replace(/^[—–-]\s*/, "");
  return (
    <section className="relative pt-[30px] lg:pt-[72px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-10 h-[400px] overflow-hidden [mask-image:linear-gradient(180deg,#000_20%,transparent_100%)]"
      >
        <img src={fxAsset("nosotros/nosotros-gradient.webp")} alt="" className="fx-drift absolute -left-[10%] top-0 h-auto w-[120%] max-w-none opacity-40" />
      </div>
      <div className="relative">
        <LegalShell>
          <div data-reveal="up" {...REVEAL} className="flex flex-wrap items-center gap-2 text-[15px] text-fx-muted">
            <a href={localizedPath(import.meta.env.BASE_URL || "/", locale)} className="text-fx-muted transition-colors duration-200 hover:text-fx-ink">
              {t("breadcrumb.home", locale)}
            </a>
            <span className="text-fx-purple">/</span>
            <span>{section}</span>
            <span className="text-fx-purple">/</span>
            <span className="font-medium text-fx-purple">{title}</span>
          </div>
          {cleanEyebrow && (
            <div
              data-reveal="up"
              {...REVEAL}
              data-reveal-delay="0.06"
              className="mt-7 font-mono text-[13px] font-medium tracking-[.2em] text-fx-purple"
              data-tina-field={eyebrowTinaField}
            >
              — {cleanEyebrow.toUpperCase()}
            </div>
          )}
          <h1
            data-reveal="up"
            {...REVEAL}
            data-reveal-delay="0.1"
            className="mb-0 mt-4 max-w-[900px] text-[36px] font-medium leading-[1.06] tracking-[-.03em] text-fx-ink [text-wrap:balance] lg:text-[60px]"
            data-tina-field={titleTinaField}
          >
            {title}
          </h1>
        </LegalShell>
      </div>
    </section>
  );
}
