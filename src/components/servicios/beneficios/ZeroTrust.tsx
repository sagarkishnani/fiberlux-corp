import { C, Escena, L, ret, u, type PropsIlustracion } from "./base";

/**
 * Plantilla "Capas Zero Trust" (SPEC 107, canvas 8f).
 *
 * Anillos concéntricos que respiran alrededor de un núcleo validado: cada capa
 * es una verificación más, y el movimiento —lento, desfasado, uno de los anillos
 * girando apenas— dice que la comprobación no se detiene.
 *
 * `datos.nodos` nombra las capas en el pie (se unen con " · ").
 */

/** Lado del anillo exterior y cuánto encoge cada capa, en unidades del lienzo. */
const EXTERIOR = 142;
const PASO = 40;
const CAPAS = 3;
/** Centro del grupo de anillos: por encima del pie. */
const CENTRO_Y = 80;

const POR_DEFECTO = {
  es: ["Identidad", "Dispositivo", "Red"],
  en: ["Identity", "Device", "Network"],
};

export default function ZeroTrust({ datos, activo, locale }: PropsIlustracion) {
  const nodos = (datos?.nodos ?? []).filter(Boolean);
  const pie = nodos.length
    ? nodos.map((n: any) => L(n, "label", locale)).filter(Boolean).join(" · ")
    : (locale === "en" ? POR_DEFECTO.en : POR_DEFECTO.es).join(" · ");

  return (
    <Escena activo={activo}>
      {Array.from({ length: CAPAS }, (_, i) => {
        const lado = EXTERIOR - i * PASO;
        /* La capa del medio va punteada y girando muy despacio: es lo que hace
           que el conjunto se lea como capas y no como una diana. */
        const rota = i === 1;
        return (
          <div
            key={i}
            className={rota ? "fbx-ben-gira" : "fbx-ben-anillo"}
            style={
              {
                position: "absolute",
                top: u(CENTRO_Y - lado / 2),
                left: "50%",
                marginLeft: u(-lado / 2),
                width: u(lado),
                height: u(lado),
                borderRadius: "50%",
                border: `1px ${rota ? "dashed" : "solid"} rgba(226,98,196,${(0.3 + i * 0.16).toFixed(2)})`,
                background: `radial-gradient(circle, rgba(226,98,196,${(0.04 + i * 0.035).toFixed(3)}), transparent 70%)`,
                opacity: rota ? 0.75 : undefined,
                "--ciclo": rota ? "46s" : `${11 - i * 2}s`,
                "--ret": ret(i * 0.7),
              } as React.CSSProperties
            }
          />
        );
      })}

      {/* Núcleo: lo único que llega al centro es lo que ya pasó las tres capas. */}
      <div
        style={{
          position: "absolute",
          top: u(CENTRO_Y - 19),
          left: "50%",
          marginLeft: u(-19),
          width: u(38),
          height: u(38),
          borderRadius: u(13),
          background: `linear-gradient(150deg, ${C.acentoVivo}, ${C.acentoOscuro})`,
          boxShadow: "0 10px 26px rgba(226,98,196,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg viewBox="0 0 24 24" width={u(18)} height={u(18)} fill="none">
          <path
            d="M6 12.5l4 4 8-9"
            stroke={C.fondo}
            strokeWidth="2"
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
        {pie}
      </div>
    </Escena>
  );
}
