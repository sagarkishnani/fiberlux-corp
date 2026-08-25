import { C, Escena, L, ret, u, type PropsIlustracion } from "./base";

/**
 * Plantilla "Túnel cifrado" (SPEC 107, canvas 8e).
 *
 * Varios carriles entre dos extremos y paquetes que los cruzan; en el medio, el
 * candado. El carril del centro va encendido y los de fuera quedan punteados:
 * lo que se cuenta es que el tráfico viaja por un canal propio y cerrado.
 *
 * `datos.hilos` (3–5) decide cuántos carriles hay y `datos.etiqueta` el pie.
 */

const MIN = 3;
const MAX = 5;
const RESERVA_CARRILES = 3;

/** Alto del bloque de carriles y margen lateral, en unidades del lienzo. */
const ALTO = 108;
const MARGEN = 30;

const POR_DEFECTO = { es: "AES-256 · extremo a extremo", en: "AES-256 · end to end" };

export default function Tunel({ datos, activo, locale }: PropsIlustracion) {
  const pedidos = Number(datos?.hilos);
  const carriles = Number.isFinite(pedidos)
    ? Math.min(MAX, Math.max(MIN, Math.round(pedidos)))
    : RESERVA_CARRILES;

  const etiqueta =
    L(datos, "etiqueta", locale) || (locale === "en" ? POR_DEFECTO.en : POR_DEFECTO.es);
  /* El carril del medio es el que va encendido: con un número par no hay medio
     exacto, así que se toma el de arriba. */
  const centro = Math.floor((carriles - 1) / 2);

  return (
    <Escena activo={activo}>
      <div
        style={{
          position: "absolute",
          top: u(90 - ALTO / 2),
          left: u(MARGEN),
          right: u(MARGEN),
          height: u(ALTO),
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {Array.from({ length: carriles }, (_, i) => {
          const vivo = i === centro;
          return (
            <div key={i} style={{ position: "relative", height: u(10) }}>
              {/* Carril: el encendido es una línea continua que se degrada; los
                  demás, una guía a trazos. */}
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "50%",
                  height: u(2),
                  marginTop: u(-1),
                  borderRadius: u(1),
                  background: vivo
                    ? `linear-gradient(90deg, ${C.acentoOscuro}, rgba(226,98,196,0.55))`
                    : `repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0 ${u(7)}, transparent ${u(7)} ${u(14)})`,
                }}
              />
              {/* Paquete que cruza el carril, desfasado en cada uno. */}
              <span
                className="fbx-ben-paquete"
                style={
                  {
                    position: "absolute",
                    top: "50%",
                    marginTop: u(-3),
                    width: u(26),
                    height: u(6),
                    borderRadius: u(3),
                    background: `linear-gradient(90deg, transparent, ${C.acentoVivo})`,
                    opacity: 0.8,
                    "--ciclo": "6s",
                    "--ret": ret(i * 0.9),
                  } as React.CSSProperties
                }
              />
              {/* Los dos extremos del carril. */}
              {(["izq", "der"] as const).map((lado) => (
                <span
                  key={lado}
                  style={{
                    position: "absolute",
                    ...(lado === "izq" ? { left: u(-4) } : { right: u(-4) }),
                    top: "50%",
                    marginTop: u(-4.5),
                    width: u(9),
                    height: u(9),
                    borderRadius: "50%",
                    background: vivo ? C.acentoVivo : "#4c444a",
                    boxShadow: vivo ? "0 0 9px rgba(226,98,196,0.6)" : "none",
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Candado: la razón por la que el canal es un túnel y no un cable. */}
      <div
        className="fbx-ben-flota"
        style={
          {
            position: "absolute",
            top: u(90 - 19),
            left: "50%",
            marginLeft: u(-19),
            width: u(38),
            height: u(38),
            borderRadius: u(12),
            background: `linear-gradient(150deg, ${C.acentoVivo}, ${C.acentoOscuro})`,
            boxShadow: "0 9px 24px rgba(226,98,196,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "--ciclo": "10s",
            "--dy": u(4),
          } as React.CSSProperties
        }
      >
        <svg viewBox="0 0 24 24" width={u(17)} height={u(17)} fill="none">
          <path
            d="M7 10.5V8a5 5 0 0 1 10 0v2.5M5.6 10.5h12.8v9H5.6v-9Z"
            stroke={C.fondo}
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: u(6),
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "'Space Mono', ui-monospace, monospace",
          fontSize: u(9),
          letterSpacing: "0.14em",
          lineHeight: 1,
          textTransform: "uppercase",
          color: C.escenaApagado,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {etiqueta}
      </div>
    </Escena>
  );
}
