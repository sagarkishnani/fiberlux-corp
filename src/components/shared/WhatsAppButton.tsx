import { useEffect, useId, useRef, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import type { Locale } from "../../i18n/config";
import { fxAsset } from "./fx/FxPrimitives";
import WhatsAppPreForm, { WhatsAppGlyph } from "./WhatsAppPreForm";

/**
 * Botón flotante de WhatsApp. El número y los textos se editan en Tina
 * (`global.whatsapp`); `BaseLayout` resuelve qué burbuja toca según la página.
 *
 * Diseño del rediseño claro (SPEC 117): píldora verde que despliega
 * "Escríbenos" al pasar el cursor. Si la página tiene mensaje, una burbuja
 * asoma sola a los `delayMs` y se cierra con la ✕.
 *
 * Con `callButton` (global.callButton, SPEC 125) suma encima un botón morado de
 * llamada; `showWhatsApp` (global.whatsapp.enabled) oculta el de WhatsApp.
 *
 * Con `preForm` (global.whatsapp.preForm.enabled) el botón ya no abre WhatsApp
 * directo: despliega un miniformulario que pide RUC y celular y recién entonces
 * abre el chat con el mensaje de la página + el RUC (`WhatsAppPreForm`).
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
  locale?: Locale;
  showWhatsApp?: boolean;
  /** Pedir RUC y celular antes de abrir WhatsApp. */
  preForm?: boolean;
  callButton?: CallButtonConfig;
}

export interface CallButtonConfig {
  phone: string;
  label?: string;
  desktop?: boolean;
}

const LABEL: Record<Locale, string> = { es: "Escríbenos", en: "Message us" };
const CALL_LABEL: Record<Locale, string> = { es: "Llámanos", en: "Call us" };

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
  locale = "es",
  showWhatsApp = true,
  preForm = false,
  callButton,
}: WhatsAppButtonProps) {
  const digits = (phone || DEFAULT_PHONE).replace(/\D/g, "");
  const href = `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`;

  const [fase, setFase] = useState<Fase>("oculta");

  /* Miniformulario previo (SPEC: obs. medición de chats de Google). */
  const [abierto, setAbierto] = useState(false);
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const cerrarPanel = (devolverFoco = true) => {
    setAbierto(false);
    if (devolverFoco) fabRef.current?.focus({ preventScroll: true });
  };

  /* Escape y clic fuera cierran el panel. */
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarPanel();
    };
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) cerrarPanel(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [abierto]);

  /* Al navegar (el botón persiste entre páginas) el panel se cierra. */
  useEffect(() => {
    const onNav = () => setAbierto(false);
    document.addEventListener("astro:after-swap", onNav);
    return () => document.removeEventListener("astro:after-swap", onNav);
  }, []);

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
  const callHref = callButton ? `tel:${callButton.phone.replace(/[^\d+]/g, "")}` : "";
  const callLabel = callButton?.label || CALL_LABEL[locale];

  if (!showWhatsApp && !callButton) return null;

  const conForm = preForm && showWhatsApp;

  const wrapClasses = [
    "wa-fab-wrap",
    conForm ? "wa-fab-wrap--form" : "",
    abierto ? "is-open" : "",
    callButton ? "wa-fab-wrap--call" : "",
    callButton?.desktop ? "wa-fab-wrap--call-desktop" : "",
    showWhatsApp ? "" : "wa-fab-wrap--call-only",
  ].filter(Boolean).join(" ");

  return (
    <div className={wrapClasses} ref={wrapRef}>
      {callButton && (
        <a href={callHref} aria-label={callLabel} title={callLabel} className="call-fab">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </a>
      )}

      {showWhatsApp && gancho && fase !== "oculta" && !abierto && (
        /* `role="status"` y no `dialog`: la burbuja se anuncia una vez y no roba
           el foco a quien está leyendo la página. */
        <div
          role="status"
          onAnimationEnd={() => setFase(siguienteFase)}
          className={`wa-bubble ${claseFase}`}
        >
          {conForm ? (
            <button
              type="button"
              className="wa-bubble__text"
              onClick={() => {
                cerrar();
                setAbierto(true);
              }}
            >
              {gancho}
            </button>
          ) : (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-bubble__text"
              onClick={cerrar}
            >
              {gancho}
            </a>
          )}

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

      {conForm && (
        <>
          <WhatsAppPreForm
            id={panelId}
            open={abierto}
            onClose={() => cerrarPanel()}
            phone={digits}
            message={message || DEFAULT_MESSAGE}
            locale={locale}
          />
          <button
            ref={fabRef}
            type="button"
            className="wa-fab2"
            aria-label={locale === "en" ? "Open WhatsApp chat" : "Abrir chat de WhatsApp"}
            aria-expanded={abierto}
            aria-controls={panelId}
            onClick={() => setAbierto((v) => !v)}
          >
            <WhatsAppGlyph />
          </button>
        </>
      )}

      {showWhatsApp && !conForm && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contáctanos por WhatsApp"
          className="wa-fab"
        >
          <span className="wa-fab__label">{LABEL[locale]}</span>
          <span className="wa-fab__icon">
            <img src={fxAsset("wa-float.svg")} alt="" />
          </span>
        </a>
      )}

      <style>{`
        /* El envoltorio mide lo que el botón: la burbuja cuelga de él en
           absoluto para que la cola caiga siempre sobre el mismo punto. */
        .wa-fab-wrap {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 70;
          height: 56px;
        }
        @media (min-width: 1024px) {
          .wa-fab-wrap {
            right: 28px;
            bottom: 28px;
            height: 60px;
          }
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
          display: flex;
          align-items: center;
          height: 100%;
          border-radius: 9999px;
          background: #51C859;
          color: #fff;
          overflow: hidden;
          box-shadow: 0 10px 24px -8px rgba(37, 211, 102, 0.6);
          transition: box-shadow 0.3s;
        }
        .wa-fab:hover {
          color: #fff;
          box-shadow: 0 0 0 6px rgba(37, 211, 102, 0.22);
        }
        .wa-fab:focus-visible {
          outline: 3px solid rgba(37, 211, 102, 0.4);
          outline-offset: 2px;
        }
        .wa-fab__label {
          max-width: 0;
          padding-left: 0;
          opacity: 0;
          white-space: nowrap;
          overflow: hidden;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .wa-fab__icon {
          display: grid;
          place-items: center;
          flex: none;
          width: 56px;
          height: 56px;
        }
        .wa-fab__icon img {
          display: block;
          width: 100%;
          height: 100%;
        }
        @media (min-width: 1024px) {
          .wa-fab {
            box-shadow: 0 12px 30px -8px rgba(37, 211, 102, 0.6);
          }
          .wa-fab__icon {
            width: 60px;
            height: 60px;
          }
          .wa-fab:hover .wa-fab__label {
            max-width: 160px;
            padding-left: 22px;
            opacity: 1;
          }
        }

        /* ── FAB del miniformulario (prototipo): círculo magenta con anillo ── */
        .wa-fab2 {
          position: relative;
          display: grid;
          place-items: center;
          width: 56px;
          height: 56px;
          border: 0;
          padding: 0;
          border-radius: 50%;
          background: #96237A;
          color: #fff;
          cursor: pointer;
          transition: background .15s, transform .15s;
        }
        .wa-fab2:hover { background: #7F1866; transform: scale(1.05); }
        .wa-fab2:focus-visible { outline: 3px solid #D5A7CA; outline-offset: 3px; }
        .wa-fab2 svg { display: block; width: 30px; height: 30px; }
        .wa-fab2::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid #D5A7CA;
          animation: wa-ring 2.8s ease-out infinite;
          pointer-events: none;
        }
        .wa-fab-wrap.is-open .wa-fab2::after { animation: none; opacity: 0; }
        @keyframes wa-ring {
          0% { transform: scale(1); opacity: .9; }
          70%, 100% { transform: scale(1.55); opacity: 0; }
        }
        @media (min-width: 1024px) {
          .wa-fab2 { width: 60px; height: 60px; }
          .wa-fab2 svg { width: 32px; height: 32px; }
        }
        /* Con el panel abierto, el de llamada se aparta para no quedar debajo. */
        .wa-fab-wrap.is-open .call-fab { visibility: hidden; }
        .wa-bubble button.wa-bubble__text {
          width: 100%;
          border: 0;
          font-family: inherit;
          cursor: pointer;
        }

        /* ── Botón de llamada: apilado 12px encima del de WhatsApp ── */
        .call-fab {
          position: absolute;
          right: 0;
          bottom: calc(100% + 12px);
          display: grid;
          place-items: center;
          width: 56px;
          height: 56px;
          border-radius: 9999px;
          background: #96237A;
          color: #fff;
          box-shadow: 0 10px 24px -8px rgba(150, 35, 122, 0.6);
          transition: box-shadow 0.3s, background-color 0.3s;
        }
        .call-fab:hover {
          color: #fff;
          background: #7E1C66;
          box-shadow: 0 0 0 6px rgba(150, 35, 122, 0.2);
        }
        .call-fab:focus-visible {
          outline: 3px solid rgba(150, 35, 122, 0.4);
          outline-offset: 2px;
        }
        .wa-fab-wrap--call-only .call-fab {
          position: static;
        }

        /* Con el de llamada encima, la burbuja sale al costado del de WhatsApp
           para no taparlo. */
        .wa-fab-wrap--call:not(.wa-fab-wrap--call-only) .wa-bubble {
          right: 100%;
          bottom: 0;
          margin: 0 14px 0 0;
          max-width: calc(100vw - 184px);
          transform-origin: bottom right;
        }
        .wa-fab-wrap--call:not(.wa-fab-wrap--call-only) .wa-bubble__tail {
          right: -4px;
          bottom: 20px;
        }

        @media (min-width: 1024px) {
          .call-fab {
            width: 60px;
            height: 60px;
          }
          .wa-fab-wrap--call:not(.wa-fab-wrap--call-desktop) .call-fab {
            display: none;
          }
          .wa-fab-wrap--call:not(.wa-fab-wrap--call-desktop) .wa-bubble {
            right: 0;
            bottom: 100%;
            margin: 0 0 16px;
            max-width: calc(100vw - 3rem);
          }
          .wa-fab-wrap--call:not(.wa-fab-wrap--call-desktop) .wa-bubble__tail {
            right: 20px;
            bottom: -4px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .wa-bubble--in,
          .wa-bubble--out { animation: none; }
          .wa-fab__label { transition: none; }
          .wa-fab2::after { animation: none; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
