import { C, Escena, L, pct, u, useTurno, type PropsIlustracion } from "./base";

/**
 * Plantilla "Tráfico" (SPEC 105, reescrita en el SPEC 107 sobre el canvas 8b).
 *
 * Lista de servicios con su prioridad y el ancho que se les reserva. El foco va
 * recorriendo las filas: es el enrutamiento atendiendo cada cola por su orden,
 * y por eso el movimiento cuenta algo en vez de adornar.
 *
 * Las filas salen de `datos.filas` (hasta cuatro), con `label`, `nivel` y
 * `porcentaje`.
 */

/** Cada cuánto pasa el foco a la fila siguiente, en ms. */
const FOCO_MS = 2200;

const RESERVA = [
  { label: "Videollamada institucional", nivel: "CRÍTICO", porcentaje: 92 },
  { label: "Sistema de trámite digital", nivel: "ALTA", porcentaje: 68 },
  { label: "Correo y colaboración", nivel: "MEDIA", porcentaje: 44 },
];

export default function Prioridad({ datos, activo, locale }: PropsIlustracion) {
  const filas = ((datos?.filas ?? []).filter(Boolean).length ? datos.filas : RESERVA)
    .filter(Boolean)
    .slice(0, 4);

  const foco = useTurno(filas.length, activo, FOCO_MS);

  return (
    <Escena activo={activo}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          gap: u(8),
        }}
      >
        {filas.map((fila: any, i: number) => {
          const on = i === foco;
          const ancho = pct(fila?.porcentaje, 60);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: u(11),
                padding: `0 ${u(14)}`,
                borderRadius: u(13),
                boxSizing: "border-box",
                background: on ? C.escenaActiva : C.escena,
                border: `1px solid ${on ? C.acentoTenue : C.escenaBorde}`,
                /* La fila enfocada se adelanta un paso en vez de crecer: con
                   cuatro filas ajustadas al alto, escalar rompería la rejilla. */
                transform: on ? `translateX(${u(4)})` : "none",
                boxShadow: on ? "0 8px 22px rgba(198,95,172,0.12)" : "none",
                transition:
                  "background .8s ease, border-color .8s ease, transform .9s cubic-bezier(.4,0,.2,1), box-shadow .8s ease",
              }}
            >
              <span
                style={{
                  flex: "none",
                  width: u(8),
                  height: u(8),
                  borderRadius: "50%",
                  background: on ? C.acentoVivo : "#4c444a",
                  boxShadow: on ? "0 0 8px rgba(226,98,196,0.6)" : "none",
                  transition: "background .8s ease, box-shadow .8s ease",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: u(12),
                    fontWeight: 500,
                    lineHeight: 1.1,
                    color: on ? "#fff" : "#9a9196",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    transition: "color .8s ease",
                  }}
                >
                  {L(fila, "label", locale)}
                </div>
                {/* Barra: cuánto ancho tiene reservado ese servicio. */}
                <div
                  style={{
                    marginTop: u(7),
                    height: u(4),
                    borderRadius: u(2),
                    background: C.tenue,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${ancho}%`,
                      height: "100%",
                      borderRadius: u(2),
                      background: on ? C.acentoVivo : C.acentoTenue,
                      transition: "background .8s ease",
                    }}
                  />
                </div>
              </div>
              {fila?.nivel && (
                <span
                  style={{
                    flex: "none",
                    padding: `${u(4)} ${u(8)}`,
                    borderRadius: u(7),
                    fontFamily: "'Space Mono', ui-monospace, monospace",
                    fontSize: u(8.5),
                    letterSpacing: "0.08em",
                    lineHeight: 1,
                    background: on ? "rgba(226,98,196,0.14)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${on ? "rgba(226,98,196,0.42)" : C.escenaBorde}`,
                    color: on ? C.acentoVivo : C.escenaApagado,
                    transition: "all .8s ease",
                  }}
                >
                  {fila.nivel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Escena>
  );
}
