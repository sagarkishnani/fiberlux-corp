import { useCallback, useEffect, useRef, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import { t } from "../../i18n/ui";
import { PlayIcon } from "../shared/fx/FxPrimitives";
import VideoModal, { type VideoModalContent } from "../shared/fx/VideoModal";
import { clamp, easeOutCubic, isDesktop, prefersReducedMotion, useScrollFrame } from "./useScrollFrame";

interface Props {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  locale?: Locale;
}

function withBase(path?: string | null): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return mediaUrl(path) || `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;
}

export function pickLoopSource(reel: Record<string, any>): string {
  const desktop = isDesktop();
  const webm = document.createElement("video").canPlayType('video/webm; codecs="vp9"') !== "";
  const order = desktop
    ? webm ? ["loopWebm1080", "loopMp41080"] : ["loopMp41080", "loopWebm1080"]
    : webm ? ["loopWebm720", "loopMp4720", "loopWebm1080", "loopMp41080"] : ["loopMp4720", "loopMp41080"];
  const key = order.find((k) => reel[k]);
  return key ? withBase(reel[key]) : "";
}

export default function HomeReelReact({ query, variables, data: initialData, locale = "es" }: Props) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });
  const reel = (data?.home?.reel || initialData?.home?.reel) as Record<string, any> | null | undefined;
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [fullVideo, setFullVideo] = useState<VideoModalContent | null>(null);
  const closeFullVideo = useCallback(() => {
    setFullVideo(null);
    videoRef.current?.play().catch(() => {});
  }, []);

  useScrollFrame(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    if (!section || !card) return;
    const reduced = prefersReducedMotion();
    const desktop = isDesktop();
    const H = window.innerHeight;
    const rect = section.getBoundingClientRect();
    const p = reduced ? 1 : easeOutCubic(clamp(-rect.top / Math.max(1, rect.height - H), 0, 1));
    if (desktop) {
      const it = 6 * (1 - p), ib = 42 * (1 - p), ix = 28 * (1 - p), rad = 28 * (1 - p);
      card.style.clipPath = `inset(${it}% ${ix}% ${ib}% ${ix}% round ${rad}px)`;
      if (videoRef.current) videoRef.current.style.transform = `scale(${1.18 - 0.18 * p})`;
    } else {
      const iv = 24 * (1 - p), ix = 16 * (1 - p), rad = 24 * (1 - p);
      card.style.clipPath = `inset(${iv}% ${ix}px ${iv}% ${ix}px round ${rad}px)`;
      if (videoRef.current) videoRef.current.style.transform = `scale(${1.15 - 0.15 * p})`;
    }
    if (reduced) return;
    const travel = desktop ? 900 : 500;
    const raw = clamp((H - rect.top) / (rect.height + H), 0, 1);
    if (topRef.current) topRef.current.style.transform = `translate3d(${-raw * travel}px,0,0)`;
    if (bottomRef.current) bottomRef.current.style.transform = `translate3d(${-travel + raw * travel}px,0,0)`;
  });

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video || !reel) return;
    video.muted = true;
    let loaded = false;
    const load = () => {
      if (loaded) return;
      const src = pickLoopSource(reel);
      if (!src) return;
      loaded = true;
      video.src = src;
      video.preload = "auto";
    };
    const near = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && (load(), near.disconnect()),
      { rootMargin: "50% 0px" }
    );
    const visible = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          load();
          video.play().catch(() => {});
        } else video.pause();
      });
    });
    near.observe(section);
    visible.observe(section);
    return () => {
      near.disconnect();
      visible.disconnect();
    };
  }, [reel]);

  if (!reel) return null;
  const poster = withBase(reel.poster);
  const fullLabel = tField(reel, "fullVideoLabel", locale);
  const hasFullVideo = !!(reel.fullVideoYoutubeUrl || reel.fullVideoMp41080 || reel.fullVideoMp4720);

  const openFullVideo = () => {
    const desktop = isDesktop();
    const file = (desktop ? reel.fullVideoMp41080 : reel.fullVideoMp4720) || reel.fullVideoMp41080 || reel.fullVideoMp4720;
    videoRef.current?.pause();
    setFullVideo({
      title: tField(reel, "fullVideoTitle", locale) || "Fiberlux",
      youtubeUrl: reel.fullVideoYoutubeUrl,
      sources: file ? [{ src: withBase(file), type: "video/mp4" }] : [],
      cover: poster,
    });
  };

  return (
    <section ref={sectionRef} id="reel" className="relative -mt-[12vh] h-[150vh] lg:mt-6 lg:h-[240vh]">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-1.5 lg:gap-2">
          <div
            ref={topRef}
            className="whitespace-nowrap text-[64px] font-semibold leading-none tracking-[-.03em] text-fx-line will-change-transform lg:text-[120px]"
            data-tina-field={tinaField(reel as any, "marqueeTop")}
          >
            {tField(reel, "marqueeTop", locale)}
          </div>
          <div
            ref={bottomRef}
            className="whitespace-nowrap text-[64px] font-semibold leading-none tracking-[-.03em] text-transparent will-change-transform [-webkit-text-stroke:1.2px_#D5A7CA] lg:text-[120px] lg:[-webkit-text-stroke:1.5px_#D5A7CA]"
            data-tina-field={tinaField(reel as any, "marqueeBottom")}
          >
            {tField(reel, "marqueeBottom", locale)}
          </div>
        </div>
        <div
          ref={cardRef}
          className="absolute inset-0 bg-fx-night will-change-[clip-path] [clip-path:inset(24%_16px_24%_16px_round_24px)] lg:[clip-path:inset(6%_28%_42%_28%_round_28px)]"
        >
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="none"
            poster={poster || undefined}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-[1.15] object-cover will-change-transform lg:scale-[1.18]"
          />
        </div>
        {hasFullVideo && fullLabel && (
          <button
            type="button"
            onClick={openFullVideo}
            className="group/play absolute bottom-[14vh] left-1/2 z-[2] inline-flex h-[52px] -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-white py-0 pl-1.5 pr-6 text-[15px] font-medium text-fx-ink shadow-[0_20px_40px_-20px_rgba(17,12,16,.45)] transition-[background,color] duration-300 hover:bg-fx-purple hover:text-white lg:bottom-[8vh] lg:h-14 lg:pl-2 lg:pr-7"
            data-tina-field={tinaField(reel as any, "fullVideoLabel")}
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-fx-purple text-white transition-[transform,background] duration-[450ms] ease-fx-spring group-hover/play:scale-[1.08] group-hover/play:bg-white group-hover/play:text-fx-purple">
              <PlayIcon size={16} />
            </span>
            {fullLabel}
          </button>
        )}
      </div>
      <VideoModal
        content={fullVideo}
        onClose={closeFullVideo}
        moreVideosLabel={t("video.more", locale)}
        closeLabel={t("video.close", locale)}
      />
    </section>
  );
}
