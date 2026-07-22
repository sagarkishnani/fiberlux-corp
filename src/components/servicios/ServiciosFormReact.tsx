import { useTina, tinaField } from "tinacms/dist/react";
import type {
  ServiciosQuery,
  ServiciosQueryVariables,
} from "../../../tina/__generated__/types";
import DynamicFormReact from "../dynamic-form/DynamicFormReact";

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
}

export default function ServiciosFormReact({
  query,
  variables,
  data: initialData,
  form,
  prefill,
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
      {/* Ambient purple glow rising from the bottom, per the Figma.
          Máscara vertical: DESVANECE el glow hacia los bordes sup/inf de la sección
          para que no se corte en seco contra las secciones vecinas. */}
      <div
        className="absolute inset-0 z-0 servicios-form-glow"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 10%, #000 82%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 10%, #000 82%, transparent 100%)",
        }}
      />

      <div className="relative z-10 site-container py-14 md:py-20 lg:py-28">
        {/* ════ Heading (editable from the servicios collection) ════ */}
        <div className="max-w-[720px] mx-auto text-center mb-10 lg:mb-14">
          <h2
            className="text-[28px] md:text-[40px] leading-[1.2] font-semibold text-greyscale-white mb-4"
            data-tina-field={tinaField(page, "formTitle")}
          >
            {page.formTitle}
          </h2>
          {page.formSubtitle && (
            <p
              className="text-body-md text-greyscale-light"
              data-tina-field={tinaField(page, "formSubtitle")}
            >
              {page.formSubtitle}
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
          />
        </div>
      </div>

      <style>{`
        /* obs_15: degradé de fondo más notorio (alphas subidos). */
        .servicios-form-glow {
          background:
            radial-gradient(56% 62% at 88% 2%, rgba(198, 78, 166, 0.62) 0%, rgba(150, 35, 122, 0) 58%),
            radial-gradient(46% 56% at 0% 52%, rgba(160, 40, 130, 0.52) 0%, rgba(150, 35, 122, 0) 64%),
            radial-gradient(52% 50% at 20% 110%, rgba(150, 35, 122, 0.38) 0%, rgba(150, 35, 122, 0) 62%);
        }
        @media (max-width: 1023px) {
          .servicios-form-glow {
            background:
              radial-gradient(75% 34% at 82% 1%, rgba(198, 78, 166, 0.55) 0%, rgba(150, 35, 122, 0) 58%),
              radial-gradient(85% 30% at 8% 60%, rgba(160, 40, 130, 0.45) 0%, rgba(150, 35, 122, 0) 64%);
          }
        }
      `}</style>
    </section>
  );
}
