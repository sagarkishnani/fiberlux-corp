import { useRef, type ReactNode } from "react";
import type { Locale } from "../../../i18n/config";
import { t } from "../../../i18n/ui";
import { localizedPath } from "../../../utils/i18n";
import { prefersReducedMotion, useScrollFrame } from "../../home/useScrollFrame";
import { fxAsset } from "./FxPrimitives";

interface PageHeroProps {
  crumb: string;
  title: ReactNode;
  subtitle?: ReactNode;
  locale: Locale;
  variant?: "full" | "soft";
  titleTinaField?: string;
  subtitleTinaField?: string;
  aside?: ReactNode;
  children?: ReactNode;
}

export function Breadcrumb({ crumb, locale }: { crumb: string; locale: Locale }) {
  return (
    <div data-reveal="up" data-reveal-distance="56" data-reveal-duration="1.2" data-reveal-ease="fx" className="flex items-center gap-2 text-[15px] text-fx-muted">
      <a href={localizedPath(import.meta.env.BASE_URL || "/", locale)} className="text-fx-muted transition-colors duration-200 hover:text-fx-ink">
        {t("breadcrumb.home", locale)}
      </a>
      <span className="text-fx-purple">/</span>
      <span className="font-medium text-fx-purple">{crumb}</span>
    </div>
  );
}

export default function PageHero({
  crumb,
  title,
  subtitle,
  locale,
  variant = "full",
  titleTinaField,
  subtitleTinaField,
  aside,
  children,
}: PageHeroProps) {
  const bgRef = useRef<HTMLDivElement>(null);
  const full = variant === "full";

  useScrollFrame(() => {
    if (!bgRef.current || prefersReducedMotion()) return;
    bgRef.current.style.transform = `translate3d(0,${Math.min(window.scrollY, 800) * 0.08}px,0)`;
  });

  return (
    <section className={`relative ${full ? "pt-[50px] lg:pt-[120px]" : "overflow-clip pt-[50px] lg:pt-24"}`}>
      <div
        ref={bgRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 -top-10 will-change-transform ${
          full ? "h-[1300px]" : "bottom-0 [mask-image:linear-gradient(180deg,#000_55%,transparent_95%)]"
        }`}
      >
        <img
          src={fxAsset("nosotros/nosotros-gradient.webp")}
          alt=""
          className={`fx-drift absolute -left-[10%] top-0 h-auto w-[120%] max-w-none ${full ? "opacity-95" : "opacity-50"}`}
        />
      </div>
      <div className="fx-container relative">
        <Breadcrumb crumb={crumb} locale={locale} />
        <div className={aside ? "lg:flex lg:items-end lg:justify-between lg:gap-16" : ""}>
          <h1
            data-reveal="up"
            data-reveal-distance="56"
            data-reveal-duration="1.2"
            data-reveal-ease="fx"
            data-reveal-delay="0.08"
            className="mb-0 mt-4 max-w-[680px] text-[38px] font-medium leading-[1.1] tracking-[-.03em] text-fx-ink [text-wrap:balance] lg:text-[64px]"
            data-tina-field={titleTinaField}
          >
            {title}
          </h1>
          {aside}
        </div>
        {subtitle && (
          <p
            data-reveal="up"
            data-reveal-distance="56"
            data-reveal-duration="1.2"
            data-reveal-ease="fx"
            data-reveal-delay="0.16"
            className={`mb-0 text-[18px] leading-[1.6] text-fx-body [text-wrap:pretty] ${full ? "mt-8 max-w-[540px]" : "mt-6 max-w-[620px]"}`}
            data-tina-field={subtitleTinaField}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
