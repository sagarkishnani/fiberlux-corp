import { C, Lienzo, ret, type PropsIlustracion } from "./base";

/**
 * Plantilla "DWDM" (SPEC 105, imagen 43, fila 2 col 2).
 *
 * Dos racks oscuros unidos por hilos que se encienden uno a uno. El número de
 * hilos sale de `datos.hilos`.
 *
 * En bucle, un pulso de luz recorre cada fibra de izquierda a derecha, con un
 * desfase distinto por hilo para que no viajen en formación.
 */

/** Segundos que tarda el pulso en recorrer una fibra. */
const PULSO_S = 3.2;

const HILOS_RESERVA = 4;
const MIN = 3;
const MAX = 8;

/** Caja de cada rack. */
const RACK = { w: 34, h: 124, y: 28, izq: 30, der: 256 };
/** Aire entre el borde de cada rack y el extremo pintado de los hilos (obs. cliente). */
const AIRE = 4;

export default function Dwdm({ datos, activo }: PropsIlustracion) {
  const pedidos = Number(datos?.hilos);
  const hilos = Number.isFinite(pedidos)
    ? Math.min(MAX, Math.max(MIN, Math.round(pedidos)))
    : HILOS_RESERVA;

  /* Los hilos se reparten por el alto útil del rack, con margen arriba y abajo
     para que no se peguen a las esquinas redondeadas. El haz va CENTRADO
     verticalmente respecto a los racks (obs. cliente): antes colgaba hacia
     abajo por esquivar las luces del equipo, que quedan dentro del rack y no
     estorban a unos hilos que arrancan fuera de él. */
  const alto = RACK.h - 46;
  const paso = alto / (hilos - 1);
  const y0 = RACK.y + (RACK.h - alto) / 2;

  return (
    <Lienzo activo={activo}>
      {[RACK.izq, RACK.der].map((x, i) => (
        <g
          key={i}
          className="fbx-ben-aparece"
          style={{ "--ret": ret(0.05 + i * 0.1) } as React.CSSProperties}
        >
          <rect
            x={x}
            y={RACK.y}
            width={RACK.w}
            height={RACK.h}
            rx="9"
            fill={C.panel}
            stroke={C.panelBorde}
            strokeWidth="1.2"
          />
          {/* Las dos barritas de cada rack: son las luces del equipo. */}
          <rect x={x + 9} y={RACK.y + 18} width={RACK.w - 18} height="6" rx="3" fill={C.acentoClaro} />
          <rect
            x={x + 9}
            y={RACK.y + 32}
            width={RACK.w - 18}
            height="6"
            rx="3"
            fill={C.acentoClaro}
            opacity="0.45"
          />
        </g>
      ))}

      {Array.from({ length: hilos }, (_, i) => {
        const y = y0 + paso * i;
        /* Uno de cada tres va a plena opacidad: sin ese contraste los hilos se
           leen como un rayado y no como fibras distintas. */
        const fuerte = i % 3 === 1;
        const grosor = fuerte ? 4 : 3;
        /* El extremo redondeado pinta medio grosor MÁS ALLÁ del punto final, así
           que se descuenta: sin eso los hilos se montaban sobre los racks. Con
           el descuento el aire visible es exactamente AIRE en ambos lados,
           igual para hilos gruesos y finos. */
        const x1 = RACK.izq + RACK.w + AIRE + grosor / 2;
        const x2 = RACK.der - AIRE - grosor / 2;
        const largo = x2 - x1;
        return (
          /* La entrada va en el grupo y el pulso en la línea de encima: una
             animación por elemento, así que no pueden compartir nodo. */
          <g
            key={i}
            className="fbx-ben-barra"
            style={{ "--ret": ret(0.3 + i * 0.09) } as React.CSSProperties}
          >
            <line
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke={C.acentoClaro}
              strokeWidth={grosor}
              strokeLinecap="round"
              opacity={fuerte ? 0.9 : 0.4}
            />
            {/* El pulso: un guión corto sobre un hueco largo, desplazándose. */}
            <line
              className="fbx-ben-flujo"
              style={
                {
                  "--ciclo": `${PULSO_S}s`,
                  "--ret": `${(i * 0.55).toFixed(2)}s`,
                  "--flujo": -(largo + 30),
                } as React.CSSProperties
              }
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke="#F7DDEF"
              strokeWidth={grosor}
              strokeLinecap="round"
              strokeDasharray={`16 ${largo + 14}`}
              opacity="0.9"
            />
          </g>
        );
      })}
    </Lienzo>
  );
}
