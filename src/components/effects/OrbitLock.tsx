/**
 * OrbitLock — gráfico protagonista del hero de Nosotros.
 *
 * Candado central SÓLIDO (relleno) sobre un disco magenta luminoso con glow que
 * pulsa, envuelto en un anillo de vidrio, anillos concéntricos y arcos que giran,
 * un campo de partículas a la deriva, y tres TILES de vidrio (glassmorphism, como
 * el hero de Soluciones) que orbitan con íconos LINEALES: rayo, servidor, globo.
 *
 * Todo es SVG/DIV + CSS (sin WebGL) por el requisito de rendimiento. Las
 * animaciones usan solo transform/opacity (compositor GPU) y respetan
 * prefers-reduced-motion. El candado es el único elemento 100% opaco; el resto
 * va con opacidad < 1. Palancas en PARAMS.
 */

interface OrbitLockProps {
  className?: string;
}

/* ── Palancas de composición y animación ── */
const PARAMS = {
  orbitRadius: 176, // distancia de los tiles al centro (sistema de 520)
  spinDuration: 48, // s — vuelta completa de la órbita
  pulseDuration: 3.8, // s — pulso del glow del candado
  coreSize: 190, // px — disco central luminoso
  glowSize: 460, // px — glow morado detrás del candado
  chipOpacity: 0.82, // opacidad de los tiles glass
  mobileScale: 0.72, // evita que los tiles se recorten en pantallas angostas
};

/* ── Íconos orbitales: SVG lineal (stroke, fill:none) ── */
function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" />
    </svg>
  );
}
function IconServer() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="7" rx="1.6" />
      <rect x="3" y="13" width="18" height="7" rx="1.6" />
      <path d="M7 7.5h.01M7 16.5h.01" />
      <path d="M17 7.5h1.5M17 16.5h1.5" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </svg>
  );
}

/* ── Candado central: SÓLIDO (relleno) ── */
function LockGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" fill="none" stroke="#2A0A22" strokeWidth={2.1} strokeLinecap="round" />
      <rect x="5" y="10" width="14" height="10.5" rx="2.4" fill="#2A0A22" />
      <circle cx="12" cy="14.4" r="1.5" fill="#F6D9EE" />
      <rect x="11.25" y="15" width="1.5" height="3.4" rx="0.75" fill="#F6D9EE" />
    </svg>
  );
}

/* angle: posición en la órbita · scale: tamaño relativo del tile (profundidad) */
const CHIPS = [
  { angle: -18, scale: 1.05, Icon: IconServer, label: 'red / servidor' },
  { angle: 108, scale: 0.86, Icon: IconBolt, label: 'velocidad' },
  { angle: 226, scale: 0.95, Icon: IconGlobe, label: 'cobertura' },
];

/* Partículas de luz (posiciones fijas → sin mismatch de hidratación). */
const PARTICLES = [
  { top: 12, left: 20, s: 3, d: 0, dur: 7 },
  { top: 24, left: 82, s: 2, d: 1.2, dur: 9 },
  { top: 46, left: 8, s: 4, d: 0.5, dur: 8 },
  { top: 68, left: 90, s: 2, d: 2.1, dur: 10 },
  { top: 82, left: 30, s: 3, d: 1.6, dur: 7.5 },
  { top: 88, left: 66, s: 2, d: 0.8, dur: 9.5 },
  { top: 34, left: 54, s: 2, d: 2.6, dur: 8.5 },
  { top: 58, left: 44, s: 3, d: 1.0, dur: 7 },
  { top: 16, left: 62, s: 2, d: 3.0, dur: 10 },
  { top: 74, left: 14, s: 3, d: 0.3, dur: 8 },
  { top: 40, left: 94, s: 2, d: 1.8, dur: 9 },
  { top: 6, left: 40, s: 2, d: 2.3, dur: 11 },
];

export default function OrbitLock({ className = '' }: OrbitLockProps) {
  const styleVars = {
    '--orbit-radius': `${PARAMS.orbitRadius}px`,
    '--spin-dur': `${PARAMS.spinDuration}s`,
    '--pulse-dur': `${PARAMS.pulseDuration}s`,
    '--core-size': `${PARAMS.coreSize}px`,
    '--glow-size': `${PARAMS.glowSize}px`,
    '--chip-opacity': `${PARAMS.chipOpacity}`,
    '--mobile-scale': `${PARAMS.mobileScale}`,
  } as React.CSSProperties;

  return (
    <div className={`orbitlock ${className}`} style={styleVars} aria-hidden="true">
      <div className="orbitlock__stage">
        {/* Glow morado grande detrás del candado (pulsa) */}
        <div className="orbitlock__glow" />

        {/* Partículas de luz a la deriva */}
        <div className="orbitlock__particles">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="orbitlock__particle"
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                width: `${p.s}px`,
                height: `${p.s}px`,
                animationDelay: `${p.d}s`,
                animationDuration: `${p.dur}s`,
              }}
            />
          ))}
        </div>

        {/* Anillos concéntricos + arco que gira */}
        <div className="orbitlock__ring orbitlock__ring--1" />
        <div className="orbitlock__ring orbitlock__ring--2" />
        <div className="orbitlock__arc" />
        <div className="orbitlock__ring orbitlock__ring--3 orbitlock__ring--dashed" />

        {/* Órbita giratoria con los 3 tiles glass lineales */}
        <div className="orbitlock__orbit">
          {CHIPS.map(({ angle, scale, Icon, label }) => (
            <div
              key={label}
              className="orbitlock__chip"
              style={{ '--angle': `${angle}deg`, '--scale': `${scale}` } as React.CSSProperties}
            >
              <div
                className="orbitlock__chip-inner"
                style={{ '--counter': `${-angle}deg` } as React.CSSProperties}
              >
                <Icon />
              </div>
            </div>
          ))}
        </div>

        {/* Anillo de vidrio + disco central luminoso + candado sólido */}
        <div className="orbitlock__lens" />
        <div className="orbitlock__core">
          <div className="orbitlock__lock">
            <LockGlyph />
          </div>
        </div>
      </div>

      <style>{`
        .orbitlock {
          position: relative;
          display: grid;
          place-items: center;
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
        }
        .orbitlock__stage {
          position: relative;
          width: 520px;
          height: 520px;
          max-width: 96vw;
          max-height: 96vw;
          display: grid;
          place-items: center;
        }
        .orbitlock__stage > * { grid-area: 1 / 1; }

        /* Glow morado que pulsa */
        .orbitlock__glow {
          width: var(--glow-size);
          height: var(--glow-size);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(226,79,184,0.45) 0%, rgba(150,35,122,0.28) 34%, rgba(150,35,122,0) 68%);
          filter: blur(6px);
          animation: ol-pulse var(--pulse-dur) ease-in-out infinite;
        }

        /* Partículas */
        .orbitlock__particles { width: 100%; height: 100%; }
        .orbitlock__particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(240,111,198,0.9);
          box-shadow: 0 0 8px 1px rgba(226,79,184,0.7);
          opacity: 0.5;
          animation-name: ol-drift;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        /* Anillos + arco */
        .orbitlock__ring {
          border-radius: 50%;
          border: 1px solid rgba(226,79,184,0.14);
        }
        .orbitlock__ring--1 { width: 262px; height: 262px; }
        .orbitlock__ring--2 { width: 366px; height: 366px; border-color: rgba(226,79,184,0.09); }
        .orbitlock__ring--3 {
          width: calc(var(--orbit-radius) * 2);
          height: calc(var(--orbit-radius) * 2);
          border-color: rgba(226,79,184,0.20);
        }
        .orbitlock__ring--dashed {
          border-style: dashed;
          animation: ol-spin calc(var(--spin-dur) * 3) linear infinite reverse;
        }
        .orbitlock__arc {
          width: 306px;
          height: 306px;
          border-radius: 50%;
          border: 2px solid transparent;
          background: conic-gradient(from 0deg, rgba(240,111,198,0) 0deg, rgba(240,111,198,0.9) 60deg, rgba(240,111,198,0) 130deg) border-box;
          -webkit-mask: linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.55;
          animation: ol-spin calc(var(--spin-dur) / 3) linear infinite;
        }

        /* Órbita giratoria */
        .orbitlock__orbit {
          position: relative;
          width: calc(var(--orbit-radius) * 2);
          height: calc(var(--orbit-radius) * 2);
          animation: ol-spin var(--spin-dur) linear infinite;
        }
        .orbitlock__chip {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 64px;
          height: 64px;
          margin: -32px 0 0 -32px;
          transform: rotate(var(--angle)) translateY(calc(var(--orbit-radius) * -1));
        }
        .orbitlock__chip-inner {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          border-radius: 26%;
          border: 1px solid rgba(255,255,255,0.16);
          background: linear-gradient(145deg, rgba(255,255,255,0.12), rgba(150,35,122,0.10));
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.22), 0 0 20px rgba(226,79,184,0.18);
          color: rgba(246,217,238,0.92);
          opacity: var(--chip-opacity);
          /* deshace ángulo de posición + contra-rota la órbita → ícono derecho, y aplica escala de profundidad */
          transform: rotate(var(--counter)) scale(var(--scale));
          animation: ol-counterspin var(--spin-dur) linear infinite;
        }
        .orbitlock__chip-inner svg { width: 46%; height: 46%; }

        /* Anillo de vidrio alrededor del core */
        .orbitlock__lens {
          width: calc(var(--core-size) + 46px);
          height: calc(var(--core-size) + 46px);
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.14);
          background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.10), rgba(255,255,255,0) 60%);
          box-shadow: inset 0 0 40px rgba(226,79,184,0.25);
        }

        /* Disco central + candado sólido (único elemento 100% opaco) */
        .orbitlock__core {
          width: var(--core-size);
          height: var(--core-size);
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: radial-gradient(circle at 36% 30%, #FF86D2 0%, #F06FC6 22%, #C13A9E 52%, #96237A 78%, #7A1866 100%);
          box-shadow: 0 0 80px 12px rgba(226,79,184,0.5), inset 0 -12px 30px rgba(58,14,48,0.6), inset 0 10px 22px rgba(255,255,255,0.32);
          animation: ol-core-pulse var(--pulse-dur) ease-in-out infinite;
        }
        .orbitlock__lock {
          width: 46%;
          height: 46%;
          display: grid;
          place-items: center;
        }
        .orbitlock__lock svg { width: 100%; height: 100%; }

        @keyframes ol-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ol-counterspin {
          from { transform: rotate(var(--counter)) scale(var(--scale)) rotate(0deg); }
          to { transform: rotate(var(--counter)) scale(var(--scale)) rotate(-360deg); }
        }
        @keyframes ol-pulse {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.07); }
        }
        @keyframes ol-core-pulse {
          0%, 100% { box-shadow: 0 0 68px 8px rgba(226,79,184,0.42), inset 0 -12px 30px rgba(58,14,48,0.6), inset 0 10px 22px rgba(255,255,255,0.30); }
          50% { box-shadow: 0 0 104px 20px rgba(226,79,184,0.66), inset 0 -12px 30px rgba(58,14,48,0.6), inset 0 10px 22px rgba(255,255,255,0.36); }
        }
        @keyframes ol-drift {
          0%, 100% { transform: translate(0, 0); opacity: 0.25; }
          50% { transform: translate(-8px, -14px); opacity: 0.7; }
        }

        @media (max-width: 767px) {
          .orbitlock__stage { transform: scale(var(--mobile-scale)); }
        }

        @media (prefers-reduced-motion: reduce) {
          .orbitlock__glow,
          .orbitlock__orbit,
          .orbitlock__chip-inner,
          .orbitlock__ring--dashed,
          .orbitlock__arc,
          .orbitlock__particle,
          .orbitlock__core {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
