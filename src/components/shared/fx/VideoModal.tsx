import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, PlayIcon, fxAsset } from "./FxPrimitives";

export interface VideoModalContent {
  title: string;
  subtitle?: string;
  youtubeUrl?: string | null;
  sources?: { src: string; type: string; media?: string }[];
  cover?: string;
  footerLogo?: string;
  footerName?: string;
  footerRole?: string;
}

const YOUTUBE_CHANNEL = "https://www.youtube.com/@fiberlux_peru";

export function youtubeId(url?: string | null): string {
  if (!url) return "";
  const match = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return match ? match[1] : "";
}

export default function VideoModal({
  content,
  onClose,
  moreVideosLabel,
  closeLabel,
}: {
  content: VideoModalContent | null;
  onClose: () => void;
  moreVideosLabel: string;
  closeLabel: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = !!content;

  useEffect(() => {
    if (!open) return;
    const lenis = (window as any).__lenis;
    lenis?.stop?.();
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lenis?.start?.();
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!content || typeof document === "undefined") return null;
  const ytId = youtubeId(content.youtubeUrl);
  const hasSources = !ytId && !!content.sources?.length;

  return createPortal(
    <div
      onClick={onClose}
      className="fx-vm-fade fixed inset-0 z-[140] grid place-items-center bg-[rgba(20,8,17,.72)] p-4 backdrop-blur-[16px] lg:p-12"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={content.title}
        className="fx-vm-pop relative w-full max-w-[1120px] overflow-hidden rounded-[24px] bg-[#1C0F19] shadow-[0_60px_120px_-40px_rgba(0,0,0,.7)] lg:rounded-[32px]"
      >
        <div className="relative aspect-video bg-black">
          {ytId && (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
              title={content.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          )}
          {hasSources && (
            <video controls autoPlay playsInline preload="auto" poster={content.cover} className="absolute inset-0 h-full w-full bg-black object-contain">
              {content.sources!.map((s) => (
                <source key={s.src} src={s.src} type={s.type} media={s.media} />
              ))}
            </video>
          )}
          {!ytId && !hasSources && (
            <>
              {content.cover && <img src={content.cover} alt={content.title} className="absolute inset-0 h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(60,14,48,.25),rgba(28,15,25,.85))]" />
              <a
                href={YOUTUBE_CHANNEL}
                target="_blank"
                rel="noopener"
                aria-label={moreVideosLabel}
                className="absolute left-1/2 top-1/2 -ml-[52px] -mt-[52px] grid h-[104px] w-[104px] place-items-center rounded-full bg-fx-purple text-white shadow-[0_0_0_16px_rgba(150,33,122,.22)] transition-[transform,box-shadow] duration-[450ms] ease-fx-spring hover:scale-[1.08] hover:text-white hover:shadow-[0_0_0_24px_rgba(150,33,122,.18)]"
              >
                <PlayIcon size={30} />
              </a>
            </>
          )}
          {!hasSources && (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-4 bg-gradient-to-b from-[rgba(20,8,17,.75)] to-transparent px-5 py-4 lg:px-7 lg:py-6">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-fx-purple">
                <img src={fxAsset("logo-white.svg")} alt="" className="h-auto w-[34px]" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[17px] font-semibold text-white lg:text-[20px]">{content.title}</div>
                <div className="mt-0.5 text-[14px] text-fx-blush-soft">{content.subtitle || "Fiberlux Perú"}</div>
              </div>
            </div>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute right-4 top-4 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/30 bg-[rgba(20,8,17,.4)] text-white transition-[background,transform] duration-[400ms] ease-fx-spring hover:rotate-90 hover:bg-fx-purple lg:right-[22px] lg:top-[22px]"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-8 lg:py-6">
          <div className="flex min-w-0 items-center gap-5">
            {content.footerLogo ? (
              <div className="flex h-11 items-center rounded-xl bg-white px-3.5">
                <img src={content.footerLogo} alt="" className="block max-h-[30px] w-auto max-w-[120px]" />
              </div>
            ) : (
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-fx-purple">
                <img src={fxAsset("logo-white.svg")} alt="" className="h-auto w-[30px]" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-white">{content.footerName || content.title}</div>
              {content.footerRole && <div className="mt-0.5 text-[13px] text-[#B7A6B3]">{content.footerRole}</div>}
            </div>
          </div>
          <a
            href={YOUTUBE_CHANNEL}
            target="_blank"
            rel="noopener"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2.5 rounded-full border border-white/20 px-5 text-[14px] font-medium text-white transition-[background,border-color] duration-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
          >
            {moreVideosLabel}
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
