import { useEffect, useState } from "react";
import { FaCloud, FaLock, FaTowerBroadcast } from "react-icons/fa6";
import type { WidgetConfig } from "./ValorSolucionReact";

const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const AVATAR = `${BASE}/images/testimonials/avatar-placeholder.svg`;
const NODE_GLYPH = `${BASE}/images/soluciones/fiberlux-purple.svg`;

/* SPEC 93 — Widget interactivo del card "El desafío", uno por categoría.
   El dispatcher elige el sub-widget según config.type. El contenido es fijo
   por categoría (hardcoded en ValorSolucionReact). */
export default function DesafioWidget({ config }: { slug: string; config: WidgetConfig }) {
  return (
    <div className="dw-root relative z-10 flex w-full items-center justify-center">
      {config.type === "toggle" && <ToggleWidget config={config} />}
      {config.type === "stats" && <StatsWidget config={config} />}
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

/* Tooltip-hint: aparece en hover (desktop) y, en touch, unos segundos como
   guía inicial. Se maneja con useHint() y se muestra sólo en el estado inicial. */
function useHint() {
  const [hover, setHover] = useState(false);
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Sin hover (touch): mostrar el tooltip unos segundos como guía y ocultarlo.
    if (!window.matchMedia("(hover: hover)").matches) {
      setGuide(true);
      const t = window.setTimeout(() => setGuide(false), 3200);
      return () => window.clearTimeout(t);
    }
  }, []);

  return {
    visible: hover || guide,
    bind: {
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
    },
  };
}

function HintTip({
  show,
  label,
  className = "",
}: {
  show: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`pointer-events-none absolute z-30 whitespace-nowrap rounded-[8px] bg-white/95 px-2.5 py-1 text-[12px] font-medium text-[#3B0E30] shadow-lg transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0"
      } ${className}`}
    >
      <span aria-hidden="true" className="mr-1">
        ↵
      </span>
      {label}
    </span>
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
  const hint = useHint();

  return (
    <div className="flex flex-col items-center" {...hint.bind}>
      {/* Label "PROTEGIDO": reserva su altura siempre para que nada salte. */}
      <span
        className={`mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-white/85 transition-opacity duration-300 ${
          on ? "opacity-100" : "opacity-0"
        }`}
      >
        {config.onLabel}
      </span>

      <div className="relative">
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

        <HintTip
          show={hint.visible && !on}
          label={config.hint}
          className="-right-1 -top-7"
        />
      </div>

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

/* ── Ciberseguridad — métricas comprometido↔protegido (click alterna) ── */
function StatsWidget({ config }: { config: WidgetConfig }) {
  const [on, setOn] = useState(false);
  const hint = useHint();
  const s = on ? config.after : config.before;
  const up = on; // true → tendencia positiva (verde)
  const accent = up ? "#2F9E44" : "#E5484D";
  const badgeBg = up ? "rgba(55,178,77,0.14)" : "rgba(229,72,77,0.14)";
  // Polilíneas de tendencia: bajando (rojo) vs subiendo (verde).
  const line = up
    ? "0,60 20,48 40,54 60,37 80,42 100,24 120,30 140,13 160,10"
    : "0,15 20,24 40,18 60,35 80,29 100,46 120,41 140,58 160,55";

  return (
    <div className="relative pt-6" {...hint.bind}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={config.hint || "Mejorar"}
        onClick={() => setOn((v) => !v)}
        className="block cursor-pointer rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <div className="relative flex items-end gap-3">
          {/* CONFIANZA — card con barra de progreso */}
          <div className="flex h-[112px] w-[168px] flex-col justify-between rounded-[16px] bg-[#F3E9F0] p-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#3B0E30]/55">
                Confianza
              </span>
              <span className="text-[15px] font-bold text-[#3B0E30]">
                {s?.confianza}
              </span>
            </div>
            <div
              className="h-[6px] w-full overflow-hidden rounded-full"
              style={{ background: "rgba(59,14,48,0.12)" }}
            >
              <span
                className="dw-bar block h-full rounded-full bg-[#96237A] transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: s?.confianza }}
              />
            </div>
          </div>

          {/* USUARIOS TOTALES — card con mini line-chart */}
          <div className="flex h-[150px] w-[196px] flex-col rounded-[16px] bg-[#F3E9F0] p-3.5 shadow-lg">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#3B0E30]/55">
              Usuarios totales
            </p>
            <svg
              viewBox="0 0 160 70"
              className="mt-2 w-full flex-1"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline
                points={line}
                stroke={accent}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="dw-trend"
              />
            </svg>
            <div className="mt-1 flex justify-end">
              <span
                className="rounded-full px-2 py-0.5 text-[12px] font-semibold"
                style={{ background: badgeBg, color: accent }}
              >
                {s?.trend}
              </span>
            </div>
          </div>

          {/* Nodo con glifo Fiberlux, superpuesto sobre la unión de las cards. */}
          <span
            aria-hidden="true"
            className="absolute left-[148px] top-0 z-20 flex h-[48px] w-[48px] items-center justify-center rounded-[14px] bg-white shadow-lg"
          >
            <img src={NODE_GLYPH} alt="" className="h-[18px] w-auto" />
          </span>
        </div>
      </button>

      <HintTip
        show={hint.visible && !on}
        label={config.hint}
        className="left-[196px] top-3"
      />
    </div>
  );
}

/* ── Servicios Gestionados — chat (click revela la respuesta) ── */
function ChatWidget({ config }: { config: WidgetConfig }) {
  const [revealed, setRevealed] = useState(false);
  const hint = useHint();
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
    <div className="relative" {...hint.bind}>
      <button
        type="button"
        role="switch"
        aria-checked={revealed}
        aria-label={config.hint || "Ver"}
        onClick={() => setRevealed((v) => !v)}
        className="block w-[300px] cursor-pointer rounded-[16px] text-left outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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

      <HintTip
        show={hint.visible && !revealed}
        label={config.hint}
        className="bottom-1 left-[92px]"
      />
    </div>
  );
}
