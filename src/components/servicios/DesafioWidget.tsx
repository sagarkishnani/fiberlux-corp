import { useEffect, useState, type ReactNode } from "react";
import {
  FaCloud,
  FaLock,
  FaTowerBroadcast,
  FaServer,
  FaShieldHalved,
  FaBug,
  FaEnvelopeOpenText,
  FaUserSecret,
  FaXmark,
} from "react-icons/fa6";
import type { WidgetConfig } from "./ValorSolucionReact";

const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const AVATAR = `${BASE}/images/testimonials/avatar-placeholder.svg`;

/* SPEC 93 — Widget interactivo del card "El desafío", uno por categoría.
   El dispatcher elige el sub-widget según config.type. El contenido es fijo
   por categoría (hardcoded en ValorSolucionReact). El tooltip-hint que sigue
   al cursor lo maneja ValorSolucionReact sobre todo el bloque. */
export default function DesafioWidget({ config }: { slug: string; config: WidgetConfig }) {
  return (
    <div className="dw-root relative z-10 flex w-full items-center justify-center">
      {config.type === "toggle" && <ToggleWidget config={config} />}
      {config.type === "failover" && <FailoverWidget config={config} />}
      {config.type === "shield" && <ShieldWidget config={config} />}
      {config.type === "chat" && <ChatWidget config={config} />}

      <style>{`
        /* Aparición de la burbuja de chat / indicador de escritura. */
        @keyframes dw-pop {
          from { opacity: 0; transform: translateY(6px) scale(0.96); }
          to   { opacity: 1; transform: none; }
        }
        .dw-root .dw-pop { animation: dw-pop 0.28s cubic-bezier(0.16,1,0.3,1) both; }

        /* Puntos "escribiendo…". */
        @keyframes dw-blink {
          0%, 60%, 100% { opacity: 0.35; transform: translateY(0); }
          30%           { opacity: 1;    transform: translateY(-2px); }
        }
        .dw-root .dw-typing i { animation: dw-blink 1.2s infinite ease-in-out; }
        .dw-root .dw-typing i:nth-child(2) { animation-delay: 0.18s; }
        .dw-root .dw-typing i:nth-child(3) { animation-delay: 0.36s; }

        /* Failover: paquetes que recorren el enlace de respaldo (izq → der). */
        @keyframes dw-flow {
          0%   { left: 0%;   opacity: 0; }
          12%  { opacity: 1; }
          88%  { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .dw-root .dw-packet {
          position: absolute;
          top: 50%;
          margin-top: -3px;
          height: 6px;
          width: 6px;
          border-radius: 9999px;
          background: #fff;
          box-shadow: 0 0 8px 1px #D64DB8;
          animation: dw-flow 1.5s linear infinite;
        }

        /* Escudo: anillo que pulsa hacia afuera cuando está protegido. */
        @keyframes dw-ring {
          0%   { transform: scale(0.9); opacity: 0.6; }
          70%  { transform: scale(1.25); opacity: 0; }
          100% { opacity: 0; }
        }
        .dw-root .dw-ring { animation: dw-ring 2s ease-out infinite; }

        /* Escudo: amenazas "vivas" (halo rojo latente) mientras está expuesto. */
        @keyframes dw-threat {
          0%, 100% { box-shadow: 0 0 0 0 rgba(229,72,77,0); }
          50%      { box-shadow: 0 0 0 4px rgba(229,72,77,0.14); }
        }
        .dw-root .dw-threat { animation: dw-threat 1.6s ease-in-out infinite; }
        .dw-root .dw-threat:nth-child(2) { animation-delay: 0.25s; }
        .dw-root .dw-threat:nth-child(3) { animation-delay: 0.5s; }

        /* Reduced-motion: sin transiciones ni animaciones; los estados siguen
           alternando de forma instantánea (los maneja React). */
        @media (prefers-reduced-motion: reduce) {
          .dw-root, .dw-root * {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* Avatar circular con punto "en línea" (verde). */
function Avatar() {
  return (
    <span className="relative shrink-0">
      <img
        src={AVATAR}
        alt=""
        aria-hidden="true"
        className="h-7 w-7 rounded-full bg-white/20 object-cover"
      />
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#37B24D] ring-2 ring-[#2c0a26]" />
    </span>
  );
}

/* ── Data Center — toggle de protección (click alterna ida y vuelta) ── */
function ToggleWidget({ config }: { config: WidgetConfig }) {
  const [on, setOn] = useState(false);

  return (
    <div className="flex flex-col items-center">
      {/* Label "PROTEGIDO": reserva su altura siempre para que nada salte. */}
      <span
        className={`mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-white/85 transition-opacity duration-300 ${
          on ? "opacity-100" : "opacity-0"
        }`}
      >
        {config.onLabel}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={config.onLabel || "Proteger"}
        onClick={() => setOn((v) => !v)}
        className="dw-pill relative flex h-[64px] w-[132px] cursor-pointer items-center rounded-full px-2 outline-none transition-colors duration-500 focus-visible:ring-2 focus-visible:ring-white/70"
        style={{ background: on ? "linear-gradient(135deg,#96237A,#650F50)" : "#E7C3DD" }}
      >
        <span
          className="dw-knob flex h-[48px] w-[48px] items-center justify-center rounded-full text-white shadow-lg transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform: on ? "translateX(68px)" : "translateX(0)",
            background: on ? "#1a0716" : "linear-gradient(135deg,#96237A,#650F50)",
          }}
        >
          {on ? <FaLock size={19} /> : <FaCloud size={22} />}
        </span>
      </button>

      {/* Línea punteada + nodo señal. */}
      <span
        aria-hidden="true"
        className="mt-4 h-10 w-px border-l border-dashed border-white/30"
      />
      <span
        aria-hidden="true"
        className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-white text-[#96237A] shadow-lg"
      >
        <FaTowerBroadcast size={24} />
      </span>
    </div>
  );
}

/* ── Conectividad — failover de enlace (click activa el respaldo SD-WAN) ── */
function FailoverWidget({ config }: { config: WidgetConfig }) {
  const [on, setOn] = useState(false);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={config.hint || "Activar respaldo"}
      onClick={() => setOn((v) => !v)}
      className="block w-full max-w-[320px] cursor-pointer rounded-[16px] outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      {/* Estado del enlace — reserva su altura para que nada salte. */}
      <div className="mb-4 flex justify-center">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-500 ${
            on
              ? "bg-[rgba(55,178,77,0.16)] text-[#8ce0a3]"
              : "bg-[rgba(229,72,77,0.16)] text-[#f0a0a2]"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${on ? "bg-[#37B24D]" : "bg-[#E5484D]"}`}
          />
          {on ? "En línea · Respaldo activo" : "Fuera de línea"}
        </span>
      </div>

      {/* Nodos (Sede ↔ Nube) unidos por dos rutas: principal caída + respaldo. */}
      <div className="flex items-center gap-2">
        <Node icon={<FaServer size={18} />} label="Sede" />

        <div className="relative h-[72px] flex-1">
          {/* Ruta principal (arriba) — siempre caída (rojo, cortada con ✕). */}
          <span className="absolute left-0 top-0 font-mono text-[9px] uppercase tracking-wider text-white/40">
            Principal
          </span>
          <div className="absolute inset-x-0 top-[22px] flex items-center gap-1">
            <span className="h-[2px] flex-1 rounded bg-[#E5484D]/70" />
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E5484D] text-white shadow">
              <FaXmark size={11} />
            </span>
            <span className="h-[2px] flex-1 rounded bg-[#E5484D]/70" />
          </div>

          {/* Ruta de respaldo (abajo) — punteada gris → magenta con paquetes. */}
          <div className="absolute inset-x-0 bottom-[20px] h-[2px]">
            <span
              className={`absolute inset-0 rounded transition-colors duration-500 ${
                on
                  ? "bg-gradient-to-r from-[#96237A] to-[#D64DB8]"
                  : "border-t border-dashed border-white/25"
              }`}
            />
            {on && (
              <>
                <span className="dw-packet" style={{ animationDelay: "0s" }} />
                <span className="dw-packet" style={{ animationDelay: "0.5s" }} />
                <span className="dw-packet" style={{ animationDelay: "1s" }} />
              </>
            )}
          </div>
          <span
            className={`absolute bottom-[6px] left-0 font-mono text-[9px] uppercase tracking-wider transition-colors duration-500 ${
              on ? "text-[#e9b8dd]" : "text-white/40"
            }`}
          >
            Respaldo
          </span>
        </div>

        <Node icon={<FaCloud size={20} />} label="Nube" />
      </div>

      {/* Pie contextual. */}
      <p
        className={`mt-3 text-center font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-500 ${
          on ? "text-white/60" : "text-[#f0a0a2]"
        }`}
      >
        {on ? "SD-WAN · conmutación automática" : "Enlace principal caído"}
      </p>
    </button>
  );
}

/* Nodo cuadrado con glifo + etiqueta (usado por el failover). */
function Node({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex shrink-0 flex-col items-center gap-1.5">
      <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-white text-[#96237A] shadow-lg">
        {icon}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-white/70">
        {label}
      </span>
    </span>
  );
}

/* ── Ciberseguridad — escudo Zero Trust que bloquea amenazas (click) ── */
function ShieldWidget({ config }: { config: WidgetConfig }) {
  const [on, setOn] = useState(false);
  const threats = [
    { icon: <FaBug size={12} />, label: "Malware" },
    { icon: <FaEnvelopeOpenText size={12} />, label: "Phishing" },
    { icon: <FaUserSecret size={12} />, label: "Intrusión" },
  ];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={config.hint || "Proteger"}
      onClick={() => setOn((v) => !v)}
      className="block w-full max-w-[320px] cursor-pointer rounded-[16px] outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      {/* Estado del perímetro — reserva su altura. */}
      <div className="mb-4 flex justify-center">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-500 ${
            on
              ? "bg-[rgba(55,178,77,0.16)] text-[#8ce0a3]"
              : "bg-[rgba(229,72,77,0.16)] text-[#f0a0a2]"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${on ? "bg-[#37B24D]" : "bg-[#E5484D]"}`}
          />
          {on ? "Protegido · Zero Trust" : "Expuesto"}
        </span>
      </div>

      {/* Escudo central con anillo pulsante al proteger. */}
      <div className="relative mx-auto flex h-[104px] w-[104px] items-center justify-center">
        {on && (
          <span className="dw-ring absolute h-[94px] w-[94px] rounded-full border-2 border-[#D64DB8]/50" />
        )}
        <span
          className="flex h-[68px] w-[68px] items-center justify-center rounded-[20px] shadow-lg transition-all duration-500"
          style={{
            background: on
              ? "linear-gradient(135deg,#96237A,#650F50)"
              : "rgba(255,255,255,0.07)",
            color: on ? "#fff" : "rgba(255,255,255,0.4)",
          }}
        >
          <FaShieldHalved size={30} />
        </span>
      </div>

      {/* Contador de amenazas. */}
      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
        {on ? "Amenazas bloqueadas: 3" : "3 amenazas activas"}
      </p>

      {/* Chips de amenazas: rojas y "vivas" → grises con ✕ al bloquearlas. */}
      <div className="mt-3 flex justify-center gap-2">
        {threats.map((t, i) => (
          <span
            key={i}
            className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-all duration-500 ${
              on
                ? "bg-white/[0.06] text-white/35"
                : "dw-threat bg-[rgba(229,72,77,0.16)] text-[#f0a0a2]"
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
    </button>
  );
}

/* ── Servicios Gestionados — chat (click revela la respuesta) ── */
function ChatWidget({ config }: { config: WidgetConfig }) {
  const [revealed, setRevealed] = useState(false);
  const msgs = config.messages || [];
  const user = msgs[0];
  const agent = msgs[1];

  useEffect(() => {
    // Reduced-motion: conversación completa estática desde el inicio.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
    }
  }, []);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={revealed}
      aria-label={config.hint || "Ver"}
      onClick={() => setRevealed((v) => !v)}
      className="block w-full max-w-[300px] cursor-pointer rounded-[16px] text-left outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <div className="flex flex-col gap-3">
        {/* Mensaje del usuario (claro, a la derecha) */}
        {user && (
          <div className="flex items-end justify-end gap-2">
            <div className="max-w-[220px] rounded-2xl rounded-br-md bg-[#F3E4EF] px-4 py-2.5 shadow-md">
              <p className="text-[13px] leading-snug text-[#3B0E30]">
                {user.text}
              </p>
              <p className="mt-1 text-[10px] text-[#3B0E30]/45">{user.time}</p>
            </div>
            <Avatar />
          </div>
        )}

        {/* Respuesta del agente: escribiendo → (click) mensaje */}
        {agent && (
          <div className="flex items-end gap-2">
            <Avatar />
            {revealed ? (
              <div
                key="msg"
                className="dw-pop max-w-[220px] rounded-2xl rounded-bl-md bg-[#9E2680] px-4 py-2.5 shadow-md"
              >
                <p className="text-[13px] leading-snug text-white">
                  {agent.text}
                </p>
                <p className="mt-1 text-[10px] text-white/60">{agent.time}</p>
              </div>
            ) : (
              <div
                key="typing"
                className="dw-pop rounded-2xl rounded-bl-md bg-[#9E2680] px-4 py-3.5 shadow-md"
                aria-label="Escribiendo…"
              >
                <span className="dw-typing flex items-center gap-1">
                  <i className="block h-1.5 w-1.5 rounded-full bg-white/85" />
                  <i className="block h-1.5 w-1.5 rounded-full bg-white/85" />
                  <i className="block h-1.5 w-1.5 rounded-full bg-white/85" />
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
