import { useId, useMemo, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Locale } from "../../../i18n/config";
import { tField } from "../../../utils/i18n";

export interface IsoSealCert {
  code?: string | null;
  label?: string | null;
  label_en?: string | null;
  ringText?: string | null;
  ringText_en?: string | null;
  norm?: string | null;
  norm_en?: string | null;
}

interface IsoSealProps {
  cert: IsoSealCert;
  locale: Locale;
  go: boolean;
  tone: "dark" | "light";
  halo?: boolean;
  className?: string;
}

const PURPLE = "#96237A";
const LILAC = "#E9A7DC";
const MAGENTA = "#D9369F";

const TRACE_MS = 900;
const HALO_MS = 700;
const DOTTED_SPIN_S = 60;
const TEXT_SPIN_S = 90;
const START_DELAY = 0.3;
const TRACE_END = START_DELAY + TRACE_MS / 1000;

const RING_R = 84;
const RING_FONT = 10;
const RING_TRACKING = 2.6;
const RING_CHARS = Math.floor((2 * Math.PI * RING_R) / (RING_FONT * 0.6 + RING_TRACKING));
const RING_PATH = `M 120,${120 - RING_R} a ${RING_R},${RING_R} 0 1,1 0,${RING_R * 2} a ${RING_R},${RING_R} 0 1,1 0,-${RING_R * 2}`;

const TICKS = Array.from({ length: 12 }, (_, i) => {
  const angle = ((i * 30 - 90) * Math.PI) / 180;
  return {
    x1: 120 + 104 * Math.cos(angle),
    y1: 120 + 104 * Math.sin(angle),
    x2: 120 + 110 * Math.cos(angle),
    y2: 120 + 110 * Math.sin(angle),
  };
});

const EASE = [0.22, 1, 0.36, 1] as const;

function useRingLoop(ringText: string) {
  return useMemo(() => {
    const base = ringText.trim();
    if (!base) return "";
    const unit = `${base} · `;
    const turns = Math.max(1, Math.ceil(RING_CHARS / unit.length));
    return unit.repeat(turns).slice(0, RING_CHARS);
  }, [ringText]);
}

export default function IsoSeal({ cert, locale, go, tone, halo = true, className = "" }: IsoSealProps) {
  const uid = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;
  const ringLoop = useRingLoop(tField(cert, "ringText", locale));
  const label = tField(cert, "label", locale);
  const centerColor = tone === "dark" ? "#FFFFFF" : "#453C46";

  const spin = (seconds: number, reverse = false): CSSProperties =>
    animate && go ? { animation: `fx-seal-spin ${seconds}s linear ${TRACE_END}s infinite${reverse ? " reverse" : ""}` } : {};

  return (
    <svg
      viewBox="0 0 240 240"
      className={`h-auto w-full overflow-visible ${className}`}
      role="img"
      aria-label={tField(cert, "norm", locale) || `ISO ${cert.code || ""}`}
    >
      <defs>
        <path id={`seal-ring-${uid}`} d={RING_PATH} fill="none" />
        <linearGradient id={`seal-stroke-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={PURPLE} />
          <stop offset="100%" stopColor={LILAC} />
        </linearGradient>
        <radialGradient id={`seal-halo-${uid}`}>
          <stop offset="55%" stopColor={MAGENTA} stopOpacity={0} />
          <stop offset="85%" stopColor={MAGENTA} stopOpacity={0.4} />
          <stop offset="100%" stopColor={MAGENTA} stopOpacity={0} />
        </radialGradient>
      </defs>

      {animate && halo && (
        <motion.circle
          cx={120}
          cy={120}
          r={118}
          fill={`url(#seal-halo-${uid})`}
          initial={{ opacity: 0 }}
          animate={go ? { opacity: [0, 1, 0] } : { opacity: 0 }}
          transition={{ duration: HALO_MS / 1000, delay: TRACE_END, times: [0, 0.35, 1] }}
        />
      )}

      <motion.circle
        cx={120}
        cy={120}
        r={112}
        fill="none"
        stroke={`url(#seal-stroke-${uid})`}
        strokeWidth={2}
        transform="rotate(-90 120 120)"
        initial={animate ? { pathLength: 0 } : false}
        animate={animate ? { pathLength: go ? 1 : 0 } : undefined}
        transition={{ duration: TRACE_MS / 1000, delay: START_DELAY, ease: "easeInOut" }}
      />

      {TICKS.map((tick, i) => (
        <motion.line
          key={i}
          {...tick}
          stroke={PURPLE}
          strokeOpacity={0.6}
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={animate ? { opacity: 0 } : false}
          animate={animate ? { opacity: go ? 1 : 0 } : undefined}
          transition={{ duration: 0.2, delay: START_DELAY + (i * TRACE_MS) / 1000 / TICKS.length }}
        />
      ))}

      <circle
        cx={120}
        cy={120}
        r={98}
        fill="none"
        stroke={PURPLE}
        strokeOpacity={0.35}
        strokeWidth={1}
        strokeDasharray="2 6"
        className="fx-seal-axis"
        style={spin(DOTTED_SPIN_S)}
      />

      {ringLoop && (
        <g className="fx-seal-axis hidden md:block" style={spin(TEXT_SPIN_S, true)}>
          <text className="font-mono" fontSize={RING_FONT} letterSpacing={RING_TRACKING} fill={PURPLE} fillOpacity={0.75}>
            <textPath href={`#seal-ring-${uid}`}>{ringLoop}</textPath>
          </text>
        </g>
      )}

      <motion.g
        style={{ transformOrigin: "120px 120px" }}
        initial={animate ? { opacity: 0, scale: 0.9 } : false}
        animate={animate ? (go ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }) : undefined}
        transition={{ duration: 0.4, delay: TRACE_END, ease: EASE }}
      >
        <text x={120} y={126} textAnchor="middle" fill={centerColor} fontSize={46} fontWeight={600} letterSpacing={-1}>
          {cert.code}
        </text>
        {label && (
          <text
            x={120}
            y={150}
            textAnchor="middle"
            className="font-mono"
            fontSize={label.length > 22 ? 7 : 9}
            letterSpacing={label.length > 22 ? 0.8 : 1.6}
            fill={centerColor}
            fillOpacity={0.55}
          >
            {label}
          </text>
        )}
      </motion.g>
    </svg>
  );
}
