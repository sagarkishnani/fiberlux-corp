import { useEffect, useState } from "react";
import { FaWhatsapp, FaXmark } from "react-icons/fa6";

/**
 * Botón flotante de WhatsApp. El número y los textos se editan en Tina
 * (`global.whatsapp`); `BaseLayout` resuelve qué burbuja toca según la página.
 *
 * El botón late siempre —dos anillos desfasados medio ciclo— y, si la página
 * tiene mensaje, una burbuja asoma sola a los `delayMs` y se cierra con la ✕.
 */
interface WhatsAppButtonProps {
  /** Phone in international format, digits only (e.g. "51986176790"). */
  phone?: string;
  /** Prefilled message. Falls back to the default RUC message. */
  message?: string;
  /** Mensaje de la burbuja flotante según la página (home/contacto/solución).
   *  Vacío ⇒ no se muestra burbuja. Editable en Tina (global.whatsapp.bubble). */
  bubbleMessage?: string;
  /** Identidad del mensaje para la memoria de sesión (home/contacto/solucion). */
  bubbleKey?: string;
  /** Retraso hasta que asoma la burbuja, en milisegundos. */
  delayMs?: number;
}

const DEFAULT_PHONE = "51986176790";
const DEFAULT_MESSAGE =
  "¡Hola Fiberlux! Quiero iniciar la Transformación Digital de mi empresa. 🛜 Mi número de RUC es:";

/* La burbuja se anima con su propia fase y desmonta en `animationend`: así la
   salida se ve completa antes de que el nodo desaparezca. */
type Fase = "oculta" | "entra" | "visible" | "sale";

/* Respaldo del `animationend`: con `prefers-reduced-motion` las animaciones
   valen `none` y el evento no llega nunca. Sin esto la burbuja se quedaría
   colgada en su fase de salida. */
const RESPALDO_MS = 400;

/* Memoria de sesión: qué mensajes ya se mostraron y cuántas veces asomó en esta
   visita. Es de sesión y no permanente porque la burbuja es una invitación de
   visita, no una preferencia del usuario. El `:v1` permite cambiar la forma del
   registro sin arrastrar lo viejo. */
const CLAVE_MEMORIA = "fbx:wa-burbuja:v1";

/* Tope por sesión. Sin él, recorrer el catálogo de soluciones dispararía una
   burbuja por página y el efecto se volvería una plaga. */
const TOPE_APARICIONES = 3;

interface Memoria {
  vistas: string[];
  total: number;
}

/* Todo el acceso va en `try/catch`: en modo privado `sessionStorage` puede
   lanzar. Sin memoria la burbuja asoma siempre, pero nunca deja de funcionar. */
function leerMemoria(): Memoria {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_MEMORIA);
    if (!crudo) return { vistas: [], total: 0 };
    const d = JSON.parse(crudo);
    return {
      vistas: Array.isArray(d?.vistas) ? d.vistas : [],
      total: typeof d?.total === "number" ? d.total : 0,
    };
  } catch {
    return { vistas: [], total: 0 };
  }
}

function guardarMemoria(m: Memoria) {
  try {
    window.sessionStorage.setItem(CLAVE_MEMORIA, JSON.stringify(m));
  } catch {
    /* sin memoria, la burbuja vuelve a asomar en la siguiente carga */
  }
}

function siguienteFase(f: Fase): Fase {
  if (f === "entra") return "visible";
  if (f === "sale") return "oculta";
  return f;
}

export default function WhatsAppButton({
  phone = DEFAULT_PHONE,
  message = DEFAULT_MESSAGE,
  bubbleMessage,
  bubbleKey = "global",
  delayMs = 7000,
}: WhatsAppButtonProps) {
  const digits = (phone || DEFAULT_PHONE).replace(/\D/g, "");
  const href = `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`;

  const [fase, setFase] = useState<Fase>("oculta");

  const gancho = (bubbleMessage || "").trim();

  useEffect(() => {
    if (!gancho) return;
    const memoria = leerMemoria();
    /* Este mensaje ya se enseñó, o esta visita ya vio suficientes. */
    if (memoria.vistas.includes(bubbleKey) || memoria.total >= TOPE_APARICIONES) return;

    const id = window.setTimeout(() => {
      /* El total cuenta apariciones, así que sube aquí. La clave se apunta al
         cerrarla o al usarla: un mensaje que el visitante ignoró todavía no
         está gastado. */
      const actual = leerMemoria();
      guardarMemoria({ ...actual, total: actual.total + 1 });
      setFase("entra");
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [gancho, bubbleKey, delayMs]);

  /* Cierra la burbuja y da el mensaje por gastado. */
  const cerrar = () => {
    const memoria = leerMemoria();
    if (!memoria.vistas.includes(bubbleKey)) {
      guardarMemoria({ ...memoria, vistas: [...memoria.vistas, bubbleKey] });
    }
    setFase("sale");
  };

  useEffect(() => {
    if (fase !== "entra" && fase !== "sale") return;
    const id = window.setTimeout(() => setFase(siguienteFase), RESPALDO_MS);
    return () => window.clearTimeout(id);
  }, [fase]);

  const claseFase = fase === "entra" ? "wa-bubble--in" : fase === "sale" ? "wa-bubble--out" : "";

  return (
    <div className="wa-fab-wrap">
      {/* Dos anillos desfasados medio ciclo. Van detrás del botón y fuera del
          árbol de accesibilidad: son decoración, no información. */}
      <span aria-hidden="true" className="wa-pulse" />
      <span aria-hidden="true" className="wa-pulse wa-pulse--delay" />

      {gancho && fase !== "oculta" && (
        /* `role="status"` y no `dialog`: la burbuja se anuncia una vez y no roba
           el foco a quien está leyendo la página. */
        <div
          role="status"
          onAnimationEnd={() => setFase(siguienteFase)}
          className={`wa-bubble ${claseFase}`}
        >
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="wa-bubble__text"
            onClick={cerrar}
          >
            {gancho}
          </a>

          {/* La cola se pinta después de la tarjeta y del mismo color: donde se
              solapan no se nota, y apunta al centro del botón. */}
          <span aria-hidden="true" className="wa-bubble__tail" />

          <button
            type="button"
            className="wa-bubble__close"
            onClick={cerrar}
            aria-label="Cerrar mensaje"
          >
            <FaXmark aria-hidden="true" />
          </button>
        </div>
      )}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contáctanos por WhatsApp"
        className="wa-fab"
      >
        <FaWhatsapp aria-hidden="true" />
      </a>

      <style>{`
        /* El envoltorio mide lo que el botón: la burbuja cuelga de él en
           absoluto para que la cola caiga siempre sobre el mismo punto. */
        .wa-fab-wrap {
          position: fixed;
          right: clamp(16px, 3vw, 28px);
          bottom: clamp(16px, 3vw, 28px);
          z-index: 60;
          width: 56px;
          height: 56px;
        }

        /* ── Pulso ── */
        .wa-pulse {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: #25D366;
          pointer-events: none;
          animation: wa-pulse 2400ms cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .wa-pulse--delay { animation-delay: 1200ms; }

        @keyframes wa-pulse {
          0%   { opacity: 0.45; transform: scale(1); }
          70%  { opacity: 0; transform: scale(1.9); }
          100% { opacity: 0; transform: scale(1.9); }
        }

        /* ── Burbuja ── */
        .wa-bubble {
          position: absolute;
          bottom: 100%;
          right: 0;
          margin-bottom: 16px;
          width: 17rem;
          max-width: calc(100vw - 3rem);
          transform-origin: bottom right;
        }
        .wa-bubble__text {
          display: block;
          border-radius: 16px;
          background: #ffffff;
          padding: 16px 40px 16px 20px;
          text-align: left;
          font-size: 14px;
          line-height: 20px;
          font-weight: 500;
          color: #0a0a0a;
          text-decoration: none;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
          transition: background-color 0.2s ease;
        }
        .wa-bubble__text:hover { background: #F7EDF4; }
        .wa-bubble__tail {
          position: absolute;
          right: 20px;
          bottom: -4px;
          width: 16px;
          height: 16px;
          border-radius: 2px;
          background: #ffffff;
          transform: rotate(45deg);
        }
        .wa-bubble__close {
          position: absolute;
          top: 4px;
          right: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 9999px;
          background: transparent;
          color: #717274;
          font-size: 14px;
          line-height: 1;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .wa-bubble__close:hover { color: #0a0a0a; }

        /* La burbuja nace del botón, así que crece desde su esquina inferior
           derecha. "forwards" en las dos: el fotograma final es el estado real
           de cada fase. */
        .wa-bubble--in {
          animation: wa-bubble-in 260ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .wa-bubble--out {
          animation: wa-bubble-out 180ms cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        @keyframes wa-bubble-in {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wa-bubble-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(8px) scale(0.96); }
        }

        /* ── FAB ── */
        .wa-fab {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 9999px;
          background: #25D366;
          color: #fff;
          font-size: 28px;
          box-shadow: 0 8px 24px rgba(37, 211, 102, 0.45);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .wa-fab:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 30px rgba(37, 211, 102, 0.55);
        }
        .wa-fab:focus-visible {
          outline: 3px solid rgba(37, 211, 102, 0.4);
          outline-offset: 2px;
        }

        /* Movimiento reducido pide menos movimiento, no menos contenido: los
           anillos se van del todo, pero la burbuja sigue asomando —sin
           transición— porque lo que dice es contenido. El componente desmonta
           con un temporizador de respaldo, así que apagar la animación de
           salida no la deja colgada. */
        @media (prefers-reduced-motion: reduce) {
          .wa-pulse { display: none; }
          .wa-bubble--in,
          .wa-bubble--out { animation: none; }
          .wa-fab { transition: none; }
          .wa-fab:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}
