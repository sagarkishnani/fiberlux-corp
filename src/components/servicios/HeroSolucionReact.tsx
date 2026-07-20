import { useTina, tinaField } from "tinacms/dist/react";
import type {
  ServiceQuery,
  ServiceQueryVariables,
} from "../../../tina/__generated__/types";
import DynamicFormReact from "../dynamic-form/DynamicFormReact";
import { mediaUrl } from "../../utils/mediaUrl";

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
  const serviciosHref = `${base}soluciones`.replace(/\/\/soluciones$/, "/soluciones");

  // SPEC 46: cada solución elige mostrar en el hero el formulario o una imagen
  // de categoría (a sangre a la derecha en desktop, de fondo arriba en mobile).
  const heroImageRaw = (hero as { heroImage?: string | null })?.heroImage;
  const isImageMode =
    (hero as { heroMode?: string | null })?.heroMode === "image" &&
    !!heroImageRaw;
  const heroImageSrc = mediaUrl(heroImageRaw);

  return (
    <section
      className={`relative overflow-hidden -mt-16 ${
        isImageMode ? "min-h-[560px] lg:min-h-[620px]" : ""
      }`}
      style={{ background: "#0a0a0a" }}
    >
      {isImageMode ? (
        <>
          {/* ── Modo imagen ── */}
          {/* Desktop: imagen a sangre a la derecha */}
          <div
            className="hidden lg:block absolute inset-0 z-0 bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url(${heroImageSrc})`,
              backgroundPosition: "right center",
            }}
            aria-hidden="true"
          />
          <div
            className="hidden lg:block absolute inset-0 z-0"
            style={{
              background:
                "linear-gradient(90deg, #0a0a0a 0%, rgba(10,10,10,0.85) 30%, rgba(10,10,10,0.35) 56%, rgba(10,10,10,0) 82%)",
            }}
            aria-hidden="true"
          />
          {/* Desktop: fade inferior para fundir la imagen con la sección de abajo */}
          <div
            className="hidden lg:block absolute inset-x-0 bottom-0 z-0 h-48"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,10,10,0) 0%, #0a0a0a 100%)",
            }}
            aria-hidden="true"
          />
          {/* Mobile: imagen de fondo arriba */}
          <div
            className="lg:hidden absolute inset-0 z-0 bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url(${heroImageSrc})`,
              backgroundPosition: "center top",
            }}
            aria-hidden="true"
          />
          <div
            className="lg:hidden absolute inset-0 z-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0.35) 34%, rgba(10,10,10,0.85) 74%, #0a0a0a 100%)",
            }}
            aria-hidden="true"
          />
        </>
      ) : (
        <>
          {/* ── Modo formulario (backdrop decorativo) ── */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url(${base}images/services/hero-img.png)`,
              backgroundPosition: "75% center",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                "linear-gradient(90deg, #0a0a0a 0%, rgba(10,10,10,0.72) 34%, rgba(10,10,10,0.15) 62%, rgba(10,10,10,0) 100%)",
            }}
            aria-hidden="true"
          />
        </>
      )}

      <div className="relative z-10 site-container pt-28 pb-20 lg:pt-36 lg:pb-8">
        <div
          className={`grid grid-cols-1 gap-12 lg:gap-16 items-center ${
            isImageMode ? "" : "lg:grid-cols-2"
          }`}
        >
          {/* ════ LEFT — content ════ */}
          <div className="max-w-[560px]">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-caption-sm text-greyscale mb-6">
              <a
                href={serviciosHref}
                className="hover:text-greyscale-white transition-colors"
              >
                Soluciones
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
                className="text-body-lg text-greyscale-light max-w-[480px] mb-8"
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

          {/* ════ RIGHT — "¿Conversamos?" form (solo modo formulario) ════ */}
          {!isImageMode && (
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
          )}
        </div>
      </div>
    </section>
  );
}
