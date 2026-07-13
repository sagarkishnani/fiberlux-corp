import { useEffect, useState } from "react";

/**
 * Preloader de bienvenida (una vez por sesión, solo en Home).
 *
 * Enmascara la carga del 3D del hero: muestra la marca Fiberlux con un glow
 * magenta y un contador simulado, y revela el sitio con un wipe hacia arriba
 * cuando la escena de Home termina de cargar (evento `fbx:hero-scene-loaded`).
 *
 * Salvaguardas:
 * - Mínimo visible (MIN_VISIBLE_MS) para que no parpadee.
 * - Tope máximo (MAX_VISIBLE_MS): si la escena tarda o falla, se cierra igual.
 * - Bandera en sessionStorage: no se repite en recargas de la misma sesión.
 *
 * La primera pintura ya trae el overlay (SSR de la isla). Un script pre-paint
 * en la página oculta este overlay por CSS cuando la bandera ya existe, para
 * evitar el flash en recargas dentro de la sesión.
 */

const MIN_VISIBLE_MS = 800;
const MAX_VISIBLE_MS = 6000;
const REVEAL_MS = 900;
const STORAGE_KEY = "fbx:preloaderShown";
const READY_EVENT = "fbx:hero-scene-loaded";

const LOGO = `${import.meta.env.BASE_URL}images/logo/fiberlux.svg`;

function alreadyShown(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markShown() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* sessionStorage bloqueado (modo privado): se comporta como cada carga */
  }
}

export default function SitePreloader() {
  const [hidden, setHidden] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Secuencia principal: contador simulado + espera de la escena + cierre.
  useEffect(() => {
    if (alreadyShown()) {
      setHidden(true);
      return;
    }

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden"; // bloquea el scroll mientras carga

    const start = Date.now();
    let finished = false;
    let raf = 0;
    let readyT = 0;

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      setProgress(100); // salta a 100% antes del wipe
      window.setTimeout(() => setRevealing(true), 140);
    };

    // Contador simulado: sube con easing asintótico hacia ~90% mientras espera.
    const tick = () => {
      const elapsed = Date.now() - start;
      const target = 90 * (elapsed / (elapsed + 1400));
      setProgress((p) => (target > p ? target : p));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // La escena de Home avisó que ya cargó (o que no había nada que esperar).
    const onReady = () => {
      const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - start));
      readyT = window.setTimeout(finish, wait);
    };
    window.addEventListener(READY_EVENT, onReady);

    // Tope de seguridad: nunca dejar al usuario atrapado en el loader.
    const maxT = window.setTimeout(finish, MAX_VISIBLE_MS);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(READY_EVENT, onReady);
      window.clearTimeout(readyT);
      window.clearTimeout(maxT);
      html.style.overflow = prevOverflow; // libera el scroll pase lo que pase
    };
  }, []);

  // Al terminar el wipe: marca la sesión y desmonta el overlay.
  useEffect(() => {
    if (!revealing) return;
    const t = window.setTimeout(() => {
      markShown();
      setHidden(true);
    }, REVEAL_MS);
    return () => window.clearTimeout(t);
  }, [revealing]);

  if (hidden) return null;

  return (
    <div
      id="site-preloader"
      className="site-preloader"
      data-revealing={revealing ? "1" : undefined}
      aria-hidden="true"
    >
      <div className="site-preloader__glow" />

      <div className="site-preloader__inner">
        <img src={LOGO} alt="" className="site-preloader__logo" draggable={false} />
        <div className="site-preloader__bar">
          <span
            className="site-preloader__fill"
            style={{ transform: `scaleX(${Math.min(progress, 100) / 100})` }}
          />
        </div>
        <div className="site-preloader__counter">
          {Math.round(progress)}
          <span>%</span>
        </div>
      </div>

      <style>{`
        .site-preloader {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
          transition: transform ${REVEAL_MS}ms cubic-bezier(0.76, 0, 0.24, 1),
            opacity ${REVEAL_MS}ms ease;
          will-change: transform, opacity;
        }
        .site-preloader[data-revealing="1"] {
          transform: translateY(-100%);
          opacity: 0;
          pointer-events: none;
        }
        .site-preloader__glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 50% 55% at 50% 45%,
            rgba(150, 35, 122, 0.3) 0%,
            rgba(150, 35, 122, 0) 70%
          );
          animation: preloaderBreath 2.8s ease-in-out infinite;
        }
        .site-preloader__inner {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 22px;
          animation: preloaderIn 0.6s ease both;
        }
        .site-preloader[data-revealing="1"] .site-preloader__inner {
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .site-preloader__logo {
          height: 26px;
          width: auto;
          /* mismo tratamiento que el header: SVG a blanco */
          filter: brightness(0) invert(1);
        }
        .site-preloader__bar {
          position: relative;
          width: 160px;
          height: 2px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }
        .site-preloader__fill {
          position: absolute;
          inset: 0;
          transform-origin: left center;
          background: linear-gradient(90deg, #650f50 0%, #96237a 100%);
          transition: transform 0.25s ease-out;
        }
        .site-preloader__counter {
          font-family: "Space Mono", monospace;
          font-size: 12px;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.6);
        }
        .site-preloader__counter span {
          margin-left: 1px;
          opacity: 0.5;
        }
        @keyframes preloaderBreath {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        @keyframes preloaderIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .site-preloader { transition: opacity 0.2s ease; }
          .site-preloader[data-revealing="1"] { transform: none; }
          .site-preloader__glow,
          .site-preloader__inner,
          .site-preloader__fill { animation: none; transition: none; }
        }
      `}</style>
    </div>
  );
}
