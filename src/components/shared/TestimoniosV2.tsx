import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { tinaField } from "tinacms/dist/react";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import { renderEmphasis } from "../../utils/emphasis";
import { Eyebrow, PlayIcon } from "./fx/FxPrimitives";
import VideoModal, { type VideoModalContent } from "./fx/VideoModal";
import { clamp } from "../home/useScrollFrame";

interface Props {
  items: any[];
  eyebrow: string;
  title: string;
  titleTinaField?: string;
  locale?: Locale;
  sectionClassName?: string;
  children?: ReactNode;
}

const DESKTOP_STEP = 564;

function ArrowButton({ dir, onClick, label, size }: { dir: "prev" | "next"; onClick: () => void; label: string; size: "sm" | "lg" }) {
  const base = size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const tone =
    dir === "prev"
      ? "border border-fx-line-strong bg-white text-fx-ink hover:border-fx-ink hover:bg-fx-ink hover:text-white active:bg-fx-ink active:text-white"
      : "bg-fx-purple text-white hover:bg-fx-purple-hover active:bg-fx-purple-hover";
  return (
    <button type="button" onClick={onClick} aria-label={label} className={`grid place-items-center rounded-full transition-all duration-300 ${base} ${tone}`}>
      <svg width={size === "lg" ? 18 : 16} height={size === "lg" ? 18 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={dir === "prev" ? "M19 12H5M11 6l-6 6 6 6" : "M5 12h14M13 6l6 6-6 6"} />
      </svg>
    </button>
  );
}

export default function TestimoniosV2({
  items,
  eyebrow,
  title,
  titleTinaField,
  locale = "es",
  sectionClassName = "pt-[88px] lg:pt-[140px]",
  children,
}: Props) {

  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const mobileProgressRef = useRef<HTMLDivElement>(null);
  const tx = useRef(0);
  const [video, setVideo] = useState<VideoModalContent | null>(null);
  const closeVideo = useCallback(() => setVideo(null), []);

  const minTx = () => {
    const w = wrapRef.current;
    const tr = trackRef.current;
    return w && tr ? Math.min(0, w.clientWidth - tr.scrollWidth) : 0;
  };

  const updateTrack = () => {
    const w = wrapRef.current;
    const tr = trackRef.current;
    const pr = progressRef.current;
    if (!w || !tr) return;
    tr.style.transform = `translate3d(${tx.current}px,0,0)`;
    if (pr) {
      const frac = clamp(w.clientWidth / tr.scrollWidth, 0.1, 1);
      const min = minTx();
      const pos = min ? tx.current / min : 0;
      pr.style.width = `${frac * 100}%`;
      pr.style.transform = `translateX(${pos * (1 / frac - 1) * 100}%)`;
    }
  };

  const slide = (dir: number) => {
    tx.current = clamp(tx.current - dir * DESKTOP_STEP, minTx(), 0);
    if (trackRef.current) trackRef.current.style.transition = "transform .8s cubic-bezier(.16,1,.3,1)";
    updateTrack();
  };

  const onMobileScroll = () => {
    const tr = mobileTrackRef.current;
    const pr = mobileProgressRef.current;
    if (!tr || !pr) return;
    const max = tr.scrollWidth - tr.clientWidth;
    const frac = clamp(tr.clientWidth / tr.scrollWidth, 0.15, 1);
    pr.style.width = `${frac * 100}%`;
    pr.style.transform = `translateX(${(max ? tr.scrollLeft / max : 0) * (1 / frac - 1) * 100}%)`;
  };

  useEffect(() => {
    const w = wrapRef.current;
    const tr = trackRef.current;
    updateTrack();
    onMobileScroll();
    if (!w || !tr) return;
    let startX = 0;
    let startTx = 0;
    let dragging = false;
    let moved = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      startX = e.clientX;
      startTx = tx.current;
      tr.style.transition = "none";
      w.style.cursor = "grabbing";
      w.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.abs(dx);
      const min = minTx();
      let v = startTx + dx;
      if (v > 0) v *= 0.35;
      if (v < min) v = min + (v - min) * 0.35;
      tx.current = v;
      tr.style.transform = `translate3d(${v}px,0,0)`;
    };
    const end = () => {
      if (!dragging) return;
      dragging = false;
      w.style.cursor = "grab";
      tr.style.transition = "transform .8s cubic-bezier(.16,1,.3,1)";
      tx.current = clamp(tx.current, minTx(), 0);
      updateTrack();
    };
    const clickGuard = (e: MouseEvent) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    w.addEventListener("pointerdown", down);
    w.addEventListener("pointermove", move);
    w.addEventListener("pointerup", end);
    w.addEventListener("pointercancel", end);
    w.addEventListener("click", clickGuard, true);
    window.addEventListener("resize", updateTrack);
    return () => {
      w.removeEventListener("pointerdown", down);
      w.removeEventListener("pointermove", move);
      w.removeEventListener("pointerup", end);
      w.removeEventListener("pointercancel", end);
      w.removeEventListener("click", clickGuard, true);
      window.removeEventListener("resize", updateTrack);
    };
  }, []);

  if (!items.length) return null;

  const open = (item: any) =>
    setVideo({
      title: `${t("testimonios.caseTitle", locale)} ${item.company || ""}`.trim(),
      youtubeUrl: item.youtubeUrl,
      cover: mediaUrl(item.cover),
      footerLogo: mediaUrl(item.logo),
      footerName: item.name,
      footerRole: tField(item, "role", locale),
    });

  const card = (item: any, i: number, mobile: boolean) => (
    <article
      key={i}
      onClick={mobile ? undefined : () => open(item)}
      className={
        mobile
          ? "flex w-[316px] shrink-0 snap-start flex-col rounded-[22px] border border-fx-line bg-white px-2.5 pb-5 pt-2.5"
          : "group/card flex w-[460px] shrink-0 cursor-pointer flex-col rounded-[24px] border border-fx-line bg-white px-3.5 pb-[26px] pt-3.5 shadow-[0_1px_2px_rgba(17,12,16,.04)] transition-[transform,box-shadow,border-color] duration-500 ease-fx-spring hover:-translate-y-2 hover:border-fx-line-strong hover:shadow-[0_30px_60px_-30px_rgba(150,33,122,.35)]"
      }
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          open(item);
        }}
        aria-label={t("casos.vervideo", locale)}
        className={`relative block aspect-video w-full overflow-hidden bg-[#F2EEF1] ${mobile ? "rounded-[14px]" : "rounded-2xl"}`}
      >
        {item.cover && (
          <img
            src={mediaUrl(item.cover)}
            alt={item.company || ""}
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-fx-out group-hover/card:scale-105"
          />
        )}
        <span
          className={`absolute left-1/2 top-1/2 grid place-items-center rounded-full bg-fx-purple text-white transition-transform duration-[400ms] ease-fx-spring group-hover/card:scale-[1.08] ${
            mobile ? "-ml-6 -mt-6 h-12 w-12 shadow-[0_0_0_8px_rgba(150,33,122,.18)]" : "-ml-7 -mt-7 h-14 w-14 shadow-[0_0_0_10px_rgba(150,33,122,.16)]"
          }`}
        >
          <PlayIcon size={mobile ? 18 : 20} />
        </span>
      </button>
      <div className={`flex flex-1 flex-col ${mobile ? "px-2.5 pt-[18px]" : "px-3.5 pt-6"}`}>
        <div className={`flex items-center ${mobile ? "h-9" : "h-10"}`} data-tina-field={tinaField(item, "logo")}>
          {item.logo && <img src={mediaUrl(item.logo)} alt={item.company || ""} draggable={false} className="block max-h-[34px] w-auto max-w-[120px] lg:max-h-10 lg:max-w-[140px]" />}
        </div>
        <div className="flex-1">
          <h3
            className={`mb-0 font-medium leading-[1.4] text-fx-ink [text-wrap:pretty] ${mobile ? "mt-3.5 text-[16px]" : "mt-5 text-[18px] tracking-[-.01em]"}`}
            data-tina-field={tinaField(item, "quote")}
          >
            {tField(item, "quote", locale)}
          </h3>
          <p className={`mb-0 leading-[1.6] text-fx-body [text-wrap:pretty] ${mobile ? "mt-2 text-[13px]" : "mt-2.5 text-[14px]"}`} data-tina-field={tinaField(item, "description")}>
            {tField(item, "description", locale)}
          </p>
        </div>
        <div className={`border-t border-fx-soft ${mobile ? "mt-4 pt-3.5" : "mt-[22px] pt-[18px]"}`}>
          <div className={`font-semibold text-fx-ink ${mobile ? "text-[14px]" : "text-[15px]"}`}>{item.name}</div>
          <div className={`mt-0.5 text-fx-muted ${mobile ? "text-[12px]" : "text-[13px]"}`}>{tField(item, "role", locale)}</div>
        </div>
      </div>
    </article>
  );

  return (
    <section id="testimonios" className={sectionClassName}>
      <div className="fx-container">
        <div className="lg:flex lg:items-end lg:justify-between">
          <div data-reveal="up" data-reveal-distance="56" data-reveal-duration="1.2" data-reveal-ease="fx">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2
              className="mb-0 mt-3.5 text-[32px] font-normal leading-[1.12] tracking-[-.02em] text-fx-ink lg:mt-[18px] lg:max-w-[520px] lg:text-[48px] lg:leading-[1.1]"
              data-tina-field={titleTinaField}
            >
              {renderEmphasis(title)}
            </h2>
          </div>
          <div className="hidden gap-3 lg:flex">
            <ArrowButton dir="prev" size="lg" onClick={() => slide(-1)} label={t("slider.prev", locale)} />
            <ArrowButton dir="next" size="lg" onClick={() => slide(1)} label={t("slider.next", locale)} />
          </div>
        </div>
        <div
          ref={wrapRef}
          data-reveal="up"
          data-reveal-distance="56"
          data-reveal-duration="1.2"
          data-reveal-ease="fx"
          data-reveal-delay="0.12"
          className="mt-14 hidden cursor-grab select-none touch-pan-y lg:block"
        >
          <div ref={trackRef} className="flex w-max gap-6 pb-6 pt-3 transition-transform duration-[800ms] ease-fx-out">
            {items.map((item, i) => card(item, i, false))}
          </div>
        </div>
        <div className="mt-4 hidden h-0.5 overflow-hidden rounded-sm bg-fx-line lg:block">
          <div ref={progressRef} className="h-full w-[30%] rounded-sm bg-fx-purple transition-[transform,width] duration-[800ms] ease-fx-out" />
        </div>
      </div>

      <div
        ref={mobileTrackRef}
        onScroll={onMobileScroll}
        className="fx-no-scrollbar mt-7 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 pt-1 lg:hidden"
      >
        {items.map((item, i) => card(item, i, true))}
      </div>
      <div className="fx-container mt-4 flex items-center justify-between gap-5 lg:hidden">
        <div className="h-0.5 flex-1 overflow-hidden rounded-sm bg-fx-line">
          <div ref={mobileProgressRef} className="h-full w-1/3 rounded-sm bg-fx-purple transition-transform duration-300" />
        </div>
        <div className="flex gap-2">
          <ArrowButton dir="prev" size="sm" onClick={() => mobileTrackRef.current?.scrollBy({ left: -328, behavior: "smooth" })} label={t("slider.prev", locale)} />
          <ArrowButton dir="next" size="sm" onClick={() => mobileTrackRef.current?.scrollBy({ left: 328, behavior: "smooth" })} label={t("slider.next", locale)} />
        </div>
      </div>

      {children}
      <VideoModal content={video} onClose={closeVideo} moreVideosLabel={t("video.more", locale)} closeLabel={t("video.close", locale)} />
    </section>
  );
}
