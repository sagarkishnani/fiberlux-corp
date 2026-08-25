import { C, Lienzo, anchoTexto, ret, useTurno, type PropsIlustracion } from "./base";

/**
 * Plantilla "Conmutación" (SPEC 105, imagen 43, fila 3 col 2).
 *
 * Un origen y un destino unidos por varias rutas: la activa se dibuja sólida y
 * las demás punteadas. Las rutas salen de `datos.rutas`.
 *
 * En bucle, la ruta activa va cambiando: es lo que hace el servicio, así que el
 * movimiento cuenta algo en vez de adornar. `datos.rutas[].activa` marca por
 * cuál empieza; a partir de ahí conmuta sola.
 */

/** Cada cuánto conmuta de ruta, en ms. */
const CONMUTA_MS = 3400;

const RESERVA = [
  { label: "FIBRA", activa: true },
  { label: "LTE" },
  { label: "SATELITAL" },
];

/** Extremos del recorrido. */
const A = { x: 44, y: 90 };
const B = { x: 276, y: 90 };
/** Cuánto se comba la ruta más alta y la más baja. */
const COMBA = 58;
/** Cuerpo, tracking y respiro de la píldora que nombra cada ruta. */
const CUERPO = 9;
const TRACKING = 0.6;
const SANGRIA = 22;

export default function Conmutacion({ datos, activo }: PropsIlustracion) {
  const rutas = ((datos?.rutas ?? []).filter(Boolean).length ? datos.rutas : RESERVA)
    .filter(Boolean)
    .slice(0, 4);

  /* Ninguna marcada: manda la primera. El dibujo pierde su sentido si no hay
     exactamente una ruta encendida. */
  const inicial = Math.max(0, rutas.findIndex((r: any) => r?.activa));
  const turno = useTurno(rutas.length, activo, CONMUTA_MS);
  const activaIdx = (inicial + turno) % rutas.length;

  return (
    <Lienzo activo={activo}>
      {rutas.map((ruta: any, i: number) => {
        /* Las rutas se reparten simétricamente arriba y abajo del eje: con tres
           quedan una arriba, una recta y una abajo, como el diseño. */
        const t = rutas.length === 1 ? 0 : (i / (rutas.length - 1)) * 2 - 1;
        const cy = A.y + t * COMBA * 1.6;
        const medio = { x: (A.x + B.x) / 2, y: cy };
        const activa = i === activaIdx;
        /* La píldora se ajusta a su etiqueta: con `width` fijo, un nombre largo
           se salía por los dos lados. Versalitas, así que el glifo es ancho. */
        const pildora = Math.max(68, anchoTexto(ruta?.label, CUERPO, 0.62, TRACKING) + SANGRIA);
        return (
          <g key={i}>
            {/* Dos trazos superpuestos que se cruzan en opacidad, en vez de un
                trazo que cambia de `strokeDasharray` y de grosor: ninguna de
                esas dos propiedades transiciona, así que la conmutación salía
                de golpe. Cruzando opacidades, la ruta se enciende y la anterior
                se apaga a la vez. */}
            <g
              className="fbx-ben-traza"
              style={{ "--largo": 260, "--ret": ret(0.15 + i * 0.12) } as React.CSSProperties}
            >
              <path
                className="fbx-ben-suave"
                d={`M ${A.x} ${A.y} Q ${medio.x} ${medio.y} ${B.x} ${B.y}`}
                fill="none"
                stroke={C.acentoTenue}
                strokeWidth="1.8"
                strokeDasharray="5 5"
                strokeLinecap="round"
                opacity={activa ? 0 : 1}
              />
              <path
                className="fbx-ben-suave"
                d={`M ${A.x} ${A.y} Q ${medio.x} ${medio.y} ${B.x} ${B.y}`}
                fill="none"
                stroke={C.acentoClaro}
                strokeWidth="3"
                strokeLinecap="round"
                opacity={activa ? 1 : 0}
              />
            </g>
            {/* Etiqueta en la cintura de la ruta: el punto medio de una
                cuadrática cae a media altura entre el eje y el control. */}
            <g
              className="fbx-ben-punto"
              style={{ "--ret": ret(0.5 + i * 0.12) } as React.CSSProperties}
            >
              <rect
                className="fbx-ben-suave"
                x={medio.x - pildora / 2}
                y={(A.y + medio.y) / 2 - 10}
                width={pildora}
                height="20"
                rx="10"
                fill={activa ? C.acentoClaro : C.panel}
                stroke={activa ? C.acentoClaro : C.acentoTenue}
                strokeWidth="1.2"
              />
              <text
                className="fbx-ben-suave"
                x={medio.x}
                y={(A.y + medio.y) / 2 + 4}
                fill={activa ? C.fondo : C.textoTenue}
                fontSize="9"
                fontWeight="700"
                letterSpacing="0.6"
                textAnchor="middle"
              >
                {ruta?.label}
              </text>
            </g>
          </g>
        );
      })}

      {/* Origen: el conmutador. */}
      <g className="fbx-ben-punto" style={{ "--ret": ret(0.05) } as React.CSSProperties}>
        <circle cx={A.x} cy={A.y} r="21" fill={C.acento} />
        <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round">
          <path d={`M ${A.x - 8} ${A.y - 5} L ${A.x + 8} ${A.y - 5}`} />
          <path d={`M ${A.x - 8} ${A.y} L ${A.x + 8} ${A.y}`} />
          <path d={`M ${A.x - 8} ${A.y + 5} L ${A.x + 8} ${A.y + 5}`} />
        </g>
      </g>

      {/* Destino: llegó. */}
      <g className="fbx-ben-punto" style={{ "--ret": ret(0.9) } as React.CSSProperties}>
        <circle cx={B.x} cy={B.y} r="21" fill={C.acentoClaro} />
        <path
          d={`M ${B.x - 8} ${B.y} L ${B.x - 2} ${B.y + 6} L ${B.x + 9} ${B.y - 6}`}
          fill="none"
          stroke={C.fondo}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </Lienzo>
  );
}
