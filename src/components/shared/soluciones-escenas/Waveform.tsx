import { C, u, ret, EscenaSol, type PropsEscena } from "./base";

/**
 * Escena de Servicios gestionados (SPEC 108).
 *
 * El ecualizador del NOC y el turno del equipo: las barras laten con su propio
 * ritmo —cada una con duración y retraso distintos, para que no respiren todas
 * juntas— y debajo un anillo de foco va rotando entre los tres avatares.
 *
 * Las alturas son una tabla fija y no valores al azar: con `Math.random()` el
 * HTML del servidor y el del cliente no coincidirían.
 */

/** Altura relativa de cada barra (0..1) y su ritmo. */
const BARRAS = [
  0.45, 0.72, 0.34, 0.9, 0.58, 0.28, 0.66, 0.95, 0.4, 0.78, 0.52, 0.86, 0.3,
  0.68, 0.44, 0.92, 0.36, 0.74, 0.5, 0.82, 0.38, 0.62,
];

const ALTO_MAX = 118;
const AVATARES = [
  { ini: "CM", activo: false },
  { ini: "JR", activo: true },
  { ini: "LP", activo: false },
];
const AV = 46;
const SOLAPE = 12;

export default function Waveform({ activo }: PropsEscena) {
  /** Paso entre centros de avatar: el foco salta de uno a otro. */
  const paso = AV - SOLAPE;

  return (
    <EscenaSol activo={activo}>
      {/* Ecualizador. */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: 0, right: 0, top: u(46), height: u(ALTO_MAX), gap: u(6) }}
      >
        {BARRAS.map((h, i) => (
          <div
            key={i}
            className="fbx-sol-anim-barra"
            style={{
              width: u(5),
              height: u(Math.round(h * ALTO_MAX)),
              borderRadius: u(3),
              background: `linear-gradient(180deg, ${C.acentoVivo} 0%, ${C.acento} 60%, ${C.acentoOscuro} 100%)`,
              ["--min" as string]: (0.3 + ((i * 7) % 5) * 0.08).toFixed(2),
              ["--ciclo" as string]: `${(0.9 + ((i * 3) % 7) * 0.16).toFixed(2)}s`,
              ["--ret" as string]: ret(((i * 5) % 11) * 0.09),
            }}
          />
        ))}
      </div>

      {/* Turno del equipo. */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: 0, right: 0, top: u(206) }}
      >
        <div className="relative flex items-center">
          {/* Anillo de foco: se para sobre cada avatar por turno. */}
          <div
            className="fbx-sol-anim-foco pointer-events-none absolute"
            style={{
              left: 0,
              top: u(-4),
              width: u(AV + 8),
              height: u(AV + 8),
              marginLeft: u(-4),
              borderRadius: "9999px",
              border: `1px solid ${C.acentoTenue}`,
              boxShadow: `0 0 ${u(18)} rgba(226,98,196,0.35)`,
              ["--p0" as string]: u(0),
              ["--p1" as string]: u(paso),
              ["--p2" as string]: u(paso * 2),
              ["--ciclo" as string]: "6s",
            }}
          />

          {AVATARES.map((a, i) => (
            <div
              key={a.ini}
              className="flex items-center justify-center"
              style={{
                width: u(AV),
                height: u(AV),
                marginLeft: i === 0 ? 0 : u(-SOLAPE),
                borderRadius: "9999px",
                border: `1px solid ${a.activo ? C.acentoTenue : C.escenaBorde}`,
                background: a.activo
                  ? `linear-gradient(150deg, ${C.acentoVivo} 0%, ${C.acento} 100%)`
                  : C.escena,
                color: a.activo ? "#fff" : C.escenaTexto,
                fontSize: u(13),
                fontWeight: 600,
                letterSpacing: "0.02em",
                boxShadow: a.activo ? `0 0 ${u(22)} rgba(226,98,196,0.4)` : "none",
                position: "relative",
                zIndex: a.activo ? 2 : 1,
              }}
            >
              {a.ini}
            </div>
          ))}
        </div>
      </div>
    </EscenaSol>
  );
}
