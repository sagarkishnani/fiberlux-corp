import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery } from "../../../tina/__generated__/types";
import { tField, localizeHref } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import SplineScene from "../shared/SplineScene";
import { mediaUrl } from "../../utils/mediaUrl";
import Button from "../shared/Button";
import WaveformEffect from "../effects/WaveformEffect";
import NodeField from "../effects/NodeField";
import CinematicBackground from "../effects/CinematicBackground";
import HeroLogoIntro from "./HeroLogoIntro";
// MorphSolutions arrastra Three.js (~508 KB sin comprimir). El hero sólo lo usa
// en `heroBackground: "morph"`, así que se carga en diferido: con cualquier otro
// modo (hoy el home va en "cinematic") Three no llega ni a descargarse.
const MorphSolutions = lazy(() => import("../effects/MorphSolutions"));
import type { MorphNode, MorphHandle } from "../effects/MorphSolutions";

// Duración del bloqueo de scroll durante la intro cinematográfica: cubre el
// morph del wordmark FLX→FIBERLUX (~1.4s: hold 420ms + morph 1000ms) y el
// escalonado de titular/subtítulo/botones, para no dejar scrollear hasta que
// los elementos de arriba terminen de animarse.
const INTRO_SCROLL_LOCK_MS = 1700;

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
  // Titular (modo cinematic): se revela línea por línea con un barrido de luz.
  const titleRef = useRef<HTMLHeadingElement>(null);
  // Contenido del hero (modo cinematic): parallax/fade al hacer scroll.
  const contentRef = useRef<HTMLDivElement>(null);

  // Modo cinematic: coreografía de entrada — el contenido (y el header) aparecen
  // escalonados tras montar. `intro` false = oculto; true = revelado.
  const [intro, setIntro] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduceMotion(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    );
  }, []);

  // Fondo en modo video: fija `muted` por propiedad (React no lo refleja en SSR)
  // y reproduce si no hay reduce-motion.
  const mode = ((hero as any)?.heroBackground as string) || "3d";

  // Dispara la entrada cinematográfica del contenido (modo cinematic). El
  // header se revela por CSS desde el SSR (BaseLayout `.cine-intro-page`).
  useEffect(() => {
    if (mode !== "cinematic" || typeof window === "undefined") return;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduce) {
      setIntro(true);
      return;
    }
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setIntro(true))
    );
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  // Bloqueo de scroll durante la intro cinematográfica: al cargar el home no se
  // permite scrollear hasta que el wordmark FIBERLUX y el contenido de arriba
  // terminen de animar. Solo si se está en el tope de la página (no cuando se
  // llega a un ancla) y sin reduced-motion.
  useEffect(() => {
    if (mode !== "cinematic" || typeof window === "undefined") return;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduce) return;
    if (window.scrollY > 4) return; // ya scrolleó / llegó a un ancla: no bloquear

    const lenis = (window as any).__lenis;
    lenis?.stop?.();

    const prevent = (e: Event) => e.preventDefault();
    const SCROLL_KEYS = [
      "ArrowDown",
      "ArrowUp",
      "PageDown",
      "PageUp",
      "Home",
      "End",
      " ",
      "Spacebar",
    ];
    const onKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.includes(e.key)) e.preventDefault();
    };
    window.addEventListener("wheel", prevent, { passive: false });
    window.addEventListener("touchmove", prevent, { passive: false });
    window.addEventListener("keydown", onKey, { passive: false });

    const release = () => {
      lenis?.start?.();
      window.removeEventListener("wheel", prevent);
      window.removeEventListener("touchmove", prevent);
      window.removeEventListener("keydown", onKey);
    };
    const t = window.setTimeout(release, INTRO_SCROLL_LOCK_MS);
    return () => {
      clearTimeout(t);
      release();
    };
  }, [mode]);

  // Barrido del titular línea por línea: agrupa las palabras por línea (según su
  // posición real tras el wrap) y les asigna un delay escalonado (línea + palabra).
  useEffect(() => {
    if (mode !== "cinematic" || typeof window === "undefined") return;
    // Mobile: sin barrido de letras (se sentía lag); el CSS las deja visibles.
    if (window.matchMedia?.("(max-width: 767px)").matches) return;
    const h1 = titleRef.current;
    if (!h1) return;
    const words = Array.from(
      h1.querySelectorAll<HTMLElement>(".cine-word")
    );
    if (!words.length) return;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduce) {
      words.forEach((w) => w.classList.add("cine-animate"));
      return;
    }
    const lines = new Map<number, HTMLElement[]>();
    words.forEach((w) => {
      const top = w.offsetTop;
      if (!lines.has(top)) lines.set(top, []);
      lines.get(top)!.push(w);
    });
    const tops = [...lines.keys()].sort((a, b) => a - b);
    const base = 300,
      lineGap = 480,
      wordGap = 55;
    tops.forEach((top, li) => {
      lines.get(top)!.forEach((w, wi) => {
        w.style.setProperty("--wd", `${base + li * lineGap + wi * wordGap}ms`);
        w.classList.add("cine-animate");
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, locale]);

  // Parallax de scroll del contenido del hero (modo cinematic): al bajar, el
  // texto/botones derivan y se desvanecen (transición de salida del hero).
  useEffect(() => {
    if (mode !== "cinematic" || typeof window === "undefined") return;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduce) return;
    // Mobile: sin el parallax/desvanecimiento del hero al scrollear hacia
    // soluciones (no se veía bien); el hero se va con el scroll natural.
    if (window.matchMedia?.("(max-width: 767px)").matches) return;
    const el = contentRef.current;
    const section = el?.closest("section");
    if (!el || !section) return;
    let ticking = false;
    const apply = () => {
      ticking = false;
      const rect = section.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height)));
      el.style.transform = `translateY(${p * 70}px)`;
      el.style.opacity = String(Math.max(0, 1 - p * 1.15));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };
    el.style.willChange = "transform, opacity";
    window.addEventListener("scroll", onScroll, { passive: true });
    apply();
    return () => window.removeEventListener("scroll", onScroll);
  }, [mode]);
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

  // Tokens flotantes del modo cinematic (SPEC 97): del CMS o el default del island.
  const cinematicTokens: string[] = (
    ((hero as any).cinematic?.floatingTokens as any[]) || []
  )
    .map((t) => (t?.text || "").trim())
    .filter(Boolean);
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

  // Coreografía de entrada (modo cinematic): revela con stagger cada elemento.
  const cine = mode === "cinematic";
  const titleText = (tField(hero as any, "title", locale) as string) || "";
  const revealStyle = (delayMs: number): CSSProperties | undefined =>
    cine
      ? {
          opacity: intro ? 1 : 0,
          transform: intro ? "none" : "translateY(22px)",
          transition:
            "opacity 0.85s cubic-bezier(.2,.7,.2,1), transform 0.85s cubic-bezier(.2,.7,.2,1)",
          transitionDelay: `${delayMs}ms`,
          willChange: "opacity, transform",
        }
      : undefined;

  return (
    <section
      className={`relative w-full overflow-hidden bg-[#0a0a0a] ${
        mode === "morph"
          ? "min-h-[100svh] md:min-h-[820px] lg:min-h-[900px]"
          : mode === "cinematic"
          ? // Mobile: hero a pantalla completa con el contenido centrado
            // verticalmente (ver el div de contenido). Desktop, hero alto.
            "min-h-[100svh] md:min-h-[820px] lg:min-h-[900px]"
          : "min-h-[600px] lg:min-h-[820px]"
      }`}
    >
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
          <Suspense fallback={null}>
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
          </Suspense>
        </div>
      )}

      {/* Modo cinematic (SPEC 97): god-rays + tokens de conectividad flotantes +
          polvo de luz (atmósfera tipo FXology en morado). Transparente sobre el
          negro base. z-0 detrás de las vignettes y del contenido. */}
      {mode === "cinematic" && (
        <div className="absolute inset-0 z-0">
          <CinematicBackground
            className="h-full w-full"
            iconKeys={morphNodes.map((n) => n.icon).filter(Boolean) as string[]}
            signalReady
          />
        </div>
      )}

      {/* Intro del wordmark FLX → FIBERLUX al cargar (SPEC 97, desktop). */}
      {mode === "cinematic" && <HeroLogoIntro />}

      {/* Modo cinematic — SOLO mobile: velo oscuro sobre el fondo para que el
          efecto no compita con el título/descripción (en desktop hay espacio a
          los costados, así que no se aplica). */}
      {mode === "cinematic" && (
        <div
          aria-hidden="true"
          className="lg:hidden pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 42%, rgba(10,10,10,0.62) 0%, rgba(10,10,10,0.5) 45%, rgba(10,10,10,0.32) 100%)",
          }}
        />
      )}

      {/* Modo cinematic — desktop: leve oscurecimiento detrás del título/desc/botones
          (que quedan sobre el centro brillante del globo) para que se lean mejor. */}
      {mode === "cinematic" && (
        <div
          aria-hidden="true"
          className="hidden lg:block pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(52% 42% at 50% 56%, rgba(10,10,10,0.78) 0%, rgba(10,10,10,0.6) 46%, rgba(10,10,10,0.24) 72%, rgba(10,10,10,0) 90%)",
          }}
        />
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

      {/* Modo morph: luces de color animadas en zonas del hero (dinamismo).
          Blend screen sobre el negro; se ubican en esquinas/izquierda para no
          restar legibilidad al texto. */}
      {mode === "morph" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        >
          <span className="morph-light morph-light--a" />
          <span className="morph-light morph-light--b" />
          <span className="morph-light morph-light--c" />
          <span className="morph-light morph-light--d" />
          <style>{`
            .morph-light {
              position: absolute;
              border-radius: 9999px;
              filter: blur(70px);
              mix-blend-mode: screen;
              will-change: transform, opacity;
            }
            .morph-light--a {
              width: 42vw; max-width: 460px; aspect-ratio: 1;
              left: -8%; top: 6%;
              background: radial-gradient(circle, rgba(150,35,122,0.55), transparent 70%);
              animation: morph-light-a 15s ease-in-out infinite;
            }
            .morph-light--b {
              width: 34vw; max-width: 380px; aspect-ratio: 1;
              left: 4%; bottom: -12%;
              background: radial-gradient(circle, rgba(214,77,184,0.5), transparent 70%);
              animation: morph-light-b 19s ease-in-out infinite;
            }
            .morph-light--c {
              width: 30vw; max-width: 340px; aspect-ratio: 1;
              right: 30%; top: -10%;
              background: radial-gradient(circle, rgba(101,15,80,0.65), transparent 70%);
              animation: morph-light-c 17s ease-in-out infinite;
            }
            .morph-light--d {
              width: 26vw; max-width: 300px; aspect-ratio: 1;
              right: 4%; bottom: 8%;
              background: radial-gradient(circle, rgba(122,40,150,0.5), transparent 70%);
              animation: morph-light-d 21s ease-in-out infinite;
            }
            @keyframes morph-light-a {
              0%,100% { transform: translate(0,0) scale(1); opacity: 0.35; }
              50% { transform: translate(6%, 5%) scale(1.18); opacity: 0.6; }
            }
            @keyframes morph-light-b {
              0%,100% { transform: translate(0,0) scale(1.05); opacity: 0.3; }
              50% { transform: translate(8%, -6%) scale(1); opacity: 0.55; }
            }
            @keyframes morph-light-c {
              0%,100% { transform: translate(0,0) scale(1); opacity: 0.3; }
              50% { transform: translate(-6%, 8%) scale(1.2); opacity: 0.5; }
            }
            @keyframes morph-light-d {
              0%,100% { transform: translate(0,0) scale(1.1); opacity: 0.25; }
              50% { transform: translate(-8%, -5%) scale(1); opacity: 0.5; }
            }
            @media (prefers-reduced-motion: reduce) {
              .morph-light { animation: none !important; }
            }
          `}</style>
        </div>
      )}

      {/* ══════════ Contenido (z-10) — centrado (SPEC 88) ══════════ */}
      <div
        className={`pointer-events-none relative z-10 site-container pt-28 pb-16 lg:pb-32 ${
          mode === "cinematic" ? "lg:pt-[13rem]" : "lg:pt-40"
        }`}
      >
        <div
          ref={contentRef}
          className={
            mode === "morph"
              ? "flex flex-col items-center text-center lg:items-start lg:text-left justify-start md:justify-center max-w-[760px] lg:max-w-[540px] mx-auto lg:mx-0 min-h-0 lg:min-h-[640px]"
              : mode === "cinematic"
              ? // Mobile: llena el hero (100svh − padding) y centra el contenido
                // verticalmente. Desktop: se baja un poco (pt mayor + min-h menor)
                // para despegar el titular del arco de luz del planeta.
                "mx-auto flex flex-col items-center text-center justify-center max-w-[760px] min-h-[calc(100svh-11rem)] lg:min-h-[600px]"
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
          {/* Modo cinematic: titular con glow morado + barrido de luz (SPEC 97). */}
          {mode === "cinematic" && (
            <style>{`
              /* Frente de revelado por palabra (barrido izq→der, línea por línea). */
              @property --cine-rev {
                syntax: '<percentage>';
                initial-value: -30%;
                inherits: false;
              }
              .cine-headline { color: #fff; }
              .cine-word {
                display: inline-block;
                color: #fff;
                /* Oculto hasta que se anima (frente de luz que lo dibuja). */
                -webkit-mask-image: linear-gradient(90deg,
                  #000 0%, #000 var(--cine-rev),
                  rgba(0,0,0,0) calc(var(--cine-rev) + 22%));
                mask-image: linear-gradient(90deg,
                  #000 0%, #000 var(--cine-rev),
                  rgba(0,0,0,0) calc(var(--cine-rev) + 22%));
              }
              .cine-word.cine-animate {
                animation: cine-reveal 0.85s cubic-bezier(.4,0,.2,1) both;
                animation-delay: var(--wd, 0ms);
              }
              @keyframes cine-reveal {
                from { --cine-rev: -30%; }
                to { --cine-rev: 130%; }
              }
              @media (prefers-reduced-motion: reduce) {
                .cine-word { --cine-rev: 130%; }
                .cine-word.cine-animate { animation: none; }
              }
              /* Mobile: sin animación de entrada letra por letra (se sentía lag);
                 las palabras aparecen ya visibles. */
              @media (max-width: 767px) {
                .cine-word { --cine-rev: 130%; }
                .cine-word.cine-animate { animation: none; }
              }
            `}</style>
          )}

          <h1
            ref={titleRef}
            className={`leading-[1.05] tracking-[-0.02em] text-[clamp(2.125rem,9.5vw,2.75rem)] md:text-subtitle-xl ${
              mode === "cinematic" ? "cine-headline text-white" : "text-white"
            }`}
            data-tina-field={tinaField(hero, "title")}
          >
            {mode === "cinematic"
              ? titleText.split(" ").flatMap((w, i, arr) =>
                  i < arr.length - 1
                    ? [
                        <span key={i} className="cine-word">
                          {w}
                        </span>,
                        " ",
                      ]
                    : [
                        <span key={i} className="cine-word">
                          {w}
                        </span>,
                      ]
                )
              : titleText}
          </h1>

          {hero.subtitle && (
            <p
              className={`mt-6 text-white text-body-lg leading-relaxed max-w-[520px] mx-auto ${
                mode === "morph" ? "lg:mx-0" : ""
              }`}
              style={revealStyle(430)}
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
              style={revealStyle(580)}
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
