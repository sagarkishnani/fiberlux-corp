/**
 * Flechas de navegación compartidas para todos los sliders (SPEC 68).
 *
 * Cada botón es magenta cuando puede navegar y oscuro (aubergine, look
 * "disabled") cuando llega al extremo: prev al inicio, next al final.
 */
interface SliderArrowsProps {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
  labelPrev?: string;
  labelNext?: string;
}

const BTN = "w-[49px] h-[49px] flex items-center justify-center transition-colors";
const ENABLED = "bg-[#96237A] text-white hover:bg-[#650F50]";
const DISABLED = "bg-[#3B0E30] text-white/30 cursor-default";

export default function SliderArrows({
  canPrev,
  canNext,
  onPrev,
  onNext,
  className = "",
  labelPrev = "Anterior",
  labelNext = "Siguiente",
}: SliderArrowsProps) {
  return (
    <div
      className={`inline-flex rounded-[12px] overflow-hidden shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] ${className}`}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label={labelPrev}
        className={`${BTN} ${canPrev ? ENABLED : DISABLED}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label={labelNext}
        className={`${BTN} border-l border-white/15 ${canNext ? ENABLED : DISABLED}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
