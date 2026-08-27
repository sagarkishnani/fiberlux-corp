import { LuPhoneCall } from "react-icons/lu";
import { C, u, ret, EscenaSol, type PropsEscena } from "./base";
import { t } from "../../../i18n/ui";
import { isLocale, DEFAULT_LOCALE } from "../../../i18n/config";

/**
 * Escena de Comunicaciones Unificadas (SPEC 109).
 *
 * La quinta categoría del portafolio nuevo no tenía escena propia: las cuatro
 * de la SPEC 108 son de conectividad, ciberseguridad, data center y equipo
 * gestionado. Esta cuenta la llamada: el tile del auricular emite anillos que
 * se expanden, debajo late la onda de voz y al pie los tres canales se van
 * turnando bajo el foco.
 *
 * Reusa las animaciones que ya declara `base.tsx` (`anillo`, `respira`,
 * `barra`, `foco`) — no agrega CSS nuevo.
 */

const CX = 200;
const TILE = 62;
const TILE_TOP = 30;

/** Altura relativa de cada barra de la onda de voz (0..1) y su ritmo.
 *  Tabla fija, no `Math.random()`: el HTML del servidor y el del cliente
 *  tienen que coincidir. */
const ONDA = [0.32, 0.58, 0.86, 0.46, 1, 0.52, 0.9, 0.6, 0.34];
const ONDA_ALTO = 44;
const ONDA_TOP = 132;

/** Canales que se turnan bajo el foco. */
const CANALES = [
  { key: "sol.esc.voz.c1" }, // Voz
  { key: "sol.esc.voz.c2" }, // Teams
  { key: "sol.esc.voz.c3" }, // WhatsApp
];
const CHIP_W = 96;
const CHIP_H = 34;
const CHIP_GAP = 10;
const CHIPS_TOP = 210;

export default function Telefonia({ activo, locale }: PropsEscena) {
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  /** Paso entre centros de chip: el foco salta de uno al siguiente. */
  const paso = CHIP_W + CHIP_GAP;
  const anchoFila = CANALES.length * CHIP_W + (CANALES.length - 1) * CHIP_GAP;

  return (
    <EscenaSol activo={activo}>
      {/* Glow bajo el tile. */}
      <div
        className="fbx-sol-anim-respira absolute rounded-full"
        style={{
          left: u(CX - 70),
          top: u(TILE_TOP - 22),
          width: u(140),
          height: u(120),
          background: `radial-gradient(circle, rgba(226,98,196,0.30) 0%, rgba(150,35,122,0.10) 50%, transparent 72%)`,
          ["--ciclo" as string]: "5.5s",
        }}
      />

      {/* Anillos de la llamada: salen del tile y se expanden. */}
      {[0, 1.1, 2.2].map((r) => (
        <div
          key={r}
          className="fbx-sol-anim-anillo pointer-events-none absolute rounded-full"
          style={{
            left: u(CX - 58),
            top: u(TILE_TOP + TILE / 2 - 58),
            width: u(116),
            height: u(116),
            border: `1px solid ${C.acentoTenue}`,
            ["--ciclo" as string]: "3.3s",
            ["--ret" as string]: ret(r),
          }}
        />
      ))}

      {/* Tile del auricular: claro, misma familia que el de la nube. */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: u(CX - TILE / 2),
          top: u(TILE_TOP),
          width: u(TILE),
          height: u(TILE),
          borderRadius: u(18),
          background: "linear-gradient(160deg, #ffffff 0%, #f7e6f3 55%, #e9c6df 100%)",
          boxShadow: `0 0 ${u(40)} rgba(226,98,196,0.45)`,
        }}
      >
        <LuPhoneCall
          color="#1a0d16"
          style={{ width: u(26), height: u(26) }}
          strokeWidth={2}
        />
      </div>

      {/* Onda de voz: corta y ancha, para que no se lea como el ecualizador
          del NOC (esa es la escena de Infraestructura). */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: 0, right: 0, top: u(ONDA_TOP), height: u(ONDA_ALTO), gap: u(9) }}
      >
        {ONDA.map((h, i) => (
          <div
            key={i}
            className="fbx-sol-anim-barra"
            style={{
              width: u(8),
              height: u(Math.round(h * ONDA_ALTO)),
              borderRadius: u(4),
              background: `linear-gradient(180deg, ${C.acentoVivo} 0%, ${C.acento} 70%, ${C.acentoOscuro} 100%)`,
              ["--min" as string]: (0.34 + ((i * 3) % 4) * 0.09).toFixed(2),
              ["--ciclo" as string]: `${(0.8 + ((i * 5) % 6) * 0.13).toFixed(2)}s`,
              ["--ret" as string]: ret(((i * 7) % 9) * 0.08),
            }}
          />
        ))}
      </div>

      {/* Canales: el foco se para sobre cada uno por turno. */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: 0, right: 0, top: u(CHIPS_TOP) }}
      >
        <div className="relative flex items-center" style={{ width: u(anchoFila) }}>
          <div
            className="fbx-sol-anim-foco pointer-events-none absolute"
            style={{
              left: 0,
              top: u(-4),
              width: u(CHIP_W + 8),
              height: u(CHIP_H + 8),
              marginLeft: u(-4),
              borderRadius: u(12),
              border: `1px solid ${C.acentoTenue}`,
              boxShadow: `0 0 ${u(18)} rgba(226,98,196,0.35)`,
              ["--p0" as string]: u(0),
              ["--p1" as string]: u(paso),
              ["--p2" as string]: u(paso * 2),
              ["--ciclo" as string]: "6s",
            }}
          />
          {CANALES.map((c, i) => (
            <div
              key={c.key}
              className="flex items-center justify-center"
              style={{
                width: u(CHIP_W),
                height: u(CHIP_H),
                marginLeft: i === 0 ? 0 : u(CHIP_GAP),
                borderRadius: u(8),
                background: C.panel,
                border: `1px solid ${C.panelBorde}`,
                color: C.texto,
                fontSize: u(13),
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
              }}
            >
              {t(c.key, loc)}
            </div>
          ))}
        </div>
      </div>
    </EscenaSol>
  );
}
