import { useTina, tinaField } from "tinacms/dist/react";
import type {
  CasosDeExitoQuery,
  CasosDeExitoQueryVariables,
} from "../../../tina/__generated__/types";

interface HeroCasosProps {
  query: string;
  variables: CasosDeExitoQueryVariables;
  data: CasosDeExitoQuery;
}

export default function HeroCasosReact({
  query,
  variables,
  data: initialData,
}: HeroCasosProps) {
  const { data } = useTina<CasosDeExitoQuery>({
    query,
    variables,
    data: initialData,
  });

  const page = data?.casosDeExito;
  if (!page) return null;

  const base = import.meta.env.BASE_URL || "/";
  // Falls back to the shared services magenta backdrop when no hero image is set.
  const heroImage = page.heroImage || `${base}images/services/hero-img.png`;

  return (
    <section
      className="relative overflow-hidden -mt-16"
      style={{ background: "#0a0a0a" }}
    >
      {/* Magenta gradient backdrop image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${heroImage})`,
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

      <div className="relative z-10 site-container pt-40 pb-24 lg:pt-48 lg:pb-10">
        <div className="max-w-[600px]">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-caption-sm text-greyscale mb-8">
            <a href={base} className="hover:text-greyscale-white transition-colors">
              Inicio
            </a>
            <span>/</span>
            <span
              className="text-greyscale-white"
              data-tina-field={tinaField(page, "breadcrumb")}
            >
              {page.breadcrumb}
            </span>
          </nav>

          <h1
            className="text-[40px] md:text-[56px] leading-[1.15] font-medium text-greyscale-white mb-6 tracking-[-1.6px]"
            data-tina-field={tinaField(page, "heading")}
          >
            {page.heading}
          </h1>

          <p
            className="text-body-lg text-greyscale-light max-w-[560px]"
            data-tina-field={tinaField(page, "intro")}
          >
            {page.intro}
          </p>
        </div>
      </div>
    </section>
  );
}
