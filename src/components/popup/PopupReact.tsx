import { useState } from "react";
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

  const [open, setOpen] = useState(true);

  if (!popup || !open) return null;

  const features = (popup.features || []).filter(Boolean);
  /* Un botón sin URL sería un enlace muerto: no se pinta. */
  const buttons = (popup.buttons || []).filter((b: any) => b?.url);
  const hasPhone = Boolean(popup.phoneImage);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center lg:items-center lg:p-6">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div
        className={`relative w-full overflow-hidden rounded-t-3xl bg-greyscale-darkest text-white shadow-[0_32px_120px_-24px_rgba(0,0,0,0.9)] lg:rounded-3xl ${
          hasPhone ? "max-w-[1000px]" : "max-w-[560px]"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white lg:right-6 lg:top-6"
        >
          <FaXmark aria-hidden="true" className="text-lg" />
        </button>

        <div className={hasPhone ? "lg:grid lg:grid-cols-2" : ""}>
          {/* ── Columna de contenido ── */}
          <div className="p-8 lg:p-12">
            {popup.badge && (
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-purple/60 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-brand-purple">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-purple" aria-hidden="true" />
                {popup.badge}
              </span>
            )}

            {popup.heading && (
              <h2 className="text-[28px] font-semibold leading-[1.15] lg:text-[40px]">
                {popup.heading}
              </h2>
            )}

            {features.length > 0 && (
              <ul className="mt-8 space-y-5">
                {features.map((f: any, i: number) => {
                  const Icon = FEATURE_ICONS[f?.icon || ""];
                  return (
                    <li key={i} className="flex items-start gap-4">
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
              <div className="mt-10 flex max-w-[420px] flex-col gap-3">
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
      </div>
    </div>
  );
}
