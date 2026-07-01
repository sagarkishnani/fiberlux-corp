import { useEffect, useRef } from "react";
import type { Caso } from "./CasoCard";

interface VideoModalProps {
  caso: Caso | null;
  onClose: () => void;
}

/** Extracts the YouTube video id from the common URL shapes. */
function youtubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
    /[?&]v=([A-Za-z0-9_-]{6,})/,
    /youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function VideoModal({ caso, onClose }: VideoModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = caso !== null;

  /* ── Esc to close + body scroll lock while open ── */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!caso) return null;

  const ytId = caso.youtubeUrl?.trim() ? youtubeId(caso.youtubeUrl.trim()) : null;
  const mp4 = caso.videoFile?.trim() || null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Video del caso de éxito${caso.author ? ` de ${caso.author}` : ""}`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[960px] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar video"
          className="absolute top-3 right-3 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/15 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {ytId ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
            title="Video del caso de éxito"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : mp4 ? (
          <video
            className="absolute inset-0 w-full h-full"
            src={mp4}
            controls
            autoPlay
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
            Video no disponible
          </div>
        )}
      </div>
    </div>
  );
}
