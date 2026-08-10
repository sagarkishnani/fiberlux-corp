import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";

interface WhatsAppButtonProps {
  /** Phone in international format, digits only (e.g. "51986176790"). */
  phone?: string;
  /** Prefilled message. Falls back to the default RUC message. */
  message?: string;
  /** Mensaje de la burbuja flotante según la página (home/contacto/solución).
   *  Vacío ⇒ no se muestra burbuja. Editable en Tina (global.whatsapp.bubble). */
  bubbleMessage?: string;
}

const DEFAULT_PHONE = "51986176790";
const DEFAULT_MESSAGE =
  "¡Hola Fiberlux! Quiero iniciar la Transformación Digital de mi empresa. 🛜 Mi número de RUC es:";

// Una vez cerrada, la burbuja no vuelve a aparecer durante la sesión.
const DISMISS_KEY = "fbx:wa-bubble-dismissed";

export default function WhatsAppButton({
  phone = DEFAULT_PHONE,
  message = DEFAULT_MESSAGE,
  bubbleMessage,
}: WhatsAppButtonProps) {
  const digits = (phone || DEFAULT_PHONE).replace(/\D/g, "");
  const href = `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`;

  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    if (!bubbleMessage) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* sessionStorage bloqueado (modo privado): mostramos igual */
    }
    const t = setTimeout(() => setShowBubble(true), 1400);
    return () => clearTimeout(t);
  }, [bubbleMessage]);

  const dismiss = () => {
    setShowBubble(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* noop */
    }
  };

  return (
    <div className="wa-fab-wrap">
      {showBubble && bubbleMessage && (
        <div className="wa-bubble" role="dialog" aria-label="Mensaje de WhatsApp">
          <button className="wa-bubble__close" onClick={dismiss} aria-label="Cerrar mensaje">
            ×
          </button>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="wa-bubble__text"
            onClick={dismiss}
          >
            {bubbleMessage}
          </a>
        </div>
      )}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contáctanos por WhatsApp"
        className={`wa-fab${showBubble ? " wa-fab--attn" : ""}`}
      >
        <FaWhatsapp aria-hidden="true" />
      </a>

      <style>{`
        .wa-fab-wrap {
          position: fixed;
          right: clamp(16px, 3vw, 28px);
          bottom: clamp(16px, 3vw, 28px);
          z-index: 60;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        /* ── Burbuja ── */
        .wa-bubble {
          position: relative;
          max-width: min(72vw, 260px);
          background: #ffffff;
          color: #0a0a0a;
          border-radius: 16px 16px 4px 16px;
          padding: 12px 30px 12px 14px;
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.35);
          transform-origin: bottom right;
          animation: wa-bubble-in 0.42s cubic-bezier(.18,.89,.32,1.28) both;
        }
        .wa-bubble::after {
          content: "";
          position: absolute;
          right: 14px;
          bottom: -7px;
          width: 14px;
          height: 14px;
          background: #ffffff;
          border-radius: 0 0 4px 0;
          transform: rotate(45deg);
          box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.06);
        }
        .wa-bubble__text {
          display: block;
          font-size: 13.5px;
          line-height: 1.4;
          color: #0a0a0a;
          text-decoration: none;
          font-weight: 500;
        }
        .wa-bubble__close {
          position: absolute;
          top: 4px;
          right: 6px;
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          border: none;
          background: transparent;
          color: #8a8a8a;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          border-radius: 50%;
        }
        .wa-bubble__close:hover { color: #0a0a0a; background: rgba(0,0,0,0.06); }

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
          font-size: 30px;
          box-shadow: 0 8px 24px rgba(37, 211, 102, 0.45);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .wa-fab:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 12px 30px rgba(37, 211, 102, 0.55);
        }
        .wa-fab:focus-visible {
          outline: 3px solid rgba(37, 211, 102, 0.4);
          outline-offset: 2px;
        }
        /* Anillo de atención mientras la burbuja está visible */
        .wa-fab--attn::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 2px solid rgba(37, 211, 102, 0.6);
          animation: wa-ring 1.8s ease-out infinite;
        }

        @keyframes wa-bubble-in {
          from { opacity: 0; transform: translateY(10px) scale(0.85); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wa-ring {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.7); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wa-fab { transition: none; }
          .wa-fab:hover { transform: none; }
          .wa-bubble { animation: none; }
          .wa-fab--attn::before { animation: none; display: none; }
        }
      `}</style>
    </div>
  );
}
