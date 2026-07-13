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
      {/* Ambient purple glow rising from the bottom, per the Figma */}
      <div className="absolute inset-0 z-0 servicios-form-glow" />

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
        .servicios-form-glow {
          background:
            radial-gradient(52% 58% at 88% 4%, rgba(190, 70, 158, 0.42) 0%, rgba(150, 35, 122, 0) 55%),
            radial-gradient(40% 52% at 1% 55%, rgba(150, 35, 122, 0.34) 0%, rgba(150, 35, 122, 0) 62%),
            radial-gradient(48% 46% at 22% 108%, rgba(150, 35, 122, 0.22) 0%, rgba(150, 35, 122, 0) 60%);
        }
        @media (max-width: 1023px) {
          .servicios-form-glow {
            background:
              radial-gradient(70% 30% at 82% 2%, rgba(190, 70, 158, 0.38) 0%, rgba(150, 35, 122, 0) 55%),
              radial-gradient(80% 26% at 10% 60%, rgba(150, 35, 122, 0.30) 0%, rgba(150, 35, 122, 0) 62%);
          }
        }
      `}</style>
    </section>
  );
}
