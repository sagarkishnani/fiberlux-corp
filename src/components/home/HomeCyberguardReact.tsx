import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { localizeHref, tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import { PillLink } from "../shared/fx/FxPrimitives";

interface Props {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  locale?: Locale;
}

function ShieldCheck({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21.5s7.5-3.4 7.5-9.5V5.6L12 3 4.5 5.6V12c0 6.1 7.5 9.5 7.5 9.5z" />
      <path d="M9 12.2l2.2 2.2 4-4.2" />
    </svg>
  );
}

export default function HomeCyberguardReact({ query, variables, data: initialData, locale = "es" }: Props) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });
  const banner = data?.home?.cyberguardBanner || initialData?.home?.cyberguardBanner;
  if (!banner) return null;
  const cta = banner.cta;
  const image = mediaUrl(banner.image);

  return (
    <section className="fx-container mt-10 lg:mt-[60px]">
      <div
        data-reveal="up"
        data-reveal-distance="56"
        data-reveal-duration="1.2"
        className="relative overflow-hidden rounded-[24px] border border-fx-line bg-gradient-to-b from-white to-fx-soft lg:grid lg:min-h-[540px] lg:grid-cols-2 lg:rounded-[32px] lg:shadow-[0_30px_80px_-40px_rgba(150,33,122,.25)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[130px] -ml-[210px] -mt-[210px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(150,33,122,.55)_0%,rgba(170,60,140,.35)_30%,rgba(213,167,202,.18)_58%,rgba(247,247,247,0)_100%)] lg:left-1/4 lg:top-1/2 lg:-ml-[380px] lg:-mt-[380px] lg:h-[760px] lg:w-[760px] lg:bg-[radial-gradient(closest-side,rgba(150,33,122,.62)_0%,rgba(170,60,140,.42)_30%,rgba(213,167,202,.22)_58%,rgba(247,247,247,0)_100%)]"
        />
        <div className="relative grid h-[260px] place-items-center lg:h-auto">
          {image ? (
            <img src={image} alt="" loading="lazy" className="relative max-h-[80%] max-w-[80%] object-contain" />
          ) : (
            <>
              <div className="absolute h-[220px] w-[220px] rounded-full bg-[rgba(150,33,122,.10)] lg:h-[400px] lg:w-[400px]" />
              <div className="absolute h-[152px] w-[152px] rounded-full bg-[rgba(150,33,122,.16)] lg:h-[272px] lg:w-[272px]" />
              <div className="fx-breath relative grid h-[104px] w-[104px] place-items-center rounded-[30px] border-[3px] border-fx-lilac bg-white text-fx-purple lg:h-[184px] lg:w-[184px] lg:rounded-[52px]">
                <span className="lg:hidden">
                  <ShieldCheck size={40} />
                </span>
                <span className="hidden lg:block">
                  <ShieldCheck size={60} />
                </span>
              </div>
            </>
          )}
        </div>
        <div className="relative flex flex-col justify-center px-6 pb-7 pt-1 lg:py-16 lg:pl-6 lg:pr-20">
          {banner.brand && (
            <div className="flex items-center gap-2.5 text-[18px] font-semibold tracking-[-.01em] text-fx-ink lg:text-[22px]" data-tina-field={tinaField(banner as any, "brand")}>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-fx-purple text-white lg:h-8 lg:w-8 lg:rounded-[9px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              {banner.brand}
            </div>
          )}
          <div className="mt-6 font-mono text-[12px] font-medium tracking-[.3em] text-fx-ink lg:mt-10 lg:text-[14px] lg:tracking-[.35em]" data-tina-field={tinaField(banner as any, "eyebrow")}>
            {tField(banner, "eyebrow", locale)}
          </div>
          <h2
            className="mb-0 mt-3 text-[30px] font-medium leading-[1.12] tracking-[-.02em] text-fx-purple lg:mt-4 lg:text-[48px] lg:leading-[1.1]"
            data-tina-field={tinaField(banner as any, "title")}
          >
            {tField(banner, "title", locale)}
          </h2>
          <p className="mb-0 mt-3.5 text-[15px] leading-[1.6] text-fx-body lg:mt-5 lg:max-w-[420px] lg:text-[16px]" data-tina-field={tinaField(banner as any, "text")}>
            {tField(banner, "text", locale)}
          </p>
          {cta?.label && (
            <div className="mt-6 flex flex-col lg:mt-9 lg:block">
              <PillLink href={localizeHref(cta.href, locale)} iconSide="left" size="lg" className="!pr-5 lg:h-[52px] lg:!pr-[26px]" data-tina-field={tinaField(cta as any, "label")}>
                {tField(cta, "label", locale)}
              </PillLink>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
