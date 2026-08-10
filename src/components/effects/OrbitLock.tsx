/**
 * OrbitLock — gráfico decorativo del hero de Nosotros.
 *
 * Candado central SÓLIDO (relleno) sobre un disco con glow morado de marca que
 * pulsa, rodeado de anillos concéntricos y tres íconos LINEALES (stroke, sin
 * relleno, con opacidad reducida) que orbitan lentamente: rayo, globo, servidor.
 *
 * Todo es SVG + CSS (sin WebGL) por el requisito de rendimiento en dispositivos
 * ligeros. Las animaciones usan solo transform/opacity (compositor GPU) y
 * respetan prefers-reduced-motion (gráfico estático). El candado es el único
 * elemento 100% opaco; el resto va con opacidad < 1.
 *
 * Palancas en PARAMS (radios, velocidades, tamaños, opacidades). Los tres chns
 * se colocan a 120° y contra-rotan para que los íconos queden siempre derechos.
 */

interface OrbitLockProps {
  className?: string;
}

/* ── Palancas de composición y animación ── */
const PARAMS = {
  orbitRadius: 168, // distancia de los chips al centro (px, en el sistema de 480)
  spinDuration: 46, // s — vuelta completa de la órbita
  pulseDuration: 3.6, // s — pulso del glow del candado
  chipSize: 62, // px — diámetro del chip orbital
  chipOpacity: 0.55, // opacidad de los íconos lineales
  coreSize: 168, // px — diámetro del disco central luminoso
  glowSize: 300, // px — diámetro del glow morado detrás del candado
  mobileScale: 0.62, // factor de escala en mobile
  mobileOpacity: 0.5, // opacidad global del gráfico en mobile (detrás del texto)
};

/* ── Íconos orbitales: SVG lineal (stroke, fill:none) ── */
function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </svg>
  );
}

function IconServer() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="7" rx="1.6" />
      <rect x="3" y="13" width="18" height="7" rx="1.6" />
      <path d="M7 7.5h.01M7 16.5h.01" />
      <path d="M17 7.5h1.5M17 16.5h1.5" />
    </svg>
  );
}

/* ── Candado central: SÓLIDO (relleno) ── */
function LockGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {/* Arco (shackle) */}
      <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" fill="none" stroke="#2A0A22" strokeWidth={2.1} strokeLinecap="round" />
      {/* Cuerpo relleno */}
      <rect x="5" y="10" width="14" height="10.5" rx="2.4" fill="#2A0A22" />
      {/* Ojo de cerradura */}
      <circle cx="12" cy="14.4" r="1.5" fill="#F6D9EE" />
      <rect x="11.25" y="15" width="1.5" height="3.4" rx="0.75" fill="#F6D9EE" />
    </svg>
  );
}

const CHIPS = [
  { angle: 0, Icon: IconBolt, label: 'velocidad' },
  { angle: 120, Icon: IconServer, label: 'red / servidor' },
  { angle: 240, Icon: IconGlobe, label: 'cobertura' },
];

export default function OrbitLock({ className = '' }: OrbitLockProps) {
  const styleVars = {
    '--orbit-radius': `${PARAMS.orbitRadius}px`,
    '--spin-dur': `${PARAMS.spinDuration}s`,
    '--pulse-dur': `${PARAMS.pulseDuration}s`,
    '--chip-size': `${PARAMS.chipSize}px`,
    '--chip-opacity': `${PARAMS.chipOpacity}`,
    '--core-size': `${PARAMS.coreSize}px`,
    '--glow-size': `${PARAMS.glowSize}px`,
    '--mobile-scale': `${PARAMS.mobileScale}`,
    '--mobile-opacity': `${PARAMS.mobileOpacity}`,
  } as React.CSSProperties;

  return (
    <div className={`orbitlock ${className}`} style={styleVars} aria-hidden="true">
      <div className="orbitlock__stage">
        {/* Glow morado detrás del candado (pulsa) */}
        <div className="orbitlock__glow" />

        {/* Anillos concéntricos tenues */}
        <div className="orbitlock__ring orbitlock__ring--1" />
        <div className="orbitlock__ring orbitlock__ring--2" />
        <div className="orbitlock__ring orbitlock__ring--3 orbitlock__ring--dashed" />

        {/* Órbita giratoria con los 3 chips lineales */}
        <div className="orbitlock__orbit">
          {CHIPS.map(({ angle, Icon, label }) => (
            <div
              key={label}
              className="orbitlock__chip"
              style={{ '--angle': `${angle}deg` } as React.CSSProperties}
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

        {/* Disco central luminoso + candado sólido */}
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
          overflow: hidden;
          pointer-events: none;
        }
        .orbitlock__stage {
          position: relative;
          width: 480px;
          height: 480px;
          max-width: 92vw;
          max-height: 92vw;
          display: grid;
          place-items: center;
        }
        /* Todos los hijos se apilan centrados en la misma celda del grid */
        .orbitlock__stage > * {
          grid-area: 1 / 1;
        }

        /* Glow morado que pulsa */
        .orbitlock__glow {
          width: var(--glow-size);
          height: var(--glow-size);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(226,79,184,0.55) 0%, rgba(150,35,122,0.35) 38%, rgba(150,35,122,0) 70%);
          filter: blur(4px);
          animation: ol-pulse var(--pulse-dur) ease-in-out infinite;
        }

        /* Anillos concéntricos */
        .orbitlock__ring {
          border-radius: 50%;
          border: 1px solid rgba(226,79,184,0.14);
        }
        .orbitlock__ring--1 { width: 240px; height: 240px; }
        .orbitlock__ring--2 { width: 336px; height: 336px; border-color: rgba(226,79,184,0.10); }
        .orbitlock__ring--3 {
          width: calc(var(--orbit-radius) * 2);
          height: calc(var(--orbit-radius) * 2);
          border-color: rgba(226,79,184,0.18);
        }
        .orbitlock__ring--dashed {
          border-style: dashed;
          animation: ol-spin calc(var(--spin-dur) * 3) linear infinite reverse;
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
          width: var(--chip-size);
          height: var(--chip-size);
          margin: calc(var(--chip-size) / -2) 0 0 calc(var(--chip-size) / -2);
          /* coloca el chip sobre el anillo y lo empuja hacia afuera */
          transform: rotate(var(--angle)) translateY(calc(var(--orbit-radius) * -1));
        }
        .orbitlock__chip-inner {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 1px solid rgba(226,79,184,0.30);
          background: rgba(150,35,122,0.10);
          color: rgba(246,217,238,0.92);
          opacity: var(--chip-opacity);
          /* deshace el ángulo de posición y contra-rota la órbita → ícono derecho */
          transform: rotate(var(--counter));
          animation: ol-spin var(--spin-dur) linear infinite reverse;
        }
        .orbitlock__chip-inner svg {
          width: 42%;
          height: 42%;
        }

        /* Disco central + candado sólido (único elemento 100% opaco) */
        .orbitlock__core {
          width: var(--core-size);
          height: var(--core-size);
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: radial-gradient(circle at 38% 32%, #F06FC6 0%, #C13A9E 34%, #96237A 72%, #7A1866 100%);
          box-shadow: 0 0 60px 8px rgba(226,79,184,0.45), inset 0 -10px 26px rgba(58,14,48,0.55), inset 0 8px 18px rgba(255,255,255,0.28);
          animation: ol-core-pulse var(--pulse-dur) ease-in-out infinite;
        }
        .orbitlock__lock {
          width: 46%;
          height: 46%;
          display: grid;
          place-items: center;
        }
        .orbitlock__lock svg { width: 100%; height: 100%; }

        @keyframes ol-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ol-pulse {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes ol-core-pulse {
          0%, 100% { box-shadow: 0 0 52px 6px rgba(226,79,184,0.40), inset 0 -10px 26px rgba(58,14,48,0.55), inset 0 8px 18px rgba(255,255,255,0.28); }
          50% { box-shadow: 0 0 78px 14px rgba(226,79,184,0.60), inset 0 -10px 26px rgba(58,14,48,0.55), inset 0 8px 18px rgba(255,255,255,0.32); }
        }

        /* Mobile: más pequeño y atenuado, detrás del texto */
        @media (max-width: 767px) {
          .orbitlock__stage {
            transform: scale(var(--mobile-scale));
            opacity: var(--mobile-opacity);
          }
        }

        /* Accesibilidad: sin movimiento */
        @media (prefers-reduced-motion: reduce) {
          .orbitlock__glow,
          .orbitlock__orbit,
          .orbitlock__chip-inner,
          .orbitlock__ring--dashed,
          .orbitlock__core {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
