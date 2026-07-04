import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  FaUniversalAccess,
  FaCircleHalfStroke,
  FaTextHeight,
  FaArrowsLeftRight,
  FaRegImage,
  FaFont,
  FaDroplet,
  FaClone,
  FaArrowPointer,
  FaXmark,
  FaRotateLeft,
} from "react-icons/fa6";

/* ─────────────────────────── State model ─────────────────────────── */

interface A11yState {
  fontScale: number; // 1 = 100%
  letterSpacing: number; // em
  contrast: boolean;
  saturation: boolean; // true = desaturated
  invert: boolean;
  hideImages: boolean;
  dyslexia: boolean;
  bigCursor: boolean;
}

const STORAGE_KEY = "fiberlux-a11y-v1";

const DEFAULTS: A11yState = {
  fontScale: 1,
  letterSpacing: 0,
  contrast: false,
  saturation: false,
  invert: false,
  hideImages: false,
  dyslexia: false,
  bigCursor: false,
};

const FONT_MIN = 0.9;
const FONT_MAX = 1.6;
const FONT_PRESET = 1.3; // "Agrandar texto" quick toggle
const SPACING_MAX = 0.4;
const SPACING_PRESET = 0.12; // "Espaciado entre letras" quick toggle

/** Applies the current state to <html>. Mirrors the inline head script. */
function applyState(s: A11yState) {
  if (typeof document === "undefined") return;
  const r = document.documentElement;
  r.style.setProperty("--a11y-font-scale", String(s.fontScale));
  r.style.setProperty(
    "--a11y-letter-spacing",
    s.letterSpacing ? `${s.letterSpacing}em` : "normal"
  );
  r.style.setProperty("--a11y-contrast", s.contrast ? "1.4" : "1");
  r.style.setProperty("--a11y-brightness", s.contrast ? "1.05" : "1");
  r.style.setProperty("--a11y-saturate", s.saturation ? "0.12" : "1");
  r.style.setProperty("--a11y-invert", s.invert ? "1" : "0");
  r.style.setProperty("--a11y-hue", s.invert ? "180deg" : "0deg");
  // Only apply the body filter when a color effect is active (see CSS note).
  r.classList.toggle("a11y-filter", s.contrast || s.saturation || s.invert);
  r.classList.toggle("a11y-hide-images", s.hideImages);
  r.classList.toggle("a11y-dyslexia", s.dyslexia);
  r.classList.toggle("a11y-big-cursor", s.bigCursor);
}

function loadState(): A11yState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

/* ─────────────────────────── Component ─────────────────────────── */

export default function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<A11yState>(DEFAULTS);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Hydrate from storage on mount and apply (the head script already applied
  // it pre-paint; this syncs React state with it).
  useEffect(() => {
    const s = loadState();
    setState(s);
    applyState(s);
  }, []);

  // Persist + apply whenever state changes (after the initial mount write).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    applyState(state);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — settings stay for this session only */
    }
  }, [state]);

  const update = useCallback(
    (patch: Partial<A11yState>) => setState((prev) => ({ ...prev, ...patch })),
    []
  );

  const reset = useCallback(() => setState(DEFAULTS), []);

  // Close on Escape; return focus to the FAB.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    // Move focus into the panel for keyboard users.
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const activeCount = [
    state.fontScale !== 1,
    state.letterSpacing > 0,
    state.contrast,
    state.saturation,
    state.invert,
    state.hideImages,
    state.dyslexia,
    state.bigCursor,
  ].filter(Boolean).length;

  return (
    <>
      {/* Floating action button */}
      <button
        ref={fabRef}
        type="button"
        className="a11y-fab"
        aria-label="Abrir panel de accesibilidad"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <FaUniversalAccess aria-hidden="true" />
        {activeCount > 0 && (
          <span className="a11y-fab-badge" aria-hidden="true">
            {activeCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      <div
        className={`a11y-backdrop ${open ? "is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`a11y-panel ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Panel de accesibilidad"
        aria-hidden={!open}
        inert={!open ? true : undefined}
        tabIndex={-1}
      >
        <div className="a11y-head">
          <div className="a11y-head-title">
            <span className="a11y-head-icon" aria-hidden="true">
              <FaUniversalAccess />
            </span>
            <div>
              <h2 className="a11y-title">Accesibilidad</h2>
            </div>
          </div>
          <button
            type="button"
            className="a11y-close"
            aria-label="Cerrar panel de accesibilidad"
            onClick={() => {
              setOpen(false);
              fabRef.current?.focus();
            }}
          >
            <FaXmark aria-hidden="true" />
          </button>
        </div>
        <p className="a11y-subtitle">Ajusta la experiencia visual a tus necesidades</p>

        <div className="a11y-body">
          {/* ── VISUAL ── */}
          <p className="a11y-section-label">Visual</p>
          <div className="a11y-grid">
            <ToggleCard
              icon={<FaCircleHalfStroke />}
              label="Contraste +"
              active={state.contrast}
              onClick={() => update({ contrast: !state.contrast })}
            />
            <ToggleCard
              icon={<FaTextHeight />}
              label="Agrandar texto"
              active={state.fontScale > 1}
              onClick={() =>
                update({ fontScale: state.fontScale > 1 ? 1 : FONT_PRESET })
              }
            />
            <ToggleCard
              icon={<FaArrowsLeftRight />}
              label="Espaciado entre letras"
              active={state.letterSpacing > 0}
              onClick={() =>
                update({
                  letterSpacing: state.letterSpacing > 0 ? 0 : SPACING_PRESET,
                })
              }
            />
            <ToggleCard
              icon={<FaRegImage />}
              label="Ocultar imágenes"
              active={state.hideImages}
              onClick={() => update({ hideImages: !state.hideImages })}
            />
            <ToggleCard
              icon={<FaFont />}
              label="Dislexia Amigable"
              active={state.dyslexia}
              onClick={() => update({ dyslexia: !state.dyslexia })}
            />
            <ToggleCard
              icon={<FaDroplet />}
              label="Saturación"
              active={state.saturation}
              onClick={() => update({ saturation: !state.saturation })}
            />
          </div>

          {/* ── NAVEGACIÓN ── */}
          <p className="a11y-section-label">Navegación</p>
          <div className="a11y-grid">
            <ToggleCard
              icon={<FaClone />}
              label="Invertir colores"
              active={state.invert}
              onClick={() => update({ invert: !state.invert })}
            />
            <ToggleCard
              icon={<FaArrowPointer />}
              label="Cursor grande"
              active={state.bigCursor}
              onClick={() => update({ bigCursor: !state.bigCursor })}
            />
          </div>

          {/* ── AJUSTE FINO ── */}
          <p className="a11y-section-label">Ajuste fino</p>
          <div className="a11y-slider-row">
            <label htmlFor="a11y-font" className="a11y-slider-label">
              Texto
            </label>
            <input
              id="a11y-font"
              type="range"
              min={FONT_MIN}
              max={FONT_MAX}
              step={0.05}
              value={state.fontScale}
              onChange={(e) => update({ fontScale: Number(e.target.value) })}
              className="a11y-range"
            />
            <span className="a11y-slider-value">
              {Math.round(state.fontScale * 100)}%
            </span>
          </div>
          <div className="a11y-slider-row">
            <label htmlFor="a11y-spacing" className="a11y-slider-label">
              Espaciado
            </label>
            <input
              id="a11y-spacing"
              type="range"
              min={0}
              max={SPACING_MAX}
              step={0.05}
              value={state.letterSpacing}
              onChange={(e) => update({ letterSpacing: Number(e.target.value) })}
              className="a11y-range"
            />
            <span className="a11y-slider-value">
              {state.letterSpacing.toFixed(2)}
            </span>
          </div>

          <button type="button" className="a11y-reset" onClick={reset}>
            <FaRotateLeft aria-hidden="true" />
            Restablecer valores
          </button>
        </div>
      </div>

      <style>{styles}</style>
    </>
  );
}

/* ─────────────────────────── Toggle card ─────────────────────────── */

function ToggleCard({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`a11y-card ${active ? "is-active" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="a11y-card-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="a11y-card-label">{label}</span>
    </button>
  );
}

/* ─────────────────────────── Styles ─────────────────────────── */

const styles = `
  /* ─── Global page effects (applied to the whole document) ───
     These live here (not in global.css, which is not bundled) so they
     actually ship: this <style> is server-rendered with the island. */
  :root {
    --a11y-font-scale: 1;
    --a11y-letter-spacing: normal;
    --a11y-saturate: 1;
    --a11y-contrast: 1;
    --a11y-brightness: 1;
    --a11y-invert: 0;
    --a11y-hue: 0deg;
  }

  /* Scale rem-based typography (font slider / "Agrandar texto") */
  html {
    font-size: calc(100% * var(--a11y-font-scale));
  }

  /* Letter spacing (identity default is safe to always apply) */
  body {
    letter-spacing: var(--a11y-letter-spacing);
  }

  /* Composed visual filter (contrast / saturation / invert).
     Applied to the page-content wrapper (#a11y-content) — NOT <body> — and
     gated behind .a11y-filter. A non-"none" filter establishes a containing
     block that breaks position:fixed, so the accessibility controls (and other
     FABs) live OUTSIDE #a11y-content to stay fixed and reachable, and we only
     apply the filter while a color effect is actually enabled. */
  html.a11y-filter #a11y-content {
    filter: saturate(var(--a11y-saturate)) contrast(var(--a11y-contrast))
      brightness(var(--a11y-brightness)) invert(var(--a11y-invert))
      hue-rotate(var(--a11y-hue));
  }

  /* Dyslexia-friendly font */
  html.a11y-dyslexia body,
  html.a11y-dyslexia body * {
    font-family: "Atkinson Hyperlegible", "Poppins", system-ui, sans-serif !important;
  }

  /* Hide decorative / content images */
  html.a11y-hide-images :is(img, picture, video, canvas) {
    visibility: hidden !important;
  }

  /* Large cursor */
  html.a11y-big-cursor,
  html.a11y-big-cursor * {
    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M9 5 L9 41 L19 31 L25 45 L31 42 L25 28 L39 28 Z' fill='%23ffffff' stroke='%23000000' stroke-width='2.5' stroke-linejoin='round'/%3E%3C/svg%3E")
        7 5,
      auto !important;
  }

  .a11y-fab {
    position: fixed;
    left: clamp(16px, 3vw, 28px);
    bottom: clamp(16px, 3vw, 28px);
    z-index: 90;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 9999px;
    border: none;
    background: #96237A;
    color: #fff;
    font-size: 28px;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(150, 35, 122, 0.45);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .a11y-fab:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 12px 30px rgba(150, 35, 122, 0.6);
  }
  .a11y-fab:focus-visible {
    outline: 3px solid rgba(150, 35, 122, 0.5);
    outline-offset: 2px;
  }
  .a11y-fab-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    border-radius: 9999px;
    background: #fff;
    color: #650F50;
    font-family: "Poppins", system-ui, sans-serif;
    font-size: 11px;
    font-weight: 700;
    line-height: 20px;
    text-align: center;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .a11y-backdrop {
    position: fixed;
    inset: 0;
    z-index: 95;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }
  .a11y-backdrop.is-open {
    opacity: 1;
    visibility: visible;
  }

  .a11y-panel {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 96;
    display: flex;
    flex-direction: column;
    width: min(380px, 90vw);
    height: 100dvh;
    background: #0A0A0A;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 12px 0 40px rgba(0, 0, 0, 0.5);
    transform: translateX(-105%);
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    font-family: "Poppins", system-ui, sans-serif;
  }
  .a11y-panel.is-open {
    transform: translateX(0);
  }

  .a11y-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px 24px 0;
  }
  .a11y-head-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .a11y-head-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #96237A;
    color: #fff;
    font-size: 20px;
  }
  .a11y-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    line-height: 40px;
  }
  .a11y-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    font-size: 20px;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }
  .a11y-close:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .a11y-close:focus-visible {
    outline: 2px solid #96237A;
    outline-offset: 2px;
  }
  .a11y-subtitle {
    margin: 6px 24px 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .a11y-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px 28px;
  }

  .a11y-section-label {
    margin: 4px 0 12px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.45);
  }
  .a11y-section-label:not(:first-child) {
    margin-top: 28px;
  }

  .a11y-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .a11y-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 96px;
    padding: 16px 10px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.85);
    font-family: inherit;
    cursor: pointer;
    text-align: center;
    transition: border-color 0.2s ease, background 0.2s ease,
      transform 0.1s ease;
  }
  .a11y-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.2);
  }
  .a11y-card:active {
    transform: scale(0.97);
  }
  .a11y-card:focus-visible {
    outline: 2px solid #96237A;
    outline-offset: 2px;
  }
  .a11y-card.is-active {
    border-color: #96237A;
    background: rgba(150, 35, 122, 0.18);
    color: #fff;
  }
  .a11y-card-icon {
    font-size: 22px;
    color: rgba(255, 255, 255, 0.65);
  }
  .a11y-card.is-active .a11y-card-icon {
    color: #D5A7CA;
  }
  .a11y-card-label {
    font-size: 12px;
    font-weight: 500;
    line-height: 1.3;
  }

  .a11y-slider-row {
    display: grid;
    grid-template-columns: 78px 1fr 48px;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .a11y-slider-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
  }
  .a11y-slider-value {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    text-align: right;
  }
  .a11y-range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.12);
    outline: none;
    cursor: pointer;
  }
  .a11y-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    background: #96237A;
    border: 2px solid #fff;
    cursor: pointer;
  }
  .a11y-range::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    background: #96237A;
    border: 2px solid #fff;
    cursor: pointer;
  }
  .a11y-range:focus-visible {
    outline: 2px solid rgba(150, 35, 122, 0.6);
    outline-offset: 4px;
  }

  .a11y-reset {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin-top: 12px;
    padding: 14px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }
  .a11y-reset:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.3);
  }
  .a11y-reset:focus-visible {
    outline: 2px solid #96237A;
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .a11y-fab,
    .a11y-backdrop,
    .a11y-panel,
    .a11y-card {
      transition: none;
    }
    .a11y-fab:hover {
      transform: none;
    }
  }
`;
