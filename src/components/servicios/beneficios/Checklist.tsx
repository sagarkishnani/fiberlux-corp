import { C, L, Lienzo, ret, type PropsIlustracion } from "./base";

/**
 * Plantilla "Checklist" (SPEC 18).
 *
 * Tres o cuatro filas que se van marcando una tras otra. Cuenta validación,
 * cumplimiento y evaluación periódica: lo que importa es el gesto de repasar
 * una lista, no cuántos ítems tiene.
 *
 * Lee `datos.chips` (las mismas etiquetas que usa MFA) para poder nombrar lo
 * que se valida en cada servicio.
 */

const RESERVA = [{ label: "Controles" }, { label: "Configuración" }, { label: "Evidencias" }];

/** Geometría de una fila. */
const FILA = { x: 40, w: 240, h: 34, hueco: 12 };
const CAJA = 22;

export default function Checklist({ datos, activo, locale }: PropsIlustracion) {
  const filas = ((datos?.chips ?? []).filter(Boolean).length ? datos.chips : RESERVA).slice(0, 4);
  const alto = filas.length * FILA.h + (filas.length - 1) * FILA.hueco;
  const y0 = (180 - alto) / 2;

  return (
    <Lienzo activo={activo}>
      {filas.map((fila: any, i: number) => {
        const y = y0 + i * (FILA.h + FILA.hueco);
        return (
          <g
            key={i}
            className="fbx-ben-aparece"
            style={{ "--ret": ret(0.15 + i * 0.16) } as React.CSSProperties}
          >
            <rect
              x={FILA.x}
              y={y}
              width={FILA.w}
              height={FILA.h}
              rx="10"
              fill={C.panel}
              stroke={C.acentoTenue}
              strokeWidth="1.5"
            />
            <rect
              x={FILA.x + 8}
              y={y + (FILA.h - CAJA) / 2}
              width={CAJA}
              height={CAJA}
              rx="7"
              fill={C.tenue}
              stroke={C.acentoTenue}
              strokeWidth="1.5"
            />
            {/* El visto se traza después de que aterriza su fila. */}
            <path
              className="fbx-ben-traza"
              style={{ "--largo": 26, "--ret": ret(0.45 + i * 0.16) } as React.CSSProperties}
              d={`M ${FILA.x + 14} ${y + FILA.h / 2} l 4.5 5 l 8.5 -10`}
              fill="none"
              stroke={C.acentoClaro}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x={FILA.x + 42}
              y={y + FILA.h / 2 + 4}
              fill={C.texto}
              fontSize="12"
              fontWeight="600"
            >
              {L(fila, "label", locale)}
            </text>
          </g>
        );
      })}
    </Lienzo>
  );
}
