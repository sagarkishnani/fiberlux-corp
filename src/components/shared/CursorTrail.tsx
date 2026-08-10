import { useEffect, useRef } from "react";

/**
 * Estela luminosa que sigue al cursor y se desvanece (estilo Davies).
 *
 * Canvas fijo a pantalla completa (pointer-events: none) montado en toda la web
 * desde BaseLayout. Guarda los últimos puntos del mouse con su tiempo de vida y
 * dibuja una línea suave que se afina y se apaga hacia la cola. Dos pasadas:
 * un halo magenta difuso + un núcleo brillante.
 *
 * Se desactiva con `prefers-reduced-motion` y en punteros gruesos (touch).
 */

type TrailPoint = { x: number; y: number; t: number };
type Intensity = "low" | "med" | "high";

// Vida de cada punto (ms): cuánto tarda un tramo en desvanecerse por completo.
const LIFETIME = 780;
// Ancho máximo (px CSS) del núcleo en la cabeza de la estela.
const CORE_WIDTH = 3;

// Intensidad del glow (SPEC 99 obs1): la estela se nota pero con menos "glow".
// `med` es el nuevo baseline reducido; `high` se acerca al look anterior.
const GLOW_BY_INTENSITY: Record<
  Intensity,
  { haloWidth: number; haloAlpha: number; haloBlur: number; coreAlpha: number; coreBlur: number }
> = {
  low: { haloWidth: 6, haloAlpha: 0.05, haloBlur: 5, coreAlpha: 0.35, coreBlur: 2 },
  med: { haloWidth: 8, haloAlpha: 0.09, haloBlur: 8, coreAlpha: 0.5, coreBlur: 3 },
  high: { haloWidth: 12, haloAlpha: 0.16, haloBlur: 13, coreAlpha: 0.72, coreBlur: 5 },
};

export default function CursorTrail({ intensity = "med" }: { intensity?: Intensity }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Solo desktop con puntero fino y hover; y respetar reduce-motion.
    const fine = window.matchMedia?.("(pointer: fine)").matches;
    const canHover = window.matchMedia?.("(hover: hover)").matches;
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!fine || !canHover || reduce) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = GLOW_BY_INTENSITY[intensity] ?? GLOW_BY_INTENSITY.med;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const points: TrailPoint[] = [];
    const onMove = (e: PointerEvent) => {
      points.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      // Tope de seguridad para que el array no crezca sin límite.
      if (points.length > 200) points.shift();
    };

    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();

      // Descartar puntos ya muertos (desde el frente del array).
      while (points.length && now - points[0].t > LIFETIME) points.shift();

      ctx.clearRect(0, 0, width, height);
      // Dentro de una sección con cursor a medida (CursorShapes) no se dibuja la
      // estela para que no se encimen los dos trazos.
      if ((window as any).__cursorShapeActive) return;
      if (points.length < 2) return;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Dibuja la estela tramo a tramo; el ancho y la opacidad se afinan según
      // la edad del punto (cabeza = brillante y grueso, cola = tenue y fino).
      const draw = (
        widthAt: (life: number) => number,
        colorAt: (life: number) => string,
        blur: number
      ) => {
        ctx.shadowBlur = blur;
        ctx.shadowColor = "rgba(214,77,184,0.9)";
        for (let i = 1; i < points.length; i++) {
          const p0 = points[i - 1];
          const p1 = points[i];
          const life = 1 - (now - p1.t) / LIFETIME; // 1 = nuevo, 0 = muerto
          if (life <= 0) continue;
          const eased = life * life; // caída más marcada hacia la cola
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          // Curva suave hacia el punto medio para evitar quiebres.
          const mx = (p0.x + p1.x) / 2;
          const my = (p0.y + p1.y) / 2;
          ctx.quadraticCurveTo(p0.x, p0.y, mx, my);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineWidth = widthAt(eased);
          ctx.strokeStyle = colorAt(eased);
          ctx.stroke();
        }
      };

      // Pasada 1 — halo magenta difuso.
      draw(
        (l) => cfg.haloWidth * l + 2,
        (l) => `rgba(150,35,122,${cfg.haloAlpha * l})`,
        cfg.haloBlur
      );
      // Pasada 2 — núcleo (SPEC 99: magenta de marca, un poco más morado/menos blanco).
      draw(
        (l) => CORE_WIDTH * l + 0.6,
        (l) => `rgba(220,110,200,${cfg.coreAlpha * l})`,
        cfg.coreBlur
      );

      ctx.shadowBlur = 0;
    };
    raf = requestAnimationFrame(frame);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9998,
        // SPEC 99 obs5: sin mix-blend "screen" la estela compone igual sobre
        // cualquier fondo (header oscuro / footer morado) → se ve uniforme.
      }}
    />
  );
}
