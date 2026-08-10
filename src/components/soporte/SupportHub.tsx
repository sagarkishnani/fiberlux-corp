import { useEffect, useRef, useState } from "react";
import { FaHeadset, FaBolt, FaServer, FaWhatsapp, FaPhone, FaEnvelope, FaComments } from "react-icons/fa6";
import type { IconType } from "react-icons";

/**
 * SupportHub — gráfico vivo del hero de Soporte técnico (SPEC 102).
 *
 * Núcleo central (tile oscuro con glow) conectado por tuberías curvas a cuatro
 * nodos de canales de soporte (WhatsApp, teléfono, correo, chat). Por cada
 * conector viaja un PULSO de señal del centro al nodo (líneas que "avanzan"), y
 * el ícono del núcleo CICLA entre audífonos, rayo, server y el isotipo Fiberlux.
 *
 * Todo SVG (líneas) + HTML/CSS (tiles glass). Sin WebGL. Sin líneas verdes: todo
 * en morado de marca. Respeta prefers-reduced-motion (estático: líneas dibujadas,
 * sin ciclo ni pulso) y pausa el ciclo fuera de viewport.
 */

interface SupportHubProps {
  className?: string;
}

const PARAMS = {
  cycleMs: 2200, // intervalo del ciclo del ícono central
  pulseDur: 2.8, // s — duración del pulso viajando por cada conector
  coreSize: 23, // % del contenedor (tile del núcleo)
  nodeSize: 15, // % del contenedor (tiles de canales)
};

/* Íconos del núcleo. El isotipo se marca con `img` y se renderiza como imagen. */
type CoreIcon = { key: string; Icon?: IconType; img?: boolean };
const CORE_ICONS: CoreIcon[] = [
  { key: "headset", Icon: FaHeadset },
  { key: "bolt", Icon: FaBolt },
  { key: "server", Icon: FaServer },
  { key: "isotipo", img: true },
];

/* Nodos de canales de soporte, con su posición en % del contenedor. */
const NODES = [
  { key: "whatsapp", Icon: FaWhatsapp, x: 17.5, y: 20 },
  { key: "phone", Icon: FaPhone, x: 82.5, y: 20 },
  { key: "chat", Icon: FaComments, x: 17.5, y: 80 },
  { key: "mail", Icon: FaEnvelope, x: 82.5, y: 80 },
];

/* Conectores núcleo→nodo (viewBox 0..400). El path empieza en el centro para que
   el pulso viaje del centro al nodo. `delay` desfasa los pulsos. */
const CONNECTORS = [
  { d: "M150,182 C108,182 70,152 70,112", delay: 0 }, // → WhatsApp (TL)
  { d: "M250,182 C292,182 330,152 330,112", delay: 0.7 }, // → teléfono (TR)
  { d: "M150,218 C108,218 70,248 70,288", delay: 1.4 }, // → chat (BL)
  { d: "M250,218 C292,218 330,248 330,288", delay: 2.1 }, // → correo (BR)
];

export default function SupportHub({ className = "" }: SupportHubProps) {
  const [idx, setIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const base = import.meta.env.BASE_URL || "/";

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduce) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(() => setIdx((i) => (i + 1) % CORE_ICONS.length), PARAMS.cycleMs);
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };

    // Pausa el ciclo fuera de viewport.
    const el = rootRef.current;
    let io: IntersectionObserver | null = null;
    if (el && "IntersectionObserver" in window) {
      io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 });
      io.observe(el);
    } else {
      start();
    }
    return () => { stop(); io?.disconnect(); };
  }, []);

  return (
    <div ref={rootRef} className={`support-hub ${className}`} aria-hidden="true">
      {/* Conectores (SVG) */}
      <svg className="support-hub__svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
        {CONNECTORS.map((c, i) => (
          <g key={i}>
            <path className="conn-base" d={c.d} pathLength={1} />
            <path
              className="conn-pulse"
              d={c.d}
              pathLength={1}
              style={{ animationDelay: `${c.delay}s` }}
            />
          </g>
        ))}
      </svg>

      {/* Nodos de canales */}
      {NODES.map((n) => (
        <div
          key={n.key}
          className="support-hub__tile support-hub__node"
          style={{ left: `${n.x}%`, top: `${n.y}%`, width: `${PARAMS.nodeSize}%` }}
        >
          <n.Icon />
        </div>
      ))}

      {/* Núcleo central (ícono ciclando con crossfade) */}
      <div
        className="support-hub__tile support-hub__core"
        style={{ left: "50%", top: "50%", width: `${PARAMS.coreSize}%` }}
      >
        {CORE_ICONS.map((c, i) => (
          <span key={c.key} className="support-hub__coreicon" style={{ opacity: i === idx ? 1 : 0 }}>
            {c.img ? (
              <img src={`${base}fiberlux-favicon.png`} alt="" className="support-hub__isotipo" />
            ) : (
              c.Icon && <c.Icon />
            )}
          </span>
        ))}
      </div>

      <style>{`
        .support-hub {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          pointer-events: none;
        }
        .support-hub__svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        /* Tuberías base (tenues, siempre visibles) */
        .conn-base {
          fill: none;
          stroke: rgba(226, 79, 184, 0.22);
          stroke-width: 2;
          stroke-linecap: round;
        }
        /* Pulso que viaja del centro al nodo (segmento brillante) */
        .conn-pulse {
          fill: none;
          stroke: #F06FC6;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-dasharray: 0.28 0.72;
          stroke-dashoffset: 1;
          filter: drop-shadow(0 0 4px rgba(240, 111, 198, 0.8));
          animation: sh-pulse var(--pulse-dur, ${PARAMS.pulseDur}s) linear infinite;
        }
        @keyframes sh-pulse {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: -0.28; }
        }

        /* Tiles glass (nodos + núcleo) */
        .support-hub__tile {
          position: absolute;
          transform: translate(-50%, -50%);
          aspect-ratio: 1 / 1;
          display: grid;
          place-items: center;
          border-radius: 26%;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.10), rgba(150, 35, 122, 0.10));
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 18px rgba(226, 79, 184, 0.16);
          color: rgba(246, 217, 238, 0.92);
          z-index: 2;
        }
        .support-hub__node svg { width: 42%; height: 42%; opacity: 0.9; }

        /* Núcleo: más oscuro, con glow morado que pulsa */
        .support-hub__core {
          border-radius: 24%;
          background: radial-gradient(circle at 40% 32%, rgba(60, 20, 52, 0.75), rgba(14, 10, 14, 0.92));
          border-color: rgba(226, 79, 184, 0.35);
          box-shadow: 0 0 44px 6px rgba(226, 79, 184, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.18);
          z-index: 3;
          animation: sh-core-pulse ${PARAMS.pulseDur}s ease-in-out infinite;
        }
        .support-hub__coreicon {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          transition: opacity 0.6s ease;
          color: rgba(246, 217, 238, 0.95);
        }
        .support-hub__coreicon svg { width: 44%; height: 44%; }
        .support-hub__isotipo { width: 62%; height: 62%; object-fit: contain; }

        @keyframes sh-core-pulse {
          0%, 100% { box-shadow: 0 0 38px 4px rgba(226, 79, 184, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.18); }
          50% { box-shadow: 0 0 60px 10px rgba(226, 79, 184, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.20); }
        }

        @media (prefers-reduced-motion: reduce) {
          .conn-pulse { animation: none; stroke-dasharray: none; stroke-dashoffset: 0; opacity: 0.5; }
          .support-hub__core { animation: none; }
          .support-hub__coreicon { transition: none; }
        }
      `}</style>
    </div>
  );
}
