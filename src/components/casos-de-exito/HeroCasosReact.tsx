import { useTina, tinaField } from "tinacms/dist/react";
import type {
  CasosDeExitoQuery,
  CasosDeExitoQueryVariables,
} from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import { t } from "../../i18n/ui";
import type { Locale } from "../../i18n/config";

interface HeroCasosProps {
  query: string;
  variables: CasosDeExitoQueryVariables;
  data: CasosDeExitoQuery;
  locale?: Locale;
}

export default function HeroCasosReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: HeroCasosProps) {
  const { data } = useTina<CasosDeExitoQuery>({
    query,
    variables,
    data: initialData,
  });

  const page = data?.casosDeExito;
  if (!page) return null;

  const base = import.meta.env.BASE_URL || "/";

  return (
    <section
      className="relative -mt-16 overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      {/* Fondo de luz — mismo lenguaje que la sección de certificaciones ISO
          (`.cert-bg-*` en CertificacionesSliderReact): cintas diagonales muy
          suaves que cruzan por detrás del texto, en vez del círculo magenta
          desenfocado que había antes (se leía como una mancha con borde).

          Son `radial-gradient` elípticos rotados: el desvanecido es intrínseco
          al degradado, sin `filter: blur()` (caro en móviles) ni imágenes.
          Estáticos, como los de ISO. La máscara inferior funde la luz contra el
          slider de casos para que no se corte en seco. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{
          /* Dial global de intensidad: un único número sobre toda la capa en vez
             de retocar el alfa de cada cinta. */
          opacity: 0.85,
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 58%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, #000 0%, #000 58%, transparent 100%)",
        }}
      >
        {/* Baño ambiental: la luz amplia que entra por la esquina superior derecha. */}
        <div className="hc-bg-amb absolute inset-0" />
        {/* Cinta principal, con el núcleo más claro y caída larga al negro. */}
        <div className="hc-bg-r1 absolute" />
        {/* Segunda cinta: otro ángulo y menos fuerza — da volumen de "seda"
            en vez de una sola banda plana. */}
        <div className="hc-bg-r2 absolute" />
        {/* Filamento fino: la línea de luz que define el borde de la cinta.
            Es lo que hace que se lea como un haz y no como niebla. */}
        <div className="hc-bg-r3 absolute" />
      </div>

      {/* Cabecera compacta: sin altura de pantalla completa ni spacer; el título
          e intro quedan arriba para que el slider asome dentro del primer viewport. */}
      <div className="relative z-10 site-container pt-24 md:pt-28 pb-6 md:pb-8">
        {/* Breadcrumb — mismo tamaño/tono que el de Nosotros (text-sm). */}
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          <a href={base} className="text-white/50 hover:text-white transition-colors">
            {t("breadcrumb.home", locale)}
          </a>
          <span className="text-white/30">/</span>
          <span
            className="text-white font-medium"
            data-tina-field={tinaField(page, "breadcrumb")}
          >
            {tField(page as any, "breadcrumb", locale)}
          </span>
        </nav>

        <div className="max-w-[640px] mt-8 md:mt-10" data-reveal="up">
          <h1
            className="text-[32px] md:text-[48px] leading-[1.15] font-medium text-greyscale-white mb-5 tracking-[-1.6px]"
            data-tina-field={tinaField(page, "heading")}
          >
            {tField(page as any, "heading", locale)}
          </h1>

          <p
            className="text-body text-greyscale-light max-w-[560px]"
            data-tina-field={tinaField(page, "intro")}
          >
            {tField(page as any, "intro", locale)}
          </p>
        </div>
      </div>

      <style>{`
        /* ── Cintas de luz del hero ────────────────────────────────────────
           Mobile: la luz entra por arriba a la derecha y baja en diagonal
           cruzando por detrás del título. */
        .hc-bg-amb {
          background: radial-gradient(120% 130% at 86% -10%, rgba(150,35,122,0.34) 0%, rgba(120,28,98,0.15) 40%, rgba(10,10,10,0) 74%);
        }
        .hc-bg-r1 {
          left: 6%; right: -30%; top: -55%; height: 165%;
          transform: rotate(-16deg);
          background: radial-gradient(closest-side, rgba(216,96,182,0.30) 0%, rgba(160,40,130,0.13) 40%, rgba(10,10,10,0) 78%);
        }
        .hc-bg-r2 {
          left: -10%; right: -20%; top: 18%; height: 150%;
          transform: rotate(11deg);
          background: radial-gradient(closest-side, rgba(150,35,122,0.20) 0%, rgba(90,22,74,0.09) 42%, rgba(10,10,10,0) 78%);
        }
        .hc-bg-r3 {
          left: 24%; right: -14%; top: -12%; height: 30%;
          transform: rotate(-16deg);
          background: radial-gradient(closest-side, rgba(240,160,214,0.24) 0%, rgba(216,96,182,0.08) 45%, rgba(10,10,10,0) 80%);
        }

        /* Desktop: la sección es mucho más ancha que alta, así que las cintas se
           aplanan y se recuestan sobre la mitad derecha, lejos del texto. */
        @media (min-width: 768px) {
          .hc-bg-amb {
            background: radial-gradient(90% 175% at 84% -6%, rgba(168,42,138,0.38) 0%, rgba(120,28,98,0.16) 40%, rgba(10,10,10,0) 72%);
          }
          .hc-bg-r1 {
            left: 30%; right: -22%; top: -70%; height: 190%;
            transform: rotate(-11deg);
            background: radial-gradient(closest-side, rgba(226,116,194,0.42) 0%, rgba(170,45,140,0.17) 40%, rgba(10,10,10,0) 78%);
          }
          .hc-bg-r2 {
            left: 14%; right: -12%; top: 6%; height: 175%;
            transform: rotate(8deg);
            background: radial-gradient(closest-side, rgba(150,35,122,0.22) 0%, rgba(90,22,74,0.10) 42%, rgba(10,10,10,0) 78%);
          }
          .hc-bg-r3 {
            left: 40%; right: -10%; top: -4%; height: 26%;
            transform: rotate(-11deg);
            background: radial-gradient(closest-side, rgba(246,180,224,0.34) 0%, rgba(216,96,182,0.11) 45%, rgba(10,10,10,0) 80%);
          }
        }
      `}</style>
    </section>
  );
}
