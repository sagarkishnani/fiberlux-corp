import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import NodeField from "./NodeField";

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
const PURPLE: [number, number, number] = [0.55, 0.22, 0.9]; // halo/atmósfera (glow)
const MAGENTA: [number, number, number] = [0.85, 0.36, 0.95]; // markers + cables

const BASE_THETA = 0.22;

// Hubs (lat, lng) — nodos de conexión que brillan sobre la superficie del globo,
// con Lima (Perú) como centro de la red. Los "cables de fibra" ya no se dibujan
// con los arcos flotantes de COBE (no integraban); la red de fibra la genera el
// plexus de partículas (NodeField) en las zonas oscuras de los costados.
const MARKERS = [
  { location: [-12.05, -77.04] as [number, number], size: 0.09 }, // Lima
  { location: [40.71, -74.0] as [number, number], size: 0.05 }, // Nueva York
  { location: [51.5, -0.12] as [number, number], size: 0.05 }, // Londres
  { location: [-23.55, -46.63] as [number, number], size: 0.05 }, // São Paulo
  { location: [1.35, 103.8] as [number, number], size: 0.05 }, // Singapur
  { location: [35.68, 139.69] as [number, number], size: 0.04 }, // Tokio
  { location: [19.43, -99.13] as [number, number], size: 0.04 }, // CDMX
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
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const glow = glowRef.current;
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
      // Globo un poco más alejado (más pequeño) que la versión anterior.
      sizePx = Math.min(w * 1.0, h * 1.7);
      // Centrado horizontal; posicionado para ver el casquete superior (~60%).
      const topPx = h * 0.16 - sizePx * 0.1;
      canvas.style.width = `${sizePx}px`;
      canvas.style.height = `${sizePx}px`;
      canvas.style.left = "50%";
      canvas.style.top = `${topPx}px`;
      canvas.style.transform = "translateX(-50%)";

      // Anillo de glow: disco del tamaño del globo (≈80% del canvas) centrado en
      // el globo, con box-shadow ancho → halo grueso alrededor del borde de la
      // Tierra. Va detrás del canvas, así el globo tapa el interior y solo se ve
      // el resplandor que desborda el borde.
      if (glow) {
        const diam = sizePx * 0.8; // diámetro visual del globo
        const centerY = topPx + sizePx / 2;
        const blur = Math.round(sizePx * 0.16);
        const spread = Math.round(sizePx * 0.03);
        glow.style.width = `${diam}px`;
        glow.style.height = `${diam}px`;
        glow.style.left = "50%";
        glow.style.top = `${centerY - diam / 2}px`;
        glow.style.transform = "translateX(-50%)";
        glow.style.boxShadow = `0 0 ${blur}px ${spread}px rgba(155,60,210,0.55)`;
      }
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
        theta: BASE_THETA,
        dark: 1,
        diffuse: 2.2, // más contraste luz/sombra → volumen (no plano)
        mapSamples: mobile ? 9000 : 16000,
        mapBrightness: 7.5,
        mapBaseBrightness: 0.06, // océano casi negro
        baseColor: WHITE, // continentes blancos
        markerColor: MAGENTA,
        glowColor: PURPLE,
        markers: MARKERS,
        markerElevation: 0.01,
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
      if (!reduce) phi += 0.0026; // rotación (un poco más rápida)

      const op = introE * (1 - scrollP * 0.85);
      globe?.update({
        phi,
        // Al hacer scroll el planeta rueda hacia arriba (en dirección del scroll).
        theta: BASE_THETA + scrollP * 0.9,
        width: sizePx * dpr,
        height: sizePx * dpr,
        opacity: op,
      });
      if (glow) glow.style.opacity = `${op}`;
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
            "radial-gradient(115% 78% at 50% 74%, rgba(150,55,190,0.42) 0%, rgba(90,25,130,0.22) 38%, rgba(40,10,60,0.08) 60%, rgba(0,0,0,0) 76%)",
          pointerEvents: "none",
        }}
      />

      {/* Red de fibra / partículas (plexus) en las zonas oscuras de los costados.
          Máscara horizontal: fuerte a izquierda/derecha, transparente en el centro
          (para no competir con el globo ni con el texto). */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.7,
          pointerEvents: "none",
          WebkitMaskImage:
            "linear-gradient(90deg, #000 0%, #000 12%, transparent 34%, transparent 66%, #000 88%, #000 100%)",
          maskImage:
            "linear-gradient(90deg, #000 0%, #000 12%, transparent 34%, transparent 66%, #000 88%, #000 100%)",
        }}
      >
        <NodeField className="h-full w-full" />
      </div>

      {/* Anillo de glow grueso alrededor del borde de la Tierra (detrás del globo). */}
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          borderRadius: "50%",
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
