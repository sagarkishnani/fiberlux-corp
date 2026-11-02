import { useCallback, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { CasosDeExitoQuery, CasosDeExitoQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import { renderEmphasis } from "../../utils/emphasis";
import PageHero from "../shared/fx/PageHero";
import { Eyebrow } from "../shared/fx/FxPrimitives";
import VideoModal, { type VideoModalContent } from "../shared/fx/VideoModal";
import { CaseCard, caseVideo, type CaseCardData } from "../shared/TestimoniosV2";
import RubrosV2 from "../shared/RubrosV2";

interface Props {
  query: string;
  variables: CasosDeExitoQueryVariables;
  data: CasosDeExitoQuery;
  locale?: Locale;
  stats: any[];
  rubros: any;
}

const FIGURE = /^([+-]?[\d.,]+)\s*(.*)$/;

function fromCaso(item: any, locale: Locale): CaseCardData {
  return {
    company: item.author || "",
    cover: mediaUrl(item.poster),
    logo: mediaUrl(item.logo),
    title: tField(item, "title", locale),
    body: tField(item, "quote", locale),
    name: item.author || "",
    role: tField(item, "role", locale),
    youtubeUrl: item.youtubeUrl,
    titleField: tinaField(item, "title"),
    bodyField: tinaField(item, "quote"),
    logoField: tinaField(item, "logo"),
  };
}

export default function CasosV2React({ query, variables, data: initialData, locale = "es", stats, rubros }: Props) {
  const { data } = useTina<CasosDeExitoQuery>({ query, variables, data: initialData });
  const page = (data?.casosDeExito || initialData?.casosDeExito) as any;
  const [video, setVideo] = useState<VideoModalContent | null>(null);
  const closeVideo = useCallback(() => setVideo(null), []);
  if (!page) return null;
  const cases = ((page.items || []).filter(Boolean) as any[]).map((item) => fromCaso(item, locale));

  return (
    <>
      <PageHero
        variant="soft"
        crumb={tField(page, "breadcrumb", locale) || t("page.casos", locale)}
        title={tField(page, "heading", locale)}
        subtitle={tField(page, "intro", locale)}
        titleTinaField={tinaField(page, "heading")}
        subtitleTinaField={tinaField(page, "intro")}
        locale={locale}
      />

      <section className="relative z-[2] mt-[58px] rounded-t-[24px] bg-white pb-[67px] pt-[50px] lg:mt-24 lg:rounded-t-[40px] lg:pb-40 lg:pt-[120px]">
        <div className="fx-container">
          <div data-reveal="up" data-reveal-distance="56" data-reveal-duration="1.2" data-reveal-ease="fx" className="lg:text-center">
            <Eyebrow className="!text-[13px]">{tField(page, "sectionEyebrow", locale)}</Eyebrow>
            <h2
              className="mx-auto mb-0 mt-[18px] text-[33px] font-normal leading-[1.1] tracking-[-.02em] text-fx-ink lg:max-w-[560px] lg:text-[48px]"
              data-tina-field={tinaField(page, "sectionTitle")}
            >
              {renderEmphasis(tField(page, "sectionTitle", locale))}
            </h2>
          </div>
          <div className="mt-[38px] grid gap-6 lg:mt-16 lg:grid-cols-3">
            {cases.map((caseData, i) => (
              <div key={i} data-reveal="up" data-reveal-distance="56" data-reveal-duration="1.2" data-reveal-ease="fx" className="flex [&>article]:w-full">
                <CaseCard data={caseData} mobile={false} locale={locale} onOpen={() => setVideo(caseVideo(caseData, locale))} />
              </div>
            ))}
          </div>
          {stats.length > 0 && (
            <div
              data-reveal="up"
              data-reveal-distance="56"
              data-reveal-duration="1.2"
              data-reveal-ease="fx"
              className="mt-[58px] grid grid-cols-2 gap-y-7 border-y border-[#E6E3E6] py-6 lg:mt-24 lg:grid-cols-4 lg:gap-y-0 lg:py-12"
            >
              {stats.map((stat, i) => {
                const match = (stat.number || "").trim().match(FIGURE);
                const main = match ? match[1] : stat.number;
                const unit = match ? match[2] : "";
                return (
                  <div
                    key={i}
                    className={`${i % 2 === 0 ? "pr-4" : "border-l border-[#E6E3E6] pl-4"} lg:px-8 ${i === 0 ? "lg:pl-0" : "lg:border-l lg:border-[#E6E3E6]"}`}
                  >
                    <div className="text-[34px] font-light leading-none tracking-[-.03em] text-fx-purple lg:text-[56px]">
                      <span data-count-up className="[font-variant-numeric:tabular-nums]">
                        {main}
                      </span>
                      {unit && <span className="ml-1 text-[18px] font-normal text-fx-ink lg:text-[20px]">{unit}</span>}
                    </div>
                    <div className="mt-3.5 max-w-[220px] text-[14px] leading-[1.5] text-fx-body">{tField(stat, "description", locale)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <RubrosV2 rubros={rubros} locale={locale} className="z-[6] -mt-10" />
      <VideoModal content={video} onClose={closeVideo} moreVideosLabel={t("video.more", locale)} closeLabel={t("video.close", locale)} />
    </>
  );
}
