import { C, u, ret, EscenaSol, type PropsEscena } from "./base";

/**
 * Escena de Infraestructura — switching.
 *
 * Réplica de la animación "9m · Switching" del documento de animaciones del
 * cliente: el chasis con sus doce puertos arriba, el árbol de cables bajando
 * al centro y los dos equipos del borde colgando de cada rama.
 *
 * Dos ritmos distintos conviven en los puertos: cada uno parpadea con su
 * propio ciclo (como las luces de un switch real, que nunca van a compás) y
 * encima el color recorre los cuatro grupos por turno. El turno es CSS puro
 * —una capa de color por puerto con su `--ret`— y no un `setInterval` como en
 * el documento original: así no hay estado que sincronizar entre el HTML del
 * servidor y el del cliente, y todo se pausa solo cuando la card sale de
 * pantalla.
 */

/** Medidas del bloque, en unidades del lienzo de 400×320. */
const ANCHO = 320;
const X0 = (400 - ANCHO) / 2;
const CHASIS_TOP = 35;
const CHASIS_ALTO = 72;
const CABLES_TOP = CHASIS_TOP + CHASIS_ALTO;
const CABLES_ALTO = 150;
/** Los equipos suben 28 sobre el final del cable: la punta entra en la caja. */
const EQUIPOS_TOP = CABLES_TOP + CABLES_ALTO - 28;
const EQUIPO = 56;

/** Turnos del recorrido de color por los puertos. */
const GRUPOS = 4;
const CICLO_COLOR = 3.6;

const PUERTOS = Array.from({ length: 12 }, (_, i) => i);

export default function Switching({ activo }: PropsEscena) {
  return (
    <EscenaSol activo={activo}>
      {/* Chasis: puertos a la izquierda, tile de marca a la derecha. */}
      <div
        className="absolute flex items-center"
        style={{
          left: u(X0),
          top: u(CHASIS_TOP),
          width: u(ANCHO),
          height: u(CHASIS_ALTO),
          padding: `${u(16)} ${u(18)}`,
          gap: u(14),
          boxSizing: "border-box",
          borderRadius: u(16),
          background: C.escena,
          border: `1px solid ${C.escenaBorde}`,
          boxShadow: `0 ${u(14)} ${u(32)} rgba(0,0,0,0.4)`,
        }}
      >
        <div
          className="grid"
          style={{ flex: 1, gridTemplateColumns: "repeat(6, 1fr)", gap: u(7) }}
        >
          {PUERTOS.map((i) => (
            <span
              key={i}
              className="fbx-sol-anim-puerto relative block"
              style={{
                height: u(13),
                borderRadius: u(4),
                background: C.escenaBorde,
                ["--ciclo" as string]: `${(3.4 + (i % 5) * 0.4).toFixed(1)}s`,
                ["--ret" as string]: ret(i * 0.16),
              }}
            >
              {/* Capa de color: se enciende cuando le toca el turno al grupo. */}
              <span
                className="fbx-sol-anim-puertoOn absolute inset-0"
                style={{
                  borderRadius: u(4),
                  background: `linear-gradient(90deg, ${C.acentoOscuro} 0%, ${C.acentoVivo} 100%)`,
                  ["--ciclo" as string]: `${CICLO_COLOR}s`,
                  ["--ret" as string]: ret((i % GRUPOS) * (CICLO_COLOR / GRUPOS)),
                }}
              />
            </span>
          ))}
        </div>

        <div
          className="flex shrink-0 items-center justify-center"
          style={{
            width: u(40),
            height: u(40),
            borderRadius: u(13),
            background: `linear-gradient(150deg, ${C.acentoVivo} 0%, ${C.acentoOscuro} 100%)`,
            boxShadow: `0 ${u(10)} ${u(24)} rgba(226,98,196,0.26)`,
          }}
        >
          <svg
            viewBox="0 0 48 48"
            fill={C.fondo}
            style={{ width: u(24), height: u(24) }}
            aria-hidden="true"
          >
            <path d="M15.54 13.52 12.46 10.96 1.64 24l10.82 13.04 3.08-2.56L6.84 24l8.7-10.48ZM14 26h4v-4h-4v4Zm20-4h-4v4h4v-4Zm-12 4h4v-4h-4v4Zm13.54-15.04-3.08 2.56 8.7 10.48-8.7 10.48 3.08 2.56L46.36 24 35.54 10.96Z" />
          </svg>
        </div>
      </div>

      {/* Árbol de cables. Los dos trazos grises son la instalación fija; encima
          se dibujan y se borran los dos vivos, cada uno a su tiempo, que es el
          tráfico bajando a cada rama. */}
      <svg
        viewBox={`0 0 ${ANCHO} ${CABLES_ALTO}`}
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: u(X0),
          top: u(CABLES_TOP),
          width: u(ANCHO),
          height: u(CABLES_ALTO),
        }}
      >
        <path d="M160 0 V46 H64 V124" stroke={C.escenaBorde} strokeWidth={1.4} />
        <path d="M160 0 V46 H256 V124" stroke={C.escenaBorde} strokeWidth={1.4} />
        <path
          className="fbx-sol-anim-traza"
          d="M160 0 V46 H64 V122"
          stroke={C.acentoVivo}
          strokeWidth={1.7}
          pathLength={1}
          strokeDasharray={1}
          style={{ ["--ciclo" as string]: "7s" }}
        />
        <path
          className="fbx-sol-anim-traza"
          d="M160 0 V46 H256 V122"
          stroke={C.acento}
          strokeWidth={1.7}
          pathLength={1}
          strokeDasharray={1}
          style={{ ["--ciclo" as string]: "7s", ["--ret" as string]: ret(1.8) }}
        />
      </svg>

      {/* Equipos del borde: respiran lento y desfasados entre sí. */}
      <div
        className="absolute flex justify-between"
        style={{
          left: u(X0),
          top: u(EQUIPOS_TOP),
          width: u(ANCHO),
          padding: `0 ${u(36)}`,
          boxSizing: "border-box",
        }}
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            className="fbx-sol-anim-late flex items-center justify-center"
            style={{
              width: u(EQUIPO),
              height: u(EQUIPO),
              borderRadius: u(18),
              background: "rgba(226,98,196,0.08)",
              border: `1px solid ${C.acentoTenue}`,
              ["--ciclo" as string]: `${9 + i}s`,
              ["--ret" as string]: ret(i * 0.7),
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={C.acentoClaro}
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: u(19), height: u(19) }}
              aria-hidden="true"
            >
              <path d="M4 11 12 5l8 6v8H4v-8Z" />
            </svg>
          </div>
        ))}
      </div>
    </EscenaSol>
  );
}
