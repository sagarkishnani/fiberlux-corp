import { useTina, tinaField } from "tinacms/dist/react";
import type {
  SubservicioQuery,
  SubservicioQueryVariables,
} from "../../../tina/__generated__/types";
import DynamicFormReact from "../dynamic-form/DynamicFormReact";

interface FormIsland {
  query: string;
  variables: { relativePath: string };
  data: any;
}

interface HeroSubservicioProps {
  query: string;
  variables: SubservicioQueryVariables;
  data: SubservicioQuery;
  form: FormIsland;
  prefill?: Record<string, string>;
}

export default function HeroSubservicioReact({
  query,
  variables,
  data: initialData,
  form,
  prefill,
}: HeroSubservicioProps) {
  const { data } = useTina<SubservicioQuery>({
    query,
    variables,
    data: initialData,
  });

  const sub = data?.subservicio;
  if (!sub) return null;

  const hero = sub.hero;
  const base = import.meta.env.BASE_URL || "/";
  const withBase = (path: string) =>
    `${base}${path}`.replace(/([^:])\/\//g, "$1/");
  const serviciosHref = withBase("soluciones");
  const solucionHref = sub.solucionSlug
    ? withBase(`soluciones/${sub.solucionSlug}`)
    : serviciosHref;

  return (
    <section
      className="relative overflow-hidden -mt-16"
      style={{ background: "#0a0a0a" }}
    >
      {/* Magenta gradient backdrop image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${base}images/services/hero-img.png)`,
          backgroundPosition: "75% center",
        }}
        aria-hidden="true"
      />
      {/* Dark overlay so the left-column copy stays legible */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(90deg, #0a0a0a 0%, rgba(10,10,10,0.72) 34%, rgba(10,10,10,0.15) 62%, rgba(10,10,10,0) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-16 pt-28 pb-20 lg:pt-36 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ════ LEFT — content ════ */}
          <div className="max-w-[560px]">
            {/* Breadcrumb (3 niveles) */}
            <nav className="flex flex-wrap items-center gap-2 text-caption-sm text-greyscale mb-6">
              <a
                href={serviciosHref}
                className="hover:text-greyscale-white transition-colors"
              >
                Servicios
              </a>
              <span>/</span>
              <a
                href={solucionHref}
                className="hover:text-greyscale-white transition-colors"
                data-tina-field={tinaField(sub, "solucionTitle")}
              >
                {sub.solucionTitle || "Solución"}
              </a>
              <span>/</span>
              <span
                className="text-greyscale-white"
                data-tina-field={tinaField(sub, "title")}
              >
                {sub.title}
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
                className="text-body-md text-greyscale-light max-w-[480px] mb-6"
                data-tina-field={tinaField(hero, "intro")}
              >
                {hero.intro}
              </p>
            )}

            {hero?.note && (
              <div
                className="max-w-[520px] mb-8 rounded-xl border-l-2 border-[#96237A] bg-white/[0.05] px-5 py-4"
                data-tina-field={tinaField(hero, "note")}
              >
                <p className="text-body-sm text-greyscale-light">{hero.note}</p>
              </div>
            )}

            {hero?.ctaLabel && (
              <a
                href="#contacto-servicios"
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
              prefill={prefill}
              hideHeader
            />
          </div>
        </div>
      </div>
    </section>
  );
}
