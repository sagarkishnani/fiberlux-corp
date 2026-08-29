import { tinaField } from "tinacms/dist/react";
import { mediaUrl } from "../../utils/mediaUrl";
import { tField } from "../../utils/i18n";
import { t } from "../../i18n/ui";
import type { Locale } from "../../i18n/config";
import { useCursorTooltip } from "../shared/CursorTooltip";

export interface Caso {
  poster?: string | null;
  youtubeUrl?: string | null;
  videoFile?: string | null;
  logo?: string | null;
  quote?: string | null;
  quote_en?: string | null;
  author?: string | null;
  role?: string | null;
  role_en?: string | null;
  badge?: string | null;
  badge_en?: string | null;
}

interface CasoCardProps {
  caso: Caso;
  /** Tina object for `data-tina-field` (the item in the list). */
  tinaItem?: any;
  /** Called when the play button is pressed; only wired when a video exists. */
  onPlay?: () => void;
  locale?: Locale;
}

/** A case has a playable video if it has a YouTube URL or an uploaded mp4. */
export function hasVideo(caso: Caso): boolean {
  return Boolean(caso.youtubeUrl?.trim() || caso.videoFile?.trim());
}

/**
 * Not every YouTube video has a `maxresdefault.jpg` (only HD uploads do); older
 * videos 404 it. Fall back through the lower-res thumbnails, which always exist.
 */
function handlePosterError(e: { currentTarget: HTMLImageElement }) {
  const img = e.currentTarget;
  const fallbacks = ["maxresdefault", "sddefault", "hqdefault", "mqdefault"];
  const current = fallbacks.find((q) => img.src.includes(`/${q}.jpg`));
  if (!current) return; // not a YT thumbnail (e.g. uploaded image) — leave as-is
  const next = fallbacks[fallbacks.indexOf(current) + 1];
  if (next) img.src = img.src.replace(`/${current}.jpg`, `/${next}.jpg`);
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

/**
 * Disparador del video: cubre TODA la foto, no sólo el círculo (obs. cliente).
 *
 * Sigue siendo un `<button>` real —y no un div con onClick— para conservar foco
 * por teclado y lectura por asistencia técnica; el círculo de play pasa a ser
 * decoración (`aria-hidden`) dentro de él. Al ocupar el panel entero, el hover
 * afecta a la imagen completa y el objetivo de clic deja de ser un blanco de
 * 56px en medio de una card de 480px de alto.
 *
 * El arrastre del carrusel no dispara el video: Embla cancela el `click` que
 * sigue a un gesto de arrastre, igual que hacía con el botón chico.
 */
function PlayTrigger({
  onPlay,
  disabled,
  locale,
}: {
  onPlay?: () => void;
  disabled: boolean;
  locale: Locale;
}) {
  const { handlers, tooltip } = useCursorTooltip(t("casos.vervideo", locale));

  return (
    <>
      <button
        type="button"
        onClick={disabled ? undefined : onPlay}
        disabled={disabled}
        aria-label={
          disabled
            ? locale === "en"
              ? "Video unavailable"
              : "Video no disponible"
            : t("casos.vervideo", locale)
        }
        {...(disabled ? {} : handlers)}
        className={`group absolute inset-0 z-10 flex items-center justify-center ${
          disabled ? "cursor-default" : "cursor-pointer"
        }`}
      >
        {/* Velo que oscurece la foto al pasar el cursor: sin él, con el botón
            invisible y a pantalla completa, no había ninguna señal de que la
            imagen entera fuera clicable. */}
        {!disabled && (
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25 motion-reduce:transition-none"
          />
        )}
        <span
          aria-hidden="true"
          className={`relative flex h-14 w-14 items-center justify-center rounded-full border border-white/15 backdrop-blur-[4px] transition-all duration-300 motion-reduce:transition-none ${
            disabled
              ? "bg-black/40 opacity-40"
              : "bg-black/50 group-hover:bg-black/70 group-hover:scale-110"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </button>
      {!disabled && tooltip}
    </>
  );
}

export default function CasoCard({ caso, tinaItem, onPlay, locale = "es" }: CasoCardProps) {
  const playable = hasVideo(caso);

  /* ── Video panel (left column / top on mobile) ── */
  const videoPanel = (
    <div className="relative rounded-[14px] overflow-hidden bg-[#0d0d14] w-full h-[280px] md:h-full min-h-[280px]">
      {caso.poster ? (
        <img
          src={mediaUrl(caso.poster)}
          alt={caso.author || "Caso de éxito"}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          onError={handlePosterError}
          data-tina-field={tinaItem ? tinaField(tinaItem, "poster") : undefined}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1526] to-[#0d0d14]" />
      )}
      <PlayTrigger onPlay={onPlay} disabled={!playable} locale={locale} />
      {caso.badge && (
        <div
          /* Por encima del disparador (z-10) pero sin capturar el clic: la
             chapa es informativa y el play tiene que seguir funcionando ahí. */
          className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-md bg-black/55 backdrop-blur-[5px] px-2.5 py-1.5"
          data-tina-field={tinaItem ? tinaField(tinaItem, "badge") : undefined}
        >
          <span className="w-[5px] h-[5px] rounded-sm bg-[#96237A]" />
          <span className="text-[10px] uppercase tracking-[0.5px] text-white/70 font-medium">
            {tField(caso as any, "badge", locale)}
          </span>
        </div>
      )}
    </div>
  );

  /* ── Quote card (top-right) ── */
  const quoteCard = (
    <div className="rounded-[14px] bg-white/[0.08] border border-white/[0.07] px-7 py-8 md:px-9 md:py-9 flex flex-col gap-5 justify-center flex-1">
      {/* Si hay logo del cliente, se muestra EN VEZ de las comillas (obs_12/obs9).
          Los logos son a todo color (pensados para fondo claro), así que van sobre
          un chip blanco para que lean bien sobre la card oscura. */}
      {caso.logo ? (
        <span className="inline-flex w-fit items-center rounded-lg bg-white px-4 py-3">
          <img
            src={mediaUrl(caso.logo)}
            alt={caso.author || "Cliente"}
            className="h-10 w-auto object-contain"
            draggable={false}
            data-tina-field={tinaItem ? tinaField(tinaItem, "logo") : undefined}
          />
        </span>
      ) : (
        <QuoteMark />
      )}
      <p
        className="text-[14px] leading-[1.8] text-white/55"
        data-tina-field={tinaItem ? tinaField(tinaItem, "quote") : undefined}
      >
        {tField(caso as any, "quote", locale)}
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
        {tField(caso as any, "role", locale)}
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
