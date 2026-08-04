import { useState } from "react";
import { FaCloud, FaLock, FaTowerBroadcast } from "react-icons/fa6";
import type { WidgetConfig } from "./ValorSolucionReact";

/* SPEC 93 — Widget interactivo del card "El desafío", uno por categoría.
   El dispatcher elige el sub-widget según config.type. El contenido es fijo
   por categoría (hardcoded en ValorSolucionReact). */
export default function DesafioWidget({ config }: { slug: string; config: WidgetConfig }) {
  return (
    <div className="dw-root relative z-10 flex w-full items-center justify-center">
      {config.type === "toggle" && <ToggleWidget config={config} />}
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
