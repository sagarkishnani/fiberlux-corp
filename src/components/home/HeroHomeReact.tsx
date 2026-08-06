import { useEffect, useRef, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery } from "../../../tina/__generated__/types";
import { tField, localizeHref } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import SplineScene from "../shared/SplineScene";
import { mediaUrl } from "../../utils/mediaUrl";
import Button from "../shared/Button";
import WaveformEffect from "../effects/WaveformEffect";
import NodeField from "../effects/NodeField";
import MorphSolutions, {
  type MorphNode,
  type MorphHandle,
} from "../effects/MorphSolutions";

// Nodos-solución por defecto (si el CMS no los define): las 4 soluciones.
const DEFAULT_MORPH_NODES = [
  { label: "Data Center & Cloud", url: "/soluciones/data-center-cloud", icon: "datacenter" },
  { label: "Conectividad Empresarial", url: "/soluciones/conectividad-empresarial", icon: "conectividad" },
  { label: "Ciberseguridad Gestionada", url: "/soluciones/ciberseguridad-gestionada", icon: "ciberseguridad" },
  { label: "Servicios Gestionados", url: "/soluciones/servicios-gestionados", icon: "gestionados" },
];

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

  // Modo morph: el gráfico (globo) es el disparador por click; aquí desvanecemos
  // el contenido del hero al salir de reposo y exponemos un botón sr-only para
  // disparar por teclado (accesibilidad).
  const morphRef = useRef<MorphHandle>(null);
  const [morphActive, setMorphActive] = useState(false);

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

  // Nodos-solución del modo morph: del CMS (hero.morph.solutionNodes) o el default.
  const morphRaw = ((hero as any).morph?.solutionNodes as any[])?.filter(Boolean);
  const morphNodes: MorphNode[] = (
    morphRaw?.length ? morphRaw : DEFAULT_MORPH_NODES
  )
    .slice(0, 4)
    .map((n) => ({
      label: tField(n, "label", locale) || "",
      url: localizeHref(n.url || "#", locale),
      icon: n.icon,
    }));
  const morphTriggerLabel =
    tField((hero as any).morph || {}, "triggerLabel", locale) ||
    (locale === "en" ? "Explore our solutions" : "Explora nuestras soluciones");
  // Logo FIBERLUX (BASE_URL-aware) para el lockup del hero y el chip central.
  const logoAsset = `${import.meta.env.BASE_URL}images/logo/fiberlux.svg`.replace(
    /\/{2,}/g,
    "/"
  );

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

      {/* Modo waveform (SPEC 88): shader WebGL2 a sangre, animado también en
          mobile. Base #0a0a0a incluida en el propio shader. */}
      {mode === "waveform" && (
        <div className="absolute inset-0 z-0">
          <WaveformEffect className="h-full w-full" signalReady />
        </div>
      )}

      {/* Modo node field: red de partículas plexus (canvas 2D, morado).
          Transparente sobre el negro base de la sección. */}
      {mode === "nodefield" && (
        <div className="absolute inset-0 z-0">
          <NodeField className="h-full w-full" signalReady />
        </div>
      )}

      {/* Modo morph (SPEC 96): globo de partículas (Three.js) que al pulsar el
          trigger morphea a 4 nodos-solución clicables y vuelve solo a los ~6 s.
          z-[2] para quedar sobre las vignettes (nodos nítidos y clicables) y
          bajo el contenido z-10 (que se desvanece durante el morph). */}
      {mode === "morph" && (
        <div className="absolute inset-0 z-[2]">
          <MorphSolutions
            ref={morphRef}
            className="h-full w-full"
            nodes={morphNodes}
            logoSrc={logoAsset}
            signalReady
            onPhaseChange={(p) => {
              const active = p !== "idle";
              setMorphActive(active);
              // El header oculta su logo grande mientras se muestran las soluciones.
              if (typeof window !== "undefined")
                window.dispatchEvent(
                  new CustomEvent("fbx:hero-morph", { detail: { active } })
                );
            }}
          />
        </div>
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

      {/* Vignette inferior — fade largo que apaga el waveform a negro sólido bien
          antes del borde, para empalmar sin costura ni rayas con la sección siguiente. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-80 md:h-[26rem] z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.45) 38%, rgba(10,10,10,0.82) 60%, #0a0a0a 80%, #0a0a0a 100%)",
        }}
      />

      {/* ══════════ Contenido (z-10) — centrado (SPEC 88) ══════════ */}
      <div className="pointer-events-none relative z-10 site-container pt-28 lg:pt-40 pb-16 lg:pb-32">
        <div
          className={
            mode === "morph"
              ? "flex flex-col items-center text-center lg:items-start lg:text-left justify-start md:justify-center max-w-[760px] lg:max-w-[540px] mx-auto lg:mx-0 min-h-0 lg:min-h-[640px]"
              : "mx-auto flex flex-col items-center text-center justify-start md:justify-center max-w-[760px] min-h-0 lg:min-h-[640px]"
          }
          style={
            mode === "morph"
              ? {
                  transition: "opacity 0.5s ease",
                  opacity: morphActive ? 0 : 1,
                  pointerEvents: morphActive ? "none" : undefined,
                }
              : undefined
          }
        >
          <h1
            className="text-white leading-[1.05] tracking-[-0.02em] text-[clamp(2.125rem,9.5vw,2.75rem)] md:text-subtitle-xl"
            data-tina-field={tinaField(hero, "title")}
          >
            {tField(hero as any, "title", locale)}
          </h1>

          {hero.subtitle && (
            <p
              className={`mt-6 text-white text-body-lg leading-relaxed max-w-[520px] mx-auto ${
                mode === "morph" ? "lg:mx-0" : ""
              }`}
              data-tina-field={tinaField(hero, "subtitle")}
            >
              {tField(hero as any, "subtitle", locale)}
            </p>
          )}

          {buttons.length > 0 && (
            <div
              className={`mt-8 lg:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center w-full sm:w-auto ${
                mode === "morph" ? "lg:justify-start" : ""
              }`}
            >
              {buttons.map((btn, i) => {
                if (!btn) return null;
                const isPrimary = btn.variant !== "secondary";
                return (
                  <Button
                    key={i}
                    variant={isPrimary ? "primary" : "secondary"}
                    href={btn.url || "#"}
                    data-tina-field={tinaField(btn as any, "text")}
                    className="pointer-events-auto w-full sm:w-auto"
                  >
                    {tField(btn as any, "text", locale)}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Modo morph: botón sr-only para disparar por teclado (accesibilidad);
              visualmente el disparador es el propio gráfico (click). */}
          {mode === "morph" && (
            <button
              type="button"
              onClick={() => morphRef.current?.trigger()}
              className="pointer-events-auto sr-only focus:not-sr-only focus:mt-6 focus:rounded-full focus:border focus:border-[#ce66b8] focus:px-5 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.14em] focus:text-white"
            >
              {morphTriggerLabel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
