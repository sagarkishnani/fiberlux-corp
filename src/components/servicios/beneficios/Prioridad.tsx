import { C, Lienzo, pct, ret, type PropsIlustracion } from "./base";

/**
 * Plantilla "Tráfico" (SPEC 105, imagen 43, fila 3 col 1).
 *
 * Lista priorizada: número, servicio, barra de ancho y etiqueta de prioridad.
 * Las filas salen de `datos.filas`.
 *
 * En bucle, un realce recorre las barras de arriba abajo: el enrutamiento
 * atendiendo cada cola por su orden.
 */

/** Segundos del ciclo del realce, incluida su pausa. */
const REALCE_S = 5.4;
/** Opacidad de reposo de una barra. */
const REPOSO = 0.82;

const RESERVA = [
  { label: "Videollamada institucional", nivel: "CRÍTICO", porcentaje: 92 },
  { label: "Sistema de trámite digital", nivel: "ALTA", porcentaje: 68 },
  { label: "Correo y colaboración", nivel: "MEDIA", porcentaje: 44 },
];

/** Alto de cada fila y de dónde arranca la primera. */
const ALTO = 46;
const Y0 = 16;
/** Caja de la barra. */
const BARRA = { x: 44, w: 176, h: 5 };

export default function Prioridad({ datos, activo }: PropsIlustracion) {
  const filas = ((datos?.filas ?? []).filter(Boolean).length ? datos.filas : RESERVA)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <Lienzo activo={activo}>
      {filas.map((fila: any, i: number) => {
        const y = Y0 + i * ALTO;
        const ancho = (BARRA.w * pct(fila?.porcentaje, 60)) / 100;
        return (
          <g key={i}>
            <g
              className="fbx-ben-aparece"
              style={{ "--ret": ret(0.05 + i * 0.13) } as React.CSSProperties}
            >
              <rect
                x="8"
                y={y}
                width="304"
                height={ALTO - 8}
                rx="10"
                fill={C.panel}
                stroke={C.tenue}
                strokeWidth="1"
              />
              {/* Ordinal. Es lo que convierte la lista en una prioridad. */}
              <rect x="18" y={y + 9} width="20" height="20" rx="6" fill={C.acentoClaro} />
              <text
                x="28"
                y={y + 23}
                fill={C.fondo}
                fontSize="12"
                fontWeight="700"
                textAnchor="middle"
              >
                {i + 1}
              </text>
              <text x={BARRA.x} y={y + 16} fill={C.texto} fontSize="11" fontWeight="600">
                {fila?.label}
              </text>
              <text
                x="304"
                y={y + 16}
                fill={C.acentoClaro}
                fontSize="8"
                fontWeight="700"
                letterSpacing="0.6"
                textAnchor="end"
              >
                {fila?.nivel}
              </text>
              <rect
                x={BARRA.x}
                y={y + 24}
                width={BARRA.w}
                height={BARRA.h}
                rx={BARRA.h / 2}
                fill={C.tenue}
              />
            </g>
            <g
              className="fbx-ben-barra"
              style={{ "--ret": ret(0.3 + i * 0.13) } as React.CSSProperties}
            >
              <rect
                className="fbx-ben-destello"
                style={
                  {
                    "--o": REPOSO,
                    "--ciclo": `${REALCE_S}s`,
                    "--ret": `${(i * 0.5).toFixed(2)}s`,
                  } as React.CSSProperties
                }
                x={BARRA.x}
                y={y + 24}
                width={ancho}
                height={BARRA.h}
                rx={BARRA.h / 2}
                fill={C.acentoClaro}
                opacity={REPOSO}
              />
            </g>
          </g>
        );
      })}
    </Lienzo>
  );
}
