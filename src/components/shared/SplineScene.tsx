import { Component, useEffect, useRef, useState, lazy, Suspense } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Application } from "@splinetool/runtime";

const Spline = lazy(() => import("@splinetool/react-spline"));

type RenderMode = "static" | "spline";

// Tope de device pixel ratio para el render de Spline. Menos píxeles que
// dibujar en retina = menos carga de GPU, con pérdida de nitidez mínima.
const DPR_CAP = 1.25;

/**
 * Aísla el fallo de carga de la escena (chunk lazy o runtime de Spline).
 * Si algo revienta, renderiza el fallback (null) y avisa vía onFail, para
 * que el contenedor quede sin 3D en vez de caer toda la isla de React.
 */
class SplineBoundary extends Component<
  { onFail: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/**
 * Decide si cargamos la escena Spline (live) o nos quedamos sin 3D.
 * - prefers-reduced-motion → static (no se carga el runtime).
 * - Móvil con allowMobile=false → static (el contenedor suele ir oculto en móvil).
 * - Desktop (>=1024px) → spline.
 * - Móvil con allowMobile=true → spline solo si la red/dispositivo lo aguantan.
 * `undefined` en las APIs se trata como "apto" (Safari/iOS no las exponen).
 */
function decideRenderMode(allowMobile: boolean): RenderMode {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "static";
  }

  const isMobile = window.matchMedia("(max-width: 1023px)").matches;
  if (!isMobile) return "spline";
  if (!allowMobile) return "static";

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };

  const saveData = nav.connection?.saveData === true;
  const effectiveType = nav.connection?.effectiveType;
  const slowNetwork = effectiveType
    ? ["slow-2g", "2g", "3g"].includes(effectiveType)
    : false;
  const lowMemory =
    typeof nav.deviceMemory === "number" ? nav.deviceMemory < 4 : false;

  return saveData || slowNetwork || lowMemory ? "static" : "spline";
}

interface SplineSceneProps {
  /** URL .splinecode exportada desde Spline. */
  scene?: string | null;
  /**
   * Poster estático (URL de imagen). Se muestra como capa base mientras carga
   * la escena viva y como salida única en equipos no aptos (static/failed/sin
   * escena), en vez de dejar el hueco vacío.
   */
  poster?: string | null;
  /** Permitir carga en móvil (default true). Ponlo en false si el contenedor va oculto en móvil. */
  allowMobile?: boolean;
  /**
   * Si es true, al terminar de cargar la escena despacha el evento
   * `fbx:hero-scene-loaded` en `window`. Lo escucha el preloader de Home para
   * cerrarse. Úsalo solo en la instancia del hero de Home.
   */
  signalReady?: boolean;
  /**
   * No mostrar el loader animado (glow + spinner). Úsalo cuando el padre ya
   * aporta su propio fondo mientras carga (p.ej. el glow ambiental del hero de
   * Home), para que no aparezca un segundo loader encima.
   */
  hideLoader?: boolean;
  /**
   * Difuminar los bordes del área con una máscara radial. Úsalo cuando el 3D
   * vive en una caja acotada y la escena trae un fondo propio: funde el borde
   * rectangular con el fondo de la página. No lo uses en heroes a sangre completa.
   */
  featherEdges?: boolean;
  /** Clases del wrapper. Debe posicionar/dimensionar el área (p.ej. "absolute inset-0"). */
  className?: string;
  style?: CSSProperties;
}

const FEATHER_MASK =
  "radial-gradient(ellipse farthest-side at 50% 45%, #000 90%, transparent 100%)";

/**
 * Escena Spline reutilizable con estrategia de rendimiento:
 * carga condicional por dispositivo/red, loader premium, revelación al cargar,
 * pausa cuando la pestaña está oculta y error boundary.
 * Llena su contenedor (100%); el padre decide posición y tamaño.
 */
export default function SplineScene({
  scene,
  poster,
  allowMobile = true,
  signalReady = false,
  hideLoader = false,
  featherEdges = false,
  className,
  style,
}: SplineSceneProps) {
  const appRef = useRef<Application | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>("static");
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [posterGone, setPosterGone] = useState(false);
  // Cuando la escena está fuera de pantalla (o la pestaña oculta) renderizamos a
  // resolución mínima en vez de pausar — ver la nota extensa en el efecto de abajo.
  const [throttled, setThrottled] = useState(false);

  // Avisa al preloader de Home de que "ya no hay nada que esperar": o la escena
  // cargó, o falló, o directamente no se va a cargar (static/sin URL).
  const emitReady = () => {
    if (signalReady) {
      window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
    }
  };

  useEffect(() => {
    const mode = decideRenderMode(allowMobile);
    setRenderMode(mode);
    // Sin escena viva (equipo no apto o sin URL): no hagas esperar al preloader.
    if (signalReady && (mode === "static" || !scene)) {
      window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowMobile, signalReady, scene]);

  // Ahorro de GPU fuera de pantalla SIN romper el efecto del chip.
  //
  // La escena reproduce EN BUCLE un pulso magenta periódico por las líneas del
  // chip (un "State" de Spline disparado por el evento `start`). `app.stop()` no
  // solo pausa el render: mata ese bucle de forma IRREVERSIBLE — `app.play()`
  // reanuda el dibujo pero el pulso queda muerto (verificado midiendo el canvas:
  // 3 pulsos/13s antes de stop() → 0 después; ni re-emitir `start` ni el mixer
  // de animación lo reviven). Ese era el bug: bajabas del hero, volvías, y el
  // chip seguía ahí pero sin efecto.
  //
  // Pero dejar la escena a resolución completa fuera de pantalla satura la GPU y
  // genera jank al hacer scroll. Solución: en vez de pausar, renderizamos a
  // resolución MÍNIMA cuando no se ve. Spline sincroniza el tamaño del canvas al
  // de su contenedor vía ResizeObserver, así que encoger la caja de render baja
  // el drawingBuffer a ~48×32 (≈2000× menos píxeles → coste casi nulo) mientras
  // el loop sigue vivo y el bucle del pulso NO se interrumpe. Al reentrar (con
  // margen de 300px de anticipación) restauramos el tamaño real antes de que sea
  // visible. Observamos `wrapperRef` (que NO se encoge) para que la geometría del
  // IntersectionObserver sea estable; solo se encoge la caja interna de render.
  useEffect(() => {
    if (renderMode !== "spline" || !loaded) return;
    const el = wrapperRef.current;
    if (!el) return;

    let onScreen = true;
    let tabVisible = !document.hidden;
    const apply = () => setThrottled(!(onScreen && tabVisible));

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        apply();
      },
      // Restaura un poco antes de entrar para que no se vea un frame en baja res.
      { rootMargin: "300px 0px" }
    );
    io.observe(el);

    const onVisibility = () => {
      tabVisible = !document.hidden;
      apply();
    };
    document.addEventListener("visibilitychange", onVisibility);

    apply();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [renderMode, loaded]);

  const showSpline = renderMode === "spline" && !failed && Boolean(scene);
  const hasPoster = Boolean(poster);
  // Con poster, el poster ES el placeholder instantáneo: nada de spinner. Con
  // hideLoader, el padre ya aporta su fondo (glow). El loader animado solo
  // aparece cuando no hay poster ni fondo del padre que cubra la carga.
  const showLoader = showSpline && !loaded && !hasPoster && !hideLoader;
  // Poster: capa base instantánea mientras el runtime inicializa, y salida única
  // cuando no hay escena viva (static/failed/sin URL). Se mantiene durante el
  // crossfade a la escena viva y se retira al terminar.
  const showPoster = hasPoster && !posterGone;

  // Al cargar la escena, deja el poster un instante más (dura el crossfade) y
  // luego retíralo, para que no haya un salto al fondo entre poster y escena.
  useEffect(() => {
    if (!loaded || !hasPoster) return;
    const t = window.setTimeout(() => setPosterGone(true), 650);
    return () => window.clearTimeout(t);
  }, [loaded, hasPoster]);

  const wrapperStyle: CSSProperties = featherEdges
    ? {
        ...style,
        WebkitMaskImage: FEATHER_MASK,
        maskImage: FEATHER_MASK,
      }
    : style ?? {};

  return (
    <div ref={wrapperRef} className={className} style={wrapperStyle}>
      {/* Poster estático: base bajo la escena / respaldo en equipos no aptos */}
      {showPoster && (
        <img
          src={poster!}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          style={{
            opacity: loaded ? 0 : 1,
            transition: "opacity 0.6s ease",
          }}
        />
      )}

      {/* Loader premium mientras carga la escena */}
      {showLoader && (
        <div
          aria-hidden="true"
          className="spline-loader absolute inset-0 flex items-center justify-center"
        >
          <div className="spline-loader__glow" />
          <div className="spline-loader__sweep" />
          <div className="spline-loader__spinner" />
        </div>
      )}

      {showSpline && (
        // Caja de render: a pantalla completa (inset-0) cuando la escena se ve;
        // encogida a un tamaño mínimo cuando está fuera de pantalla, para que
        // Spline baje el drawingBuffer y el render cueste casi nada sin pausar el
        // loop (así el pulso de las líneas no se rompe). overflow:hidden evita que
        // el canvas mínimo desborde durante la transición.
        <div
          style={
            throttled
              ? { position: "absolute", top: 0, left: 0, width: 48, height: 32, overflow: "hidden", pointerEvents: "none" }
              : { position: "absolute", inset: 0 }
          }
        >
        <SplineBoundary
          onFail={() => {
            setFailed(true);
            emitReady();
          }}
        >
          <Suspense fallback={null}>
            <Spline
              scene={scene!}
              onLoad={(app) => {
                appRef.current = app;
                // Fondo transparente: el objeto 3D flota sobre el fondo de la
                // página en vez de dibujar una caja rectangular opaca.
                try {
                  (app as { setBackgroundColor?: (c: string) => void })
                    .setBackgroundColor?.("transparent");
                } catch {
                  /* versiones antiguas del runtime: se ignora */
                }
                // Limita el device pixel ratio: en pantallas retina (DPR 2–3)
                // el runtime renderiza 4–9× los píxeles. Cap a DPR_CAP baja mucho
                // la carga de GPU con una pérdida de nitidez apenas perceptible.
                try {
                  const renderer =
                    (app as unknown as { renderer?: { setPixelRatio?: (r: number) => void } })
                      .renderer;
                  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
                  renderer?.setPixelRatio?.(dpr);
                } catch {
                  /* API no disponible en esta versión: se ignora */
                }
                setLoaded(true);
                emitReady();
              }}
              onError={() => {
                setFailed(true);
                emitReady();
              }}
              style={{
                width: "100%",
                height: "100%",
                background: "transparent",
                opacity: loaded ? 1 : 0,
                // Con poster: crossfade simple de opacidad sobre la imagen base.
                // Sin poster: revelación con desenfoque + escala desde el vacío.
                transform: hasPoster || loaded ? "scale(1)" : "scale(1.04)",
                filter: hasPoster || loaded ? "blur(0px)" : "blur(12px)",
                transition: hasPoster
                  ? "opacity 0.6s ease"
                  : "opacity 1.1s ease, transform 1.1s cubic-bezier(0.16,1,0.3,1), filter 1.1s ease",
              }}
            />
          </Suspense>
        </SplineBoundary>
        </div>
      )}

      <style>{`
        .spline-loader__glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            42% 48% at 62% 50%,
            rgba(150, 35, 122, 0.35) 0%,
            rgba(150, 35, 122, 0) 70%
          );
          animation: splineBreath 2.6s ease-in-out infinite;
        }
        .spline-loader__sweep {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 30%;
          width: 40%;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.06) 45%,
            rgba(255, 255, 255, 0.12) 50%,
            rgba(255, 255, 255, 0.06) 55%,
            transparent 100%
          );
          filter: blur(6px);
          animation: splineSweep 2.2s ease-in-out infinite;
        }
        .spline-loader__spinner {
          position: relative;
          width: 46px;
          height: 46px;
          border-radius: 9999px;
          background: conic-gradient(
            from 0deg,
            rgba(150, 35, 122, 0) 0%,
            rgba(150, 35, 122, 0.15) 35%,
            #96237a 100%
          );
          -webkit-mask: radial-gradient(
            farthest-side,
            transparent calc(100% - 3px),
            #000 calc(100% - 3px)
          );
          mask: radial-gradient(
            farthest-side,
            transparent calc(100% - 3px),
            #000 calc(100% - 3px)
          );
          animation: splineSpin 0.9s linear infinite;
        }
        @keyframes splineBreath {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
        @keyframes splineSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes splineSweep {
          0% { transform: translateX(-140%); }
          100% { transform: translateX(140%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .spline-loader__glow,
          .spline-loader__sweep,
          .spline-loader__spinner {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
