import { C, Lienzo, pct, ret, type PropsIlustracion } from "./base";

/**
 * Plantilla "Escalera" (SPEC 18).
 *
 * Barras que crecen por escalones, con una silueta punteada por encima que
 * marca hasta dónde puede seguir subiendo. Cuenta escalabilidad y capacidad que
 * acompaña la demanda; no pone cifra en ninguna barra a propósito.
 *
 * `datos.porcentaje` decide cuánto de la escalera está ocupado hoy: el resto
 * queda como margen de crecimiento.
 */

const BARRAS = 6;
const CAJA = { x: 44, y: 34, w: 232, h: 108 };
const HUECO = 10;

export default function Escalera({ datos, activo }: PropsIlustracion) {
  const porcentaje = pct(datos?.porcentaje, 66);
  const llenas = Math.max(1, Math.round((BARRAS * porcentaje) / 100));
  const ancho = (CAJA.w - HUECO * (BARRAS - 1)) / BARRAS;

  return (
    <Lienzo activo={activo}>
      {/* Base sobre la que se apoya todo. */}
      <line
        className="fbx-ben-traza"
        style={{ "--largo": CAJA.w + 16, "--ret": ret(0.05) } as React.CSSProperties}
        x1={CAJA.x - 8}
        y1={CAJA.y + CAJA.h + 6}
        x2={CAJA.x + CAJA.w + 8}
        y2={CAJA.y + CAJA.h + 6}
        stroke={C.acentoClaro}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {Array.from({ length: BARRAS }, (_, i) => {
        /* Cada escalón es más alto que el anterior: la progresión es el
           argumento del dibujo. */
        const alto = CAJA.h * (0.24 + (0.76 * (i + 1)) / BARRAS);
        const x = CAJA.x + i * (ancho + HUECO);
        const y = CAJA.y + CAJA.h - alto;
        const llena = i < llenas;
        return (
          <g key={i}>
            {/* Margen de crecimiento: contorno punteado hasta el tope. */}
            <rect
              className="fbx-ben-aparece"
              style={{ "--ret": ret(0.2 + i * 0.07) } as React.CSSProperties}
              x={x}
              y={y}
              width={ancho}
              height={alto}
              rx="6"
              fill="none"
              stroke={C.acentoTenue}
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {llena && (
              <rect
                className="fbx-ben-sube"
                style={{ "--ret": ret(0.3 + i * 0.1) } as React.CSSProperties}
                x={x}
                y={y}
                width={ancho}
                height={alto}
                rx="6"
                fill={i === llenas - 1 ? C.acentoClaro : C.acentoTenue}
              />
            )}
          </g>
        );
      })}

      {/* Flecha de crecimiento sobre el último escalón ocupado. */}
      <g
        className="fbx-ben-late"
        style={{ "--ciclo": "3.2s", "--ret": ret(1.1) } as React.CSSProperties}
      >
        <path
          d={`M ${CAJA.x + CAJA.w - 14} ${CAJA.y - 6} l 0 -14 M ${CAJA.x + CAJA.w - 21} ${CAJA.y - 14} l 7 -8 l 7 8`}
          fill="none"
          stroke={C.acentoClaro}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </Lienzo>
  );
}
