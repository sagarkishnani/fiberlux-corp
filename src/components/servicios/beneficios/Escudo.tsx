import { C, Lienzo, ret, type PropsIlustracion } from "./base";

/**
 * Plantilla "Escudo" (SPEC 18).
 *
 * Un escudo que se traza y tres impactos que llegan desde fuera y rebotan en su
 * borde. Cuenta protección, bloqueo e inmutabilidad sin afirmar ninguna cifra:
 * lo que se ve es que algo llega y no entra.
 *
 * Sin `datos`: el dibujo es siempre el mismo. Lo único que cambia entre cards es
 * el texto de la card, que ya lo pone el editor.
 */

/** Punta y hombros del escudo, en unidades del lienzo. */
const CX = 160;
const TOPE = 34;
const ANCHO = 52;
const HOMBRO = 74;
const PUNTA = 152;

/** Contorno del escudo: hombros rectos y base en punta. */
const SILUETA = `M ${CX} ${TOPE}
  L ${CX + ANCHO} ${TOPE + 16}
  L ${CX + ANCHO} ${HOMBRO + 22}
  Q ${CX + ANCHO} ${PUNTA - 26} ${CX} ${PUNTA}
  Q ${CX - ANCHO} ${PUNTA - 26} ${CX - ANCHO} ${HOMBRO + 22}
  L ${CX - ANCHO} ${TOPE + 16} Z`;

/** Los tres impactos: de dónde vienen y dónde rebotan. */
const IMPACTOS = [
  { x: CX - ANCHO + 6, y: 66, desde: -46, ciclo: 3.4, ret: 0.0 },
  { x: CX + ANCHO - 6, y: 92, desde: 46, ciclo: 3.9, ret: 0.5 },
  { x: CX - ANCHO + 16, y: 118, desde: -46, ciclo: 4.3, ret: 1.0 },
];

export default function Escudo({ activo }: PropsIlustracion) {
  return (
    <Lienzo activo={activo}>
      {/* Relleno: entra después del trazo, así el escudo se lee como que se
          cierra sobre sí mismo antes de llenarse. */}
      <path
        className="fbx-ben-aparece"
        style={{ "--ret": ret(0.5) } as React.CSSProperties}
        d={SILUETA}
        fill={C.tenue}
      />
      <path
        className="fbx-ben-traza"
        style={{ "--largo": 420, "--ret": ret(0.1) } as React.CSSProperties}
        d={SILUETA}
        fill="none"
        stroke={C.acentoClaro}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Marca interior: dos trazos que forman el visto del escudo. */}
      <path
        className="fbx-ben-traza"
        style={{ "--largo": 90, "--ret": ret(0.9) } as React.CSSProperties}
        d={`M ${CX - 22} ${94} L ${CX - 5} ${112} L ${CX + 26} ${74}`}
        fill="none"
        stroke={C.acentoClaro}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Impactos: llegan, tocan el borde y se apagan. En bucle, desfasados,
          para que nunca golpeen los tres a la vez. */}
      {IMPACTOS.map((im, i) => (
        <g
          key={i}
          className="fbx-ben-flujo"
          style={{ "--ciclo": `${im.ciclo}s`, "--ret": ret(im.ret) } as React.CSSProperties}
        >
          <line
            x1={im.x + im.desde}
            y1={im.y}
            x2={im.x + im.desde * 0.35}
            y2={im.y}
            stroke={C.textoTenue}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.45"
          />
          <circle cx={im.x + im.desde * 0.3} cy={im.y} r="4" fill={C.textoTenue} opacity="0.7" />
        </g>
      ))}
    </Lienzo>
  );
}
