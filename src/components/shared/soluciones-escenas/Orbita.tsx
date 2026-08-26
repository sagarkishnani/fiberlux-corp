import { LuZap } from "react-icons/lu";
import { C, u, ret, EscenaSol, VB, type PropsEscena } from "./base";

/**
 * Escena de Conectividad empresarial (SPEC 108).
 *
 * Anillos concéntricos punteados, el tile magenta con el rayo al centro y un
 * punto que da la vuelta al anillo exterior: la señal que sale del nodo y
 * vuelve. El punto gira sobre un pivote de tamaño cero clavado en el centro,
 * que es la forma barata de una órbita: rotar el pivote mueve al hijo en
 * círculo sin recalcular nada por frame.
 */

const CX = VB.w / 2;
const CY = VB.h / 2;
const R_EXT = 128;
const R_INT = 76;

export default function Orbita({ activo }: PropsEscena) {
  return (
    <EscenaSol activo={activo}>
      {/* Halo del centro. */}
      <div
        className="fbx-sol-anim-respira absolute rounded-full"
        style={{
          left: u(CX - 90),
          top: u(CY - 90),
          width: u(180),
          height: u(180),
          background: `radial-gradient(circle, ${C.acentoRelleno} 0%, rgba(150,35,122,0.05) 45%, transparent 70%)`,
          ["--ciclo" as string]: "6s",
        }}
      />

      {/* Anillos punteados. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <circle
          cx={CX}
          cy={CY}
          r={R_EXT}
          fill="none"
          stroke={C.tenue}
          strokeWidth="1"
          strokeDasharray="1.5 7"
          strokeLinecap="round"
        />
        <circle
          cx={CX}
          cy={CY}
          r={R_INT}
          fill="none"
          stroke={C.acentoTenue}
          strokeWidth="1"
          strokeDasharray="1.5 7"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>

      {/* Anillo que se expande desde el centro, en dos tiempos. */}
      {[0, 2.5].map((r) => (
        <div
          key={r}
          className="fbx-sol-anim-anillo absolute rounded-full"
          style={{
            left: u(CX - R_INT),
            top: u(CY - R_INT),
            width: u(R_INT * 2),
            height: u(R_INT * 2),
            border: `1px solid ${C.acentoTenue}`,
            ["--ciclo" as string]: "5s",
            ["--ret" as string]: ret(r),
          }}
        />
      ))}

      {/* Tile del centro. */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: u(CX - 32),
          top: u(CY - 32),
          width: u(64),
          height: u(64),
          borderRadius: u(18),
          background: `linear-gradient(150deg, ${C.acentoVivo} 0%, ${C.acento} 55%, ${C.acentoOscuro} 100%)`,
          boxShadow: `0 0 ${u(46)} rgba(198,95,172,0.45)`,
        }}
      >
        <LuZap
          color="#fff"
          style={{ width: u(28), height: u(28) }}
          strokeWidth={2.2}
        />
      </div>

      {/* Pivote en el centro: al girar, arrastra al punto por el anillo. */}
      <div
        className="fbx-sol-anim-orbita absolute"
        style={{
          left: u(CX),
          top: u(CY),
          width: 0,
          height: 0,
          ["--ciclo" as string]: "14s",
        }}
      >
        <div
          className="absolute"
          style={{
            left: u(R_EXT - 7),
            top: u(-7),
            width: u(14),
            height: u(14),
            borderRadius: u(5),
            background: C.acentoVivo,
            boxShadow: `0 0 ${u(16)} rgba(226,98,196,0.75)`,
          }}
        />
      </div>
    </EscenaSol>
  );
}
