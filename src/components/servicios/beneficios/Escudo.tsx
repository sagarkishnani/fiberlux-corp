import { C, Escena, L, u, type PropsIlustracion } from "./base";

/**
 * Plantilla "Escudo" (SPEC 18, reescrita en el SPEC 107 sobre el canvas 8d).
 *
 * El perímetro se traza solo, se cierra y valida con un visto; detrás, un halo
 * respira. Cuenta protección y verificación continua: no es un escudo quieto,
 * es uno que se comprueba una y otra vez.
 *
 * `datos.etiqueta` cambia el pie; sin ella, el de reserva en el idioma activo.
 */

/** Silueta y visto, en el sistema de coordenadas propio del escudo (200×200). */
const SILUETA = "M100 22 34 48v52c0 40 27 74 66 88 39-14 66-48 66-88V48L100 22Z";
const VISTO = "M72 100l20 21 38-40";

/** Lado del escudo en unidades del lienzo (320×180). */
const LADO = 130;

const POR_DEFECTO = { es: "Perímetro verificado", en: "Perimeter verified" };

export default function Escudo({ datos, activo, locale }: PropsIlustracion) {
  const etiqueta =
    L(datos, "etiqueta", locale) || (locale === "en" ? POR_DEFECTO.en : POR_DEFECTO.es);

  return (
    <Escena activo={activo}>
      {/* Halo: nace detrás del escudo y respira muy despacio. */}
      <div
        className="fbx-ben-pulso"
        style={
          {
            position: "absolute",
            top: u(2),
            left: "50%",
            marginLeft: u(-85),
            width: u(170),
            height: u(170),
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(226,98,196,0.16), transparent 68%)",
            pointerEvents: "none",
            "--ciclo": "9s",
          } as React.CSSProperties
        }
      />

      <svg
        viewBox="0 0 200 200"
        width={u(LADO)}
        height={u(LADO)}
        fill="none"
        style={{ position: "absolute", top: u(3), left: "50%", marginLeft: u(-LADO / 2) }}
      >
        {/* Perímetro en reposo: la silueta existe siempre, aunque el trazo vivo
            esté a medio camino. */}
        <path d={SILUETA} stroke={C.tenue} strokeWidth="2.4" strokeLinejoin="round" />
        <path
          className="fbx-ben-dibuja"
          style={{ "--ciclo": "7s" } as React.CSSProperties}
          d={SILUETA}
          stroke={C.acentoVivo}
          strokeWidth="2.4"
          strokeLinejoin="round"
          pathLength={1}
        />
        {/* El visto entra detrás del perímetro: primero se cierra, luego valida. */}
        <path
          className="fbx-ben-dibuja"
          style={{ "--ciclo": "7s", "--ret": "1.4s" } as React.CSSProperties}
          d={VISTO}
          stroke={C.acentoClaro}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          bottom: u(8),
          left: "50%",
          transform: "translateX(-50%)",
          display: "inline-flex",
          alignItems: "center",
          gap: u(7),
          maxWidth: "90%",
          padding: `${u(7)} ${u(13)}`,
          borderRadius: u(999),
          background: "rgba(226,98,196,0.10)",
          border: "1px solid rgba(226,98,196,0.28)",
          color: C.acentoVivo,
          fontFamily: "'Space Mono', ui-monospace, monospace",
          fontSize: u(9),
          letterSpacing: "0.12em",
          lineHeight: 1,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <span
          className="fbx-ben-blip"
          style={
            {
              flex: "none",
              width: u(6),
              height: u(6),
              borderRadius: "50%",
              background: C.acentoVivo,
              "--ciclo": "4s",
            } as React.CSSProperties
          }
        />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{etiqueta}</span>
      </div>
    </Escena>
  );
}
