import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "../../i18n/config";
import { fxAsset } from "./fx/FxPrimitives";

/**
 * Miniformulario previo a WhatsApp (prototipo «Botón flotante WhatsApp –
 * Fiberlux Corporativo»). Pide RUC y celular antes de abrir el chat para que
 * Fiberlux pueda medir las conversaciones que llegan desde la web.
 *
 * El mensaje prellenado es el mismo que ya usaba el botón según la página
 * (general, servicio o solución); solo se le agrega el RUC. Se activa desde
 * Tina en `global.whatsapp.preForm.enabled`.
 */

/* ── Validaciones ─────────────────────────────────────────────────────────── */

export function soloDigitos(v: string): string {
  return v.replace(/\D+/g, "");
}

/** RUC peruano: 11 dígitos, prefijo de contribuyente válido (10 persona
 *  natural, 15/16/17 casos especiales, 20 persona jurídica) y dígito
 *  verificador módulo 11 de SUNAT. */
export function rucValido(v: string): boolean {
  if (!/^\d{11}$/.test(v)) return false;
  if (!/^(10|15|16|17|20)/.test(v)) return false;
  const f = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let s = 0;
  for (let i = 0; i < 10; i++) s += Number(v[i]) * f[i];
  let d = 11 - (s % 11);
  if (d === 10) d = 0;
  else if (d === 11) d = 1;
  return d === Number(v[10]);
}

/** Celular peruano: 9 dígitos que empiezan con 9. */
export function celularValido(v: string): boolean {
  return /^9\d{8}$/.test(v);
}

/** Agrega el RUC al mensaje de la página sin cambiar el resto:
 *  - `{ruc}` en el mensaje ⇒ se reemplaza ahí.
 *  - Termina en «:» (el general: «…Mi número de RUC es:») ⇒ se pega al final.
 *  - Si no (servicio/solución) ⇒ se agrega «Mi número de RUC es: X». */
export function mensajeConRuc(mensaje: string, ruc: string): string {
  const base = mensaje.trim();
  if (base.includes("{ruc}")) return base.split("{ruc}").join(ruc);
  if (/:\s*$/.test(base)) return `${base} ${ruc}`;
  return `${base} Mi número de RUC es: ${ruc}`;
}

/* ── Textos ───────────────────────────────────────────────────────────────── */

const UI: Record<Locale, {
  eyebrow: string;
  title1: string;
  title2: string;
  sub: string;
  ruc: string;
  rucPh: string;
  rucErr: string;
  cel: string;
  celErr: string;
  submit: string;
  close: string;
}> = {
  es: {
    eyebrow: "Contacto",
    title1: "Inicie la",
    title2: "conversación",
    sub: "Complete los campos a continuación para continuar en WhatsApp.",
    ruc: "RUC *",
    rucPh: "11 dígitos",
    rucErr: "Ingrese un RUC válido de 11 dígitos.",
    cel: "Celular *",
    celErr: "Ingrese un celular válido de 9 dígitos (empieza con 9).",
    submit: "Iniciar la conversación",
    close: "Cerrar",
  },
  en: {
    eyebrow: "Contact",
    title1: "Start the",
    title2: "conversation",
    sub: "Fill in the fields below to continue on WhatsApp.",
    ruc: "RUC (Tax ID) *",
    rucPh: "11 digits",
    rucErr: "Enter a valid 11-digit RUC.",
    cel: "Mobile *",
    celErr: "Enter a valid 9-digit mobile number (starts with 9).",
    submit: "Start the conversation",
    close: "Close",
  },
};

const WA_ICON =
  "M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.22-8.24 8.22Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07s.88 2.4 1 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z";

export function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={WA_ICON} />
    </svg>
  );
}

/* ── Panel ────────────────────────────────────────────────────────────────── */

interface Props {
  open: boolean;
  onClose: () => void;
  /** Dígitos del número de destino. */
  phone: string;
  /** Mensaje de la página (sin RUC). */
  message: string;
  locale: Locale;
  id: string;
}

export default function WhatsAppPreForm({ open, onClose, phone, message, locale, id }: Props) {
  const t = UI[locale] ?? UI.es;
  const uid = useId();
  const rucRef = useRef<HTMLInputElement>(null);
  const celRef = useRef<HTMLInputElement>(null);
  const [ruc, setRuc] = useState("");
  const [cel, setCel] = useState("");
  const [errRuc, setErrRuc] = useState(false);
  const [errCel, setErrCel] = useState(false);

  const okRuc = rucValido(ruc);
  const okCel = celularValido(cel);
  const listo = okRuc && okCel;

  const href = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
    mensajeConRuc(message, ruc),
  )}`;

  /* Foco al RUC al abrir (después de la transición de entrada). */
  useEffect(() => {
    if (!open) return;
    const tid = window.setTimeout(() => rucRef.current?.focus({ preventScroll: true }), 200);
    return () => window.clearTimeout(tid);
  }, [open]);

  const onSubmit = (e: React.MouseEvent<HTMLAnchorElement> | React.FormEvent) => {
    if (!listo) {
      e.preventDefault();
      setErrRuc(!okRuc);
      setErrCel(!okCel);
      (!okRuc ? rucRef : celRef).current?.focus();
      return;
    }
    /* Medición: evento sin datos personales para GTM (los datos del visitante
       no van al dataLayer). */
    try {
      (window as any).dataLayer?.push({
        event: "whatsapp_preform_submit",
        wa_page: window.location.pathname,
      });
    } catch {
      /* sin GTM el chat se abre igual */
    }
    /* Si es válido, el <a> abre WhatsApp por sí solo: un enlace real no lo
       bloquea el navegador como lo haría un window.open diferido. */
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (listo) {
      /* Enter con todo válido: dispara el enlace como clic de usuario. */
      document.getElementById(`${uid}-go`)?.click();
    } else {
      onSubmit(e);
    }
  };

  return (
    <div
      id={id}
      className={`wa-pf${open ? " is-open" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${uid}-title`}
      aria-hidden={!open}
      inert={!open ? true : undefined}
    >
      <button type="button" className="wa-pf__close" onClick={onClose} aria-label={t.close}>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
          <path d="M2 2l10 10M12 2L2 12" />
        </svg>
      </button>

      <div className="wa-pf__scroll">
      <div className="wa-pf__top">
        <span className="wa-pf__eyebrow">{t.eyebrow}</span>
        <img className="wa-pf__logo" src={fxAsset("logo.svg")} alt="Fiberlux" width={128} height={19} />
      </div>

      <h2 className="wa-pf__title" id={`${uid}-title`}>
        {t.title1}
        <br />
        <b>{t.title2}</b>
      </h2>
      <p className="wa-pf__sub">{t.sub}</p>

      <form noValidate onSubmit={onFormSubmit}>
        <div className="wa-pf__card">
          <div className={`wa-pf__field${errRuc ? " has-error" : ""}`}>
            <label htmlFor={`${uid}-ruc`}>{t.ruc}</label>
            <input
              ref={rucRef}
              id={`${uid}-ruc`}
              name="ruc"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder={t.rucPh}
              value={ruc}
              required
              aria-invalid={errRuc}
              aria-describedby={errRuc ? `${uid}-ruc-err` : undefined}
              onChange={(e) => {
                setRuc(soloDigitos(e.target.value).slice(0, 11));
                setErrRuc(false);
              }}
              onBlur={() => setErrRuc(ruc.length > 0 && !rucValido(ruc))}
            />
            {errRuc && (
              <div className="wa-pf__error" id={`${uid}-ruc-err`} role="alert">
                {t.rucErr}
              </div>
            )}
          </div>
          <div className={`wa-pf__field${errCel ? " has-error" : ""}`}>
            <label htmlFor={`${uid}-cel`}>{t.cel}</label>
            <input
              ref={celRef}
              id={`${uid}-cel`}
              name="celular"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="9XX XXX XXX"
              value={cel}
              required
              aria-invalid={errCel}
              aria-describedby={errCel ? `${uid}-cel-err` : undefined}
              onChange={(e) => {
                /* Quien pega «+51 987 654 321» queda con los 9 dígitos. */
                let d = soloDigitos(e.target.value);
                if (d.length > 9 && d.startsWith("51")) d = d.slice(2);
                setCel(d.slice(0, 9));
                setErrCel(false);
              }}
              onBlur={() => setErrCel(cel.length > 0 && !celularValido(cel))}
            />
            {errCel && (
              <div className="wa-pf__error" id={`${uid}-cel-err`} role="alert">
                {t.celErr}
              </div>
            )}
          </div>
        </div>

        {/* Un <a> real: así WhatsApp se abre como enlace normal. Hasta que los
            dos campos son válidos queda deshabilitado (aria-disabled) y el clic
            solo señala qué falta. */}
        <a
          id={`${uid}-go`}
          className={`wa-pf__submit${listo ? "" : " is-disabled"}`}
          href={listo ? href : undefined}
          role={listo ? undefined : "button"}
          tabIndex={0}
          aria-disabled={!listo}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onSubmit}
        >
          <WhatsAppGlyph />
          {t.submit}
        </a>
      </form>
      </div>

      <style>{`
        .wa-pf {
          position: absolute;
          right: 0;
          bottom: calc(100% + 16px);
          z-index: 2;
          width: min(392px, calc(100vw - 32px));
          background: #fff;
          border: 2px solid #D5A7CA;
          border-radius: 28px;
          text-align: left;
          font-family: Poppins, "Segoe UI", Arial, sans-serif;
          color: #1A1A1A;
          transform-origin: bottom right;
          opacity: 0;
          transform: translateY(12px) scale(.97);
          visibility: hidden;
          pointer-events: none;
          transition: opacity .22s ease, transform .22s ease, visibility 0s linear .22s;
        }
        .wa-pf.is-open {
          opacity: 1;
          transform: none;
          visibility: visible;
          pointer-events: auto;
          transition: opacity .22s ease, transform .22s ease;
        }
        /* El scroll va en un envoltorio interno para que la ✕ pueda colgar de
           la esquina del panel (como en el prototipo) sin quedar recortada. */
        .wa-pf__scroll {
          max-height: calc(100dvh - 140px);
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 24px 24px 26px;
          border-radius: 26px;
        }
        .wa-pf__close {
          position: absolute;
          top: -14px;
          right: -14px;
          z-index: 1;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid #D5A7CA;
          background: #fff;
          color: #96237A;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: background .15s, color .15s, border-color .15s;
        }
        .wa-pf__close:hover,
        .wa-pf__close:focus-visible { background: #96237A; border-color: #96237A; color: #fff; outline: none; }

        .wa-pf__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 22px;
        }
        .wa-pf__eyebrow {
          font: 400 11px/1.4 Poppins, sans-serif;
          letter-spacing: 2.6px;
          text-transform: uppercase;
          color: #868687;
          white-space: nowrap;
        }
        .wa-pf__logo { display: block; width: 128px; height: auto; flex: none; }

        .wa-pf__title {
          font: 300 30px/1.2 Poppins, sans-serif;
          color: #96237A;
          margin: 0 0 10px;
          letter-spacing: 0;
        }
        .wa-pf__title b { font-weight: 700; }
        .wa-pf__sub { font: 400 14px/1.55 Poppins, sans-serif; color: #1A1A1A; margin: 0 0 20px; }

        .wa-pf__card { background: #E6E6E6; border-radius: 24px; padding: 22px 20px 6px; margin-bottom: 18px; }
        .wa-pf__field { margin-bottom: 16px; }
        .wa-pf__field label { display: block; font: 500 13px/1.3 Poppins, sans-serif; color: #1A1A1A; margin-bottom: 8px; }
        .wa-pf__field input {
          display: block;
          width: 100%;
          height: 48px;
          padding: 0 18px;
          border: 2px solid #fff;
          border-radius: 20px;
          background: #fff;
          font: 400 16px Poppins, sans-serif;
          letter-spacing: .4px;
          color: #1A1A1A;
          transition: border-color .15s;
        }
        .wa-pf__field input::placeholder { color: #9a9a9b; font-weight: 300; letter-spacing: 0; }
        .wa-pf__field input:focus { outline: none; border-color: #96237A; }
        .wa-pf__field.has-error input { border-color: #96237A; }
        .wa-pf__error { color: #96237A; font: 500 12px/1.4 Poppins, sans-serif; margin-top: 7px; padding-left: 4px; }

        .wa-pf__submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          height: 52px;
          background: #96237A;
          color: #fff;
          text-decoration: none;
          border-radius: 20px;
          font: 500 16px Poppins, sans-serif;
          letter-spacing: .2px;
          cursor: pointer;
          transition: background .15s, transform .1s, opacity .15s;
        }
        .wa-pf__submit svg { width: 20px; height: 20px; flex: none; }
        .wa-pf__submit:hover,
        .wa-pf__submit:focus-visible { background: #7F1866; color: #fff; outline: none; }
        .wa-pf__submit:active { transform: translateY(1px); }
        .wa-pf__submit.is-disabled { opacity: .45; cursor: not-allowed; }
        .wa-pf__submit.is-disabled:hover { background: #96237A; }
        .wa-pf__submit.is-disabled:active { transform: none; }

        @media (max-width: 1023px) {
          .wa-pf__scroll { padding: 22px 20px 22px; }
          .wa-pf__title { font-size: 26px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wa-pf, .wa-pf.is-open { transition: none; }
        }
      `}</style>
    </div>
  );
}
