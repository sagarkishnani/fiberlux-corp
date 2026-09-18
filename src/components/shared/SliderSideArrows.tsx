import type { CSSProperties } from "react";

/**
 * Flechas laterales para sliders — SPEC 94 (solo desktop).
 *
 * Dos botones circulares magenta independientes, superpuestos (`absolute`) sobre
 * los bordes izquierdo/derecho del carrusel y centrados verticalmente. Por
 * defecto visibles únicamente en `lg+`; en mobile/tablet se usa `SliderArrows`
 * (píldora). Con `mobile` se muestran también en pantallas chicas, con un
 * tratamiento tenue (círculo blanco translúcido + chevron magenta) para no
 * competir con la tarjeta que tapan.
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
   * Por defecto es RESPONSIVE via `clamp()`: ~-1.5rem a 1024px creciendo con el
   * ancho hasta ~-4.5rem en pantallas grandes (separación de la card hacia el
   * gutter). Evita el scroll horizontal (los gutters del site-container dan
   * espacio de sobra). Certificaciones usa un `offset` propio más chico. En
   * carruseles a sangre usar `leftOffset`/`rightOffset`.
   */
  offset?: string;
  /** Override del inset izquierdo (p. ej. alinear con el gutter en carruseles a sangre). Cae en `offset`. */
  leftOffset?: string;
  /** Override del inset derecho. Cae en `offset`. */
  rightOffset?: string;
  /** Clases extra aplicadas a ambos botones. */
  className?: string;
  /**
   * Mostrar también en mobile/tablet (variante tenue). Quien lo active debe
   * quitar la píldora `SliderArrows` para no duplicar controles.
   */
  mobile?: boolean;
  /**
   * Inset horizontal bajo `lg` cuando `mobile` está activo. Negativo = el botón
   * asoma fuera del carrusel; no pasarse del gutter del contenedor (24px en
   * mobile) o aparece scroll horizontal.
   */
  mobileOffset?: string;
}

const BTN =
  "hidden lg:flex absolute top-1/2 -translate-y-1/2 z-30 h-12 w-12 items-center justify-center rounded-full shadow-[0_8px_24px_-8px_rgba(0,0,0,0.55)] transition-colors";
const ENABLED = "bg-[#96237A] text-white hover:bg-[#650F50]";
// Deshabilitada: círculo translúcido esmerilado (blur + baja opacidad) en vez del
// aubergine sólido, para que no destaque sobre fondos claros/oscuros.
const DISABLED =
  "bg-[#3B0E30]/25 text-white/40 backdrop-blur-md border border-white/10 cursor-default";

/* ── Variante `mobile`: mismo botón, tenue y más chico bajo `lg` ──
   El inset se pasa por variables CSS porque cambia por breakpoint y un `style`
   inline no puede hacerlo. */
const BTN_M =
  "flex absolute top-1/2 -translate-y-1/2 z-30 h-9 w-9 lg:h-12 lg:w-12 items-center justify-center rounded-full transition-colors backdrop-blur-md lg:backdrop-blur-none shadow-[0_4px_14px_-6px_rgba(59,14,48,0.4)] lg:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.55)]";
const ENABLED_M =
  "bg-white/85 text-brand-purple ring-1 ring-brand-purple/20 lg:ring-0 lg:bg-[#96237A] lg:text-white lg:hover:bg-[#650F50]";
const DISABLED_M =
  "bg-white/45 text-brand-purple/35 ring-1 ring-brand-purple/10 cursor-default lg:ring-0 lg:bg-[#3B0E30]/25 lg:text-white/40 lg:border lg:border-white/10";

export default function SliderSideArrows({
  canPrev,
  canNext,
  onPrev,
  onNext,
  labelPrev = "Anterior",
  labelNext = "Siguiente",
  offset = "clamp(-4.5rem, 30px - 6vw, -1.5rem)",
  leftOffset,
  rightOffset,
  className = "",
  mobile = false,
  mobileOffset = "-0.75rem",
}: SliderSideArrowsProps) {
  const base = mobile ? BTN_M : BTN;
  const on = mobile ? ENABLED_M : ENABLED;
  const off = mobile ? DISABLED_M : DISABLED;
  /* Sin `mobile` el inset va inline; con `mobile` se resuelve por breakpoint
     desde las variables CSS. */
  const insetCls = mobile ? "left-[var(--arrow-inset-sm)] lg:left-[var(--arrow-inset)]" : "";
  const insetClsRight = mobile ? "right-[var(--arrow-inset-sm)] lg:right-[var(--arrow-inset)]" : "";
  const insetStyle = (val: string) =>
    mobile
      ? ({ "--arrow-inset-sm": mobileOffset, "--arrow-inset": val } as CSSProperties)
      : undefined;

  return (
    <>
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label={labelPrev}
        style={mobile ? insetStyle(leftOffset ?? offset) : { left: leftOffset ?? offset }}
        className={`${base} ${insetCls} ${canPrev ? on : off} ${className}`}
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
        style={mobile ? insetStyle(rightOffset ?? offset) : { right: rightOffset ?? offset }}
        className={`${base} ${insetClsRight} ${canNext ? on : off} ${className}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </>
  );
}
