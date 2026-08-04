import { useState } from "react";
import {
  FaCloud,
  FaLock,
  FaTowerBroadcast,
  FaCircleNodes,
} from "react-icons/fa6";
import type { WidgetConfig } from "./ValorSolucionReact";

/* SPEC 93 — Widget interactivo del card "El desafío", uno por categoría.
   El dispatcher elige el sub-widget según config.type. El contenido es fijo
   por categoría (hardcoded en ValorSolucionReact). */
export default function DesafioWidget({ config }: { slug: string; config: WidgetConfig }) {
  return (
    <div className="dw-root relative z-10 flex w-full items-center justify-center">
      {config.type === "toggle" && <ToggleWidget config={config} />}
      {config.type === "stats" && <StatsWidget config={config} />}
    </div>
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

        {/* Tooltip-hint: invita a interactuar, solo en el estado inicial. */}
        <span
          className={`pointer-events-none absolute -right-1 -top-7 whitespace-nowrap rounded-[8px] bg-white/95 px-2.5 py-1 text-[12px] font-medium text-[#3B0E30] shadow-lg transition-opacity duration-300 ${
            on ? "opacity-0" : "opacity-100"
          }`}
        >
          <span aria-hidden="true" className="mr-1">
            ↵
          </span>
          {config.hint}
        </span>
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
  const s = on ? config.after : config.before;
  const up = on; // true → tendencia positiva (verde)
  const accent = up ? "#2F9E44" : "#E5484D";
  const badgeBg = up ? "rgba(55,178,77,0.14)" : "rgba(229,72,77,0.14)";
  // Polilíneas de tendencia: bajando (rojo) vs subiendo (verde).
  const line = up
    ? "0,42 20,34 40,38 60,26 80,30 100,17 120,21 140,9 160,7"
    : "0,11 20,17 40,13 60,25 80,21 100,33 120,29 140,41 160,39";

  return (
    <div className="relative">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={config.hint || "Mejorar"}
        onClick={() => setOn((v) => !v)}
        className="relative block cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-[22px]"
      >
        <div className="relative h-[210px] w-[300px]">
          {/* USUARIOS TOTALES — card con mini line-chart */}
          <div className="absolute right-0 top-0 w-[196px] rounded-[16px] bg-[#F3E9F0] p-3.5 shadow-lg">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#3B0E30]/55">
              Usuarios totales
            </p>
            <svg
              viewBox="0 0 160 50"
              className="mt-3 h-[52px] w-full"
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
                className="dw-trend"
              />
            </svg>
            <div className="mt-2 flex justify-end">
              <span
                className="rounded-full px-2 py-0.5 text-[12px] font-semibold"
                style={{ background: badgeBg, color: accent }}
              >
                {s?.trend}
              </span>
            </div>
          </div>

          {/* CONFIANZA — card con barra de progreso */}
          <div className="absolute bottom-0 left-0 z-10 w-[214px] rounded-[16px] bg-[#F3E9F0] p-3.5 shadow-lg">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#3B0E30]/55">
                Confianza
              </span>
              <span className="text-[15px] font-bold text-[#3B0E30]">
                {s?.confianza}
              </span>
            </div>
            <div
              className="mt-3 h-[6px] w-full overflow-hidden rounded-full"
              style={{ background: "rgba(59,14,48,0.12)" }}
            >
              <span
                className="dw-bar block h-full rounded-full bg-[#96237A] transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: s?.confianza }}
              />
            </div>
          </div>

          {/* Nodo con glifo de conexiones, superpuesto arriba a la izquierda */}
          <span
            aria-hidden="true"
            className="absolute left-0 top-8 z-20 flex h-[48px] w-[48px] items-center justify-center rounded-[14px] bg-white text-[#96237A] shadow-lg"
          >
            <FaCircleNodes size={20} />
          </span>
        </div>
      </button>

      {/* Tooltip-hint: solo en el estado inicial (comprometido). */}
      <span
        className={`pointer-events-none absolute -top-3 right-2 whitespace-nowrap rounded-[8px] bg-white/95 px-2.5 py-1 text-[12px] font-medium text-[#3B0E30] shadow-lg transition-opacity duration-300 ${
          on ? "opacity-0" : "opacity-100"
        }`}
      >
        <span aria-hidden="true" className="mr-1">
          ↵
        </span>
        {config.hint}
      </span>
    </div>
  );
}
