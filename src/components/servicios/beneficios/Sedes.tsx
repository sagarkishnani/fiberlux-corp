import { C, Escena, L, ret, u, type PropsIlustracion } from "./base";

/**
 * Plantilla "Sedes / Flujo conectado" (SPEC 107, canvas 8a).
 *
 * Un hub central y los nodos que confluyen en él, cada uno con su etiqueta y su
 * cable. La ruta se dibuja en bucle sobre una guía punteada: lo que se cuenta es
 * que todo pasa por un mismo sitio, no un dibujo quieto de una red.
 *
 * Los nodos salen de `datos.nodos` (hasta cuatro). El primero es el que va
 * encendido; los demás quedan en gris, que es lo que da jerarquía al hub.
 *
 * Escena HTML: las etiquetas las escribe el editor y en SVG habría que medir
 * cada cadena para dimensionar su caja. Aquí el chip se ajusta solo y su fondo
 * OPACO tapa el final del cable, así que el cable puede llegar hasta debajo del
 * chip sin saber cuánto mide.
 */

const RESERVA = [{ label: "Conectividad" }, { label: "Ciberseguridad" }];

/** Hub: lado y borde, en unidades del lienzo (320×180). */
const HUB = 36;
const HUB_IZQ = 160 - HUB / 2;
const HUB_DER = 160 + HUB / 2;

/**
 * Puestos, en el orden en que se ocupan. Con dos nodos quedan en diagonal; con
 * tres, dos por la izquierda y uno por la derecha; con cuatro, uno por esquina.
 * `y` es la altura por la que el cable entra al chip.
 */
const PUESTOS = [
  { lado: "izq", y: 28 },
  { lado: "der", y: 152 },
  { lado: "izq", y: 152 },
  { lado: "der", y: 28 },
] as const;

/** Cable del hub al chip: sale recto, dobla a media distancia y entra por debajo. */
function cable(lado: "izq" | "der", y: number) {
  return lado === "izq"
    ? `M ${HUB_IZQ} 90 H 84 V ${y} H 20`
    : `M ${HUB_DER} 90 H 236 V ${y} H 300`;
}

export default function Sedes({ datos, activo, locale }: PropsIlustracion) {
  const nodos = ((datos?.nodos ?? []).filter(Boolean).length ? datos.nodos : RESERVA)
    .filter(Boolean)
    .slice(0, PUESTOS.length);

  return (
    <Escena activo={activo}>
      {/* Cables. Van en un SVG por debajo de los chips: el trazo se dibuja entero
          y son los chips los que le tapan las puntas. */}
      <svg
        viewBox="0 0 320 180"
        width="100%"
        height="100%"
        fill="none"
        style={{ position: "absolute", inset: 0 }}
      >
        {nodos.map((_: any, i: number) => {
          const p = PUESTOS[i];
          const d = cable(p.lado, p.y);
          return (
            <g key={i}>
              {/* Guía punteada: el camino existe aunque no pase nada por él. */}
              <path
                className="fbx-ben-flujo"
                style={
                  {
                    "--ciclo": `${(3.4 + i * 0.6).toFixed(1)}s`,
                    "--flujo": -24,
                  } as React.CSSProperties
                }
                d={d}
                stroke={C.tenue}
                strokeWidth="1.4"
                strokeDasharray="6 6"
              />
              {/* La ruta, trazándose una y otra vez. La del nodo encendido va a
                  plena luz; las demás, a media asta. */}
              <path
                className="fbx-ben-dibuja"
                style={
                  {
                    "--ciclo": "6.4s",
                    "--ret": ret(i * 1.6),
                  } as React.CSSProperties
                }
                d={d}
                stroke={i === 0 ? C.acentoVivo : C.acento}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
              />
            </g>
          );
        })}
      </svg>

      {/* Hub: el único elemento con color de relleno de toda la escena. Se
          posiciona con margen negativo y no con `translate` para dejarle el
          `transform` libre a la flotación. */}
      <div
        className="fbx-ben-flota"
        style={
          {
            position: "absolute",
            top: u(90 - HUB / 2),
            left: "50%",
            marginLeft: u(-HUB / 2),
            width: u(HUB),
            height: u(HUB),
            borderRadius: u(12),
            background: `linear-gradient(150deg, ${C.acentoVivo}, ${C.acentoOscuro})`,
            boxShadow: "0 8px 22px rgba(226,98,196,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "--ciclo": "9s",
            "--dy": u(4),
          } as React.CSSProperties
        }
      >
        <svg viewBox="0 0 24 24" width={u(17)} height={u(17)} fill="none">
          <path
            d="M12 5v4m0 6v4M5 12h4m6 0h4"
            stroke={C.fondo}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Chips con la etiqueta de cada nodo. */}
      {nodos.map((nodo: any, i: number) => {
        const p = PUESTOS[i];
        const encendido = i === 0;
        const arriba = p.y < 90;
        const izquierda = p.lado === "izq";
        return (
          <div
            key={i}
            className={encendido ? "fbx-ben-brilla" : "fbx-ben-flota"}
            style={
              {
                position: "absolute",
                top: arriba ? u(13) : undefined,
                bottom: arriba ? undefined : u(13),
                left: izquierda ? u(12) : undefined,
                right: izquierda ? undefined : u(12),
                maxWidth: "44%",
                display: "flex",
                alignItems: "center",
                gap: u(8),
                padding: `${u(9)} ${u(13)}`,
                borderRadius: u(11),
                background: encendido ? C.escenaActiva : C.escena,
                border: `1px solid ${encendido ? C.acentoTenue : C.escenaBorde}`,
                color: encendido ? "#fff" : C.escenaTexto,
                fontSize: u(11.5),
                fontWeight: 500,
                lineHeight: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                "--ciclo": encendido ? "7s" : `${(10 + i).toFixed(0)}s`,
                "--ret": ret(i * 0.8),
                "--dy": u(arriba ? -4 : 4),
              } as React.CSSProperties
            }
          >
            <span
              className={encendido ? "fbx-ben-blip" : undefined}
              style={{
                flex: "none",
                width: u(8),
                height: u(8),
                borderRadius: "50%",
                background: encendido ? C.acentoVivo : "#5e5259",
                boxShadow: encendido ? "0 0 8px rgba(226,98,196,0.7)" : "none",
              }}
            />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {L(nodo, "label", locale)}
            </span>
          </div>
        );
      })}
    </Escena>
  );
}
