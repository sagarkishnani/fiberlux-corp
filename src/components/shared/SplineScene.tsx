import { Component, useEffect, useRef, useState, lazy, Suspense } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Application } from "@splinetool/runtime";

const Spline = lazy(() => import("@splinetool/react-spline"));

type RenderMode = "static" | "spline";

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
  featherEdges = false,
  className,
  style,
}: SplineSceneProps) {
  const appRef = useRef<Application | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>("static");
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setRenderMode(decideRenderMode(allowMobile));
  }, [allowMobile]);

  // Pausa el loop de render (WebGL/rAF) cuando la escena NO aporta nada:
  // fuera del viewport (p.ej. tras hacer scroll pasando el hero) o con la
  // pestaña oculta. Esto es clave para el rendimiento: un Spley corriendo
  // fuera de pantalla compite con el scroll y genera lag en toda la página.
  useEffect(() => {
    if (renderMode !== "spline" || !loaded) return;
    const app = appRef.current;
    const el = wrapperRef.current;
    if (!app || !el) return;

    let onScreen = true;
    let tabVisible = !document.hidden;
    const apply = () => (onScreen && tabVisible ? app.play() : app.stop());

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        apply();
      },
      // Reanuda un poco antes de entrar para que no se note el "arranque".
      { rootMargin: "200px 0px" }
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
  const showLoader = showSpline && !loaded;
  // Poster: capa base mientras la escena viva aún no carga, y salida única
  // cuando no hay escena viva (static/failed/sin URL). Se retira al cargar.
  const showPoster = Boolean(poster) && !loaded;

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
        <SplineBoundary onFail={() => setFailed(true)}>
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
                // el runtime renderiza 4–9× los píxeles. Cap a 1.5 baja mucho la
                // carga de GPU con una pérdida de nitidez apenas perceptible.
                try {
                  const renderer =
                    (app as unknown as { renderer?: { setPixelRatio?: (r: number) => void } })
                      .renderer;
                  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
                  renderer?.setPixelRatio?.(dpr);
                } catch {
                  /* API no disponible en esta versión: se ignora */
                }
                setLoaded(true);
              }}
              onError={() => setFailed(true)}
              style={{
                width: "100%",
                height: "100%",
                background: "transparent",
                opacity: loaded ? 1 : 0,
                transform: loaded ? "scale(1)" : "scale(1.04)",
                filter: loaded ? "blur(0px)" : "blur(12px)",
                transition:
                  "opacity 1.1s ease, transform 1.1s cubic-bezier(0.16,1,0.3,1), filter 1.1s ease",
              }}
            />
          </Suspense>
        </SplineBoundary>
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
