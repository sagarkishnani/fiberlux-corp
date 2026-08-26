import { LuCloud } from "react-icons/lu";
import { C, u, ret, EscenaSol, VB, type PropsEscena } from "./base";

/**
 * Escena de Data Center & Cloud (SPEC 108).
 *
 * El tile claro de la nube arriba, la línea punteada que baja hasta los racks y
 * los paquetes que suben por ella. Cada llegada enciende la barra de rack que
 * le toca, así que el ciclo de los racks es el de los paquetes multiplicado por
 * las tres barras.
 */

const CX = VB.w / 2;
const TILE = 62;
const TILE_TOP = 26;
/** De dónde arranca el paquete y cuánto sube hasta desaparecer bajo el tile. */
const PAQUETE_TOP = 190;
const VIAJE = 78;

const CICLO_PAQUETE = 2.6;
const RACKS = [0, 1, 2];
const CICLO_RACK = `${(CICLO_PAQUETE * RACKS.length).toFixed(2)}s`;

export default function Nube({ activo }: PropsEscena) {
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

      {/* Tile de la nube: claro, como en la referencia del diseñador. */}
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
        <LuCloud
          color="#1a0d16"
          style={{ width: u(26), height: u(26) }}
          strokeWidth={2}
        />
      </div>

      {/* Línea punteada tile → racks. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          x1={CX}
          y1={TILE_TOP + TILE + 6}
          x2={CX}
          y2={PAQUETE_TOP + 6}
          stroke={C.tenue}
          strokeWidth="1.5"
          strokeDasharray="2 7"
          strokeLinecap="round"
        />
      </svg>

      {/* Paquetes que suben por la línea. */}
      {[0, 1.3].map((r) => (
        <div
          key={r}
          className="fbx-sol-anim-paquete absolute"
          style={{
            left: u(CX - 3),
            top: u(PAQUETE_TOP),
            width: u(6),
            height: u(20),
            borderRadius: u(3),
            background: `linear-gradient(180deg, ${C.acentoVivo} 0%, ${C.acento} 100%)`,
            boxShadow: `0 0 ${u(12)} rgba(226,98,196,0.5)`,
            ["--viaje" as string]: `calc(${-VIAJE} * var(--u))`,
            ["--ciclo" as string]: `${CICLO_PAQUETE}s`,
            ["--ret" as string]: ret(r),
          }}
        />
      ))}

      {/* Racks: se encienden en secuencia, uno por paquete. */}
      <div
        className="absolute flex flex-col items-center"
        style={{ left: 0, right: 0, top: u(222), gap: u(10) }}
      >
        {RACKS.map((i) => (
          <div
            key={i}
            className="fbx-sol-anim-rack"
            style={{
              width: u(184),
              height: u(24),
              borderRadius: u(12),
              border: `1px solid ${C.escenaBorde}`,
              background: C.escena,
              ["--apagado" as string]: C.escenaBorde,
              ["--encendido" as string]: C.acentoTenue,
              ["--fondo-off" as string]: C.escena,
              ["--fondo-on" as string]: C.escenaActiva,
              ["--ciclo" as string]: CICLO_RACK,
              ["--ret" as string]: ret(i * CICLO_PAQUETE),
            }}
          />
        ))}
      </div>
    </EscenaSol>
  );
}
