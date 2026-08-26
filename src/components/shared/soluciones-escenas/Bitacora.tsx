import { C, u, ret, EscenaSol, type PropsEscena } from "./base";
import { t } from "../../../i18n/ui";
import { isLocale, DEFAULT_LOCALE } from "../../../i18n/config";

/**
 * Escena de Ciberseguridad gestionada (SPEC 108).
 *
 * La bitácora del SOC: seis eventos con su hora, su badge y su descripción. Un
 * realce baja fila por fila —cada fila anima el mismo ciclo con su propio
 * retraso— y al pasar enciende el fondo, el texto y el glow del badge.
 *
 * Las horas y los acrónimos son constantes (no se traducen); las descripciones
 * salen de `src/i18n/ui.ts`.
 */

const FILAS = [
  { hora: "09:41", badge: "MFA", key: "sol.esc.ciber.r1" },
  { hora: "09:43", badge: "WAF", key: "sol.esc.ciber.r2" },
  { hora: "09:44", badge: "EDR", key: "sol.esc.ciber.r3" },
  { hora: "09:47", badge: "ZTNA", key: "sol.esc.ciber.r4" },
  { hora: "09:50", badge: "DDoS", key: "sol.esc.ciber.r5" },
  { hora: "09:52", badge: "SOC", key: "sol.esc.ciber.r6" },
] as const;

/** Un turno por fila; el ciclo completo es la suma de los seis. */
const TURNO_S = 1.4;
const CICLO = `${(TURNO_S * FILAS.length).toFixed(2)}s`;

export default function Bitacora({ activo, locale }: PropsEscena) {
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;

  return (
    <EscenaSol activo={activo}>
      <div
        className="absolute inset-0 flex flex-col justify-center"
        style={{ gap: u(6), paddingLeft: u(18), paddingRight: u(18) }}
      >
        {FILAS.map((f, i) => (
          <div
            key={f.badge}
            className="fbx-sol-anim-filaBg flex items-center"
            style={{
              gap: u(12),
              height: u(34),
              paddingLeft: u(10),
              paddingRight: u(10),
              borderRadius: u(8),
              ["--activa" as string]: C.escenaActiva,
              ["--borde-activo" as string]: C.acentoTenue,
              ["--ciclo" as string]: CICLO,
              ["--ret" as string]: ret(i * TURNO_S),
            }}
          >
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: u(12),
                color: C.escenaApagado,
                letterSpacing: "0.02em",
              }}
            >
              {f.hora}
            </span>

            <span
              className="fbx-sol-anim-badge inline-flex items-center justify-center"
              style={{
                minWidth: u(42),
                height: u(20),
                paddingLeft: u(8),
                paddingRight: u(8),
                borderRadius: u(6),
                border: `1px solid ${C.acentoTenue}`,
                background: "rgba(150,35,122,0.14)",
                color: C.acentoVivo,
                fontFamily: "'Space Mono', monospace",
                fontSize: u(10),
                letterSpacing: "0.04em",
                ["--brillo" as string]: "rgba(226,98,196,0.45)",
                ["--glow" as string]: u(12),
                ["--ciclo" as string]: CICLO,
                ["--ret" as string]: ret(i * TURNO_S),
              }}
            >
              {f.badge}
            </span>

            <span
              className="fbx-sol-anim-filaTxt truncate"
              style={{
                fontSize: u(13),
                color: "#fff",
                opacity: 0.55,
                ["--ciclo" as string]: CICLO,
                ["--ret" as string]: ret(i * TURNO_S),
              }}
            >
              {t(f.key, loc)}
            </span>
          </div>
        ))}
      </div>
    </EscenaSol>
  );
}
