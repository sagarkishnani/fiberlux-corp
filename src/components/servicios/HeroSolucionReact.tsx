import { useTina, tinaField } from "tinacms/dist/react";
import type {
  ServiceQuery,
  ServiceQueryVariables,
} from "../../../tina/__generated__/types";
import DynamicFormReact from "../dynamic-form/DynamicFormReact";

interface FormIsland {
  query: string;
  variables: { relativePath: string };
  data: any;
}

interface HeroSolucionProps {
  query: string;
  variables: ServiceQueryVariables;
  data: ServiceQuery;
  form: FormIsland;
}

export default function HeroSolucionReact({
  query,
  variables,
  data: initialData,
  form,
}: HeroSolucionProps) {
  const { data } = useTina<ServiceQuery>({ query, variables, data: initialData });

  const service = data?.service;
  if (!service) return null;

  const hero = service.hero;
  const base = import.meta.env.BASE_URL || "/";
  const serviciosHref = `${base}servicios`.replace(/\/\/servicios$/, "/servicios");

  return (
    <section
      className="relative overflow-hidden -mt-16"
      style={{ background: "#0a0a0a" }}
    >
      {/* Ambient magenta glow toward the right, behind the form */}
      <div className="absolute inset-0 z-0 solucion-hero-glow" />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-16 pt-28 pb-20 lg:pt-36 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ════ LEFT — content ════ */}
          <div className="max-w-[560px]">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-caption-sm text-greyscale mb-6">
              <a
                href={serviciosHref}
                className="hover:text-greyscale-white transition-colors"
              >
                Servicios
              </a>
              <span>/</span>
              <span
                className="text-greyscale-white"
                data-tina-field={tinaField(service, "title")}
              >
                {service.title}
              </span>
            </nav>

            {hero?.heading && (
              <h1
                className="text-[32px] md:text-[48px] leading-[1.12] font-semibold text-greyscale-white mb-6"
                data-tina-field={tinaField(hero, "heading")}
              >
                {hero.heading}
              </h1>
            )}

            {hero?.intro && (
              <p
                className="text-body-md text-greyscale-light max-w-[480px] mb-8"
                data-tina-field={tinaField(hero, "intro")}
              >
                {hero.intro}
              </p>
            )}

            {hero?.ctaLabel && (
              <a
                href="#catalogo"
                className="inline-flex items-center justify-center px-7 py-4 rounded-full font-medium text-base transition-all duration-300 bg-[#96237A] hover:bg-[#650F50] text-white shadow-[0_8px_32px_-8px_rgba(150,35,122,0.6)] hover:shadow-[0_8px_32px_-4px_rgba(150,35,122,0.8)] hover:translate-y-[-1px]"
                data-tina-field={tinaField(hero, "ctaLabel")}
              >
                {hero.ctaLabel}
              </a>
            )}
          </div>

          {/* ════ RIGHT — "¿Conversamos?" form ════ */}
          <div className="w-full rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-sm p-6 md:p-8">
            {hero?.formTitle && (
              <h2
                className="text-[22px] md:text-[26px] font-semibold text-greyscale-white mb-6"
                data-tina-field={tinaField(hero, "formTitle")}
              >
                {hero.formTitle}
              </h2>
            )}
            <DynamicFormReact
              query={form.query}
              variables={form.variables}
              data={form.data}
              hideHeader
            />
          </div>
        </div>
      </div>

      <style>{`
        .solucion-hero-glow {
          background: radial-gradient(
            60% 75% at 78% 40%,
            rgba(150, 35, 122, 0.30) 0%,
            rgba(150, 35, 122, 0) 62%
          );
        }
        @media (max-width: 1023px) {
          .solucion-hero-glow {
            background: radial-gradient(
              85% 45% at 80% 8%,
              rgba(150, 35, 122, 0.22) 0%,
              rgba(150, 35, 122, 0) 60%
            );
          }
        }
      `}</style>
    </section>
  );
}
