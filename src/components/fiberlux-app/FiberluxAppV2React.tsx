import { useCallback, useRef, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown, type Components } from "tinacms/dist/rich-text";
import type { FiberluxAppQuery, FiberluxAppQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { richField, tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import { renderEmphasis } from "../../utils/emphasis";
import { isDesktop, prefersReducedMotion, useScrollFrame } from "../home/useScrollFrame";
import { Eyebrow, PlayIcon } from "../shared/fx/FxPrimitives";
import { Breadcrumb } from "../shared/fx/PageHero";
import PageHeroBackdrop from "../shared/fx/PageHeroBackdrop";
import VideoModal, { type VideoModalContent } from "../shared/fx/VideoModal";

interface Props {
  query: string;
  variables: FiberluxAppQueryVariables;
  data: FiberluxAppQuery;
  locale?: Locale;
}

const REVEAL = { "data-reveal-distance": "56", "data-reveal-duration": "1.2", "data-reveal-ease": "fx" } as const;

const STORES: Record<string, { name: string; icon: string; size: number }> = {
  appstore: {
    name: "App Store",
    size: 22,
    icon: "M16.37 12.76c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-2.99-.79-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.89 1.15 9.14.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.39-.92-2.4-3.66zM14.1 6.02c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28z",
  },
  googleplay: {
    name: "Google Play",
    size: 20,
    icon: "M4.6 2.3a1 1 0 0 0-.6.9v17.6a1 1 0 0 0 .6.9L14 12 4.6 2.3zM15.4 13.4l2.4 2.4-10.6 6 8.2-8.4zM15.4 10.6L7.2 2.2l10.6 6-2.4 2.4zM18.9 9.1l2.6 1.5a1.6 1.6 0 0 1 0 2.8l-2.6 1.5-2.6-2.9 2.6-2.9z",
  },
};

const BENEFIT_ICONS: Record<string, string> = {
  monitoreo: "M22 12h-4l-3 9L9 3l-3 9H2",
  sedes: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6",
  diagnostico: "M21 21l-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8 11h6M11 8v6",
  factura: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15l3 3 3-3",
  ticket: "M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z",
  reloj: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  red: "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01",
  escudo: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
  grafico: "M3 3v18h18M7 15l4-4 3 3 5-6",
  generico: "M20 6L9 17l-5-5",
};

/* El último bloque de beneficios (2 cards) ocupa media fila cada uno; los anteriores un tercio (6 columnas del prototipo). */
function benefitSpan(index: number, total: number): string {
  const lastRowStart = total - (total % 3 === 2 ? 2 : total % 3 === 1 ? 1 : 0);
  const mobileFull = total % 2 === 1 && index === total - 1 ? "col-span-2" : "";
  if (index >= lastRowStart && total % 3 !== 0) return `${mobileFull} ${total % 3 === 2 ? "lg:col-span-3" : "lg:col-span-6"}`;
  return `${mobileFull} lg:col-span-2`;
}

const bodyComponents: Components<{}> = {
  p: (props: any) => <span>{props.children}</span>,
  bold: (props: any) => <strong className="font-semibold text-white">{props.children}</strong>,
};

export default function FiberluxAppV2React({ query, variables, data: initialData, locale = "es" }: Props) {
  const { data } = useTina<FiberluxAppQuery>({ query, variables, data: initialData });
  const [video, setVideo] = useState<VideoModalContent | null>(null);
  const closeVideo = useCallback(() => setVideo(null), []);
  const phoneRef = useRef<HTMLImageElement>(null);
  const mockRef = useRef<HTMLImageElement>(null);

  useScrollFrame(() => {
    if (prefersReducedMotion()) return;
    const y = window.scrollY;
    if (phoneRef.current) phoneRef.current.style.transform = isDesktop() ? `translate3d(0,${Math.min(y, 700) * -0.06}px,0)` : "";
    const mock = mockRef.current;
    if (mock) {
      const rect = mock.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, 1 - rect.top / window.innerHeight));
      mock.style.transform = `translate3d(0,${(1 - progress) * 60}px,0)`;
    }
  });

  const app = (data?.fiberluxApp || initialData?.fiberluxApp) as any;
  if (!app) return null;
  const hero = app.hero || {};
  const downloads = ((hero.downloads || []).filter(Boolean) as any[]);
  const beneficios = app.beneficios;
  const benefits = ((beneficios?.items || []).filter(Boolean) as any[]);
  const showcase = app.videoShowcase;
  const videoUrl = showcase?.videoUrl?.trim() || "";
  const showcaseImage = mediaUrl(showcase?.imageDesktop);

  return (
    <>
      <section className="relative overflow-clip pt-[30px] lg:pt-[72px]">
        <PageHeroBackdrop />
        <div className="fx-container relative grid items-center gap-[29px] lg:min-h-[620px] lg:grid-cols-2 lg:gap-16">
          <div>
            <Breadcrumb crumb={tField(hero, "heading", locale) || "Fiberlux App"} locale={locale} />
            <h1
              data-reveal="up"
              {...REVEAL}
              data-reveal-delay="0.08"
              className="mb-0 mt-4 text-[43px] font-semibold leading-[1.02] tracking-[-.04em] text-fx-ink lg:text-[72px]"
              data-tina-field={tinaField(hero, "heading")}
            >
              {tField(hero, "heading", locale)}
            </h1>
            <p
              data-reveal="up"
              {...REVEAL}
              data-reveal-delay="0.14"
              className="mb-0 mt-6 max-w-[520px] text-[18px] font-medium leading-[1.35] tracking-[-.01em] text-fx-purple [text-wrap:balance] lg:text-[26px]"
              data-tina-field={tinaField(hero, "description")}
            >
              {tField(hero, "description", locale)}
            </p>
            <p
              data-reveal="up"
              {...REVEAL}
              data-reveal-delay="0.2"
              className="mb-0 mt-5 max-w-[500px] text-[17px] leading-[1.65] text-fx-body [text-wrap:pretty]"
              data-tina-field={tinaField(hero, "note")}
            >
              {tField(hero, "note", locale)}
            </p>
            {downloads.length > 0 && (
              <div data-reveal="up" {...REVEAL} data-reveal-delay="0.26" className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {downloads.map((download, i) => {
                  const store = STORES[download.store] || STORES.appstore;
                  const label = tField(download, "label", locale) || "";
                  const lead = label.replace(store.name, "").trim();
                  return (
                    <a
                      key={i}
                      href={download.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-[60px] items-center gap-3 rounded-2xl bg-[#2B252C] pl-5 pr-6 text-white transition-transform duration-[400ms] ease-fx-out hover:-translate-y-[3px] hover:text-white"
                      data-tina-field={tinaField(download, "label")}
                    >
                      <svg width={store.size} height={store.size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d={store.icon} />
                      </svg>
                      <span className="flex flex-col leading-[1.15]">
                        {lead && <span className="text-[11px] text-fx-line-strong">{lead}</span>}
                        <span className="text-[17px] font-semibold">{store.name}</span>
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <div data-reveal="scale" data-reveal-duration="1.2" data-reveal-ease="fx" className="relative -mb-px flex h-[300px] items-start justify-center overflow-hidden lg:mb-0 lg:grid lg:h-auto lg:place-items-center lg:overflow-visible">
            <div className="absolute h-[347px] w-full rounded-full bg-[radial-gradient(closest-side,rgba(150,33,122,.32),rgba(213,167,202,.16)_55%,rgba(247,247,247,0))] lg:h-[560px] lg:w-[560px]" />
            {hero.mockup && (
              <img
                ref={phoneRef}
                src={mediaUrl(hero.mockup)}
                alt={tField(hero, "heading", locale)}
                className="relative block h-auto w-[250px] drop-shadow-[0_50px_60px_rgba(101,13,74,.35)] will-change-transform lg:w-[330px]"
                data-tina-field={tinaField(hero, "mockup")}
              />
            )}
          </div>
        </div>
      </section>

      {benefits.length > 0 && (
        <section className="fx-container mt-[72px] lg:mt-[120px]">
          <div data-reveal="up" {...REVEAL}>
            <Eyebrow className="!text-[13px]">[ {(tField(beneficios, "title", locale) || t("beneficios.eyebrow", locale)).toUpperCase()} ]</Eyebrow>
            <h2
              className="mb-0 mt-[18px] text-[33px] font-medium leading-[1.1] tracking-[-.025em] text-fx-ink [text-wrap:balance] lg:text-[48px]"
              data-tina-field={tinaField(beneficios, "heading")}
            >
              {renderEmphasis(tField(beneficios, "heading", locale) || tField(beneficios, "title", locale))}
            </h2>
          </div>
          <div className="mt-[34px] grid grid-cols-2 gap-5 lg:mt-14 lg:grid-cols-6">
            {benefits.map((item, i) => (
              <div
                key={i}
                data-reveal="up"
                {...REVEAL}
                data-reveal-delay={String((i % 3) * 0.08)}
                className={`group/benefit flex flex-col gap-[22px] rounded-[28px] border border-fx-line bg-white p-5 transition-[transform,border-color,box-shadow] duration-500 ease-fx-spring hover:-translate-y-1.5 hover:border-fx-lilac-strong hover:shadow-[0_30px_60px_-30px_rgba(150,33,122,.4)] lg:min-h-[240px] lg:gap-12 lg:p-9 ${benefitSpan(i, benefits.length)}`}
                data-tina-field={tinaField(item, "text")}
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FAF0F6] text-fx-purple transition-colors duration-[400ms] group-hover/benefit:bg-fx-purple group-hover/benefit:text-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={BENEFIT_ICONS[item.icon || ""] || BENEFIT_ICONS.generico} />
                  </svg>
                </div>
                <p className="m-0 max-w-[440px] text-[18px] font-medium leading-[1.45] text-fx-ink [text-wrap:pretty] lg:text-[19px]">{tField(item, "text", locale)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {showcase && (
        <section className="fx-container mt-[84px] lg:mt-[140px]">
          <div
            data-reveal="up"
            {...REVEAL}
            className="relative overflow-hidden rounded-[24px] bg-[#3C0E30] px-6 pt-12 text-center text-white lg:rounded-[40px] lg:px-20 lg:pt-[88px]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_100%,rgba(194,52,154,.5),rgba(60,14,48,0)_70%)]" />
            <h2
              className="relative mx-auto my-0 max-w-[820px] text-[30px] font-medium leading-[1.08] tracking-[-.03em] [text-wrap:balance] lg:text-[52px]"
              data-tina-field={tinaField(showcase, "heading")}
            >
              {tField(showcase, "heading", locale)}
            </h2>
            <p className="relative mx-auto mb-0 mt-6 max-w-[620px] text-[16px] leading-[1.6] text-fx-blush-soft lg:text-[18px]" data-tina-field={tinaField(showcase, "body")}>
              <TinaMarkdown content={richField(showcase, "body", locale)} components={bodyComponents} />
            </p>
            {videoUrl && (
              <div className="relative mt-9 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVideo({ title: tField(showcase, "heading", locale), youtubeUrl: videoUrl })}
                  className="group/play inline-flex h-14 items-center gap-3.5 rounded-full bg-white pl-2 pr-7 text-[15px] font-semibold text-fx-purple-deep transition-colors duration-300 hover:bg-fx-blush"
                  data-tina-field={tinaField(showcase, "buttonLabel")}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-fx-purple text-white transition-transform duration-[400ms] group-hover/play:scale-110">
                    <PlayIcon size={14} />
                  </span>
                  {tField(showcase, "buttonLabel", locale) || t("video.watch", locale)}
                </button>
              </div>
            )}
            {showcaseImage && (
              <img
                ref={mockRef}
                src={showcaseImage}
                alt=""
                loading="lazy"
                className="relative mx-auto -mb-[6%] mt-12 block h-auto w-full max-w-[1000px] will-change-transform lg:w-[86%]"
                data-tina-field={tinaField(showcase, "imageDesktop")}
              />
            )}
          </div>
        </section>
      )}

      <VideoModal content={video} onClose={closeVideo} moreVideosLabel={t("video.more", locale)} closeLabel={t("video.close", locale)} />
    </>
  );
}
