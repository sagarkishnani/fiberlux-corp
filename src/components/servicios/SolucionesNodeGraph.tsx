import { useEffect, useRef, useState } from "react";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import type { GraphCategory } from "./HeroServiciosReact";

/* ─────────────────────────────────────────────────────────────────────────
   SolucionesNodeGraph (SPEC 98)

   Grafo interactivo: 1 hub central "Fiberlux" + N satélites (las categorías de
   solución). Los satélites se unen al hub con líneas glow y un pulso de energía
   que viaja por cada enlace. Hover ilumina/agranda el nodo y su enlace; el click
   despacha `fbx:goto-solucion` para que `SolucionesScroll` baje a esa categoría.

   Sin dependencias externas. Nodos posicionados por fracciones del contenedor;
   las líneas/pulsos se dibujan en px (medidos con ResizeObserver). Respeta
   prefers-reduced-motion (frame estático) y desactiva el parallax en touch.
   ───────────────────────────────────────────────────────────────────────── */

const PARAMS = {
  hubSize: 108, // diámetro del disco del hub (px)
  satSize: 74, // diámetro del disco de cada satélite (px)
  linkWidth: 1.5, // grosor base de la línea de enlace
  linkAlpha: 0.4, // opacidad base de la línea (sube en hover)
  linkAlphaHover: 0.95,
  pulseDur: 2.6, // s que tarda un pulso en recorrer un enlace
  pulseDurHover: 1.2, // pulso acelerado en hover
  floatAmp: 7, // amplitud (px) de la deriva idle de cada satélite
  parallaxMax: 16, // desplazamiento máx (px) del parallax por cursor (desktop)
  hoverScale: 1.1, // escala del satélite en hover/focus
  glow: "rgba(150,35,122,0.55)", // brand-purple, glow de nodos/líneas
  linkColor: "rgba(206,102,184,1)", // magenta claro para el trazo del enlace
} as const;

/* Posiciones (fracción 0..1 del contenedor) del hub y los satélites, por
   breakpoint. Desktop: hub al centro, satélites en aspa. Mobile: espina
   vertical con el hub arriba y los satélites en columna. */
const HUB = { desktop: { x: 0.5, y: 0.5 }, mobile: { x: 0.5, y: 0.1 } };
const SAT_POS = {
  desktop: [
    { x: 0.14, y: 0.26 },
    { x: 0.86, y: 0.26 },
    { x: 0.14, y: 0.74 },
    { x: 0.86, y: 0.74 },
  ],
  mobile: [
    { x: 0.5, y: 0.34 },
    { x: 0.5, y: 0.52 },
    { x: 0.5, y: 0.7 },
    { x: 0.5, y: 0.88 },
  ],
} as const;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
function withBase(path: string): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

interface Props {
  categories: GraphCategory[];
  locale?: Locale;
  /** Wordmark de Fiberlux para el hub (ruta, BASE_URL-aware). */
  logoSrc?: string;
  className?: string;
}

export default function SolucionesNodeGraph({
  categories,
  locale = "es",
  logoSrc = "/images/logo/fiberlux.svg",
  className,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const nodes = categories.slice(0, 4);
  const bp = isMobile ? "mobile" : "desktop";
  const hub = HUB[bp];
  const satPositions = SAT_POS[bp];

  return (
    <div
      className={`sng-root relative w-full ${className || ""}`}
      style={{
        height: isMobile ? "clamp(420px, 78vw, 560px)" : "clamp(360px, 46vh, 520px)",
      }}
    >
      {/* Hub central: Fiberlux */}
      <div
        className="sng-node sng-hub absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${hub.x * 100}%`, top: `${hub.y * 100}%` }}
      >
        <div
          className="grid place-items-center rounded-full"
          style={{
            width: PARAMS.hubSize,
            height: PARAMS.hubSize,
            background: "radial-gradient(circle at 50% 40%, rgba(150,35,122,0.35) 0%, rgba(10,10,10,0.9) 70%)",
            border: "1px solid rgba(206,102,184,0.55)",
            boxShadow: `0 0 42px ${PARAMS.glow}, inset 0 0 24px rgba(150,35,122,0.35)`,
          }}
        >
          <img
            src={withBase(logoSrc)}
            alt="Fiberlux"
            className="pointer-events-none select-none"
            style={{ width: "66%", height: "auto" }}
          />
        </div>
      </div>

      {/* Satélites: las categorías */}
      {nodes.map((cat, i) => {
        const p = satPositions[i] || { x: 0.5, y: 0.5 };
        const label = tField(cat as any, "title", locale);
        return (
          <button
            key={i}
            type="button"
            aria-label={label}
            className="sng-node sng-sat absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 outline-none"
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
          >
            <span
              className="sng-chip grid place-items-center rounded-full"
              style={{
                width: PARAMS.satSize,
                height: PARAMS.satSize,
                background: "radial-gradient(circle at 50% 40%, rgba(150,35,122,0.28) 0%, rgba(10,10,10,0.88) 72%)",
                border: "1px solid rgba(206,102,184,0.45)",
                boxShadow: `0 0 26px rgba(150,35,122,0.35)`,
              }}
            >
              {cat.icon && (
                <img
                  src={withBase(cat.icon)}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none select-none"
                  style={{ width: "46%", height: "auto" }}
                />
              )}
            </span>
            <span className="sng-label max-w-[16ch] text-center text-[13px] leading-tight text-white/85">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
