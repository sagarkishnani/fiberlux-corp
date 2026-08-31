import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTina } from "tinacms/dist/react";
import type { IconType } from "react-icons";
import {
  FaApple,
  FaArrowRight,
  FaDownload,
  FaGooglePlay,
  FaWhatsapp,
  FaXmark,
} from "react-icons/fa6";
import {
  LuActivity,
  LuBuilding2,
  LuChartLine,
  LuCircleCheck,
  LuClock,
  LuCloud,
  LuScanSearch,
  LuShieldCheck,
  LuWifi,
  LuZap,
} from "react-icons/lu";
import type { PopupQuery, PopupQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";

interface Props {
  query: string;
  variables: PopupQueryVariables;
  data: PopupQuery;
  locale: Locale;
}

/* Sets fijos de íconos: los valores viven en `tina/config.ts`
   (FEATURE_ICON_OPTIONS / BUTTON_ICON_OPTIONS). Un valor desconocido —o
   "ninguno"— cae en undefined y el ícono simplemente no se pinta. */
const FEATURE_ICONS: Record<string, IconType> = {
  pulso: LuActivity,
  edificio: LuBuilding2,
  lupa: LuScanSearch,
  escudo: LuShieldCheck,
  rayo: LuZap,
  reloj: LuClock,
  nube: LuCloud,
  wifi: LuWifi,
  grafico: LuChartLine,
  check: LuCircleCheck,
};

const BUTTON_ICONS: Record<string, IconType> = {
  apple: FaApple,
  "google-play": FaGooglePlay,
  descarga: FaDownload,
  flecha: FaArrowRight,
  whatsapp: FaWhatsapp,
};

const BASE = import.meta.env.BASE_URL || "/";

/** Las rutas de imagen del CMS vienen sin base ("images/x.png"). */
function asset(path?: string | null): string {
  const p = (path || "").replace(/^\//, "");
  return `${BASE}${p}`.replace(/\/{2,}/g, "/");
}

/* Persistencia. Dos claves con propósitos distintos: la de sesión evita que el
   pop-up salte en cada navegación de una misma visita; la de localStorage
   implementa los N días de respeto al cierre. */
const STORAGE_KEY = "flx-popup:v1";
const SESSION_KEY = "flx-popup-session:v1";
const COOKIE_CONSENT_KEY = "flx-cookie-consent:v1";

interface Dismissal {
  closedAt?: number;
  campaignId?: string;
}

function readDismissal(): Dismissal | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDismissal(campaignId: string) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ closedAt: Date.now(), campaignId })
    );
  } catch {
    /* storage deshabilitado: el pop-up sigue funcionando, sólo no recuerda */
  }
}

function markSeenThisSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {}
}

function seenThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/** El modal de cookies tiene prioridad: hasta que no se responde, no hay pop-up. */
function cookiesResolved(): boolean {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) !== null;
  } catch {
    /* Sin storage no podemos saberlo; no bloqueamos el pop-up por eso. */
    return true;
  }
}

/** `?popup=1` fuerza la vista previa: ignora persistencia y disparador. */
function isPreview(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("popup") === "1";
  } catch {
    return false;
  }
}

/**
 * Pop-up promocional (SPEC 111).
 *
 * Capas del sitio: header z-[80], buscador z-[85], pop-up z-[90], modal de
 * cookies z-[100]. El de cookies va encima a propósito: tiene prioridad legal
 * y el pop-up espera a que se resuelva.
 */
export default function PopupReact({ query, variables, data: initialData }: Props) {
  const { data } = useTina({ query, variables, data: initialData });
  const popup = data?.popup;

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();

  const [open, setOpen] = useState(false);
  /* La hoja nace desplazada y sube en el frame siguiente a abrirse: sin este
     doble paso el navegador pinta el estado final y no hay transición. */
  const [entered, setEntered] = useState(false);

  /* `allowed` se decide tras montar: en SSG el HTML es el mismo para todos y
     leer storage durante el render daría una hidratación inconsistente. */
  const [allowed, setAllowed] = useState(false);
  const [preview, setPreview] = useState(false);
  /* Cerrado en esta carga de página: sin esto el disparador se rearma en
     cuanto `open` vuelve a false y el pop-up reaparece solo (al instante en
     vista previa, N segundos después en el modo por tiempo). */
  const [dismissed, setDismissed] = useState(false);

  const campaignId = popup?.campaignId || "";
  const remindDays = Math.max(0, popup?.remindAfterDays ?? 7);

  useEffect(() => {
    if (isPreview()) {
      setPreview(true);
      setAllowed(true);
      return;
    }
    if (seenThisSession()) return;
    if (!cookiesResolved()) return;

    const prev = readDismissal();
    if (prev?.closedAt) {
      /* Campaña distinta: el cierre anterior ya no aplica. */
      const sameCampaign = (prev.campaignId || "") === campaignId;
      const elapsedDays = (Date.now() - prev.closedAt) / 86_400_000;
      if (sameCampaign && elapsedDays < remindDays) return;
    }
    setAllowed(true);
  }, [campaignId, remindDays]);

  const trigger = popup?.trigger || "segundos";
  const delayMs = Math.max(0, popup?.delaySeconds ?? 5) * 1000;
  const scrollPercent = Math.min(100, Math.max(0, popup?.scrollPercent ?? 40));

  /* Disparador. Cada modo arma su propio listener y todos desembocan en el
     mismo `setOpen(true)`. */
  useEffect(() => {
    if (open || !allowed || dismissed) return;

    /* La vista previa se salta el disparador: el editor quiere verlo ya. */
    if (preview) {
      setOpen(true);
      return;
    }

    /* La intención de salida no existe sin cursor: en táctil se repliega al
       modo por segundos para que el pop-up no quede invisible en celulares. */
    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: coarse)").matches;
    const mode = trigger === "salida" && coarse ? "segundos" : trigger;

    if (mode === "inmediato") {
      /* Un respiro para no competir con la pintura inicial de la página. */
      const t = setTimeout(() => setOpen(true), 300);
      return () => clearTimeout(t);
    }

    if (mode === "segundos") {
      const t = setTimeout(() => setOpen(true), delayMs);
      return () => clearTimeout(t);
    }

    if (mode === "scroll") {
      const onScroll = () => {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - window.innerHeight;
        /* Página que no scrollea: el umbral es inalcanzable, se abre igual. */
        const pct = scrollable <= 0 ? 100 : (window.scrollY / scrollable) * 100;
        if (pct >= scrollPercent) setOpen(true);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }

    if (mode === "salida") {
      const onOut = (e: MouseEvent) => {
        if (e.clientY <= 0 && !e.relatedTarget) setOpen(true);
      };
      document.addEventListener("mouseout", onOut);
      return () => document.removeEventListener("mouseout", onOut);
    }
  }, [open, allowed, dismissed, preview, trigger, delayMs, scrollPercent]);

  useEffect(() => {
    if (!open) return;
    if (!preview) markSeenThisSession();
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open, preview]);

  /* Cerrar: en vista previa no se escribe nada, para no ensuciar el storage
     del editor mientras revisa. */
  const close = useCallback(() => {
    if (!preview) writeDismissal(campaignId);
    setDismissed(true);
    setOpen(false);
  }, [preview, campaignId]);

  /* Mientras está abierto: Escape cierra, el scroll de la página se congela
     (incluido Lenis, que corre su propio raf) y el foco no puede salir del
     panel. La restauración va en el return del efecto y no en el manejador de
     cierre: si el componente se desmonta por otra vía, el scroll no puede
     quedarse bloqueado. */
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /* `overflow: hidden` no frena a Lenis: scrollea por su cuenta desde un raf.
       Y la isla monta con client:idle, a veces antes de que el script inline
       del layout asigne `window.__lenis`, así que un stop() único se pierde y
       la página sigue corriendo por detrás del pop-up. Se reintenta durante
       ~2s (120 frames) y se abandona si nunca aparece. */
    let lenisFrame = 0;
    let lenisRaf = 0;
    const stopLenis = () => {
      const lenis = (window as any).__lenis;
      if (lenis?.stop) {
        lenis.stop();
        return;
      }
      if (lenisFrame++ < 120) lenisRaf = requestAnimationFrame(stopLenis);
    };
    stopLenis();

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!panel.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(lenisRaf);
      document.body.style.overflow = prevOverflow;
      (window as any).__lenis?.start?.();
      previouslyFocused?.focus?.();
    };
  }, [open, close]);

  if (!popup || !open) return null;

  /* Modo imagen: una pieza ya diseñada por breakpoint. Si falta la de uno, se
     usa la del otro, para que nunca quede un hueco. */
  const imageMode = popup.mode === "imagen";
  const imgDesktop = popup.imageDesktop || popup.imageMobile;
  const imgMobile = popup.imageMobile || popup.imageDesktop;

  const features = (popup.features || []).filter(Boolean);
  /* Un botón sin URL sería un enlace muerto: no se pinta. */
  const buttons = (popup.buttons || []).filter((b: any) => b?.url);
  const hasPhone = Boolean(popup.phoneImage);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center lg:items-center lg:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={popup.heading ? headingId : undefined}
      aria-label={popup.heading ? undefined : "Aviso"}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={close}
      />

      <div
        ref={panelRef}
        className={`relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-greyscale-darkest text-white shadow-[0_32px_120px_-24px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-out motion-reduce:transition-none lg:max-h-[90vh] lg:rounded-3xl ${
          hasPhone ? "max-w-[1000px]" : "max-w-[560px]"
        } ${entered ? "translate-y-0" : "translate-y-full lg:translate-y-0"} ${
          imageMode ? "!max-w-[720px] bg-transparent" : ""
        }`}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-greyscale-darkest/85 text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white lg:right-6 lg:top-6"
        >
          <FaXmark aria-hidden="true" className="text-lg" />
        </button>

        {imageMode ? (
          <ImagePopup desktop={imgDesktop} mobile={imgMobile} url={popup.imageUrl} />
        ) : (
        <div
          data-lenis-prevent
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
            hasPhone ? "lg:grid lg:grid-cols-2 lg:overflow-visible" : ""
          }`}
        >
          {/* ── Columna de contenido ── */}
          <div className="p-8 text-center lg:p-12 lg:text-left">
            {popup.appIcon && (
              <img
                src={asset(popup.appIcon)}
                alt=""
                aria-hidden="true"
                className="mx-auto mb-6 h-20 w-20 rounded-[22px] lg:hidden"
              />
            )}
            {popup.badge && (
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-purple/60 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-brand-purple">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-purple" aria-hidden="true" />
                {popup.badge}
              </span>
            )}

            {popup.heading && (
              <h2 id={headingId} className="text-[28px] font-semibold leading-[1.15] lg:text-[40px]">
                {popup.heading}
              </h2>
            )}

            {features.length > 0 && (
              <ul className="mt-8 space-y-5">
                {features.map((f: any, i: number) => {
                  const Icon = FEATURE_ICONS[f?.icon || ""];
                  return (
                    <li className="flex items-start gap-4 rounded-2xl border border-white/10 p-4 text-left lg:border-0 lg:p-0" key={i}>
                      {Icon && (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-purple/40 bg-brand-purple/10 text-brand-purple">
                          <Icon aria-hidden="true" />
                        </span>
                      )}
                      <span className="pt-2 text-[15px] leading-relaxed text-white/70">
                        {f?.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {buttons.length > 0 && (
              /* Todos los botones al mismo ancho: el mockup de desktop los
                 muestra con anchos distintos, y el cliente confirmó que es un
                 error del diseño. */
              <div className="mx-auto mt-10 flex max-w-[420px] flex-col gap-3 lg:mx-0">
                {buttons.map((b: any, i: number) => {
                  const Icon = BUTTON_ICONS[b?.icon || ""];
                  const primary = b?.variant !== "secundario";
                  return (
                    <a
                      key={i}
                      href={b.url}
                      className={`flex w-full items-center justify-center gap-3 rounded-lg px-6 py-4 text-[15px] font-semibold transition ${
                        primary
                          ? "border border-transparent bg-brand-purple text-white hover:bg-brand-purple-dark"
                          : "border border-white/25 text-white hover:bg-white/10"
                      }`}
                    >
                      {Icon && <Icon aria-hidden="true" className="text-lg" />}
                      {b?.label}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Columna de imagen (solo desktop) ── */}
          {hasPhone && (
            <div className="relative hidden overflow-hidden bg-[#240A1E] lg:block">
              {/* Resplandor suave arriba a la izquierda, como en el diseño. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(120%_90%_at_25%_0%,rgba(150,35,122,0.30),transparent_72%)]"
              />
              <img
                src={asset(popup.phoneImage)}
                alt=""
                aria-hidden="true"
                className="absolute inset-x-0 top-20 mx-auto h-auto w-[86%] max-w-none"
              />
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

/** Modo "solo imagen": la pieza entera es la imagen, con enlace opcional. */
function ImagePopup({
  desktop,
  mobile,
  url,
}: {
  desktop?: string | null;
  mobile?: string | null;
  url?: string | null;
}) {
  if (!desktop && !mobile) return null;

  const picture = (
    <picture>
      {desktop && <source media="(min-width: 1024px)" srcSet={asset(desktop)} />}
      <img
        src={asset(mobile || desktop)}
        alt=""
        className="block h-auto w-full rounded-t-3xl lg:rounded-3xl"
      />
    </picture>
  );

  return url ? (
    <a href={url} className="block">
      {picture}
    </a>
  ) : (
    picture
  );
}
