import { C, Escena, L, ret, u, useTurno, type PropsIlustracion } from "./base";

/**
 * Plantilla "Conmutación" (SPEC 105, reescrita en el SPEC 107 sobre el canvas 8h).
 *
 * Dos extremos y varias rutas entre ellos: la activa va dibujada y a plena luz,
 * las demás quedan en su guía punteada. En bucle la activa cambia, que es
 * exactamente lo que hace el servicio —el tráfico pasa al enlace alterno sin
 * cortes—, así que el movimiento cuenta algo en vez de adornar.
 *
 * Las rutas salen de `datos.rutas` (hasta cuatro); `activa` marca por cuál
 * empieza el ciclo.
 */

/** Cada cuánto conmuta de ruta, en ms. */
const CONMUTA_MS = 3600;

const RESERVA = [
  { label: "PRINCIPAL", activa: true },
  { label: "RESPALDO" },
];

/** Lado de los dos extremos y su margen, en unidades del lienzo (320×180). */
const NODO = 34;
const MARGEN = 14;
/** De dónde a dónde va cada curva: los bordes interiores de los extremos. */
const X_A = MARGEN + NODO;
const X_B = 320 - MARGEN - NODO;
const EJE = 90;
/** Cuánto se comba la ruta más alta y la más baja. */
const COMBA = 62;

export default function Conmutacion({ datos, activo, locale }: PropsIlustracion) {
  const rutas = ((datos?.rutas ?? []).filter(Boolean).length ? datos.rutas : RESERVA)
    .filter(Boolean)
    .slice(0, 4);

  /* Ninguna marcada: manda la primera. El dibujo pierde su sentido si no hay
     exactamente una ruta encendida. */
  const inicial = Math.max(0, rutas.findIndex((r: any) => r?.activa));
  const turno = useTurno(rutas.length, activo, CONMUTA_MS);
  const activaIdx = (inicial + turno) % rutas.length;

  /* Las rutas se reparten simétricamente arriba y abajo del eje: con dos quedan
     una arriba y otra abajo; con tres, la del medio recta. */
  const curvas = rutas.map((_: any, i: number) => {
    const t = rutas.length === 1 ? 0 : (i / (rutas.length - 1)) * 2 - 1;
    const dy = t * COMBA;
    return {
      d: `M ${X_A} ${EJE} C ${X_A + 54} ${EJE + dy}, ${X_B - 54} ${EJE + dy}, ${X_B} ${EJE}`,
      /* Cintura de la curva: con los dos controles a la misma altura, el punto
         medio de una cúbica cae a tres cuartos del desvío. Ahí va su píldora. */
      cintura: EJE + dy * 0.75,
    };
  });

  const extremo = (lado: "izq" | "der", icono: React.ReactNode) => (
    <div
      style={{
        position: "absolute",
        top: u(EJE - NODO / 2),
        ...(lado === "izq" ? { left: u(MARGEN) } : { right: u(MARGEN) }),
        width: u(NODO),
        height: u(NODO),
        borderRadius: u(11),
        background: C.escenaActiva,
        border: `1px solid ${C.acentoTenue}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icono}
    </div>
  );

  return (
    <Escena activo={activo}>
      <svg
        viewBox="0 0 320 180"
        width="100%"
        height="100%"
        fill="none"
        style={{ position: "absolute", inset: 0 }}
      >
        {curvas.map((curva: { d: string; cintura: number }, i: number) => (
          <g key={i}>
            <path d={curva.d} stroke={C.tenue} strokeWidth="1.6" strokeDasharray="6 6" />
            {/* La ruta activa se dibuja y las demás se repliegan. `stroke-dashoffset`
                sí transiciona (a diferencia de `stroke-dasharray`), así que la
                conmutación se ve recorrer la curva en lugar de saltar. */}
            <path
              d={curva.d}
              stroke={C.acentoVivo}
              strokeWidth="2.2"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              style={{
                strokeDashoffset: i === activaIdx ? 0 : 1,
                opacity: i === activaIdx ? 1 : 0.25,
                transition: `stroke-dashoffset 1.4s ease ${i === activaIdx ? "0.2s" : "0s"}, opacity 1.4s ease`,
              }}
            />
          </g>
        ))}
      </svg>

      {extremo(
        "izq",
        <svg viewBox="0 0 24 24" width={u(16)} height={u(16)} fill="none">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
      {extremo(
        "der",
        <svg viewBox="0 0 24 24" width={u(16)} height={u(16)} fill="none">
          <path
            d="M5 12.5l4.5 4.5L19 7"
            stroke={C.acentoVivo}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Píldora de cada ruta, en la cintura de su curva. */}
      {rutas.map((ruta: any, i: number) => {
        const on = i === activaIdx;
        return (
          <span
            key={i}
            style={
              {
                position: "absolute",
                top: u(curvas[i].cintura - 11),
                left: "50%",
                transform: "translateX(-50%)",
                maxWidth: "58%",
                padding: `${u(6)} ${u(12)}`,
                borderRadius: u(999),
                fontFamily: "'Space Mono', ui-monospace, monospace",
                fontSize: u(9),
                letterSpacing: "0.1em",
                lineHeight: 1,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                background: on ? "rgba(226,98,196,0.14)" : C.escena,
                border: `1px solid ${on ? "rgba(226,98,196,0.42)" : C.escenaBorde}`,
                color: on ? C.acentoVivo : C.escenaApagado,
                transition: "all .9s ease",
                "--ret": ret(i * 0.1),
              } as React.CSSProperties
            }
          >
            {L(ruta, "label", locale)}
          </span>
        );
      })}
    </Escena>
  );
}
