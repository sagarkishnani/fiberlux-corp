import { useEffect, useState, type ReactNode } from "react";
import {
  FaCloud,
  FaLock,
  FaLockOpen,
  FaTowerBroadcast,
  FaServer,
  FaShieldHalved,
  FaBug,
  FaEnvelopeOpenText,
  FaUserSecret,
  FaXmark,
  FaHeartPulse,
  FaBuilding,
  FaLocationDot,
} from "react-icons/fa6";
import type { WidgetConfig } from "./ValorSolucionReact";

/* SPEC 95 — Animación en loop del card "El desafío", una por categoría.
   Todas comparten la línea gráfica: nodo blanco redondeado, conectores finos,
   labels mono en mayúsculas y glow magenta (la base "horizonte" la pinta el
   card en ValorSolucionReact). Por defecto corren solas en loop; con
   `clickable` (valor.desafioClickable) vuelve la interacción por click, que
   sólo tiene efecto real en el switch de ciberseguridad. */
export default function DesafioWidget({
  config,
  clickable = false,
}: {
  slug: string;
  config: WidgetConfig;
  clickable?: boolean;
}) {
  return (
    <div className="dw-root relative z-10 flex w-full items-center justify-center">
      {config.type === "cloud-beam" && <CloudBeamWidget />}
      {config.type === "fiber" && <FiberWidget />}
      {config.type === "multisede" && <MultisedeWidget />}
      {config.type === "shield-switch" && (
        <ShieldSwitchWidget config={config} clickable={clickable} />
      )}
      {config.type === "noc" && <NocWidget config={config} />}

      <style>{`
        /* Haz de luz que recorre un trazo (nube / hilos de fibra): un segmento
           iluminado viaja a lo largo del path animando el stroke-dashoffset. */
        @keyframes dw-trace { to { stroke-dashoffset: -100; } }
        @keyframes dw-trace2 { to { stroke-dashoffset: -100; } }

        /* Nube (data-center): el haz recorre el contorno una vez y, al cerrar el
           ciclo, se corta y reinicia (parpadeo en la costura). */
        @keyframes dw-cloud-beam {
          0%   { stroke-dashoffset: 0;    opacity: 0; }
          5%   { opacity: 1; }
          78%  { stroke-dashoffset: -100; opacity: 1; }
          86%  { stroke-dashoffset: -100; opacity: 0; }
          100% { stroke-dashoffset: -100; opacity: 0; }
        }

        /* Nodo blanco compartido: anillos de señal que pulsan hacia afuera. */
        @keyframes dw-node-ring {
          0%   { transform: scale(0.92); opacity: 0.75; }
          70%  { opacity: 0; }
          100% { transform: scale(1.95); opacity: 0; }
        }
        .dw-root .dw-node-ring {
          transform-origin: center;
          animation: dw-node-ring 2s ease-out infinite;
        }
        .dw-root .dw-node-ring2 { animation-delay: 1s; }

        /* Glow que respira en la esfera blanca (vida constante). */
        @keyframes dw-node-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(214,77,184,0); }
          50%      { box-shadow: 0 0 16px 3px rgba(214,77,184,0.55); }
        }
        .dw-root .dw-node-core { animation: dw-node-glow 2s ease-in-out infinite; }

        /* Pulso de luz que baja por la línea punteada hacia el nodo. */
        @keyframes dw-drip {
          0%   { transform: translate(-50%, -2px); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translate(-50%, 36px); opacity: 0; }
        }
        .dw-root .dw-drip { animation: dw-drip 1.6s ease-in infinite; }

        /* Endpoints que se encienden en secuencia (data-center). */
        @keyframes dw-endpoint {
          0%, 100% { opacity: 0.28; transform: scale(0.82); }
          45%      { opacity: 1;    transform: scale(1.12); }
        }
        .dw-root .dw-ep { transform-box: fill-box; transform-origin: center; }
        .dw-root .dw-ep { animation: dw-endpoint 3s ease-in-out infinite; }
        .dw-root .dw-ep2 { animation-delay: 1s; }
        .dw-root .dw-ep3 { animation-delay: 2s; }

        /* Punto de luz viajero sobre el hilo de fibra (glow que persigue el dash). */
        @keyframes dw-comet { to { offset-distance: 100%; } }

        /* Multisede: cada sede "recibe" el haz al final del recorrido (glow que
           pulsa justo cuando la luz que salió del hub llega al nodo). */
        @keyframes dw-site-arrive {
          0%, 74%, 100% { box-shadow: 0 6px 14px -4px rgba(0,0,0,0.45); }
          86%           { box-shadow: 0 0 18px 4px rgba(214,77,184,0.75); }
        }
        .dw-root .dw-site { animation: dw-site-arrive 2s ease-in-out infinite; }

        /* Escudo: anillo que pulsa hacia afuera cuando está protegido. */
        @keyframes dw-ring {
          0%   { transform: scale(0.9); opacity: 0.6; }
          70%  { transform: scale(1.25); opacity: 0; }
          100% { opacity: 0; }
        }
        .dw-root .dw-ring { animation: dw-ring 2s ease-out infinite; }

        /* Amenazas "vivas" (halo rojo latente) mientras está expuesto. */
        @keyframes dw-threat {
          0%, 100% { box-shadow: 0 0 0 0 rgba(229,72,77,0); }
          50%      { box-shadow: 0 0 0 4px rgba(229,72,77,0.14); }
        }
        .dw-root .dw-threat { animation: dw-threat 1.6s ease-in-out infinite; }
        .dw-root .dw-threat:nth-child(2) { animation-delay: 0.25s; }
        .dw-root .dw-threat:nth-child(3) { animation-delay: 0.5s; }

        /* NOC: latido de uptime (dash que recorre la línea EKG) + tiles que respiran. */
        @keyframes dw-ekg { to { stroke-dashoffset: -240; } }
        @keyframes dw-breathe {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        .dw-root .dw-tile { animation: dw-breathe 2.4s ease-in-out infinite; }
        .dw-root .dw-tile:nth-child(2) { animation-delay: 0.4s; }
        .dw-root .dw-tile:nth-child(3) { animation-delay: 0.8s; }
        @keyframes dw-pulse-dot {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
        .dw-root .dw-live { animation: dw-pulse-dot 1.4s ease-in-out infinite; }

        /* Reduced-motion: sin animaciones. Cada widget queda en su frame estático
           representativo (los estados por defecto de React ya lo componen). */
        @media (prefers-reduced-motion: reduce) {
          .dw-root, .dw-root * {
            transition: none !important;
            animation: none !important;
            offset-distance: 55% !important;
          }
        }
      `}</style>
    </div>
  );
}

/* Nodo blanco redondeado con ícono de marca — motivo compartido de la línea
   gráfica. Opcionalmente precedido por un conector punteado vertical. */
function SignalNode({
  icon,
  connector = true,
  size = 60,
}: {
  icon: ReactNode;
  connector?: boolean;
  size?: number;
}) {
  return (
    <div className="flex flex-col items-center">
      {connector && (
        <span aria-hidden="true" className="relative block h-9 w-px">
          <span className="absolute inset-0 border-l border-dashed border-white/30" />
          {/* Pulso de luz que desciende por la línea hacia el nodo. */}
          <span
            className="dw-drip absolute left-1/2 top-0 h-2 w-2 rounded-full bg-[#D64DB8]"
            style={{ boxShadow: "0 0 8px 2px rgba(214,77,184,0.9)" }}
          />
        </span>
      )}
      <span className="relative mt-2 flex items-center justify-center" style={{ height: size, width: size }}>
        {/* Anillos de señal que pulsan (efecto de vida en el nodo). */}
        <span
          aria-hidden="true"
          className="dw-node-ring pointer-events-none absolute inset-0 rounded-2xl border-2 border-[#D64DB8]/70"
        />
        <span
          aria-hidden="true"
          className="dw-node-ring dw-node-ring2 pointer-events-none absolute inset-0 rounded-2xl border-2 border-[#D64DB8]/60"
        />
        <span
          aria-hidden="true"
          className="dw-node-core relative flex h-full w-full items-center justify-center rounded-2xl bg-[#180614]/90 text-[#F5B4E6] border border-[#D64DB8]/65 shadow-[0_0_20px_rgba(214,77,184,0.3)] backdrop-blur-sm"
        >
          {icon}
        </span>
      </span>
    </div>
  );
}

/* Etiqueta mono en mayúsculas (línea gráfica compartida). */
function MonoLabel({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "on" | "off" }) {
  const color =
    tone === "on" ? "text-[#e9b8dd]" : tone === "off" ? "text-[#f0a0a2]" : "text-white/70";
  return (
    <span className={`font-mono text-[11px] uppercase tracking-[0.25em] ${color}`}>
      {children}
    </span>
  );
}

/* ── Data Center — nube de luz con haz que la recorre + endpoints en secuencia ── */
function CloudBeamWidget() {
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 220 150"
        className="w-[220px] max-w-full"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="dw-cloud" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#D64DB8" />
            <stop offset="1" stopColor="#96237A" />
          </linearGradient>
        </defs>

        {/* Conectores nube → endpoints (líneas punteadas finas). */}
        <path d="M74 96 L52 128" stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeDasharray="3 4" />
        <path d="M110 100 L110 132" stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeDasharray="3 4" />
        <path d="M146 96 L168 128" stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeDasharray="3 4" />

        {/* Nube — trazo tenue de base. */}
        <path
          d="M80 100 C60 100 46 86 46 68 C46 52 58 39 74 40 C78 25 91 16 106 16 C124 16 138 30 139 47 C155 48 168 61 168 76 C168 90 156 100 142 100 Z"
          stroke="rgba(213,167,202,0.30)"
          strokeWidth="2"
        />
        {/* Nube — haz de luz: segmento iluminado que recorre el contorno. */}
        <path
          d="M80 100 C60 100 46 86 46 68 C46 52 58 39 74 40 C78 25 91 16 106 16 C124 16 138 30 139 47 C155 48 168 61 168 76 C168 90 156 100 142 100 Z"
          pathLength={100}
          stroke="url(#dw-cloud)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeDasharray="24 76"
          style={{
            filter: "drop-shadow(0 0 5px rgba(214,77,184,0.9))",
            animation: "dw-cloud-beam 3.2s linear infinite",
          }}
        />

        {/* Endpoints que se encienden en secuencia. */}
        <circle className="dw-ep" cx="52" cy="132" r="5" fill="#D64DB8" style={{ filter: "drop-shadow(0 0 4px #D64DB8)" }} />
        <circle className="dw-ep dw-ep2" cx="110" cy="136" r="5" fill="#D64DB8" style={{ filter: "drop-shadow(0 0 4px #D64DB8)" }} />
        <circle className="dw-ep dw-ep3" cx="168" cy="132" r="5" fill="#D64DB8" style={{ filter: "drop-shadow(0 0 4px #D64DB8)" }} />
      </svg>

      <span className="mt-3">
        <MonoLabel>Sincronizado</MonoLabel>
      </span>
      <SignalNode icon={<FaTowerBroadcast size={24} />} />
    </div>
  );
}

/* ── Conectividad — hilo de fibra con punto de luz que lo recorre ── */
function FiberWidget() {
  // Curvas bézier recorridas por un punto de luz + estela (offset-path).
  const P1 = "M8 92 C 70 36, 150 148, 232 62";
  const P2 = "M8 60 C 78 120, 148 20, 232 96";
  return (
    <div className="flex w-full max-w-[300px] flex-col items-center">
      <div className="relative h-[150px] w-full">
        {/* Nodos-extremo (línea gráfica: contenedor translúcido + borde e ícono magenta). */}
        <span className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl bg-[#180614]/90 text-[#F5B4E6] border border-[#D64DB8]/65 shadow-[0_0_20px_rgba(214,77,184,0.3)] backdrop-blur-sm">
          <FaServer size={16} />
        </span>
        <span className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl bg-[#180614]/90 text-[#F5B4E6] border border-[#D64DB8]/65 shadow-[0_0_20px_rgba(214,77,184,0.3)] backdrop-blur-sm">
          <FaCloud size={18} />
        </span>

        <svg viewBox="0 0 240 150" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="dw-fiber" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#96237A" />
              <stop offset="0.5" stopColor="#D64DB8" />
              <stop offset="1" stopColor="#96237A" />
            </linearGradient>
          </defs>
          {/* Hilos tenues. */}
          <path d={P1} stroke="rgba(213,167,202,0.22)" strokeWidth="1.5" />
          <path d={P2} stroke="rgba(213,167,202,0.14)" strokeWidth="1.5" />
          {/* Estela de luz recorriendo cada hilo. */}
          <path
            d={P1}
            pathLength={100}
            stroke="url(#dw-fiber)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="16 84"
            strokeDashoffset={-30}
            style={{ filter: "drop-shadow(0 0 5px rgba(214,77,184,0.9))", animation: "dw-trace 2.6s linear infinite" }}
          />
          <path
            d={P2}
            pathLength={100}
            stroke="url(#dw-fiber)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="12 88"
            strokeDashoffset={-70}
            style={{ filter: "drop-shadow(0 0 4px rgba(214,77,184,0.7))", animation: "dw-trace2 3.4s linear infinite" }}
          />
        </svg>

        {/* Punto de luz brillante que viaja por el hilo principal (offset-path). */}
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-2.5 w-2.5 rounded-full bg-white"
          style={{
            offsetPath: `path("${P1}")`,
            offsetDistance: "55%",
            boxShadow: "0 0 10px 2px #D64DB8",
            animation: "dw-comet 2.6s linear infinite",
          }}
        />
      </div>
      <span className="mt-1">
        <MonoLabel tone="on">Enlace activo</MonoLabel>
      </span>
    </div>
  );
}

/* ── Conectividad Empresarial — hub multisede: un nodo central irradia enlaces
   de fibra hacia varias sedes; la luz sale del hub y viaja a cada sede en
   secuencia (concepto de red multisede, no un simple punto a punto). ── */
function MultisedeWidget() {
  // viewBox 300×196: hub centrado arriba (150,52 = borde inferior del nodo),
  // tres sedes abajo. Cada enlace lo recorre un haz hub → sede, escalonado.
  const sites = [
    { x: 24, d: "M150 52 C 110 100, 50 120, 24 156", delay: "0s" },
    { x: 150, d: "M150 52 L150 156", delay: "0.5s" },
    { x: 276, d: "M150 52 C 190 100, 250 120, 276 156", delay: "1s" },
  ];
  return (
    <div className="mb-24 flex w-full max-w-[260px] flex-col items-center sm:max-w-[300px] md:mb-32">
      <div className="relative h-[176px] w-full">
        <svg viewBox="0 0 300 176" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="dw-hub" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#D64DB8" />
              <stop offset="1" stopColor="#96237A" />
            </linearGradient>
          </defs>
          {sites.map((s, i) => (
            <g key={i}>
              {/* Enlace tenue de base. */}
              <path d={s.d} stroke="rgba(213,167,202,0.22)" strokeWidth="1.5" />
              {/* Haz de luz que sale del hub y viaja hacia la sede. */}
              <path
                d={s.d}
                pathLength={100}
                stroke="url(#dw-hub)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeDasharray="18 82"
                style={{
                  filter: "drop-shadow(0 0 5px rgba(214,77,184,0.9))",
                  animation: `dw-trace 2s linear ${s.delay} infinite`,
                }}
              />
            </g>
          ))}
        </svg>

        {/* Hub central (nodo con anillos de señal que pulsan). */}
        <span className="absolute left-1/2 top-0 z-10 h-11 w-11 -translate-x-1/2 md:h-[52px] md:w-[52px]">
          <span aria-hidden="true" className="dw-node-ring pointer-events-none absolute inset-0 rounded-2xl border-2 border-[#D64DB8]/70" />
          <span aria-hidden="true" className="dw-node-ring dw-node-ring2 pointer-events-none absolute inset-0 rounded-2xl border-2 border-[#D64DB8]/60" />
          <span className="dw-node-core relative flex h-full w-full items-center justify-center rounded-2xl bg-[#180614]/90 text-[#F5B4E6] border border-[#D64DB8]/65 shadow-[0_0_20px_rgba(214,77,184,0.3)] backdrop-blur-sm">
            <FaBuilding className="text-[19px] md:text-[22px]" />
          </span>
        </span>

        {/* Sedes — cada una "se enciende" cuando el haz llega (dw-site). */}
        {sites.map((s, i) => (
          <span
            key={i}
            className="dw-site absolute bottom-0 z-10 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#180614]/90 text-[#F5B4E6] border border-[#D64DB8]/65 shadow-[0_0_20px_rgba(214,77,184,0.3)] backdrop-blur-sm md:h-10 md:w-10"
            style={{ left: `${(s.x / 300) * 100}%`, transform: "translateX(-50%)", animationDelay: s.delay }}
          >
            <FaLocationDot className="text-[13px] md:text-[15px]" />
          </span>
        ))}
      </div>
      <span className="mt-2">
        <MonoLabel tone="on">Sedes conectadas</MonoLabel>
      </span>
    </div>
  );
}

/* ── Ciberseguridad — interruptor/candado que alterna EXPUESTO ↔ PROTEGIDO ── */
function ShieldSwitchWidget({
  config,
  clickable,
}: {
  config: WidgetConfig;
  clickable: boolean;
}) {
  const [on, setOn] = useState(false); // arranca EXPUESTO
  const threats = [
    { icon: <FaBug size={12} />, label: "Malware" },
    { icon: <FaEnvelopeOpenText size={12} />, label: "Phishing" },
    { icon: <FaUserSecret size={12} />, label: "Intrusión" },
  ];

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Reduced-motion: frame estático protegido.
    if (reduced) {
      setOn(true);
      return;
    }
    // Con click activo, no hay autoplay (lo maneja el usuario).
    if (clickable) return;
    const id = window.setInterval(() => setOn((v) => !v), 2600);
    return () => window.clearInterval(id);
  }, [clickable]);

  const body = (
    <div className="flex flex-col items-center">
      {/* Label mono EXPUESTO/PROTEGIDO — reserva altura para que nada salte. */}
      <span className="mb-3 h-4">
        <MonoLabel tone={on ? "on" : "off"}>{on ? config.onLabel : config.offLabel}</MonoLabel>
      </span>

      {/* Interruptor pill + perilla candado. */}
      <span
        className="dw-pill relative flex h-[64px] w-[132px] items-center rounded-full px-2 transition-colors duration-500"
        style={{ background: on ? "linear-gradient(135deg,#96237A,#650F50)" : "#E7C3DD" }}
      >
        <span
          className="dw-knob flex h-[48px] w-[48px] items-center justify-center rounded-full text-white shadow-lg transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform: on ? "translateX(68px)" : "translateX(0)",
            background: on ? "#1a0716" : "linear-gradient(135deg,#B23E97,#7c1c64)",
          }}
        >
          {on ? <FaLock size={19} /> : <FaLockOpen size={19} />}
        </span>
      </span>

      {/* Chips de amenazas: rojas y "vivas" (expuesto) → grises con ✕ (protegido). */}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {threats.map((t, i) => (
          <span
            key={i}
            className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-all duration-500 ${
              on ? "bg-white/[0.06] text-white/35" : "dw-threat bg-[rgba(229,72,77,0.16)] text-[#f0a0a2]"
            }`}
            style={{ transitionDelay: on ? `${i * 90}ms` : "0ms" }}
          >
            {t.icon}
            {t.label}
            {on && (
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#E5484D] text-white">
                <FaXmark size={8} />
              </span>
            )}
          </span>
        ))}
      </div>

      <SignalNode icon={<FaShieldHalved size={22} />} />
    </div>
  );

  // Con interacción activa, el bloque es un switch operable (lo dispara también
  // el click sobre todo el card, vía ValorSolucionReact).
  if (clickable) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={config.hint || "Proteger"}
        onClick={() => setOn((v) => !v)}
        className="cursor-pointer rounded-[16px] outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        {body}
      </button>
    );
  }
  return body;
}

/* ── Servicios Gestionados — NOC / monitoreo 24/7 (latido de uptime en loop) ── */
function NocWidget({ config }: { config: WidgetConfig }) {
  const tiles = [
    { label: "CPU", value: "32%" },
    { label: "Red", value: "OK" },
    { label: "Backup", value: "✓" },
  ];
  return (
    <div className="flex w-full max-w-[300px] flex-col items-center">
      <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        {/* Cabecera: estado OPERATIVO (punto verde latente) + uptime. */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <span className="dw-live h-2 w-2 rounded-full bg-[#37B24D]" />
            <MonoLabel tone="on">Operativo</MonoLabel>
          </span>
          <span className="font-mono text-[13px] font-semibold text-white">{config.uptime}</span>
        </div>

        {/* Latido de uptime (línea EKG recorrida por un dash). */}
        <svg viewBox="0 0 240 56" className="mt-3 h-[56px] w-full" fill="none" aria-hidden="true">
          <path
            d="M0 28 H70 l8 -18 l10 36 l8 -18 H150 l8 -12 l10 24 l6 -12 H240"
            stroke="rgba(213,167,202,0.22)"
            strokeWidth="1.5"
          />
          <path
            d="M0 28 H70 l8 -18 l10 36 l8 -18 H150 l8 -12 l10 24 l6 -12 H240"
            pathLength={240}
            stroke="#D64DB8"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="46 194"
            strokeDashoffset={0}
            style={{ filter: "drop-shadow(0 0 4px rgba(214,77,184,0.8))", animation: "dw-ekg 2.2s linear infinite" }}
          />
        </svg>

        {/* Tiles de métricas vivas. */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {tiles.map((t, i) => (
            <div key={i} className="dw-tile rounded-lg bg-white/[0.05] px-2 py-1.5 text-center">
              <div className="font-mono text-[9px] uppercase tracking-wider text-white/50">{t.label}</div>
              <div className="font-mono text-[13px] font-semibold text-white">{t.value}</div>
            </div>
          ))}
        </div>
      </div>

      <SignalNode icon={<FaHeartPulse size={22} />} />
    </div>
  );
}
