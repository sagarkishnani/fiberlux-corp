import { C, Lienzo, pct, ret, type PropsIlustracion } from "./base";

/**
 * Plantilla "Prioridad" (SPEC 105, imagen 41, card 3).
 *
 * Semicírculo de rayitas. Las que caen dentro de `datos.porcentaje` son las
 * oscuras del diseño y se encienden una tras otra; el resto queda apagado.
 *
 * En bucle, una onda de luz recorre el arco: las encendidas reposan un punto
 * por debajo de su opacidad plena y la recuperan al pasar la onda.
 */

/** Segundos del ciclo de la onda, incluida su larga pausa. */
const ONDA_S = 5.5;
/** Opacidad de reposo de una rayita encendida. */
const REPOSO = 0.82;

/** Cuántas rayitas forman el arco. */
const RAYAS = 30;
/** Centro y radios del arco, en unidades del lienzo. */
const CX = 160;
const CY = 156;
const R_INT = 74;
const R_EXT = 96;
/** Segundos entre una rayita y la siguiente al encenderse. */
const STAGGER = 0.03;

export default function Gauge({ datos, activo }: PropsIlustracion) {
  const porcentaje = pct(datos?.porcentaje, 88);
  const encendidas = Math.round((RAYAS * porcentaje) / 100);

  const rayas = Array.from({ length: RAYAS }, (_, i) => {
    /* De 180° a 360°: el arco se recorre de izquierda a derecha pasando por
       arriba, como en el diseño. */
    const angulo = Math.PI + (Math.PI * i) / (RAYAS - 1);
    const cos = Math.cos(angulo);
    const sen = Math.sin(angulo);
    /* Las del centro son un pelo más largas: lo justo para que el arco se lea
       como un medidor. Con más realce el borde exterior sale dentado. */
    const realce = 1 + Math.sin((Math.PI * i) / (RAYAS - 1)) * 0.05;
    return {
      x1: CX + cos * R_INT,
      y1: CY + sen * R_INT,
      x2: CX + cos * R_EXT * realce,
      y2: CY + sen * R_EXT * realce,
      on: i < encendidas,
      ret: ret(0.1 + i * STAGGER),
    };
  });

  return (
    <Lienzo activo={activo}>
      {rayas.map((raya, i) => (
        /* La entrada va en el grupo y la onda en la rayita: una animación por
           elemento. Sólo ondulan las encendidas; las apagadas son fondo. */
        <g key={i} className="fbx-ben-punto" style={{ "--ret": raya.ret } as React.CSSProperties}>
          <line
            className={raya.on ? "fbx-ben-destello" : undefined}
            style={
              raya.on
                ? ({
                    "--o": REPOSO,
                    "--ciclo": `${ONDA_S}s`,
                    "--ret": `${(i * 0.045).toFixed(2)}s`,
                  } as React.CSSProperties)
                : undefined
            }
            x1={raya.x1}
            y1={raya.y1}
            x2={raya.x2}
            y2={raya.y2}
            /* Las apagadas son el MISMO morado a baja opacidad, no otro color:
               el dial se lee como una sola pieza, y un tono distinto lo
               partiría en dos objetos. */
            stroke={C.acentoClaro}
            strokeWidth="3"
            strokeLinecap="round"
            opacity={raya.on ? REPOSO : 0.3}
          />
        </g>
      ))}
    </Lienzo>
  );
}
