import { tinaField } from "tinacms/dist/react";
import { tField } from "../../utils/i18n";
import { t } from "../../i18n/ui";
import { mediaUrl } from "../../utils/mediaUrl";
import PageHero from "../shared/fx/PageHero";
import { NosotrosIcon } from "./nosotrosIcons";
import { useAbout, type AboutProps } from "./useAbout";

const REVEAL = { "data-reveal-distance": "56", "data-reveal-duration": "1.2", "data-reveal-ease": "fx" } as const;

export default function NosotrosIntroReact(props: AboutProps) {
  const locale = props.locale || "es";
  const about = useAbout(props);
  if (!about) return null;
  const hero = about.hero;
  const porQue = about.porQue;
  const items = ((porQue?.items || []).filter(Boolean) as any[]);
  const features = ((porQue?.features || []).filter(Boolean) as any[]);

  return (
    <>
      <PageHero
        crumb={t("page.nosotros", locale)}
        title={tField(hero, "title", locale)}
        subtitle={tField(hero, "subtitle", locale)}
        titleTinaField={tinaField(hero, "title")}
        subtitleTinaField={tinaField(hero, "subtitle")}
        locale={locale}
      />

      {porQue && (
        <section className="fx-container relative mt-[66px] lg:mt-[110px]">
          <div data-reveal="up" {...REVEAL} className="rounded-[24px] bg-white lg:rounded-[40px]">
            <div className="px-[27px] pb-[27px] pt-[37px] text-center lg:px-16 lg:pb-16 lg:pt-[88px]">
              <h2
                className="m-0 text-[34px] font-medium leading-[1.1] tracking-[-.025em] text-fx-purple lg:text-[52px]"
                data-tina-field={tinaField(porQue, "title")}
              >
                {tField(porQue, "title", locale)}
              </h2>
            </div>
            <div className="grid border-t border-fx-soft lg:grid-cols-3">
              {items.map((item, i) => (
                <div
                  key={i}
                  className={`group/pq flex flex-col items-center gap-6 px-5 pb-[30px] pt-[27px] text-center lg:px-10 lg:pb-[72px] lg:pt-16 ${
                    i ? "border-t border-fx-soft lg:border-l lg:border-t-0" : ""
                  }`}
                  data-tina-field={tinaField(item, "title")}
                >
                  <div className="grid h-[60px] w-[60px] place-items-center rounded-2xl border border-fx-line bg-white text-fx-purple shadow-[0_6px_14px_-6px_rgba(17,12,16,.14)] transition-all duration-[450ms] ease-fx-spring group-hover/pq:-translate-y-1 group-hover/pq:border-fx-purple group-hover/pq:bg-fx-purple group-hover/pq:text-white">
                    <NosotrosIcon name={item.icon} />
                  </div>
                  <div className="max-w-[300px] text-[21px] font-medium leading-[1.3] tracking-[-.01em] text-[#2B252C] [text-wrap:balance] lg:text-[24px]">
                    {tField(item, "title", locale)}
                  </div>
                  <p className="-mt-2 mb-0 max-w-[280px] text-[15px] leading-[1.6] text-fx-body [text-wrap:pretty]">{tField(item, "text", locale)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-6">
            {features.map((feature, i) => {
              const purple = feature.tone === "purple";
              const imageFirst = i % 2 === 1;
              const text = (
                <div
                  data-reveal="up"
                  {...REVEAL}
                  data-reveal-delay={imageFirst ? "0.08" : undefined}
                  className={`flex flex-col justify-center rounded-[24px] px-[30px] py-[27px] text-white lg:min-h-[460px] lg:rounded-[40px] lg:px-[72px] lg:py-16 ${
                    purple ? "bg-fx-purple" : "bg-fx-ink"
                  }`}
                  data-tina-field={tinaField(feature, "title")}
                >
                  <h3 className="m-0 text-[22px] font-medium leading-[1.05] tracking-[-.025em] [text-wrap:balance] lg:text-[52px]">
                    {tField(feature, "title", locale)}
                  </h3>
                  <p className={`mb-0 mt-6 text-[17px] leading-[1.6] [text-wrap:pretty] ${purple ? "text-fx-blush" : "text-[#E6E3E6]"}`}>
                    {tField(feature, "text", locale)}
                  </p>
                </div>
              );
              const image = (
                <div
                  data-reveal="scale"
                  data-reveal-duration="1.2"
                  data-reveal-ease="fx"
                  className={`group/img relative min-h-[285px] overflow-hidden rounded-[24px] bg-fx-ink lg:min-h-[460px] lg:rounded-[40px]`}
                  data-tina-field={tinaField(feature, "image")}
                >
                  {feature.image && (
                    <img
                      src={mediaUrl(feature.image)}
                      alt={tField(feature, "title", locale)}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-fx-out group-hover/img:scale-105"
                    />
                  )}
                </div>
              );
              return (
                <div
                  key={i}
                  className={`grid gap-6 ${imageFirst ? "lg:grid-cols-[minmax(0,2.05fr)_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,2.05fr)]"}`}
                >
                  {imageFirst ? (
                    <>
                      {image}
                      {text}
                    </>
                  ) : (
                    <>
                      {text}
                      {image}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
