import { useEffect, useRef } from "react";
import { FaWhatsapp, FaPhone, FaEnvelope, FaComments } from "react-icons/fa6";

/**
 * SupportHub — gráfico vivo del hero de Soporte técnico (SPEC 102).
 *
 * Núcleo central (tile con glow que rota, con el ISOTIPO de Fiberlux) conectado
 * por tuberías curvas a cuatro nodos de canales de soporte (WhatsApp, teléfono,
 * correo, chat). Por cada conector viaja un PULSO de señal del centro al nodo
 * (líneas que "avanzan", en bucle continuo) y el nodo emite un PING al recibirlo.
 *
 * Interactividad + profundidad: toda la escena hace un leve TILT 3D siguiendo el
 * cursor. Todo SVG (líneas) + HTML/CSS (tiles glass). Sin WebGL, sin líneas
 * verdes. Respeta prefers-reduced-motion (estático); el tilt solo corre en
 * punteros finos (en mobile no hay hover).
 */

interface SupportHubProps {
  className?: string;
}

const PARAMS = {
  pulseDur: 2.8, // s — pulso viajando por cada conector
  tiltDeg: 7, // grados máximos de inclinación 3D con el cursor
  coreSize: 23, // % del contenedor (tile del núcleo)
  nodeSize: 15, // % del contenedor (tiles de canales)
};

/* Isotipo Fiberlux — trazado real del SVG de marca
   (public/images/soporte-tecnico/isotipo-fiberlux.svg), pintado con
   `currentColor` para que tome el tono del núcleo. */
function IsotipoFiberlux() {
  return (
    <svg viewBox="0 0 54 39" fill="currentColor" aria-hidden="true">
      <path d="M51.4241 16.8506C48.5632 14.7233 44.4592 15.2648 42.2667 18.0496C40.8764 19.8288 40.5957 22.085 41.3176 24.0447L30.1282 32.7729C29.9544 32.6182 29.7673 32.4893 29.5667 32.3732L37.815 14.0013C37.922 14.0013 38.0423 14.0013 38.1626 14.0013C42.1732 14.0013 45.4217 10.8685 45.4217 7.00069C45.4217 3.13292 42.1732 0 38.1626 0C34.1521 0 30.9036 3.13292 30.9036 7.00069C30.9036 9.244 31.9998 11.2552 33.7109 12.5316L27.9893 31.8704C27.8823 31.8704 27.762 31.8317 27.6551 31.8317C27.4144 31.8317 27.1871 31.8575 26.9599 31.8962L25.3022 21.6853H25.2888C26.0374 21.002 26.492 20.035 26.4652 18.9779C26.3984 17.0182 24.7007 15.484 22.6687 15.5356C20.6367 15.6 19.0458 17.2374 19.1126 19.197C19.1661 20.9762 20.5831 22.4073 22.3611 22.6136L26.0508 32.2056C25.8637 32.2959 25.6765 32.3861 25.5161 32.515L12.6824 22.4975C13.4043 20.5379 13.1235 18.2688 11.7332 16.5025C9.54078 13.7048 5.43671 13.1762 2.57586 15.3035C-0.298353 17.4437 -0.846449 21.4274 1.33261 24.2122C3.51166 27.0099 7.61574 27.5514 10.49 25.4113C10.5702 25.3597 10.637 25.2952 10.7039 25.2437L24.5268 33.5465C24.1792 34.088 23.9654 34.7326 23.9654 35.4288C23.9654 37.4013 25.6231 39 27.6684 39C29.7138 39 31.3714 37.4013 31.3714 35.4288C31.3714 34.9646 31.2779 34.5263 31.1041 34.1137L43.2961 26.7907C43.363 26.8552 43.4298 26.9068 43.51 26.9584C46.3708 29.0856 50.4884 28.557 52.6674 25.7594C54.8465 22.9746 54.2983 18.9908 51.4241 16.8506ZM38.176 4.22876C39.7668 4.22876 41.0636 5.47934 41.0636 7.01356C41.0636 8.54777 39.7668 9.79836 38.176 9.79836C36.5852 9.79836 35.2885 8.54777 35.2885 7.01356C35.2885 5.47934 36.5852 4.22876 38.176 4.22876ZM22.8424 20.641C21.9601 20.6668 21.2114 19.9964 21.1847 19.1455C21.158 18.2817 21.8532 17.5726 22.7355 17.5468C23.6312 17.521 24.3664 18.1914 24.3932 19.0423C24.4199 19.8932 23.7248 20.6152 22.8291 20.641H22.8424ZM8.48469 21.9818C7.589 23.0519 5.98478 23.2066 4.88857 22.3557C3.79236 21.4919 3.61861 19.919 4.5143 18.8618C5.40998 17.7917 7.01421 17.6242 8.12379 18.488C9.22 19.3518 9.38038 20.9247 8.49807 21.9947L8.48469 21.9818ZM49.1114 23.8899C48.0152 24.7537 46.4109 24.5861 45.5153 23.5161C44.6329 22.446 44.7934 20.8731 45.8896 20.0093C46.9992 19.1455 48.6033 19.3131 49.499 20.3832C50.3813 21.4533 50.221 23.0132 49.1248 23.877L49.1114 23.8899Z" />
    </svg>
  );
}

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
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const finePointer = window.matchMedia?.("(pointer: fine)").matches ?? false;

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

    return () => { window.removeEventListener("pointermove", onMove); };
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
            <span className="support-hub__coreicon">
              <IsotipoFiberlux />
            </span>
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
        /* 1 → 0 es exactamente un período del patrón (0.28 + 0.72 = pathLength):
           el bucle empalma sin salto. Con 1 → -0.28 el trazo retrocedía al
           reiniciar y el recorrido se veía cortado. */
        @keyframes sh-pulse { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }

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
          color: rgba(250, 226, 243, 0.97);
        }
        /* El isotipo es apaisado (54×39): ancho fijo y alto automático para no
           deformarlo; glow suave para que asiente sobre el núcleo. */
        .support-hub__coreicon svg {
          width: 58%; height: auto;
          filter: drop-shadow(0 0 10px rgba(240, 111, 198, 0.45));
        }
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
        }
      `}</style>
    </div>
  );
}
