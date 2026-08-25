import { C, Lienzo, ret, type PropsIlustracion } from "./base";

/**
 * Plantilla "Reloj" (SPEC 18).
 *
 * Una esfera con rayitas de hora y una aguja que barre en bucle. Cuenta
 * vigilancia permanente y tiempo de reacción sin escribir ningún número: la
 * lectura es "esto no para", no "esto tarda X".
 *
 * Sin `datos`.
 */

const CX = 160;
const CY = 92;
const R = 58;
/** Cuántas rayitas rodean la esfera. */
const MARCAS = 12;
/** Segundos de una vuelta completa de la aguja. */
const VUELTA_S = 6;

export default function Reloj({ activo }: PropsIlustracion) {
  const marcas = Array.from({ length: MARCAS }, (_, i) => {
    const angulo = (Math.PI * 2 * i) / MARCAS - Math.PI / 2;
    const cos = Math.cos(angulo);
    const sen = Math.sin(angulo);
    /* Las cuatro cardinales son más largas: dan lectura de esfera sin números. */
    const larga = i % 3 === 0;
    return {
      x1: CX + cos * (R - (larga ? 13 : 8)),
      y1: CY + sen * (R - (larga ? 13 : 8)),
      x2: CX + cos * R,
      y2: CY + sen * R,
      larga,
      ret: ret(0.15 + i * 0.04),
    };
  });

  return (
    <Lienzo activo={activo}>
      <circle
        className="fbx-ben-aparece"
        style={{ "--ret": ret(0.05) } as React.CSSProperties}
        cx={CX}
        cy={CY}
        r={R + 12}
        fill={C.tenue}
      />
      <circle
        className="fbx-ben-traza"
        style={{ "--largo": 2 * Math.PI * R, "--ret": ret(0.1) } as React.CSSProperties}
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={C.acentoClaro}
        strokeWidth="3"
      />

      {marcas.map((m, i) => (
        <line
          key={i}
          className="fbx-ben-punto"
          style={{ "--ret": m.ret } as React.CSSProperties}
          x1={m.x1}
          y1={m.y1}
          x2={m.x2}
          y2={m.y2}
          stroke={C.texto}
          strokeWidth={m.larga ? 3 : 2}
          strokeLinecap="round"
          opacity={m.larga ? 0.75 : 0.35}
        />
      ))}

      {/* La aguja barre en bucle. Gira el grupo entero para que el pivote quede
          clavado en el centro de la esfera. */}
      <g
        className="fbx-ben-gira"
        style={{ "--ciclo": `${VUELTA_S}s`, "--ret": ret(0.7), transformOrigin: `${CX}px ${CY}px` } as React.CSSProperties}
      >
        <line
          x1={CX}
          y1={CY}
          x2={CX}
          y2={CY - R + 16}
          stroke={C.acentoClaro}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
      <circle cx={CX} cy={CY} r="6" fill={C.acentoClaro} />
    </Lienzo>
  );
}
