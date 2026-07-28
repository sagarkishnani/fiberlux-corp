import { useEffect, useRef, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery } from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import SplineScene from "../shared/SplineScene";
import { mediaUrl } from "../../utils/mediaUrl";

interface HeroHomeProps {
  query: string;
  variables: { relativePath: string };
  data: HomeQuery;
  locale?: Locale;
}

// Señal para el preloader del Home (SitePreloader escucha este evento para
// ocultarse). En modo 3D lo dispara SplineScene; en video/imagen, el medio.
function signalHeroReady() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
}

export default function HeroHomeReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: HeroHomeProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });
  const hero = data?.home?.hero || initialData?.home?.hero;

  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduceMotion(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    );
  }, []);

  // Fondo en modo video: fija `muted` por propiedad (React no lo refleja en SSR)
  // y reproduce si no hay reduce-motion.
  const mode = ((hero as any)?.heroBackground as string) || "3d";
  useEffect(() => {
    const el = bgVideoRef.current;
    if (!el) return;
    el.muted = true;
    if (!reduceMotion) el.play().catch(() => {});
    else el.pause();
  }, [reduceMotion, mode]);

  if (!hero) return null;

  const buttons = (hero.buttons || []).filter(Boolean);

  // Opacidad del medio de fondo (video/imagen). Default 60%.
  const bgOpacity = Math.max(
    0,
    Math.min(100, (hero as any).heroBgOpacity ?? 60)
  ) / 100;
  const bgVideo = mediaUrl((hero as any).heroBgVideo);
  const bgImage = mediaUrl((hero as any).heroBgImage);

  // Imagen estática a sangre del modo 3D en mobile (SPEC 44).
  const mobileCover = mediaUrl(hero.splinePosterUrl);

  return (
    <section className="relative w-full min-h-[600px] lg:min-h-[820px] overflow-hidden bg-[#0a0a0a]">
      {/* ══════════ FONDO (z-0) según el modo elegido ══════════ */}

      {mode === "video" && bgVideo && (
        <video
          ref={bgVideoRef}
          src={bgVideo}
          autoPlay={!reduceMotion}
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          suppressHydrationWarning
          onCanPlay={signalHeroReady}
          className="absolute inset-0 z-0 w-full h-full object-cover"
          style={{ opacity: bgOpacity, pointerEvents: "none" }}
        />
      )}

      {mode === "imagen" && bgImage && (
        <img
          src={bgImage}
          alt=""
          aria-hidden="true"
          draggable={false}
          onLoad={signalHeroReady}
          className="absolute inset-0 z-0 w-full h-full object-cover"
          style={{ opacity: bgOpacity }}
        />
      )}

      {mode === "3d" && (
        <>
          {/* Mobile (<lg): fondo estático a sangre en vez del 3D en vivo
              (SPEC 44). El Spline no se carga en mobile (allowMobile={false}). */}
          {mobileCover && (
            <img
              src={mobileCover}
              alt=""
              aria-hidden="true"
              className="lg:hidden absolute z-0 inset-0 w-full h-full object-cover"
            />
          )}
          {/* Scrim mobile (<lg): oscurece el fondo estático para que el texto
              blanco se lea bien. Solo mobile — en desktop el 3D + vignettes ya
              dan contraste. */}
          <div
            aria-hidden="true"
            className="lg:hidden pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.55) 38%, rgba(10,10,10,0.4) 68%, rgba(10,10,10,0.55) 100%)",
            }}
          />
          {/* Capa de la escena 3D — SOLO desktop (lg+). */}
          <div className="hidden lg:block absolute z-0 inset-x-0 bottom-0 top-[46%] md:top-0">
            {/* En desktop la escena se corre a la derecha (-40%) para que quede
                al lado del texto. */}
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
              <SplineScene
                scene={hero.splineSceneUrl}
                allowMobile={false}
                signalReady
                hideLoader
                className="absolute inset-0"
              />
            </div>
          </div>
        </>
      )}

      {/* ══════════ Vignettes (z-[1]) — para legibilidad, en todos los modos ══════════ */}
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

      {/* ══════════ Contenido (z-10) ══════════ */}
      <div className="pointer-events-none relative z-10 site-container pt-28 lg:pt-40 pb-16 lg:pb-32">
        <div className="flex flex-col justify-start md:justify-center max-w-[640px] min-h-0 lg:min-h-[640px]">
          <h1
            className="text-white leading-[1.05] tracking-[-0.02em] text-[clamp(2.125rem,9.5vw,2.75rem)] md:text-subtitle-xl"
            data-tina-field={tinaField(hero, "title")}
          >
            {tField(hero as any, "title", locale)}
          </h1>

          {hero.subtitle && (
            <p
              className="mt-6 text-white text-body-lg leading-relaxed max-w-[480px]"
              data-tina-field={tinaField(hero, "subtitle")}
            >
              {tField(hero as any, "subtitle", locale)}
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
                    {tField(btn as any, "text", locale)}
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
