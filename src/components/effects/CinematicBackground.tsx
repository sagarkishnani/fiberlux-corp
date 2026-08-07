import { useEffect, useRef } from "react";
import createGlobe from "cobe";

/**
 * CinematicBackground — hero "cinematic" (SPEC 97): PLANETA de fibra con COBE.
 *
 * Usa la librería `cobe` (globo punteado WebGL, ~5KB, muy eficiente; el mismo
 * enfoque del componente de Framer de referencia). Paleta de marca: mar oscuro,
 * continentes con puntos blancos, halo morado y cables de fibra magenta que
 * conectan hubs (submarinos). Se muestra ~60% del globo (recortado abajo, como
 * la referencia). Entra con fade y se funde/sube al hacer scroll.
 */

// Colores 0..1
const WHITE: [number, number, number] = [1, 1, 1]; // continentes (puntos)
const PURPLE: [number, number, number] = [0.4, 0.16, 0.64]; // halo/atmósfera
const MAGENTA: [number, number, number] = [0.85, 0.36, 0.95]; // markers + cables

// Hubs (lat, lng) y cables de fibra (conexiones tipo submarino), con Lima (Perú)
// como centro de la red.
const MARKERS = [
  { location: [-12.05, -77.04] as [number, number], size: 0.09 }, // Lima
  { location: [40.71, -74.0] as [number, number], size: 0.05 }, // Nueva York
  { location: [51.5, -0.12] as [number, number], size: 0.05 }, // Londres
  { location: [-23.55, -46.63] as [number, number], size: 0.05 }, // São Paulo
  { location: [1.35, 103.8] as [number, number], size: 0.05 }, // Singapur
  { location: [35.68, 139.69] as [number, number], size: 0.04 }, // Tokio
  { location: [19.43, -99.13] as [number, number], size: 0.04 }, // CDMX
];
const ARCS = [
  { from: [-12.05, -77.04] as [number, number], to: [40.71, -74.0] as [number, number] },
  { from: [-12.05, -77.04] as [number, number], to: [-23.55, -46.63] as [number, number] },
  { from: [-12.05, -77.04] as [number, number], to: [19.43, -99.13] as [number, number] },
  { from: [40.71, -74.0] as [number, number], to: [51.5, -0.12] as [number, number] },
  { from: [51.5, -0.12] as [number, number], to: [1.35, 103.8] as [number, number] },
  { from: [1.35, 103.8] as [number, number], to: [35.68, 139.69] as [number, number] },
];

interface Props {
  className?: string;
  iconKeys?: string[]; // (no usado)
  signalReady?: boolean;
  onUnsupported?: () => void;
}

export default function CinematicBackground({
  className,
  signalReady,
  onUnsupported,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const mobile = window.matchMedia?.("(max-width: 1023px)").matches ?? false;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap por rendimiento

    // Tamaño del canvas (cuadrado): grande, de modo que se vea ~60% del globo
    // (el resto queda recortado abajo por el overflow del hero).
    let sizePx = 0;
    const computeSize = () => {
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;
      // Diámetro visual ≈ 92% del ancho; COBE deja el globo a ~80% del canvas.
      sizePx = Math.min(w * 1.15, h * 1.9);
      // Centrado horizontal; posicionado para ver el casquete superior (~60%).
      canvas.style.width = `${sizePx}px`;
      canvas.style.height = `${sizePx}px`;
      canvas.style.left = "50%";
      canvas.style.top = `${h * 0.14 - sizePx * 0.1}px`;
      canvas.style.transform = "translateX(-50%)";
    };
    computeSize();

    let heroTop = 0;
    let heroHeight = 1;
    const cacheHero = () => {
      const r = root.getBoundingClientRect();
      heroTop = window.scrollY + r.top;
      heroHeight = r.height || 1;
    };
    cacheHero();

    let globe: { update: (s: any) => void; destroy: () => void } | null = null;
    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: sizePx * dpr,
        height: sizePx * dpr,
        phi: 0,
        theta: 0.22,
        dark: 1,
        diffuse: 1.25,
        mapSamples: mobile ? 9000 : 16000,
        mapBrightness: 7.5,
        mapBaseBrightness: 0.06, // océano casi negro
        baseColor: WHITE, // continentes blancos
        markerColor: MAGENTA,
        glowColor: PURPLE,
        markers: MARKERS,
        arcs: ARCS as any,
        arcColor: MAGENTA,
        arcWidth: 1.3,
        arcHeight: 0.4,
        markerElevation: 0.02,
        opacity: reduce ? 1 : 0,
        scale: 1,
      } as any);
    } catch (e) {
      onUnsupported?.();
      return;
    }

    const onResize = () => {
      computeSize();
      cacheHero();
      globe?.update({ width: sizePx * dpr, height: sizePx * dpr });
    };
    window.addEventListener("resize", onResize);

    // Parallax por puntero (leve): desplaza phi/theta.
    const ptr = { x: 0, y: 0 };
    const finePointer =
      window.matchMedia?.("(pointer: fine)").matches ?? false;
    const onPointerMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      ptr.x = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
      ptr.y = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
    };
    if (finePointer && !reduce)
      window.addEventListener("pointermove", onPointerMove, { passive: true });

    let phi = 0;
    let raf = 0;
    let startMs = -1;
    let visible = true;
    let signaled = false;
    const signalOnce = () => {
      if (signalReady && !signaled) {
        signaled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
    };

    const frame = (ms: number) => {
      if (startMs < 0) startMs = ms;
      const intro = reduce ? 1 : Math.min(1, (ms - startMs) / 1600);
      const introE = 1 - Math.pow(1 - intro, 3);
      const scrollP = Math.max(
        0,
        Math.min(1, (window.scrollY - heroTop) / heroHeight)
      );
      if (!reduce) phi += 0.0016; // rotación lenta

      globe?.update({
        phi: phi + ptr.x * 0.35,
        theta: 0.22 + ptr.y * 0.12,
        width: sizePx * dpr,
        height: sizePx * dpr,
        opacity: introE * (1 - scrollP * 0.9),
      });
      signalOnce();
      if (!reduce && visible) raf = requestAnimationFrame(frame);
      else raf = 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduce && !raf) raf = requestAnimationFrame(frame);
      },
      { threshold: 0 }
    );
    io.observe(root);

    if (reduce) {
      globe?.update({ phi: 0.6, opacity: 1 });
      signalOnce();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      io.disconnect();
      globe?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalReady]);

  return (
    <div
      ref={rootRef}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
    >
      {/* Resplandor morado de base detrás del globo (gradiente base→morado→negro). */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 80% at 50% 78%, rgba(120,45,150,0.28) 0%, rgba(60,15,80,0.14) 40%, rgba(0,0,0,0) 72%)",
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: "absolute", display: "block", pointerEvents: "none" }}
      />
    </div>
  );
}
