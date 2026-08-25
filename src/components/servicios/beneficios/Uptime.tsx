import { C, Lienzo, pct, ret, type PropsIlustracion } from "./base";

/**
 * Plantilla "Uptime" (SPEC 105, imagen 43, fila 2 col 3).
 *
 * Anillo grande con la cifra al centro. `datos.valor` y `datos.unidad` son el
 * texto; `datos.porcentaje` es cuánto se llena el anillo.
 *
 * En bucle, un halo ancho alrededor del anillo respira muy despacio: el uptime
 * es algo que se sostiene, no algo que se mueve, y un halo dice eso sin que
 * nada cambie de sitio.
 */

/** Segundos de una respiración completa del halo. */
const RESPIRA_S = 6;

const CX = 160;
const CY = 90;
const R = 58;
const GROSOR = 13;
const VUELTA = 2 * Math.PI * R;

export default function Uptime({ datos, activo }: PropsIlustracion) {
  const valor = datos?.valor || "99,95";
  const unidad = datos?.unidad || "% UPTIME";
  /* Sin porcentaje explícito se intenta leer la propia cifra: un SLA de 99,95
     dibuja un anillo casi cerrado sin que nadie tenga que repetir el dato. */
  const reserva = Number(String(valor).replace(",", "."));
  const porcentaje = pct(datos?.porcentaje, Number.isFinite(reserva) ? Math.min(reserva, 100) : 95);
  const largo = (VUELTA * porcentaje) / 100;

  return (
    <Lienzo activo={activo}>
      {/* Disco bajo el anillo: aísla la cifra del fondo de la card para que no
          se lea sobre el negro pelado de la sección. */}
      {/* Halo. Va el primero para quedar por debajo de todo lo demás. */}
      <circle
        className="fbx-ben-respira"
        style={{ "--o": 0.16, "--ciclo": `${RESPIRA_S}s` } as React.CSSProperties}
        cx={CX}
        cy={CY}
        r={R + GROSOR * 0.9}
        fill="none"
        stroke={C.acentoClaro}
        strokeWidth={GROSOR}
        opacity="0.16"
      />

      <circle
        className="fbx-ben-aparece"
        style={{ "--ret": ret(0.05) } as React.CSSProperties}
        cx={CX}
        cy={CY}
        r={R - GROSOR / 2}
        fill={C.panel}
      />

      <circle
        className="fbx-ben-aparece"
        style={{ "--ret": ret(0.05) } as React.CSSProperties}
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={C.tenue}
        strokeWidth={GROSOR}
      />

      <circle
        className="fbx-ben-traza"
        style={{ "--largo": largo, "--ret": ret(0.2) } as React.CSSProperties}
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={C.acentoClaro}
        strokeWidth={GROSOR}
        strokeLinecap="round"
        transform={`rotate(-90 ${CX} ${CY})`}
        strokeDasharray={`${largo} ${VUELTA}`}
      />

      <g
        className="fbx-ben-aparece"
        style={{ "--ret": ret(0.85) } as React.CSSProperties}
        textAnchor="middle"
      >
        <text x={CX} y={CY + 4} fill="#FFFFFF" fontSize="27" fontWeight="700">
          {valor}
        </text>
        <text
          x={CX}
          y={CY + 24}
          fill={C.acentoClaro}
          fontSize="11"
          fontWeight="700"
          letterSpacing="0.5"
        >
          {unidad}
        </text>
      </g>
    </Lienzo>
  );
}
