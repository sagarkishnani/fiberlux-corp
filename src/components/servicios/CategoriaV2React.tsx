import { useRef, type CSSProperties } from "react";
import { tinaField } from "tinacms/dist/react";
import { t } from "../../i18n/ui";
import { localizeHref, tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import { ArrowIcon, Eyebrow, PillLink } from "../shared/fx/FxPrimitives";
import { prefersReducedMotion, useScrollFrame } from "../home/useScrollFrame";
import SolutionsBreadcrumb from "./SolutionsBreadcrumb";
import { REVEAL, useService, type ServiceProps } from "./useService";

function CornerArrow({ tone }: { tone: "dark" | "light" }) {
  return (
    <span
      className={`pointer-events-none absolute right-7 top-7 z-[2] grid h-12 w-12 place-items-center rounded-full transition-transform duration-[450ms] ease-fx-spring group-hover/card:rotate-45 ${
        tone === "dark" ? "bg-fx-ink text-white" : "bg-white text-fx-purple"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 17L17 7M8 7h9v9" />
      </svg>
    </span>
  );
}

const CARD =
  "group/card relative flex flex-col overflow-hidden rounded-[24px] p-3 transition-[transform,box-shadow] duration-500 ease-fx-spring hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(101,13,74,.45)] lg:h-[560px] lg:rounded-[32px]";

export default function CategoriaV2React(props: ServiceProps) {
  const locale = props.locale || "es";
  const service = useService(props);
  const heroImgRef = useRef<HTMLDivElement>(null);

  useScrollFrame(() => {
    if (!heroImgRef.current || prefersReducedMotion()) return;
    heroImgRef.current.style.transform = `translate3d(0,${Math.min(window.scrollY, 800) * 0.12}px,0)`;
  });

  if (!service) return null;
  const title = tField(service, "title", locale);
  const hero = service.hero;
  const valor = service.valor;
  const cards = ((valor?.cards || []).filter(Boolean) as any[]);
  const [desafio, solucion, industrias] = cards;
  const items = ((service.catalogo?.items || []).filter(Boolean) as any[]);
  const marquee = Array.from({ length: 12 }, () => title.toUpperCase());

  return (
    <>
      <section className="relative -mt-[68px] overflow-hidden lg:-mt-[84px] lg:h-[760px]">
        <div className="absolute inset-y-0 right-0 w-full overflow-hidden lg:w-[66%]">
          <div ref={heroImgRef} className="absolute inset-x-0 -top-[10%] h-[120%] will-change-transform" data-tina-field={tinaField(hero, "heroImage")}>
            {hero?.heroImage && <img src={mediaUrl(hero.heroImage)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(247,247,247,.97)_0%,rgba(247,247,247,.9)_55%,rgba(247,247,247,.72)_100%)] lg:bg-[linear-gradient(90deg,#F7F7F7_0%,rgba(247,247,247,.92)_18%,rgba(247,247,247,.35)_42%,rgba(247,247,247,0)_62%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[180px] bg-[linear-gradient(180deg,rgba(247,247,247,.85),rgba(247,247,247,0))]" />
        </div>
        <div className="fx-container relative flex flex-col pb-12 pt-24 lg:h-full lg:justify-center lg:pb-0 lg:pt-[84px]">
          <div className="max-w-[560px]">
            <SolutionsBreadcrumb locale={locale} trail={[{ label: title }]} />
            <h1
              data-reveal="up"
              {...REVEAL}
              data-reveal-delay="0.08"
              className="mb-0 mt-4 text-[35px] font-medium leading-[1.1] tracking-[-.03em] text-fx-ink [text-wrap:balance] lg:text-[52px]"
              data-tina-field={tinaField(hero, "heading")}
            >
              {tField(hero, "heading", locale)}
            </h1>
            <p
              data-reveal="up"
              {...REVEAL}
              data-reveal-delay="0.16"
              className="mb-0 mt-5 max-w-[500px] text-[16px] leading-[1.6] text-fx-ink [text-wrap:pretty] lg:mt-7 lg:text-[17px] lg:leading-[1.65] lg:text-fx-body"
              data-tina-field={tinaField(hero, "intro")}
            >
              {tField(hero, "intro", locale)}
            </p>
            <div data-reveal="up" {...REVEAL} data-reveal-delay="0.24" className="mt-8 flex lg:mt-10">
              <PillLink href="#catalogo" iconSide="left" size="lg" className="!pr-5 lg:!pr-7" data-tina-field={tinaField(hero, "ctaLabel")}>
                {tField(hero, "ctaLabel", locale) || t("sol.vermas", locale)}
              </PillLink>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-[2] overflow-hidden bg-fx-ink" aria-hidden="true">
        <div className="fx-marquee flex w-max" style={{ "--fx-marquee-duration": "38s" } as CSSProperties}>
          {[...marquee, ...marquee].map((word, i) => (
            <div key={i} className="flex items-center gap-4 whitespace-nowrap px-3.5 py-[18px] text-[19px] font-medium tracking-[.02em] text-white lg:gap-7 lg:text-[22px]">
              {word}
              <span className="h-2 w-2 rounded-full bg-fx-lilac-strong" />
            </div>
          ))}
        </div>
      </div>

      {valor && (
        <section className="fx-container mt-[72px] lg:mt-[120px]">
          <div data-reveal="up" {...REVEAL} className="text-center">
            <h2
              className="m-0 text-[34px] font-medium leading-[1.1] tracking-[-.025em] text-fx-purple [text-wrap:balance] lg:text-[52px]"
              data-tina-field={tinaField(valor, "title")}
            >
              {tField(valor, "title", locale)}
            </h2>
            <p className="mx-auto mb-0 mt-[18px] max-w-[620px] text-[17px] leading-[1.6] text-fx-ink" data-tina-field={tinaField(valor, "subtitle")}>
              {tField(valor, "subtitle", locale)}
            </p>
          </div>
          <div className="mt-[34px] grid gap-5 lg:mt-14 lg:grid-cols-3">
            {desafio && (
              <div data-reveal="up" {...REVEAL} className={`${CARD} bg-[#EFEDEF]`} data-tina-field={tinaField(desafio, "heading")}>
                <CornerArrow tone="dark" />
                <div className="flex-1 pb-5 pl-7 pr-[72px] pt-7 lg:pb-0">
                  <h3 className="m-0 text-[22px] font-medium leading-[1.15] tracking-[-.02em] text-fx-ink lg:text-[30px]">{tField(desafio, "heading", locale)}</h3>
                  <p className="mb-0 mt-4 text-[16px] leading-[1.6] text-fx-ink [text-wrap:pretty]">{tField(desafio, "text", locale)}</p>
                </div>
                <div className="relative h-[200px] shrink-0 overflow-hidden rounded-2xl lg:h-[236px] lg:rounded-[22px]">
                  {desafio.image && (
                    <img src={mediaUrl(desafio.image)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-fx-out group-hover/card:scale-105" />
                  )}
                </div>
              </div>
            )}
            {solucion && (
              <a
                href="#catalogo"
                data-reveal="up"
                {...REVEAL}
                data-reveal-delay="0.08"
                className={`${CARD} min-h-[260px] bg-fx-purple text-white hover:text-white`}
                data-tina-field={tinaField(solucion, "heading")}
              >
                <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full border border-white/[.16]" />
                <div className="absolute -right-5 -top-5 h-[200px] w-[200px] rounded-full border border-white/[.12]" />
                <CornerArrow tone="light" />
                <div className="relative mt-auto px-7 pb-7 pt-[76px] lg:pt-0">
                  <h3 className="m-0 text-[22px] font-medium leading-[1.15] tracking-[-.02em] lg:text-[30px]">{tField(solucion, "heading", locale)}</h3>
                  <p className="mb-0 mt-4 text-[16px] leading-[1.6] text-fx-blush [text-wrap:pretty]">{tField(solucion, "text", locale)}</p>
                </div>
              </a>
            )}
            {industrias && (
              <div data-reveal="up" {...REVEAL} data-reveal-delay="0.16" className={`${CARD} bg-fx-ink`} data-tina-field={tinaField(industrias, "heading")}>
                <CornerArrow tone="light" />
                <div className="relative h-[200px] shrink-0 overflow-hidden rounded-2xl lg:h-[236px] lg:rounded-[22px]">
                  {industrias.image && (
                    <img src={mediaUrl(industrias.image)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-fx-out group-hover/card:scale-105" />
                  )}
                </div>
                <div className="mt-auto px-7 pb-7 pt-5 text-white">
                  <h3 className="m-0 text-[22px] font-medium leading-[1.15] tracking-[-.02em] lg:text-[30px]">{tField(industrias, "heading", locale)}</h3>
                  <p className="mb-0 mt-4 text-[16px] leading-[1.6] text-[#E6E3E6] [text-wrap:pretty]">{tField(industrias, "text", locale)}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {items.length > 0 && (
        <section id="catalogo" className="fx-container mt-[84px] scroll-mt-28 lg:mt-[140px]">
          <div data-reveal="up" {...REVEAL} className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div>
              <Eyebrow className="!text-[13px]">{t("catalogo.eyebrow", locale)}</Eyebrow>
              <h2 className="mb-0 mt-[18px] text-[34px] font-medium leading-[1.1] tracking-[-.025em] text-fx-ink [text-wrap:balance] lg:text-[48px]">
                {t("catalogo.titlePrefix", locale)} <span className="font-semibold text-fx-purple">{title}</span>
              </h2>
            </div>
            <p className="m-0 max-w-[340px] text-[16px] leading-[1.6] text-fx-body">{t("catalogo.text", locale)}</p>
          </div>
          <div className="mt-[34px] grid gap-5 lg:mt-14 lg:grid-cols-3">
            {items.map((item, i) => (
              <a
                key={i}
                href={localizeHref(item.url, locale)}
                data-reveal="up"
                {...REVEAL}
                className="group/sol flex min-h-[240px] flex-col rounded-[24px] border border-fx-line bg-white p-7 text-fx-ink transition-[transform,border-color,box-shadow] duration-500 ease-fx-spring hover:-translate-y-1.5 hover:border-fx-lilac-strong hover:text-fx-ink hover:shadow-[0_30px_60px_-30px_rgba(150,33,122,.4)] lg:min-h-[280px] lg:rounded-[28px] lg:p-9"
                data-tina-field={tinaField(item, "title")}
              >
                <h3 className="m-0 text-[22px] font-medium leading-[1.25] tracking-[-.01em] transition-colors duration-300 group-hover/sol:text-fx-purple lg:text-[24px]">
                  {tField(item, "title", locale)}
                </h3>
                <p className="mb-0 mt-3.5 text-[15px] leading-[1.6] text-fx-body [text-wrap:pretty]">{tField(item, "description", locale)}</p>
                <div className="mt-auto flex items-center justify-between pt-7">
                  <span className="text-[14px] font-medium text-fx-purple">{t("catalogo.cta", locale)}</span>
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-fx-line-strong text-fx-ink transition-all duration-[450ms] ease-fx-spring group-hover/sol:-rotate-45 group-hover/sol:border-fx-purple group-hover/sol:bg-fx-purple group-hover/sol:text-white">
                    <ArrowIcon />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
