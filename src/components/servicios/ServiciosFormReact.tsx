import { useTina, tinaField } from "tinacms/dist/react";
import type {
  ServiciosQuery,
  ServiciosQueryVariables,
} from "../../../tina/__generated__/types";
import DynamicFormReact from "../dynamic-form/DynamicFormReact";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";

interface FormIsland {
  query: string;
  variables: { relativePath: string };
  data: any;
}

interface ServiciosFormProps {
  query: string;
  variables: ServiciosQueryVariables;
  data: ServiciosQuery;
  form: FormIsland;
  prefill?: Record<string, string>;
  locale?: Locale;
}

export default function ServiciosFormReact({
  query,
  variables,
  data: initialData,
  form,
  prefill,
  locale = "es",
}: ServiciosFormProps) {
  const { data } = useTina<ServiciosQuery>({ query, variables, data: initialData });

  const page = data?.servicios;
  if (!page) return null;

  return (
    <section
      id="contacto-servicios"
      className="relative overflow-hidden"
      style={{ background: "#0a0a0a", scrollMarginTop: 96 }}
    >
      {/* Fondo de luz — mismo lenguaje que la sección de certificaciones ISO
          (`.cert-bg-*`) y el hero de Casos de éxito: cintas diagonales suaves
          que cruzan por detrás del formulario. Reemplaza los tres blobs
          radiales saturados que había antes (obs_15), que se leían como nubes
          planas con borde en vez de luz.

          `radial-gradient` elípticos rotados: el desvanecido es intrínseco al
          degradado, sin `filter: blur()` (caro en móviles) ni imágenes.
          Estáticos. La máscara vertical funde la luz contra las secciones
          vecinas para que no se corte en seco arriba ni abajo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{
          /* Dial global de intensidad: un único número sobre toda la capa en vez
             de retocar el alfa de cada cinta. */
          opacity: 0.9,
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 10%, #000 82%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 10%, #000 82%, transparent 100%)",
        }}
      >
        {/* Baño ambiental: la luz amplia que entra por la esquina superior
            derecha y por el flanco izquierdo, como en la versión anterior. */}
        <div className="sf-bg-amb absolute inset-0" />
        {/* Cinta principal, con el núcleo más claro y caída larga al negro. */}
        <div className="sf-bg-r1 absolute" />
        {/* Segunda cinta: otro ángulo y menos fuerza — da volumen de "seda"
            en vez de una sola banda plana. */}
        <div className="sf-bg-r2 absolute" />
        {/* Filamento fino: la línea de luz que define el borde de la cinta.
            Es lo que hace que se lea como un haz y no como niebla. */}
        <div className="sf-bg-r3 absolute" />
      </div>

      <div className="relative z-10 site-container py-14 md:py-20 lg:py-28">
        {/* ════ Heading (editable from the servicios collection) ════ */}
        <div className="max-w-[720px] mx-auto text-center mb-10 lg:mb-14">
          <h2
            className="text-[28px] md:text-[40px] leading-[1.2] font-medium text-greyscale-white mb-4"
            data-tina-field={tinaField(page, "formTitle")}
          >
            {tField(page as any, "formTitle", locale)}
          </h2>
          {tField(page as any, "formSubtitle", locale) && (
            <p
              className="text-body-md text-greyscale-light"
              data-tina-field={tinaField(page, "formSubtitle")}
            >
              {tField(page as any, "formSubtitle", locale)}
            </p>
          )}
        </div>

        {/* ════ Dynamic form ════ */}
        <div className="w-full max-w-[720px] mx-auto">
          <DynamicFormReact
            query={form.query}
            variables={form.variables}
            data={form.data}
            prefill={prefill}
            locale={locale}
          />
        </div>
      </div>

      <style>{`
        /* ── Cintas de luz del fondo ──────────────────────────────────────
           Desktop: la luz entra por arriba a la derecha, cruza en diagonal por
           detrás del formulario y sale por el flanco izquierdo. Mantiene la
           colocación del degradé anterior (obs_15: el cliente lo quiere
           notorio), pero como haz y no como blob. */
        .sf-bg-amb {
          background:
            radial-gradient(72% 58% at 94% 2%, rgba(198,78,166,0.44) 0%, rgba(150,35,122,0.17) 40%, rgba(10,10,10,0) 72%),
            radial-gradient(58% 50% at -6% 54%, rgba(160,40,130,0.36) 0%, rgba(120,28,98,0.14) 42%, rgba(10,10,10,0) 74%);
        }
        .sf-bg-r1 {
          left: -25%; right: -25%; top: 0%; height: 54%;
          transform: rotate(-17deg);
          background: radial-gradient(closest-side, rgba(226,116,194,0.36) 0%, rgba(170,45,140,0.16) 40%, rgba(10,10,10,0) 78%);
        }
        .sf-bg-r2 {
          left: -32%; right: -15%; top: 44%; height: 62%;
          transform: rotate(12deg);
          background: radial-gradient(closest-side, rgba(160,40,130,0.30) 0%, rgba(96,24,78,0.13) 42%, rgba(10,10,10,0) 78%);
        }
        .sf-bg-r3 {
          left: -12%; right: -12%; top: 11%; height: 11%;
          transform: rotate(-17deg);
          background: radial-gradient(closest-side, rgba(246,180,224,0.30) 0%, rgba(216,96,182,0.10) 45%, rgba(10,10,10,0) 80%);
        }

        /* Mobile: la sección es angosta y muy alta, así que las cintas se
           enderezan y se reparten arriba/abajo para no tapar los campos. */
        @media (max-width: 1023px) {
          .sf-bg-amb {
            background:
              radial-gradient(96% 34% at 84% 1%, rgba(198,78,166,0.42) 0%, rgba(150,35,122,0.16) 42%, rgba(10,10,10,0) 74%),
              radial-gradient(104% 30% at 6% 62%, rgba(160,40,130,0.32) 0%, rgba(120,28,98,0.12) 44%, rgba(10,10,10,0) 76%);
          }
          .sf-bg-r1 {
            left: -40%; right: -40%; top: 2%; height: 34%;
            transform: rotate(-11deg);
            background: radial-gradient(closest-side, rgba(226,116,194,0.32) 0%, rgba(170,45,140,0.14) 40%, rgba(10,10,10,0) 78%);
          }
          .sf-bg-r2 {
            left: -45%; right: -25%; top: 52%; height: 40%;
            transform: rotate(9deg);
            background: radial-gradient(closest-side, rgba(150,35,122,0.22) 0%, rgba(90,22,74,0.09) 42%, rgba(10,10,10,0) 78%);
          }
          .sf-bg-r3 {
            left: -20%; right: -20%; top: 14%; height: 9%;
            transform: rotate(-11deg);
            background: radial-gradient(closest-side, rgba(246,180,224,0.26) 0%, rgba(216,96,182,0.09) 45%, rgba(10,10,10,0) 80%);
          }
        }
      `}</style>
    </section>
  );
}
