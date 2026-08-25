import { C, Escena, L, ret, u, type PropsIlustracion } from "./base";

/**
 * Plantilla "Consola / Panel en vivo" (SPEC 18, reescrita en el SPEC 107 sobre
 * el canvas 8c).
 *
 * El panel desde el que se gobierna el servicio: una cabecera con su indicador
 * en vivo y las filas de lo que se administra, cada una con su estado latiendo y
 * un barrido de luz que las recorre. Cuenta administración centralizada y
 * acompañamiento sin afirmar ninguna cifra.
 *
 * Lee `datos.nodos` (las mismas etiquetas que usa Sedes) para nombrar cada fila,
 * `datos.etiqueta` para la cabecera y `datos.valor` + `datos.unidad` para la
 * píldora, que sin cifra se queda en un simple "en vivo".
 */

const RESERVA = [{ label: "Red" }, { label: "Usuarios" }, { label: "Reportes" }];

/** Textos de reserva, en los dos idiomas del sitio (SPEC 80). */
const POR_DEFECTO = {
  es: { titulo: "Gestión centralizada", vivo: "EN VIVO" },
  en: { titulo: "Centralized management", vivo: "LIVE" },
};

export default function Consola({ datos, activo, locale }: PropsIlustracion) {
  const filas = ((datos?.nodos ?? []).filter(Boolean).length ? datos.nodos : RESERVA)
    .filter(Boolean)
    .slice(0, 3);

  const textos = locale === "en" ? POR_DEFECTO.en : POR_DEFECTO.es;
  const titulo = L(datos, "etiqueta", locale) || textos.titulo;
  const cifra = [datos?.valor, L(datos, "unidad", locale)].filter(Boolean).join(" ");

  const mono = {
    fontFamily: "'Space Mono', ui-monospace, monospace",
    letterSpacing: "0.1em",
    lineHeight: 1,
  } as const;

  return (
    <Escena activo={activo}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Cabecera: qué se está mirando y que se está mirando AHORA. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: u(10),
            marginBottom: u(11),
          }}
        >
          <span
            style={{
              fontSize: u(12.5),
              fontWeight: 600,
              lineHeight: 1,
              color: "#fff",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {titulo}
          </span>
          <span
            style={{
              flex: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: u(6),
              padding: `${u(5)} ${u(10)}`,
              borderRadius: u(999),
              background: "rgba(226,98,196,0.10)",
              border: "1px solid rgba(226,98,196,0.28)",
              color: C.acentoVivo,
              fontSize: u(9),
              ...mono,
            }}
          >
            <span
              className="fbx-ben-blip"
              style={
                {
                  width: u(6),
                  height: u(6),
                  borderRadius: "50%",
                  background: C.acentoVivo,
                  "--ciclo": "3.4s",
                } as React.CSSProperties
              }
            />
            {cifra || textos.vivo}
          </span>
        </div>

        {/* Filas de estado. */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: u(8),
          }}
        >
          {filas.map((fila: any, i: number) => (
            <div
              key={i}
              style={{
                position: "relative",
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: u(10),
                padding: `0 ${u(14)}`,
                borderRadius: u(12),
                overflow: "hidden",
                boxSizing: "border-box",
                background: C.escena,
                border: `1px solid ${C.escenaBorde}`,
              }}
            >
              <span
                style={{
                  minWidth: 0,
                  fontSize: u(12),
                  fontWeight: 500,
                  color: "#ede7ea",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {L(fila, "label", locale)}
              </span>
              <span
                style={{
                  flex: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: u(20),
                  height: u(20),
                  borderRadius: "50%",
                  background: "rgba(226,98,196,0.10)",
                  border: "1px solid rgba(226,98,196,0.26)",
                }}
              >
                <span
                  className="fbx-ben-blip"
                  style={
                    {
                      width: u(6),
                      height: u(6),
                      borderRadius: "50%",
                      background: C.acentoVivo,
                      "--ciclo": "3.6s",
                      "--ret": ret(i * 0.6),
                    } as React.CSSProperties
                  }
                />
              </span>
              {/* Barrido: la luz que recorre la fila. Va desfasado por fila para
                  que el panel no parpadee entero a la vez. */}
              <span
                className="fbx-ben-barrido"
                style={
                  {
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: u(70),
                    pointerEvents: "none",
                    background:
                      "linear-gradient(90deg, transparent, rgba(226,98,196,0.10), transparent)",
                    "--ciclo": "7s",
                    "--ret": ret(i * 1.1),
                  } as React.CSSProperties
                }
              />
            </div>
          ))}
        </div>
      </div>
    </Escena>
  );
}
