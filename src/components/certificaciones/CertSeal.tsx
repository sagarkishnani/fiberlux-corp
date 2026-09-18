import { useId, useMemo } from "react";
import { tinaField } from "tinacms/dist/react";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";

/**
 * Sello ISO animado (SPEC 106) — panel de una certificación del carrusel.
 *
 * Réplica del "estampado" de NEXTNET adaptado al magenta de Fiberlux: al entrar
 * la sección en pantalla el anillo exterior se DIBUJA de las 12 en sentido
 * horario, los 12 ticks radiales se encienden detrás del trazo y, al cerrarse,
 * se dispara un halo, entra el código central y un barrido de luz cruza la card.
 * Después el anillo punteado y el texto curvo giran en sentido contrario para
 * siempre.
 *
 * Todo el movimiento es CSS puro (keyframes + `animation-delay`): este repo usa
 * el `motion` vanilla, no `motion/react`, y el requisito del cliente es que la
 * animación no pese en dispositivos ligeros. El disparo lo da el padre con
 * `stamp` ("go" | "idle" | null): sin atributo (reduced-motion o SSR) el sello
 * se pinta directamente en su estado final.
 */

export interface Cert {
  code?: string | null; // número grande del centro (ej. "37001")
  label?: string | null; // etiqueta bajo el número (ej. "ISO ANTISOBORNO")
  label_en?: string | null;
  ringText?: string | null; // texto curvo del anillo
  ringText_en?: string | null;
  norm?: string | null; // norma completa, bajo la card
  norm_en?: string | null;
  scope?: string | null; // alcance / emisor
  scope_en?: string | null;
}

interface CertSealProps {
  cert: Cert;
  /** Objeto Tina del item de la lista, para `data-tina-field`. */
  tinaItem?: any;
  locale?: Locale;
  /**
   * Estado del estampado. `null` ⇒ sin animación (estado final directo).
   * `"idle"` ⇒ estado inicial oculto; `"go"` ⇒ reproduce el estampado.
   */
  stamp: "idle" | "go" | null;
  /** Ciclo de repetición: al cambiar, React remonta y la animación se repite. */
  cycle?: number;
}

/* ── Geometría del sello — viewBox 0 0 240 240, centro (120,120) ── */
const RING_R = 84; // ruta invisible del texto curvo
const RING_FONT = 10;
const RING_TRACKING = 2.6;
const OUTER_R = 112; // anillo que se dibuja
const RING_CIRC = 2 * Math.PI * RING_R; // vuelta completa del texto curvo
/** Avance aproximado de un carácter de Space Mono con el tracking aplicado. */
const RING_CHAR_ADV = RING_FONT * 0.6 + RING_TRACKING;
/** Ruta circular del texto: arranca a las 12 y gira en sentido horario. */
const RING_PATH = `M 120,${120 - RING_R} a ${RING_R},${RING_R} 0 1,1 0,${RING_R * 2} a ${RING_R},${RING_R} 0 1,1 0,-${RING_R * 2}`;

/** Los 12 ticks radiales, entre r=104 y r=110. */
/**
 * Coordenadas redondeadas a 3 decimales A PROPÓSITO: `Math.sin`/`Math.cos` no
 * están obligados a devolver el mismo último bit en Node (SSR) y en el motor del
 * navegador, así que el HTML del servidor traía `29.933358006418402` y el
 * cliente calculaba `29.933358006418416` → React abortaba la hidratación de toda
 * la isla. A 3 decimales sobre un `viewBox` de 240 el redondeo es invisible.
 */
const round3 = (n: number) => Math.round(n * 1000) / 1000;

const TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = ((i * 30 - 90) * Math.PI) / 180;
  return {
    x1: round3(120 + 104 * Math.cos(a)),
    y1: round3(120 + 104 * Math.sin(a)),
    x2: round3(120 + 110 * Math.cos(a)),
    y2: round3(120 + 110 * Math.sin(a)),
  };
});

/* ── Etiqueta bajo el código: hasta 2 líneas ──────────────────────────────────
   El SVG no reparte el texto solo, así que las etiquetas largas ("SEGURIDAD DE
   LA INFORMACIÓN") se salían del sello. `useLabelLines` mide el ancho aproximado
   y, si no entra, parte por palabras en DOS líneas equilibradas (se minimiza la
   línea más ancha), nunca a mitad de palabra. */
const LABEL_FONT = 10;
const LABEL_TRACKING = 2;
/** Avance aproximado de un carácter de Space Mono con el tracking aplicado. */
const LABEL_CHAR_ADV = LABEL_FONT * 0.6 + LABEL_TRACKING;
/** Ancho útil dentro del anillo a la altura de la etiqueta (unidades del viewBox). */
const LABEL_MAX_W = 130;
const LABEL_LINE_H = 12;

function useLabelLines(label?: string | null) {
  return useMemo(() => {
    const texto = (label || "").trim();
    if (!texto) return [] as string[];
    const ancho = (s: string) => s.length * LABEL_CHAR_ADV;
    if (ancho(texto) <= LABEL_MAX_W) return [texto];

    const palabras = texto.split(/\s+/);
    if (palabras.length < 2) return [texto]; // una sola palabra: no hay dónde cortar

    // Corte que deja la línea más ancha lo más estrecha posible.
    let mejor = 1;
    let mejorMax = Infinity;
    for (let i = 1; i < palabras.length; i++) {
      const max = Math.max(
        ancho(palabras.slice(0, i).join(" ")),
        ancho(palabras.slice(i).join(" "))
      );
      if (max < mejorMax) {
        mejorMax = max;
        mejor = i;
      }
    }
    return [palabras.slice(0, mejor).join(" "), palabras.slice(mejor).join(" ")];
  }, [label]);
}

/**
 * Repite `ringText` con ` · ` el número ENTERO de veces que mejor se acerca a la
 * circunferencia. No se recorta nada: el ajuste fino lo hace `textLength` +
 * `lengthAdjust="spacing"` sobre el `<textPath>`, que reparte el sobrante (o el
 * faltante) entre las letras. Así la vuelta cierra exacta y la costura cae
 * siempre en un separador, nunca a mitad de palabra.
 */
function useRingLoop(ringText?: string | null) {
  return useMemo(() => {
    const base = (ringText || "").trim();
    if (!base) return "";
    const unidad = `${base} · `;
    const vueltas = Math.max(1, Math.round(RING_CIRC / (unidad.length * RING_CHAR_ADV)));
    return unidad.repeat(vueltas);
  }, [ringText]);
}

export default function CertSeal({
  cert,
  tinaItem,
  locale = "es",
  stamp,
  cycle = 0,
}: CertSealProps) {
  const uid = useId().replace(/:/g, "");
  const label = tField(cert as any, "label", locale);
  const labelLines = useLabelLines(label);
  const norm = tField(cert as any, "norm", locale);
  const scope = tField(cert as any, "scope", locale);
  const ringLoop = useRingLoop(tField(cert as any, "ringText", locale));

  /* La primera vuelta arranca detrás del revelado de la card; las repeticiones
     (al volverse la card activa en el carrusel) entran casi de inmediato. */
  const base = cycle > 0 ? 0.05 : 0.3;

  return (
    <div
      data-stamp={stamp ?? undefined}
      /* Glass (SPEC 108). El anterior era casi opaco (`backdrop-blur-sm` sobre un
         fondo negro plano): no había nada que difuminar, así que se leía como un
         rectángulo gris con borde. Ahora el fondo de la sección tiene cintas de
         luz reales, y la card las difumina de verdad: blur alto + saturación,
         base casi negra translúcida y un sheen diagonal. */
      className="cs-card group relative flex h-full flex-col justify-center overflow-hidden rounded-[24px] px-8 py-9 text-center backdrop-blur-2xl backdrop-saturate-150 md:px-10 md:py-11"
      style={
        {
          background:
            // Sheen diagonal desde la esquina superior izquierda (la luz entra
            // por ahí) + un rebote magenta abajo, que es el reflejo de la cinta
            // de fondo. La base translúcida deja pasar el blur.
            "linear-gradient(138deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.025) 26%, rgba(255,255,255,0) 52%), radial-gradient(120% 78% at 50% 128%, rgba(174,44,142,0.26) 0%, rgba(96,25,74,0.12) 44%, rgba(20,15,24,0) 74%), rgba(11,10,13,0.52)",
          // Sombra profunda para despegar la card del fondo + hairline interior.
          boxShadow:
            "0 40px 90px -50px rgba(0,0,0,0.95), 0 2px 24px -12px rgba(216,96,182,0.25), inset 0 1px 0 rgba(255,255,255,0.09)",
          "--cs-base": `${base}s`,
          "--cs-after": `${base + 0.9}s`,
        } as React.CSSProperties
      }
    >
      {/* Borde de cristal: hairline de 1px con degradado — claro arriba-izquierda
          (donde pega la luz) y magenta tenue abajo-derecha, en vez del
          `border-white/12` plano de antes. Se pinta con la técnica de máscara
          `xor`: el relleno se recorta y sólo queda el contorno. */}
      <div aria-hidden="true" className="cs-edge pointer-events-none absolute inset-0 rounded-[24px]" />

      {/* Barrido de luz: cruza el panel una vez, al cerrarse el trazo del anillo */}
      <div aria-hidden="true" className="cs-sweep pointer-events-none absolute inset-y-0" />

      {/* Lado del sello: 180 px bajo md, 210 px de md hacia arriba */}
      <div className="mx-auto w-full max-w-[180px] md:max-w-[210px]">
        <svg
          viewBox="0 0 240 240"
          className="h-auto w-full"
          role="img"
          aria-label={norm || cert.code || "Certificación"}
        >
          <defs>
            <path id={`cs-ring-${uid}`} d={RING_PATH} fill="none" />
            <radialGradient id={`cs-halo-${uid}`}>
              <stop offset="55%" stopColor="#D14FB0" stopOpacity={0} />
              <stop offset="85%" stopColor="#D14FB0" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#D14FB0" stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* Halo del estampado: se enciende y se apaga cuando el anillo cierra */}
          <circle className="cs-halo" cx={120} cy={120} r={118} fill={`url(#cs-halo-${uid})`} />

          {/* Anillo exterior: se dibuja de 0 a 1 arrancando a las 12.
              `pathLength={1}` normaliza la longitud del trazo, así el CSS anima
              `stroke-dashoffset` de 1 a 0 sin calcular la circunferencia. El
              `stroke-dasharray` lo pone el CSS sólo mientras hay estampado: en
              reposo el anillo debe verse entero. */}
          <circle
            className="cs-ring"
            cx={120}
            cy={120}
            r={OUTER_R}
            pathLength={1}
            fill="none"
            stroke="#D14FB0"
            strokeOpacity={0.85}
            strokeWidth={2}
            transform="rotate(-90 120 120)"
          />

          {/* Ticks radiales, encendiéndose en secuencia detrás del trazo */}
          {TICKS.map((t, i) => (
            <line
              key={i}
              className="cs-tick"
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="#D14FB0"
              strokeOpacity={0.5}
              strokeWidth={1.5}
              strokeLinecap="round"
              style={{ "--i": i } as React.CSSProperties}
            />
          ))}

          {/* Anillo punteado, girando lento en sentido horario */}
          <circle
            className="cs-eje cs-spin"
            cx={120}
            cy={120}
            r={98}
            fill="none"
            stroke="#D14FB0"
            strokeOpacity={0.3}
            strokeWidth={1}
            strokeDasharray="2 6"
          />

          {/* Texto curvo, más lento y en sentido contrario. Se oculta bajo md,
              donde el sello es demasiado pequeño para leerlo. */}
          {ringLoop && (
            <g
              className="cs-eje cs-spin-rev hidden md:block"
              data-tina-field={tinaItem ? tinaField(tinaItem, "ringText") : undefined}
            >
              <text
                fontSize={RING_FONT}
                letterSpacing={RING_TRACKING}
                fill="#E08FCC"
                fillOpacity={0.75}
                style={{ fontFamily: "'Space Mono', ui-monospace, monospace" }}
              >
                <textPath
                  href={`#cs-ring-${uid}`}
                  textLength={RING_CIRC}
                  lengthAdjust="spacing"
                >
                  {ringLoop}
                </textPath>
              </text>
            </g>
          )}

          {/* Centro: entra cuando el anillo se ha cerrado */}
          <g className="cs-eje cs-core">
            <text
              x={120}
              y={126}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={46}
              fontWeight={700}
              data-tina-field={tinaItem ? tinaField(tinaItem, "code") : undefined}
            >
              {cert.code}
            </text>
            {labelLines.length > 0 && (
              <text
                x={120}
                /* Con dos líneas el bloque sube media interlínea para que siga
                   centrado bajo el número en vez de bajar hacia el anillo. */
                y={labelLines.length > 1 ? 147 : 150}
                textAnchor="middle"
                fontSize={LABEL_FONT}
                letterSpacing={LABEL_TRACKING}
                fill="#FFFFFF"
                fillOpacity={0.45}
                style={{ fontFamily: "'Space Mono', ui-monospace, monospace" }}
                data-tina-field={tinaItem ? tinaField(tinaItem, "label") : undefined}
              >
                {labelLines.map((linea, i) => (
                  <tspan key={i} x={120} dy={i === 0 ? 0 : LABEL_LINE_H}>
                    {linea}
                  </tspan>
                ))}
              </text>
            )}
          </g>
        </svg>
      </div>

      {norm && (
        <p
          className="cs-meta mt-6 text-[14px] leading-[1.5] text-white"
          style={{ "--cs-meta-i": 0 } as React.CSSProperties}
          data-tina-field={tinaItem ? tinaField(tinaItem, "norm") : undefined}
        >
          {norm}
        </p>
      )}
      {scope && (
        <p
          className="cs-meta mt-2 text-[12px] leading-[1.6] text-white/40"
          style={{ "--cs-meta-i": 1 } as React.CSSProperties}
          data-tina-field={tinaItem ? tinaField(tinaItem, "scope") : undefined}
        >
          {scope}
        </p>
      )}
    </div>
  );
}
