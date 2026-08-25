import { C, Lienzo, ret, type PropsIlustracion } from "./base";

/**
 * Plantilla "Sedes" (SPEC 105, imagen 43, fila 2 col 1).
 *
 * Nodos unidos por líneas discontinuas dentro de un recuadro punteado: la LAN
 * privada, aislada del internet público. Los nodos salen de `datos.nodos`.
 *
 * En bucle, un pulso recorre cada enlace de punta a punta y los nodos respiran
 * por turnos. Antes lo que se movía eran los propios guiones del enlace, y con
 * un patrón tan corto el avance se leía a tirones en vez de como un flujo.
 */

/** Segundos que tarda el pulso en recorrer un enlace. */
const PULSO_S = 2.8;
/** Segundos entre el arranque de un pulso y el del siguiente enlace. */
const PULSO_STAGGER = 0.7;
/** Largo del pulso, en unidades del lienzo. */
const PULSO_LARGO = 18;

/** Posiciones fijas del diseño: dos arriba y uno abajo al centro.
    Bajaron con el recinto (SPEC 17) y volvieron a subir en el SPEC 18: el halo
    de un nodo mide 1.75 veces su radio, así que el de abajo llegaba a 174 y el
    recinto termina en 170 — se veía cortado contra la línea punteada. Con estas
    alturas el halo más bajo cierra en 163 y respira dentro del recinto. */
const PUESTOS = [
  { x: 86, y: 74, r: 20 },
  { x: 232, y: 70, r: 22 },
  { x: 158, y: 126, r: 21 },
  { x: 60, y: 130, r: 18 },
];

const RESERVA = [
  { label: "Sede norte" },
  { label: "Sede sur" },
  { label: "Nube" },
];

export default function Sedes({ datos, activo }: PropsIlustracion) {
  const nodos = ((datos?.nodos ?? []).filter(Boolean).length ? datos.nodos : RESERVA)
    .filter(Boolean)
    .slice(0, PUESTOS.length);

  /* Cada nodo se une con el siguiente y el último cierra contra el primero:
     con tres o cuatro puntos eso da el triángulo/rombo del diseño sin tener
     que enumerar las aristas a mano. */
  const aristas = nodos.map((_: any, i: number) => [
    PUESTOS[i],
    PUESTOS[(i + 1) % nodos.length],
  ]);

  /* El pulso necesita saber cuánto mide su enlace para recorrerlo justo. */
  const largos = aristas.map(([a, b]: any) => Math.round(Math.hypot(b.x - a.x, b.y - a.y)));

  return (
    <Lienzo activo={activo}>
      {/* Recinto punteado: es lo que dice "esto es una sola red". Se agrandó en
          la revisión del cliente (SPEC 17): con 276×126 rozaba los nodos y el
          recinto se leía apretado en vez de contenerlos. */}
      <rect
        className="fbx-ben-aparece"
        style={{ "--ret": ret(0.05) } as React.CSSProperties}
        x="12"
        y="24"
        width="296"
        height="146"
        rx="18"
        fill="none"
        stroke={C.acento}
        strokeWidth="1.2"
        strokeDasharray="6 6"
        opacity="0.45"
      />

      {aristas.map(([a, b]: any, i: number) => (
        <g
          key={i}
          className="fbx-ben-barra"
          style={{ "--ret": ret(0.25 + i * 0.1) } as React.CSSProperties}
        >
          {/* El enlace, quieto. */}
          <line
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={C.acento}
            strokeWidth="1.4"
            strokeDasharray="5 5"
            opacity="0.5"
          />
          {/* El pulso: un tramo corto sobre un hueco tan largo como el enlace,
              desplazándose hasta salir por el otro extremo. Al recorrer justo
              `largo + PULSO_LARGO` el ciclo encaja consigo mismo y no da el
              salto que se veía al reiniciar. */}
          <line
            className="fbx-ben-flujo"
            style={
              {
                "--ciclo": `${PULSO_S}s`,
                "--ret": `${(i * PULSO_STAGGER).toFixed(2)}s`,
                "--flujo": -(largos[i] + PULSO_LARGO),
              } as React.CSSProperties
            }
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={C.acentoClaro}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray={`${PULSO_LARGO} ${largos[i]}`}
          />
        </g>
      ))}

      {nodos.map((nodo: any, i: number) => {
        const p = PUESTOS[i];
        /* El último nodo es el concentrador: relleno verde en vez de blanco,
           como el globo del diseño. */
        const hub = i === nodos.length - 1;
        return (
          <g
            key={i}
            className="fbx-ben-punto"
            style={{ "--ret": ret(0.15 + i * 0.12) } as React.CSSProperties}
          >
            <circle
              className="fbx-ben-respira"
              style={
                {
                  "--o": 0.14,
                  "--ciclo": "4.4s",
                  "--ret": `${(i * 0.9).toFixed(2)}s`,
                } as React.CSSProperties
              }
              cx={p.x}
              cy={p.y}
              r={p.r * 1.75}
              fill={C.acentoClaro}
              opacity="0.14"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill={hub ? C.acentoClaro : C.panel}
              stroke={hub ? C.acentoClaro : C.acentoTenue}
              strokeWidth="1.6"
            />
            {/* Casita para las sedes, meridianos para el concentrador. */}
            {hub ? (
              <g
                transform={`translate(${p.x} ${p.y})`}
                fill="none"
                stroke={C.fondo}
                strokeWidth="1.6"
              >
                <circle r="8" />
                <path d="M -8 0 L 8 0 M 0 -8 C 4 -4 4 4 0 8 C -4 4 -4 -4 0 -8" />
              </g>
            ) : (
              <path
                d={`M ${p.x - 7} ${p.y + 1} L ${p.x} ${p.y - 6} L ${p.x + 7} ${p.y + 1} L ${p.x + 7} ${p.y + 7} L ${p.x - 7} ${p.y + 7} Z`}
                fill="none"
                stroke={C.acentoClaro}
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            )}
          </g>
        );
      })}
    </Lienzo>
  );
}
