import { tinaField } from "tinacms/dist/react";

export interface Caso {
  poster?: string | null;
  youtubeUrl?: string | null;
  videoFile?: string | null;
  logo?: string | null;
  quote?: string | null;
  author?: string | null;
  role?: string | null;
  badge?: string | null;
}

interface CasoCardProps {
  caso: Caso;
  /** Tina object for `data-tina-field` (the item in the list). */
  tinaItem?: any;
  /** Called when the play button is pressed; only wired when a video exists. */
  onPlay?: () => void;
}

/** A case has a playable video if it has a YouTube URL or an uploaded mp4. */
export function hasVideo(caso: Caso): boolean {
  return Boolean(caso.youtubeUrl?.trim() || caso.videoFile?.trim());
}

/* ── Quote mark icon (matches the design's magenta si:quote-fill) ── */
function QuoteMark() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="#96237A"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M7.5 6C5.015 6 3 8.015 3 10.5S5.015 15 7.5 15c.17 0 .336-.01.5-.03V15c0 1.657-1.343 3-3 3a1 1 0 1 0 0 2c2.761 0 5-2.239 5-5v-4.5C10 8.015 7.985 6 7.5 6Zm9 0C14.015 6 12 8.015 12 10.5S14.015 15 16.5 15c.17 0 .336-.01.5-.03V15c0 1.657-1.343 3-3 3a1 1 0 1 0 0 2c2.761 0 5-2.239 5-5v-4.5C19 8.015 16.985 6 16.5 6Z" />
    </svg>
  );
}

function PlayButton({ onPlay, disabled }: { onPlay?: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onPlay}
      disabled={disabled}
      aria-label={disabled ? "Video no disponible" : "Reproducir video"}
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-14 h-14 rounded-full border border-white/15 backdrop-blur-[4px] transition-all ${
        disabled
          ? "bg-black/40 opacity-40 cursor-default"
          : "bg-black/50 hover:bg-black/70 hover:scale-105 cursor-pointer"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
  );
}

export default function CasoCard({ caso, tinaItem, onPlay }: CasoCardProps) {
  const playable = hasVideo(caso);

  /* ── Video panel (left column / top on mobile) ── */
  const videoPanel = (
    <div className="relative rounded-[14px] overflow-hidden bg-[#0d0d14] w-full h-[280px] md:h-full min-h-[280px]">
      {caso.poster ? (
        <img
          src={caso.poster}
          alt={caso.author || "Caso de éxito"}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          data-tina-field={tinaItem ? tinaField(tinaItem, "poster") : undefined}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1526] to-[#0d0d14]" />
      )}
      <PlayButton onPlay={onPlay} disabled={!playable} />
      {caso.badge && (
        <div
          className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-md bg-black/55 backdrop-blur-[5px] px-2.5 py-1.5"
          data-tina-field={tinaItem ? tinaField(tinaItem, "badge") : undefined}
        >
          <span className="w-[5px] h-[5px] rounded-sm bg-[#96237A]" />
          <span className="text-[10px] uppercase tracking-[0.5px] text-white/70 font-medium">
            {caso.badge}
          </span>
        </div>
      )}
    </div>
  );

  /* ── Quote card (top-right) ── */
  const quoteCard = (
    <div className="rounded-[14px] bg-white/[0.08] border border-white/[0.07] px-7 py-8 md:px-9 md:py-9 flex flex-col gap-5 justify-center flex-1">
      {caso.logo ? (
        <img
          src={caso.logo}
          alt={caso.author || "Cliente"}
          className="h-12 object-contain object-left"
          draggable={false}
          data-tina-field={tinaItem ? tinaField(tinaItem, "logo") : undefined}
        />
      ) : (
        <div
          className="inline-flex items-center gap-2 h-12 px-4 rounded-md bg-white/10 border border-white/10 w-fit"
          data-tina-field={tinaItem ? tinaField(tinaItem, "logo") : undefined}
          aria-label="Logo del cliente (placeholder)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="text-white/50" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M6 21V7l6-4 6 4v14M10 9h.01M14 9h.01M10 13h.01M14 13h.01M10 17h.01M14 17h.01" />
          </svg>
          <span className="text-white/50 text-[11px] uppercase tracking-[1.5px] font-medium">Logo</span>
        </div>
      )}
      <QuoteMark />
      <p
        className="text-[14px] leading-[1.8] text-white/55"
        data-tina-field={tinaItem ? tinaField(tinaItem, "quote") : undefined}
      >
        {caso.quote}
      </p>
    </div>
  );

  /* ── Author card (bottom-right) ── */
  const authorCard = (
    <div className="rounded-[14px] bg-white/[0.08] px-7 py-5 flex flex-col items-center gap-1">
      <p
        className="text-[15px] font-semibold text-white text-center"
        data-tina-field={tinaItem ? tinaField(tinaItem, "author") : undefined}
      >
        {caso.author}
      </p>
      <p
        className="text-[10px] uppercase tracking-[1.5px] text-white/70 text-center"
        data-tina-field={tinaItem ? tinaField(tinaItem, "role") : undefined}
      >
        {caso.role}
      </p>
    </div>
  );

  return (
    <div className="w-full">
      {/* Desktop: video left (spans both rows), quote+author stacked right */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-6 md:min-h-[480px]">
        <div className="min-h-[480px]">{videoPanel}</div>
        <div className="flex flex-col gap-3">
          {quoteCard}
          {authorCard}
        </div>
      </div>

      {/* Mobile: stacked video → quote → author */}
      <div className="md:hidden flex flex-col gap-4">
        {videoPanel}
        {quoteCard}
        {authorCard}
      </div>
    </div>
  );
}
