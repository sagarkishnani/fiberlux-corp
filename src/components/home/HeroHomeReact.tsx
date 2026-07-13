import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery } from "../../../tina/__generated__/types";
import SplineScene from "../shared/SplineScene";

interface HeroHomeProps {
  query: string;
  variables: { relativePath: string };
  data: HomeQuery;
}

export default function HeroHomeReact({
  query,
  variables,
  data: initialData,
}: HeroHomeProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });
  const hero = data?.home?.hero || initialData?.home?.hero;

  if (!hero) return null;

  const buttons = (hero.buttons || []).filter(Boolean);

  return (
    <section className="relative w-full min-h-[100svh] lg:min-h-[820px] overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute top-0 bottom-0 left-0"
          style={{
            right: "-40%",
            willChange: "transform",
            contain: "layout paint",
            transform: "translateZ(0)",
          }}
        >
          {/* Fondo ambiental (siempre detrás de la escena / loader) */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 70% 50%, rgba(150,35,122,0.2) 0%, transparent 70%)",
            }}
          />

          {/* Escena 3D (carga condicional + loader + revelación + pausa) */}
          <SplineScene
            scene={hero.splineSceneUrl}
            className="absolute inset-0"
          />
        </div>
      </div>

      {/* Vignette izquierda */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.25) 35%, rgba(10,10,10,0) 60%)",
        }}
      />

      {/* Vignette inferior — fade largo y suave para empalmar con la sección siguiente */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 md:h-80 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.5) 45%, rgba(10,10,10,0.85) 75%, #0a0a0a 100%)",
        }}
      />

      {/* Contenido */}
      <div className="pointer-events-none relative z-10 site-container pt-28 lg:pt-40 pb-20 lg:pb-32">
        <div className="flex flex-col justify-center max-w-[640px] min-h-[calc(100svh-200px)] lg:min-h-[640px]">
          <h1
            className="text-white leading-[1.05] tracking-[-0.02em] text-subtitle-lg md:text-subtitle-xl"
            data-tina-field={tinaField(hero, "title")}
          >
            {hero.title}
          </h1>

          {hero.subtitle && (
            <p
              className="mt-6 text-white text-body-lg leading-relaxed max-w-[480px]"
              data-tina-field={tinaField(hero, "subtitle")}
            >
              {hero.subtitle}
            </p>
          )}

          {buttons.length > 0 && (
            <div className="mt-8 lg:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              {buttons.map((btn, i) => {
                if (!btn) return null;
                const isPrimary = btn.variant !== "secondary";
                const baseClasses =
                  "group pointer-events-auto inline-flex items-center justify-center px-7 py-4 rounded-full font-medium text-base transition-all duration-300";
                const variantClasses = isPrimary
                  ? "bg-[#96237A] hover:bg-[#650F50] text-white shadow-[0_8px_32px_-8px_rgba(150,35,122,0.6)] hover:shadow-[0_8px_32px_-4px_rgba(150,35,122,0.8)] hover:translate-y-[-1px]"
                  : "border border-white/80 hover:border-white bg-transparent hover:bg-white/5 text-white backdrop-blur-sm";
                return (
                  <a
                    key={i}
                    href={btn.url || "#"}
                    data-tina-field={tinaField(btn as any, "text")}
                    className={`${baseClasses} ${variantClasses}`}
                  >
                    {btn.text}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
