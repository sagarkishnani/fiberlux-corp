import { C, L, Lienzo, cajaEtiquetas, ret, VB, type PropsIlustracion } from "./base";

/**
 * Plantilla "Consola" (SPEC 18).
 *
 * Un panel central del que salen tres módulos gobernados desde él. Cuenta
 * administración centralizada, gestión integral y acompañamiento: una sola
 * mano operando varias cosas.
 *
 * Lee `datos.nodos` (las mismas etiquetas que usa Sedes) para nombrar qué se
 * administra en cada servicio.
 */

const RESERVA = [{ label: "Red" }, { label: "Usuarios" }, { label: "Reportes" }];

/** Panel central. */
const PANEL = { x: 26, y: 30, w: 100, h: 120 };
/** Módulos: alto, separación y respiro alrededor del texto. */
const MOD = { h: 32, hueco: 14, sangriaIzq: 30, sangriaDer: 24 };
/** Cuerpo de la etiqueta y aire mínimo entre el panel y la columna. */
const CUERPO = 11;
const CABLE_MIN = 34;
/** Margen del lienzo por la derecha. */
const MARGEN = 12;

export default function Consola({ datos, activo, locale }: PropsIlustracion) {
  const modulos = ((datos?.nodos ?? []).filter(Boolean).length ? datos.nodos : RESERVA)
    .filter(Boolean)
    .slice(0, 3);

  /* La caja se dimensiona con la etiqueta más larga y todas quedan iguales: una
     columna de anchos distintos se lee como un error, no como jerarquía. */
  const { ancho, cuerpo } = cajaEtiquetas(
    modulos.map((m: any) => L(m, "label", locale)),
    {
      cuerpo: CUERPO,
      minimo: 96,
      maximo: VB.w - MARGEN - (PANEL.x + PANEL.w + CABLE_MIN),
      sangria: MOD.sangriaIzq + MOD.sangriaDer,
    }
  );
  const x = VB.w - MARGEN - ancho;

  const alto = modulos.length * MOD.h + (modulos.length - 1) * MOD.hueco;
  const y0 = (VB.h - alto) / 2;
  const salida = { x: PANEL.x + PANEL.w, y: PANEL.y + PANEL.h / 2 };

  return (
    <Lienzo activo={activo}>
      {/* Panel: bloque morado oscuro con tres filas de estado dentro. Sobre el
          negro de la sección un marco oscuro no separaría nada. */}
      <rect
        className="fbx-ben-aparece"
        style={{ "--ret": ret(0.05) } as React.CSSProperties}
        x={PANEL.x}
        y={PANEL.y}
        width={PANEL.w}
        height={PANEL.h}
        rx="14"
        fill={C.acentoOscuro}
        stroke={C.acentoTenue}
        strokeWidth="1.2"
      />
      {[0, 1, 2].map((i) => (
        <g key={i} className="fbx-ben-aparece" style={{ "--ret": ret(0.3 + i * 0.1) } as React.CSSProperties}>
          <circle cx={PANEL.x + 20} cy={PANEL.y + 34 + i * 26} r="5" fill={i === 0 ? C.acentoClaro : C.acentoTenue} opacity={i === 0 ? 1 : 0.5} />
          <rect
            x={PANEL.x + 34}
            y={PANEL.y + 30 + i * 26}
            width={PANEL.w - 52}
            height="8"
            rx="4"
            fill="#FFFFFF"
            opacity={i === 0 ? 0.85 : 0.35}
          />
        </g>
      ))}

      {modulos.map((mod: any, i: number) => {
        const y = y0 + i * (MOD.h + MOD.hueco);
        const centro = y + MOD.h / 2;
        const codo = salida.x + (x - salida.x) / 2;
        return (
          <g key={i}>
            {/* Cable del panel al módulo: sale recto, dobla a media distancia y
                entra horizontal a su altura. */}
            <path
              className="fbx-ben-traza"
              style={{ "--largo": 140, "--ret": ret(0.45 + i * 0.14) } as React.CSSProperties}
              d={`M ${salida.x} ${salida.y} H ${codo} V ${centro} H ${x}`}
              fill="none"
              stroke={C.acentoTenue}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
            <g className="fbx-ben-punto" style={{ "--ret": ret(0.75 + i * 0.14) } as React.CSSProperties}>
              <rect
                x={x}
                y={y}
                width={ancho}
                height={MOD.h}
                rx="9"
                fill={C.panel}
                stroke={C.acentoTenue}
                strokeWidth="1.5"
              />
              <circle cx={x + 15} cy={centro} r="4" fill={C.acentoClaro} />
              <text x={x + MOD.sangriaIzq} y={centro + 4} fill={C.texto} fontSize={cuerpo} fontWeight="600">
                {L(mod, "label", locale)}
              </text>
            </g>
          </g>
        );
      })}
    </Lienzo>
  );
}
