import { C, Escena, L, u, useReducido, useTurno, type PropsIlustracion } from "./base";

/**
 * Plantilla "Bitácora" (SPEC 107, canvas 8g).
 *
 * Los eventos van apareciendo uno a uno mientras un barrido recorre el panel:
 * es el registro de un servicio que está siendo vigilado ahora mismo. No afirma
 * ninguna cifra; lo que cuenta es que hay alguien mirando.
 *
 * Las líneas salen de `datos.filas`: `label` es el evento y `nivel` la etiqueta
 * de la izquierda. La hora es decorativa y va fija —generarla en el navegador
 * daría una marca distinta a la del servidor y React abortaría la hidratación.
 */

/** Cada cuánto entra la línea siguiente, en ms. */
const PASO_MS = 1300;
/** Cuántas líneas se ven ya al empezar el ciclo. */
const VISIBLES_AL_INICIO = 2;

const HORAS = ["09:41", "09:43", "09:44", "09:47", "09:52"];

const RESERVA = {
  es: [
    { nivel: "MFA", label: "Acceso verificado · ERP central" },
    { nivel: "WAF", label: "Solicitud anómala bloqueada" },
    { nivel: "EDR", label: "Endpoint aislado y saneado" },
    { nivel: "ZTNA", label: "Sesión revalidada · sede Lima" },
    { nivel: "SOC", label: "Sin incidentes abiertos" },
  ],
  en: [
    { nivel: "MFA", label: "Access verified · core ERP" },
    { nivel: "WAF", label: "Anomalous request blocked" },
    { nivel: "EDR", label: "Endpoint isolated and cleaned" },
    { nivel: "ZTNA", label: "Session revalidated · Lima site" },
    { nivel: "SOC", label: "No open incidents" },
  ],
};

export default function Bitacora({ datos, activo, locale }: PropsIlustracion) {
  const propias = (datos?.filas ?? []).filter(Boolean);
  const lineas = (propias.length ? propias : RESERVA[locale === "en" ? "en" : "es"]).slice(0, 5);

  const reducido = useReducido();
  const turno = useTurno(lineas.length, activo, PASO_MS);
  /* Sin movimiento —o antes de que la card entre en pantalla— la bitácora se
     pinta entera: un panel vacío no es un estado de reposo válido. */
  const visibles =
    !activo || reducido ? lineas.length : Math.min(lineas.length, VISIBLES_AL_INICIO + turno);

  const mono = {
    fontFamily: "'Space Mono', ui-monospace, monospace",
    lineHeight: 1,
  } as const;

  return (
    <Escena activo={activo}>
      {/* Barrido: la banda de luz que recorre el panel de arriba abajo. */}
      <span
        className="fbx-ben-barrido-y"
        style={
          {
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: u(66),
            pointerEvents: "none",
            background:
              "linear-gradient(180deg, transparent, rgba(226,98,196,0.06), transparent)",
            "--ciclo": "9s",
          } as React.CSSProperties
        }
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: u(10),
        }}
      >
        {lineas.map((linea: any, i: number) => {
          const on = i < visibles;
          return (
            <div
              key={i}
              className="fbx-ben-suave"
              style={{
                display: "flex",
                alignItems: "center",
                gap: u(9),
                opacity: on ? 1 : 0,
                transform: on ? "none" : `translateY(${u(8)})`,
              }}
            >
              <span style={{ flex: "none", fontSize: u(9), color: "#6e6469", ...mono }}>
                {HORAS[i % HORAS.length]}
              </span>
              {linea?.nivel && (
                <span
                  style={{
                    flex: "none",
                    padding: `${u(4)} ${u(8)}`,
                    borderRadius: u(6),
                    background: "rgba(226,98,196,0.10)",
                    border: "1px solid rgba(226,98,196,0.22)",
                    color: C.acentoVivo,
                    fontSize: u(8.5),
                    letterSpacing: "0.08em",
                    ...mono,
                  }}
                >
                  {linea.nivel}
                </span>
              )}
              <span
                style={{
                  minWidth: 0,
                  fontSize: u(11),
                  color: C.escenaTexto,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {L(linea, "label", locale)}
              </span>
            </div>
          );
        })}
      </div>
    </Escena>
  );
}
