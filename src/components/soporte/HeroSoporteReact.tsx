import { useTina, tinaField } from "tinacms/dist/react";
import type {
  SoporteTecnicoQuery,
  SoporteTecnicoQueryVariables,
} from "../../../tina/__generated__/types";
import SplineScene from "../shared/SplineScene";

interface HeroSoporteProps {
  query: string;
  variables: SoporteTecnicoQueryVariables;
  data: SoporteTecnicoQuery;
}

export default function HeroSoporteReact({
  query,
  variables,
  data: initialData,
}: HeroSoporteProps) {
  const { data } = useTina<SoporteTecnicoQuery>({ query, variables, data: initialData });

  const page = data?.soporteTecnico;
  if (!page) return null;

  const base = import.meta.env.BASE_URL || "/";

  return (
    <section
      className="relative overflow-hidden -mt-16"
      style={{ background: "#0a0a0a" }}
    >
      {/* Ambient glow toward the right (where the 3D element will live) */}
      <div className="absolute inset-0 z-0 soporte-hero-glow" />

      <div className="relative z-10 site-container pt-28 pb-20 lg:pt-36 lg:pb-8">
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
              className="text-body-md text-greyscale-light max-w-[460px]"
              data-tina-field={tinaField(page, "intro")}
            >
              {page.intro}
            </p>
          </div>

          {/* ════ RIGHT — elemento 3D (desktop) ════ */}
          <div
            className="hidden lg:block relative w-full"
            style={{ minHeight: 440 }}
          >
            {page.splineSceneUrl && (
              <SplineScene
                scene={page.splineSceneUrl}
                poster={page.splinePosterUrl}
                allowMobile={false}
                featherEdges
                className="absolute inset-0"
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        .soporte-hero-glow {
          background: radial-gradient(
            55% 70% at 82% 35%,
            rgba(150, 35, 122, 0.28) 0%,
            rgba(150, 35, 122, 0) 60%
          );
        }
        @media (max-width: 1023px) {
          .soporte-hero-glow {
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
