import { useEffect, useRef, useState } from "react";
import { FaHeadset, FaBolt, FaServer, FaWhatsapp, FaPhone, FaEnvelope, FaComments } from "react-icons/fa6";
import type { IconType } from "react-icons";

/**
 * SupportHub — gráfico vivo del hero de Soporte técnico (SPEC 102).
 *
 * Núcleo central (tile con glow que rota) conectado por tuberías curvas a cuatro
 * nodos de canales de soporte (WhatsApp, teléfono, correo, chat). Por cada
 * conector viaja un PULSO de señal del centro al nodo (líneas que "avanzan") y el
 * nodo emite un PING al recibirlo; el ícono del núcleo CICLA entre audífonos,
 * rayo, server y el isotipo Fiberlux (SVG inline).
 *
 * Interactividad + profundidad: toda la escena hace un leve TILT 3D siguiendo el
 * cursor. Todo SVG (líneas) + HTML/CSS (tiles glass). Sin WebGL, sin líneas
 * verdes. Respeta prefers-reduced-motion (estático) y pausa el ciclo/tilt fuera
 * de viewport o en punteros gruesos (mobile).
 */

interface SupportHubProps {
  className?: string;
}

const PARAMS = {
  cycleMs: 2200, // intervalo del ciclo del ícono central
  pulseDur: 2.8, // s — pulso viajando por cada conector
  tiltDeg: 7, // grados máximos de inclinación 3D con el cursor
  coreSize: 23, // % del contenedor (tile del núcleo)
  nodeSize: 15, // % del contenedor (tiles de canales)
};

/* Isotipo Fiberlux como SVG inline (marca de red: 3 nodos → hub + tallo). */
function IsotipoFiberlux() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* conectores del isotipo */}
      <path d="M42 21 L31 40" />
      <path d="M14 32 L31 40" />
      <path d="M44 34 L31 40" />
      <path d="M31 40 L31 47" />
      {/* nodos (anillos) */}
      <circle cx="42" cy="17" r="5" />
      <circle cx="10" cy="31" r="5" />
      <circle cx="47" cy="33" r="5" />
      {/* hub + extremo del tallo (rellenos) */}
      <circle cx="31" cy="40" r="2.6" fill="currentColor" stroke="none" />
      <circle cx="31" cy="48" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* Íconos del núcleo. `isotipo` renderiza el SVG inline. */
type CoreIcon = { key: string; Icon?: IconType; isotipo?: boolean };
const CORE_ICONS: CoreIcon[] = [
  { key: "headset", Icon: FaHeadset },
  { key: "bolt", Icon: FaBolt },
  { key: "server", Icon: FaServer },
  { key: "isotipo", isotipo: true },
];

/* Nodos de canales (posición en % y desfase del pulso alineado a su conector). */
const NODES = [
  { key: "whatsapp", Icon: FaWhatsapp, x: 17.5, y: 20, delay: 0 },
  { key: "phone", Icon: FaPhone, x: 82.5, y: 20, delay: 0.7 },
  { key: "chat", Icon: FaComments, x: 17.5, y: 80, delay: 1.4 },
  { key: "mail", Icon: FaEnvelope, x: 82.5, y: 80, delay: 2.1 },
];

/* Conectores núcleo→nodo (viewBox 0..400), alineados por índice con NODES. */
const CONNECTORS = [
  "M150,182 C108,182 70,152 70,112", // → WhatsApp (TL)
  "M250,182 C292,182 330,152 330,112", // → teléfono (TR)
  "M150,218 C108,218 70,248 70,288", // → chat (BL)
  "M250,218 C292,218 330,248 330,288", // → correo (BR)
];

export default function SupportHub({ className = "" }: SupportHubProps) {
  const [idx, setIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const finePointer = window.matchMedia?.("(pointer: fine)").matches ?? false;

    // ── Ciclo del ícono central (pausado fuera de viewport) ──
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => { if (!timer && !reduce) timer = setInterval(() => setIdx((i) => (i + 1) % CORE_ICONS.length), PARAMS.cycleMs); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 });
      io.observe(root);
    } else start();

    // ── Tilt 3D siguiendo el cursor (solo puntero fino, sin reduced-motion) ──
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const onMove = (e: PointerEvent) => {
      const px = clamp((e.clientX / window.innerWidth - 0.5) * 2);
      const py = clamp((e.clientY / window.innerHeight - 0.5) * 2);
      // Grados calculados en JS (evita calc() con ángulos y es más robusto).
      root.style.setProperty("--ry", `${px * PARAMS.tiltDeg}deg`);
      root.style.setProperty("--rx", `${-py * PARAMS.tiltDeg}deg`);
    };
    if (finePointer && !reduce) window.addEventListener("pointermove", onMove, { passive: true });

    return () => { stop(); io?.disconnect(); window.removeEventListener("pointermove", onMove); };
  }, []);

  return (
    <div ref={rootRef} className={`support-hub ${className}`} aria-hidden="true">
      <div className="support-hub__scene">
        {/* Conectores (SVG) */}
        <svg className="support-hub__svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
          {CONNECTORS.map((d, i) => (
            <g key={i}>
              <path className="conn-base" d={d} pathLength={1} />
              <path className="conn-pulse" d={d} pathLength={1} style={{ animationDelay: `${NODES[i].delay}s` }} />
            </g>
          ))}
        </svg>

        {/* Nodos de canales */}
        {NODES.map((n) => (
          <div
            key={n.key}
            className="support-hub__node"
            style={{ left: `${n.x}%`, top: `${n.y}%`, width: `${PARAMS.nodeSize}%` }}
          >
            <div className="support-hub__nodeinner" style={{ animationDelay: `${-n.delay}s` }}>
              <n.Icon />
              <span className="support-hub__ping" style={{ animationDelay: `${n.delay}s` }} />
            </div>
          </div>
        ))}

        {/* Núcleo central */}
        <div className="support-hub__core" style={{ left: "50%", top: "50%", width: `${PARAMS.coreSize}%` }}>
          <span className="support-hub__coreglow" />
          <div className="support-hub__coreinner">
            {CORE_ICONS.map((c, i) => (
              <span key={c.key} className="support-hub__coreicon" style={{ opacity: i === idx ? 1 : 0 }}>
                {c.isotipo ? <IsotipoFiberlux /> : c.Icon && <c.Icon />}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .support-hub {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          pointer-events: none;
          perspective: 1000px;
        }
        .support-hub__scene {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
          transform: rotateY(var(--ry, 0deg)) rotateX(var(--rx, 0deg));
          transition: transform 0.35s cubic-bezier(.22,.61,.36,1);
          will-change: transform;
        }
        .support-hub__svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        /* Tuberías base (tenues) + pulso viajando del centro al nodo */
        .conn-base { fill: none; stroke: rgba(226, 79, 184, 0.22); stroke-width: 2; stroke-linecap: round; }
        .conn-pulse {
          fill: none; stroke: #F06FC6; stroke-width: 3; stroke-linecap: round;
          stroke-dasharray: 0.28 0.72; stroke-dashoffset: 1;
          filter: drop-shadow(0 0 4px rgba(240, 111, 198, 0.8));
          animation: sh-pulse ${PARAMS.pulseDur}s linear infinite;
        }
        @keyframes sh-pulse { from { stroke-dashoffset: 1; } to { stroke-dashoffset: -0.28; } }

        /* Tiles (nodos + núcleo) */
        .support-hub__node, .support-hub__core {
          position: absolute;
          transform: translate(-50%, -50%);
          aspect-ratio: 1 / 1;
        }
        .support-hub__nodeinner, .support-hub__coreinner {
          width: 100%; height: 100%;
          display: grid; place-items: center;
          border-radius: 26%;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.10), rgba(150, 35, 122, 0.10));
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 18px rgba(226, 79, 184, 0.16);
          color: rgba(246, 217, 238, 0.92);
          position: relative;
        }
        /* Nodos: flotación suave (profundidad/vida) */
        .support-hub__nodeinner { animation: sh-bob 5s ease-in-out infinite; }
        .support-hub__nodeinner > svg { width: 42%; height: 42%; opacity: 0.9; }
        @keyframes sh-bob { 0%, 100% { transform: translateY(-4%); } 50% { transform: translateY(4%); } }

        /* Ping del nodo al recibir el pulso */
        .support-hub__ping {
          position: absolute; inset: -6%;
          border-radius: 26%;
          border: 2px solid rgba(240, 111, 198, 0.7);
          opacity: 0;
          animation: sh-ping ${PARAMS.pulseDur}s ease-out infinite;
        }
        @keyframes sh-ping {
          0%, 78% { transform: scale(0.9); opacity: 0; }
          86% { transform: scale(1.0); opacity: 0.9; }
          100% { transform: scale(1.25); opacity: 0; }
        }

        /* Núcleo: glow rotando detrás + tile con pulso, elevado en Z */
        .support-hub__core { z-index: 3; transform: translate(-50%, -50%) translateZ(24px); }
        .support-hub__coreglow {
          position: absolute; inset: -34%;
          border-radius: 50%;
          background: conic-gradient(from 0deg, rgba(240,111,198,0) 0deg, rgba(240,111,198,0.55) 90deg, rgba(150,35,122,0) 200deg, rgba(240,111,198,0.45) 300deg, rgba(240,111,198,0) 360deg);
          filter: blur(10px);
          animation: sh-rotate 9s linear infinite;
        }
        .support-hub__coreinner {
          border-radius: 24%;
          background: radial-gradient(circle at 40% 32%, rgba(60, 20, 52, 0.85), rgba(14, 10, 14, 0.95));
          border-color: rgba(226, 79, 184, 0.4);
          box-shadow: 0 0 44px 6px rgba(226, 79, 184, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.18);
          animation: sh-core-pulse ${PARAMS.pulseDur}s ease-in-out infinite;
        }
        .support-hub__coreicon {
          position: absolute; inset: 0;
          display: grid; place-items: center;
          transition: opacity 0.55s ease, transform 0.55s ease;
          color: rgba(246, 217, 238, 0.96);
        }
        .support-hub__coreicon svg { width: 46%; height: 46%; }
        @keyframes sh-rotate { to { transform: rotate(360deg); } }
        @keyframes sh-core-pulse {
          0%, 100% { box-shadow: 0 0 38px 4px rgba(226, 79, 184, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.18); }
          50% { box-shadow: 0 0 64px 12px rgba(226, 79, 184, 0.52), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
        }

        @media (prefers-reduced-motion: reduce) {
          .support-hub__scene { transform: none; }
          .conn-pulse { animation: none; stroke-dasharray: none; stroke-dashoffset: 0; opacity: 0.5; }
          .support-hub__nodeinner, .support-hub__coreinner, .support-hub__coreglow, .support-hub__ping { animation: none; }
          .support-hub__ping { opacity: 0; }
          .support-hub__coreicon { transition: none; }
        }
      `}</style>
    </div>
  );
}
