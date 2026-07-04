import { FaWhatsapp } from "react-icons/fa6";

interface WhatsAppButtonProps {
  /** Phone in international format, digits only (e.g. "51986176790"). */
  phone?: string;
  /** Prefilled message. Falls back to the default RUC message. */
  message?: string;
}

const DEFAULT_PHONE = "51986176790";
const DEFAULT_MESSAGE =
  "¡Hola Fiberlux! Quiero iniciar la Transformación Digital de mi empresa. 🛜 Mi número de RUC es:";

export default function WhatsAppButton({
  phone = DEFAULT_PHONE,
  message = DEFAULT_MESSAGE,
}: WhatsAppButtonProps) {
  const digits = (phone || DEFAULT_PHONE).replace(/\D/g, "");
  const href = `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(
    message
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contáctanos por WhatsApp"
      className="wa-fab"
    >
      <FaWhatsapp aria-hidden="true" />
      <style>{`
        .wa-fab {
          position: fixed;
          right: clamp(16px, 3vw, 28px);
          bottom: clamp(16px, 3vw, 28px);
          z-index: 60;
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
        @media (prefers-reduced-motion: reduce) {
          .wa-fab { transition: none; }
          .wa-fab:hover { transform: none; }
        }
      `}</style>
    </a>
  );
}
