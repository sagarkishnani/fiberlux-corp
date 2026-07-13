import { useTina, tinaField } from "tinacms/dist/react";
import type {
  ServiciosQuery,
  ServiciosQueryVariables,
} from "../../../tina/__generated__/types";
import SplineScene from "../shared/SplineScene";

interface HeroServiciosProps {
  query: string;
  variables: ServiciosQueryVariables;
  data: ServiciosQuery;
}

export default function HeroServiciosReact({
  query,
  variables,
  data: initialData,
}: HeroServiciosProps) {
  const { data } = useTina<ServiciosQuery>({ query, variables, data: initialData });

  const page = data?.servicios;
  if (!page) return null;

  const base = import.meta.env.BASE_URL || "/";

  return (
    <section
      className="relative overflow-hidden -mt-16"
      style={{ background: "#0a0a0a" }}
    >
      {/* Ambient glow toward the right (where the 3D element will live) */}
      <div className="absolute inset-0 z-0 servicios-hero-glow" />

      <div className="relative z-10 site-container pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* ════ LEFT — informational chrome ════ */}
          <div className="max-w-[560px]">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-caption-sm text-greyscale mb-6">
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
              className="text-[32px] md:text-[44px] leading-[1.15] font-semibold text-greyscale-white mb-6"
              data-tina-field={tinaField(page, "heading")}
            >
              {page.heading}
            </h1>

            <p
              className="text-body-md text-greyscale-light max-w-[460px] mb-8"
              data-tina-field={tinaField(page, "intro")}
            >
              {page.intro}
            </p>

            {page.ctaLabel && (
              <a
                href="#contacto-servicios"
                className="inline-flex items-center justify-center px-7 py-4 rounded-full font-medium text-base transition-all duration-300 bg-[#96237A] hover:bg-[#650F50] text-white shadow-[0_8px_32px_-8px_rgba(150,35,122,0.6)] hover:shadow-[0_8px_32px_-4px_rgba(150,35,122,0.8)] hover:translate-y-[-1px]"
                data-tina-field={tinaField(page, "ctaLabel")}
              >
                {page.ctaLabel}
              </a>
            )}
          </div>

          {/* ════ RIGHT — elemento 3D (desktop) ════ */}
          <div
            className="hidden lg:block relative w-full"
            style={{ minHeight: 440 }}
          >
            {page.splineSceneUrl && (
              <SplineScene
                scene={page.splineSceneUrl}
                allowMobile={false}
                featherEdges
                className="absolute inset-0"
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        .servicios-hero-glow {
          background: radial-gradient(
            55% 70% at 82% 35%,
            rgba(150, 35, 122, 0.28) 0%,
            rgba(150, 35, 122, 0) 60%
          );
        }
        @media (max-width: 1023px) {
          .servicios-hero-glow {
            background: radial-gradient(
              80% 50% at 80% 12%,
              rgba(150, 35, 122, 0.22) 0%,
              rgba(150, 35, 122, 0) 60%
            );
          }
        }
      `}</style>
    </section>
  );
}
