import { C, L, Lienzo, VB, cajaEtiquetas, ret, type PropsIlustracion } from "./base";

/**
 * Plantilla "MFA" (SPEC 105, imagen 43, fila 3 col 3).
 *
 * Móvil oscuro con el candado y los puntos del código, y los factores en
 * chips a la derecha. Los chips salen de `datos.chips`.
 *
 * En bucle, los puntos del código laten y el ícono de cada factor se enciende
 * por turnos: la verificación pasando de un factor al siguiente.
 */

/** Segundos del ciclo de encendido de los factores. */
const FACTOR_S = 5.2;

const RESERVA = [{ label: "Contraseña" }, { label: "Token / App" }, { label: "Biometría" }];

/** Caja del móvil. */
const MOVIL = { x: 22, y: 22, w: 86, h: 138 };
/** Caja de los chips. Su ancho ya no es fijo: lo fija la etiqueta más larga,
    porque el editor las escribe en Tina y "Reporte del usuario" llegaba justo
    al borde. Se conserva el ancho del diseño como mínimo. */
const CHIP = { x: 132, w: 168, h: 34, gap: 10, sangriaIzq: 38, sangriaDer: 20 };
/** Cuerpo de la etiqueta y margen derecho del lienzo. */
const CUERPO = 11;
const MARGEN = 12;
/** Cuántos puntos tiene el código. */
const PUNTOS = 4;

export default function Mfa({ datos, activo, locale }: PropsIlustracion) {
  const chips = ((datos?.chips ?? []).filter(Boolean).length ? datos.chips : RESERVA)
    .filter(Boolean)
    .slice(0, 4);

  /* Todos los chips miden lo mismo, el que pide la etiqueta más larga, y la
     columna se ancla a la derecha del lienzo. Si crece, avanza hacia el móvil
     sin llegar a tocarlo. */
  const { ancho: anchoChip, cuerpo } = cajaEtiquetas(
    chips.map((c: any) => L(c, "label", locale)),
    {
      cuerpo: CUERPO,
      minimo: CHIP.w,
      maximo: VB.w - MARGEN - (MOVIL.x + MOVIL.w + 16),
      sangria: CHIP.sangriaIzq + CHIP.sangriaDer,
    }
  );
  const xChip = VB.w - MARGEN - anchoChip;

  /* Los chips se centran verticalmente contra el móvil, sean tres o cuatro. */
  const altoTotal = chips.length * CHIP.h + (chips.length - 1) * CHIP.gap;
  const y0 = MOVIL.y + (MOVIL.h - altoTotal) / 2;

  return (
    <Lienzo activo={activo}>
      <g className="fbx-ben-aparece" style={{ "--ret": ret(0.05) } as React.CSSProperties}>
        <rect
          x={MOVIL.x}
          y={MOVIL.y}
          width={MOVIL.w}
          height={MOVIL.h}
          rx="16"
          fill={C.acentoOscuro}
          stroke={C.acentoTenue}
          strokeWidth="1.2"
        />
        {/* Candado. */}
        <g transform={`translate(${MOVIL.x + MOVIL.w / 2} ${MOVIL.y + 52})`}>
          <circle r="17" fill={C.acentoClaro} opacity="0.16" />
          <rect x="-8" y="-2" width="16" height="13" rx="3" fill={C.acentoClaro} />
          <path
            d="M -5 -2 L -5 -7 A 5 5 0 0 1 5 -7 L 5 -2"
            fill="none"
            stroke={C.acentoClaro}
            strokeWidth="2.2"
          />
        </g>
      </g>

      {/* Puntos del código: laten en bucle porque es lo único de la card que
          representa algo que caduca. */}
      <g>
        {Array.from({ length: PUNTOS }, (_, i) => (
          <circle
            key={i}
            className="fbx-ben-punto fbx-ben-late"
            style={
              {
                "--ret": ret(0.45 + i * 0.14),
                "--ciclo": "2.4s",
                "--o": 1,
              } as React.CSSProperties
            }
            cx={MOVIL.x + MOVIL.w / 2 - 18 + i * 12}
            cy={MOVIL.y + 96}
            r="5"
            fill={C.acentoClaro}
          />
        ))}
      </g>

      <text
        className="fbx-ben-aparece"
        style={{ "--ret": ret(0.7) } as React.CSSProperties}
        x={MOVIL.x + MOVIL.w / 2}
        y={MOVIL.y + 122}
        fill={C.acentoTenue}
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
        textAnchor="middle"
      >
        CÓDIGO OTP
      </text>

      {chips.map((chip: any, i: number) => {
        const y = y0 + i * (CHIP.h + CHIP.gap);
        return (
          <g
            key={i}
            className="fbx-ben-aparece"
            style={{ "--ret": ret(0.25 + i * 0.14) } as React.CSSProperties}
          >
            <rect
              x={xChip}
              y={y}
              width={anchoChip}
              height={CHIP.h}
              rx="10"
              fill={C.panel}
              stroke={C.acentoTenue}
              strokeWidth="1"
            />
            <rect
              x={xChip + 11}
              y={y + CHIP.h / 2 - 9}
              width="18"
              height="18"
              rx="6"
              fill={C.tenue}
            />
            {/* Lo que se enciende por turnos es el punto, no el cuadro: pintar
                el cuadro de verde convertía el ícono en una mancha. */}
            <circle
              className="fbx-ben-destello"
              style={
                {
                  "--o": 0.45,
                  "--ciclo": `${FACTOR_S}s`,
                  "--ret": `${(i * 1.1).toFixed(2)}s`,
                } as React.CSSProperties
              }
              cx={xChip + 20}
              cy={y + CHIP.h / 2}
              r="3.4"
              fill={C.acentoClaro}
              opacity="0.45"
            />
            <text
              x={xChip + CHIP.sangriaIzq}
              y={y + CHIP.h / 2 + 4}
              fill={C.texto}
              fontSize={cuerpo}
              fontWeight="600"
            >
              {L(chip, "label", locale)}
            </text>
          </g>
        );
      })}
    </Lienzo>
  );
}
