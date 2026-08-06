/**
 * Flechas laterales para sliders — SPEC 94 (solo desktop).
 *
 * Dos botones circulares magenta independientes, superpuestos (`absolute`) sobre
 * los bordes izquierdo/derecho del carrusel y centrados verticalmente. Visibles
 * únicamente en `lg+`; en mobile/tablet se sigue usando `SliderArrows` (píldora).
 *
 * IMPORTANTE: el componente debe montarse dentro de un contenedor `relative` que
 * sea HERMANO del viewport de Embla (que es `overflow-hidden`), no hijo — de lo
 * contrario el overflow recorta las flechas.
 *
 * Reutiliza los colores/estados de `SliderArrows` (magenta habilitado / aubergine
 * deshabilitado) para mantener coherencia visual.
 */
interface SliderSideArrowsProps {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  labelPrev?: string;
  labelNext?: string;
  /**
   * Distancia horizontal desde cada borde del contenedor (longitud CSS).
   * Por defecto "0.5rem" (la flecha se superpone al borde de la card). Un valor
   * negativo la empuja hacia afuera; evitar en carruseles a sangre para no crear
   * scroll horizontal.
   */
  offset?: string;
  /** Override del inset izquierdo (p. ej. alinear con el gutter en carruseles a sangre). Cae en `offset`. */
  leftOffset?: string;
  /** Override del inset derecho. Cae en `offset`. */
  rightOffset?: string;
  /** Clases extra aplicadas a ambos botones. */
  className?: string;
}

const BTN =
  "hidden lg:flex absolute top-1/2 -translate-y-1/2 z-30 h-12 w-12 items-center justify-center rounded-full shadow-[0_8px_24px_-8px_rgba(0,0,0,0.55)] transition-colors";
const ENABLED = "bg-[#96237A] text-white hover:bg-[#650F50]";
const DISABLED = "bg-[#3B0E30] text-white/30 cursor-default";

export default function SliderSideArrows({
  canPrev,
  canNext,
  onPrev,
  onNext,
  labelPrev = "Anterior",
  labelNext = "Siguiente",
  offset = "0.5rem",
  leftOffset,
  rightOffset,
  className = "",
}: SliderSideArrowsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label={labelPrev}
        style={{ left: leftOffset ?? offset }}
        className={`${BTN} ${canPrev ? ENABLED : DISABLED} ${className}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label={labelNext}
        style={{ right: rightOffset ?? offset }}
        className={`${BTN} ${canNext ? ENABLED : DISABLED} ${className}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </>
  );
}
