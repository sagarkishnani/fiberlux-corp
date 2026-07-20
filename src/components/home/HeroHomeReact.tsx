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

  // Fondo estático del hero en mobile (SPEC 44): en <lg no se carga el 3D
  // (problemas en mobile), se muestra esta imagen a sangre completa.
  const base = import.meta.env.BASE_URL || "/";
  const mobileCover = hero.splinePosterUrl
    ? `${base}${hero.splinePosterUrl}`.replace(/([^:])\/\//g, "$1/")
    : "";

  return (
    <section className="relative w-full min-h-[600px] lg:min-h-[820px] overflow-hidden bg-[#0a0a0a]">
      {/* Mobile (<lg): fondo estático a sangre completa en vez del 3D en vivo
          (que da problemas en mobile — SPEC 44). El Spline no se carga en mobile
          gracias a allowMobile={false} más abajo. */}
      {mobileCover && (
        <img
          src={mobileCover}
          alt=""
          aria-hidden="true"
          className="lg:hidden absolute z-0 inset-0 w-full h-full object-cover"
        />
      )}
      {/* Scrim mobile (<lg): oscurece el fondo estático para que el texto blanco
          se lea bien sobre el hexágono neón. Más denso arriba (donde va el
          contenido) y más ligero abajo. Solo mobile — en desktop el 3D + las
          vignettes ya dan contraste. */}
      <div
        aria-hidden="true"
        className="lg:hidden pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.55) 38%, rgba(10,10,10,0.4) 68%, rgba(10,10,10,0.55) 100%)",
        }}
      />
      {/* Capa de la escena 3D — SOLO desktop (lg+). En mobile se muestra la
          imagen de arriba en su lugar. En desktop ocupa todo (inset-0) y va al
          lado del texto. */}
      <div className="hidden lg:block absolute z-0 inset-x-0 bottom-0 top-[46%] md:top-0">
        {/* En desktop la escena se corre a la derecha (-40%) para que el 3D
            quede al lado del texto; en mobile eso empujaba el hexágono fuera de
            cuadro (detrás del texto), así que a sangre completa (right-0) para
            centrarlo debajo del contenido, como en el diseño. */}
        <div
          className="absolute top-0 bottom-0 left-0 right-0 md:right-[-40%]"
          style={{
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
          {/* Home va a sangre completa: sin poster (una captura se maximiza y
              recorta mal, peor en mobile). El glow ambiental de arriba cubre la
              carga; hideLoader evita que salga un spinner encima. */}
          <SplineScene
            scene={hero.splineSceneUrl}
            allowMobile={false}
            signalReady
            hideLoader
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
      <div className="pointer-events-none relative z-10 site-container pt-28 lg:pt-40 pb-16 lg:pb-32">
        <div className="flex flex-col justify-start md:justify-center max-w-[640px] min-h-0 lg:min-h-[640px]">
          <h1
            className="text-white leading-[1.05] tracking-[-0.02em] text-[clamp(2.125rem,9.5vw,2.75rem)] md:text-subtitle-xl"
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
