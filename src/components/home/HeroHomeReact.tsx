import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
// ParticleNebula (SPEC 100) también arrastra Three.js: mismo trato que el
// morph, solo se descarga cuando `heroBackground` es "dotfield".
const ParticleNebula = lazy(() => import("../effects/ParticleNebula"));
// LatticeField (SPEC 112) es el tercer consumidor de Three.js del hero: mismo
// trato, solo se descarga cuando `heroBackground` es "lattice".
const LatticeField = lazy(() => import("../effects/LatticeField"));
// FiberTunnel (SPEC 113) NO arrastra Three (es WebGL2 crudo), pero se carga en
// diferido igual que sus hermanos: con cualquier otro modo no se descarga.
const FiberTunnel = lazy(() => import("../effects/FiberTunnel"));
import type { MorphNode, MorphHandle } from "../effects/MorphSolutions";
// Solo el tipo: no arrastra el módulo al bundle del hero.
import type { FiberTunnelHandle } from "../effects/FiberTunnel";
import type { PlanetHandle } from "../effects/CinematicBackground";
import {
  actAnimate,
  actProgress,
  chapterLen,
  chaptersEnabled,
  spanProgress,
} from "../../scripts/chapters";

// Modos de fondo que comparten el "chrome" cinematográfico del hero: intro del
// wordmark, coreografía de entrada y bloqueo de scroll (SPEC 97 y SPEC 100).
// OJO: esta lista está duplicada en `BaseLayout.astro` (`homeHeroCinematic`).
// Hay que tocar las dos: si un modo se queda fuera de la de allí, el CSS
// `.cine-intro-page [data-hero-logo]` no oculta el wordmark real durante el
// morph y se ven DOS logos a la vez (SPEC 112).
const CINE_MODES = ["cinematic", "dotfield", "lattice", "fiber", "planeta"];

// Duración del bloqueo de scroll durante la intro cinematográfica: cubre el
// morph del wordmark FLX→FIBERLUX (~1.4s: hold 420ms + morph 1000ms) y el
// escalonado de titular/subtítulo/botones, para no dejar scrollear hasta que
// los elementos de arriba terminen de animarse.
const INTRO_SCROLL_LOCK_MS = 1700;

// Nodos-solución por defecto (si el CMS no los define): las 5 soluciones
// del portafolio (SPEC 109).
const DEFAULT_MORPH_NODES = [
  { label: "Conectividad", url: "/soluciones/conectividad", icon: "conectividad" },
  { label: "Ciberseguridad", url: "/soluciones/ciberseguridad", icon: "ciberseguridad" },
  { label: "Data Center", url: "/soluciones/data-center", icon: "datacenter" },
  { label: "Infraestructura", url: "/soluciones/infraestructura", icon: "infraestructura" },
  { label: "Comunicaciones Unificadas", url: "/soluciones/comunicaciones", icon: "comunicaciones" },
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

/** Monta el fondo de un modo narrativo (`fiber`/`planeta`) donde toque (ver
 *  `bgTarget`). */
function renderNarrativeBg(target: HTMLElement | "inline", layer: ReactNode) {
  if (target === "inline") return <div className="absolute inset-0 z-0">{layer}</div>;
  return createPortal(layer, target);
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
  // Handle del shader de fibra: el capítulo del hero le empuja su progreso.
  const fiberRef = useRef<FiberTunnelHandle>(null);
  // Handle del planeta conducido (SPEC 116): mismo papel que el de la fibra.
  const planetRef = useRef<PlanetHandle>(null);
  /* Fallback CSS de los modos narrativos (sin WebGL). Se maneja por ref porque
     su opacidad la empuja el scroll, igual que la del canvas. */
  const bgFallbackRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  // Sin WebGL el fondo se esconde solo y avisa: el hero cae a un halo CSS.
  const [bgFailed, setBgFailed] = useState(false);
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
    if (!CINE_MODES.includes(mode) || typeof window === "undefined") return;
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
    if (!CINE_MODES.includes(mode) || typeof window === "undefined") return;
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
    if (!CINE_MODES.includes(mode) || typeof window === "undefined") return;
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
    if (!CINE_MODES.includes(mode) || typeof window === "undefined") return;
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
  // Intensidad del modo dotfield (SPEC 100): preset del CMS, default "medio".
  const dotfieldIntensity = ((): "sutil" | "medio" | "intenso" => {
    const v = (hero as any).dotfield?.intensity;
    return v === "sutil" || v === "intenso" ? v : "medio";
  })();
  // Intensidad del modo lattice (SPEC 112): idem.
  const latticeIntensity = ((): "sutil" | "medio" | "intenso" => {
    const v = (hero as any).lattice?.intensity;
    return v === "sutil" || v === "intenso" ? v : "medio";
  })();
  // Modo fiber (SPEC 113): tratamiento e intensidad del túnel, ambos del CMS.
  const fiberVariant = ((): "tunel" | "haz" | "reticula" => {
    const v = (hero as any).fiber?.variant;
    return v === "haz" || v === "reticula" ? v : "tunel";
  })();
  const fiberIntensity = ((): "sutil" | "medio" | "intenso" => {
    const v = (hero as any).fiber?.intensity;
    return v === "sutil" || v === "intenso" ? v : "medio";
  })();

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

  // Chrome cinematográfico: layout a pantalla completa, intro del wordmark,
  // velos de legibilidad y coreografía de entrada con stagger. Lo comparten el
  // modo `cinematic` (planeta) y el `dotfield` (campo de puntos, SPEC 100),
  // porque ambos son fondos full-bleed detrás del mismo contenido.
  const cine =
    mode === "cinematic" ||
    mode === "dotfield" ||
    mode === "lattice" ||
    mode === "fiber" ||
    mode === "planeta";
  const dotfield = mode === "dotfield";
  const lattice = mode === "lattice";
  const fiber = mode === "fiber";
  // Modo `planeta` (SPEC 116): el mismo globo de `cinematic`, pero conducido
  // por el motor de capítulos en vez de leer el scroll por su cuenta.
  const planeta = mode === "planeta";
  /* Modos que montan el tramo narrativo. La lista equivalente del lado Astro
     vive en `index.astro` (`NARRATIVE_MODES`). */
  const narrativeBg = fiber || planeta;
  /* Dónde se monta el fondo del modo `fiber`:

     - un elemento ⇒ portal a `[data-narrative-bg]`, el `fixed` que cuelga del
       tramo narrativo. Es la única forma de que iOS no lo recorte: dentro del
       capítulo, el canvas vive bajo dos `overflow: hidden` (la sección del hero
       y el panel clavado) y Safari SÍ recorta los `position: fixed` contra
       ellos — el fondo se cortaba a media pantalla al soltarse el hero.
     - "inline" ⇒ como siempre, dentro de la sección. Es el caso sin motor de
       capítulos (`prefers-reduced-motion`), donde no hay panel que recorte.

     Arranca en `null` y lo decide un efecto: así el canvas se monta UNA sola
     vez y ya en su sitio. Montarlo dentro y moverlo después recrearía el
     contexto WebGL. */
  const [bgTarget, setBgTarget] = useState<HTMLElement | "inline" | null>(null);
  // dotfield y lattice comparten tratamiento de velo: en ambos el campo de
  // puntos ES el fondo, así que un velo fuerte lo borraría justo donde tiene
  // que verse (el planeta de `cinematic` sí lo pide).
  const softVeil = dotfield || lattice || fiber;
  /* Máscara de pie para los velos del hero en modo `fiber` (SPEC 113).
     Ahí el fondo es un canvas `fixed` que sigue vivo en el capítulo siguiente:
     cualquier velo que llegue con algo de opacidad al borde inferior del panel
     deja un CORTE horizontal en cuanto el panel se despega y ese borde entra en
     pantalla (arriba el velo, abajo el mismo fondo sin velo). Se apagan antes
     de llegar al borde. */
  const edgeFade = fiber
    ? // El apagado va al final y no a media altura: el velo tiene que seguir
      // sosteniendo la legibilidad del subtítulo y los botones (en mobile es lo
      // único que separa el texto del fondo).
      "linear-gradient(180deg, #000 0%, #000 72%, transparent 100%)"
    : undefined;
  const edgeFadeStyle: CSSProperties | undefined = edgeFade
    ? { maskImage: edgeFade, WebkitMaskImage: edgeFade }
    : undefined;

  useEffect(() => {
    if (!narrativeBg) return;
    const host = chaptersEnabled()
      ? document.querySelector<HTMLElement>("[data-narrative-bg]")
      : null;
    setBgTarget(host ?? "inline");
  }, [narrativeBg]);

  /* ── Capítulo del hero en modo `fiber` (SPEC 113) ───────────────────────
     Coreografía de SALIDA. La de ENTRADA (morph FLX→FIBERLUX, bloqueo de
     scroll) no se toca: es la de SPEC 97/39.

     El wordmark tampoco se toca. En la Home real el wordmark es el <img> del
     header y la SPEC 39 ya lo acopla con el scroll en sus primeros 320 px;
     animarlo aquí sería pelearse con un movimiento contrario. Quien retrocede
     hacia el punto de fuga es el TITULAR. */
  useEffect(() => {
    if (!fiber || !chaptersEnabled()) return;
    const root = rootRef.current;
    const chapter = root?.closest("[data-chapter]") as HTMLElement | null;
    if (!root || !chapter) return;
    // El tramo narrativo puede abarcar más de un capítulo (hero + frases).
    const narrative = (root.closest("[data-narrative]") as HTMLElement | null) ?? chapter;
    const len = chapterLen(chapter);
    const stops: Array<() => void> = [];

    // Acto 1 — se apagan los satélites: subtítulo y botones.
    const satellites = [
      root.querySelector("[data-hero-sub]"),
      root.querySelector("[data-hero-cta]"),
    ].filter(Boolean) as Element[];
    if (satellites.length) {
      stops.push(
        actAnimate(chapter, len, 0, 0.35, satellites, { opacity: [1, 0], y: [0, 26] })
      );
    }

    // Actos 2 y 3 — el titular se sostiene y retrocede hacia el punto de fuga.
    // `opacity: [1, 1, 0]` aguanta hasta la mitad del acto y recién ahí se va.
    if (titleRef.current) {
      stops.push(
        actAnimate(chapter, len, 0.22, 0.92, titleRef.current, {
          scale: [1, 1.45],
          opacity: [1, 1, 0],
        })
      );
    }

    // Fogonazo del núcleo: sube dentro del hero y DECAE al salir. Si se quedara
    // en su valor final quemaría el texto del capítulo siguiente.
    stops.push(
      actProgress(chapter, len, 0, 1, (p) => {
        fiberRef.current?.setHero(
          p < 0.7 ? p / 0.7 : Math.max(0, 1 - (p - 0.7) / 0.3)
        );
      })
    );

    // Avance del viaje y apagado del fondo, a lo largo de TODO el tramo
    // narrativo: monótono (si dependiera del fogonazo, al decaer se viajaría
    // hacia atrás) y en opacidad 0 el shader deja de renderizar, que es lo que
    // garantiza que no haya dos canvas WebGL vivos al entrar en Soluciones.
    stops.push(
      spanProgress(narrative, (p) => {
        const op = p < 0.86 ? 1 : Math.max(0, 1 - (p - 0.86) / 0.14);
        fiberRef.current?.setTravel(p);
        fiberRef.current?.setOpacity(op);
        /* El fallback sin WebGL2 no vive dentro del canvas, así que hay que
           apagarlo aparte — con el mismo perfil, o se quedaría encendido sobre
           `SolucionesStack`. */
        const fb = bgFallbackRef.current;
        if (fb) fb.style.opacity = String(op);
      })
    );

    return () => stops.forEach((stop) => stop());
  }, [fiber]);

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
      ref={rootRef}
      /* Sin fondo propio cuando el canvas va por portal: el portal pinta ANTES
         que la sección (cuelga antes en el DOM), así que un `bg` opaco aquí lo
         taparía justo dentro del hero. Detrás queda el negro de `main`. */
      className={`relative w-full overflow-hidden ${
        fiber && bgTarget && bgTarget !== "inline" ? "bg-transparent" : "bg-[#0a0a0a]"
      } ${
        mode === "morph"
          ? "min-h-[100svh] md:min-h-[820px] lg:min-h-[900px]"
          : fiber
          ? // El panel clavado del capítulo mide 100svh (ScrollChapter). Si el
            // hero mide menos (en desktop, `lg:min-h-[900px]` contra un viewport
            // más alto) queda una franja al pie donde el fondo `fixed` se ve sin
            // los velos del hero: una raya horizontal fija durante todo el
            // capítulo. Aquí el hero mide lo mismo que su panel.
            "min-h-[100svh]"
          : cine
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

      {/* Modo dotfield (SPEC 100): nube esférica de partículas que se dispersa
          al hacer scroll, sobre rejilla y halo morado. z-0 detrás de las
          vignettes y del contenido. */}
      {dotfield && (
        <div className="absolute inset-0 z-0">
          <Suspense fallback={null}>
            <ParticleNebula
              className="h-full w-full"
              intensity={dotfieldIntensity}
              signalReady
            />
          </Suspense>
        </div>
      )}

      {/* Modo lattice (SPEC 112): retícula volumétrica de puntos atravesada por
          ondas que la funden en nube y la vuelven a ordenar. z-0 detrás de las
          vignettes y del contenido. */}
      {lattice && (
        <div className="absolute inset-0 z-0">
          <Suspense fallback={null}>
            <LatticeField
              className="h-full w-full"
              intensity={latticeIntensity}
              signalReady
            />
          </Suspense>
        </div>
      )}

      {/* Modo fiber (SPEC 113): túnel de filamentos ópticos (WebGL2 crudo, sin
          Three) + su fallback CSS. Los dos van juntos al mismo sitio: por
          portal al `fixed` del tramo narrativo, o dentro de la sección si no
          hay capítulos. Ver `bgTarget`. */}
      {fiber && bgTarget && renderNarrativeBg(
        bgTarget,
        <>
          {bgFailed && (
            <div
              ref={bgFallbackRef}
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(115% 85% at 50% 48%, rgba(150,35,122,0.32) 0%, rgba(59,14,48,0.45) 45%, rgba(10,10,10,1) 100%)",
              }}
            />
          )}
          <Suspense fallback={null}>
            <FiberTunnel
              ref={fiberRef}
              onUnsupported={() => setBgFailed(true)}
              /* Dentro de la sección le toca ser `fixed` él mismo (el fondo no
                 se corta entre capítulos). En el portal el `fixed` ya lo pone
                 el host, así que basta con llenarlo. */
              fixed={bgTarget === "inline"}
              className="h-full w-full"
              variant={fiberVariant}
              intensity={fiberIntensity}
              signalReady
            />
          </Suspense>
        </>
      )}

      {/* Modo planeta (SPEC 116): el globo punteado de `cinematic` conducido por
          el motor de capítulos. Va al mismo sitio que el túnel de fibra —por
          portal al `fixed` del tramo narrativo— y por la misma razón: dentro del
          capítulo, iOS lo recortaría contra los `overflow: hidden`. */}
      {planeta && bgTarget && renderNarrativeBg(
        bgTarget,
        <>
          {bgFailed && (
            <div
              ref={bgFallbackRef}
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 80% at 50% 96%, rgba(150,35,122,0.34) 0%, rgba(59,14,48,0.42) 42%, rgba(10,10,10,1) 100%)",
              }}
            />
          )}
          <CinematicBackground
            ref={planetRef}
            onUnsupported={() => setBgFailed(true)}
            /* En el portal el `fixed` ya lo pone el host, y sin capítulos
               (`reduced-motion`) el planeta se queda dentro del hero como en
               `cinematic`: sólo hace falta que sea `fixed` él mismo si acaba
               inline CON capítulos, porque entonces el fondo sí cruza paneles. */
            fixed={bgTarget === "inline" && chaptersEnabled()}
            driven={chaptersEnabled()}
            className="h-full w-full"
            signalReady
          />
        </>
      )}

      {/* Intro del wordmark FLX → FIBERLUX al cargar (SPEC 97, desktop). */}
      {cine && <HeroLogoIntro />}

      {/* Modos cinematic/dotfield — SOLO mobile: velo oscuro sobre el fondo para
          que el efecto no compita con el título/descripción (en desktop hay
          espacio a los costados, así que no se aplica). */}
      {cine && (
        <div
          aria-hidden="true"
          className="lg:hidden pointer-events-none absolute inset-0 z-[1]"
          style={{
            ...edgeFadeStyle,
            background: lattice
              ? // La retícula es tenue y pareja, y en mobile ya va a menos
                // densidad: con el velo de los otros modos desaparecía entera.
                "radial-gradient(120% 95% at 50% 52%, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.48) 48%, rgba(10,10,10,0.2) 100%)"
              : softVeil
              ? "radial-gradient(120% 95% at 50% 52%, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.7) 48%, rgba(10,10,10,0.35) 100%)"
              : "radial-gradient(120% 95% at 50% 52%, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.6) 48%, rgba(10,10,10,0.3) 100%)",
          }}
        />
      )}

      {/* Modos cinematic/dotfield — desktop: leve oscurecimiento detrás del
          título/desc/botones para que se lean mejor. El planeta tiene un centro
          muy brillante y pide un velo fuerte; el campo de puntos es tenue y
          parejo, así que ahí basta un velo suave (si no, se borra la malla
          justo donde queremos que se vea). */}
      {cine && (
        <div
          aria-hidden="true"
          className="hidden lg:block pointer-events-none absolute inset-0 z-[1]"
          style={{
            background: softVeil
              ? // El campo de puntos ES el fondo: un velo fuerte en el centro la borraba
                // justo donde tiene que verse. Solo un apoyo mínimo bajo el
                // bloque de texto.
                "radial-gradient(40% 26% at 50% 62%, rgba(10,10,10,0.34) 0%, rgba(10,10,10,0.2) 55%, rgba(10,10,10,0) 88%)"
              : "radial-gradient(58% 48% at 50% 56%, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.78) 46%, rgba(10,10,10,0.42) 72%, rgba(10,10,10,0) 92%)",
          }}
        />
      )}

      {/* ══════════ Vignettes (z-[1]) — para legibilidad, en todos los modos ══════════ */}
      {/* Vignette izquierda */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          ...edgeFadeStyle,
          background:
            "linear-gradient(90deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.25) 35%, rgba(10,10,10,0) 60%)",
        }}
      />

      {/* Vignette inferior — fade largo que apaga el fondo a negro sólido bien
          antes del borde, para empalmar sin costura ni rayas con la sección
          siguiente.

          NO en modo `fiber`: ahí no hay "sección siguiente" con fondo propio —
          el capítulo de frases comparte el mismo canvas `fixed`. Apagar el pie
          del hero a negro sólido contra ese fondo intacto es justo lo que
          producía el corte horizontal al salir del hero. */}
      {!fiber && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-80 md:h-[26rem] z-[1]"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.45) 38%, rgba(10,10,10,0.82) 60%, #0a0a0a 80%, #0a0a0a 100%)",
          }}
        />
      )}

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
          cine ? "lg:pt-[13rem]" : "lg:pt-40"
        }`}
      >
        <div
          ref={contentRef}
          className={
            mode === "morph"
              ? "flex flex-col items-center text-center lg:items-start lg:text-left justify-start md:justify-center max-w-[760px] lg:max-w-[540px] mx-auto lg:mx-0 min-h-0 lg:min-h-[640px]"
              : cine
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
          {/* Modos cinematic/dotfield: titular con glow morado + barrido de luz
              (SPEC 97). */}
          {cine && (
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
              cine ? "cine-headline text-white" : "text-white"
            }`}
            data-tina-field={tinaField(hero, "title")}
          >
            {cine
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
              data-hero-sub=""
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
              data-hero-cta=""
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
