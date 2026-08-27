import { useEffect, useRef } from "react";

/**
 * Estela luminosa que sigue al cursor (réplica del trail de
 * davies.framer.website/home-gridwave, en morado de marca).
 *
 * Algoritmo del referente (verificado inspeccionando su DOM):
 *  1. Una única "cabeza" que persigue al mouse con suavizado exponencial
 *     (lerp ~0.13 por paso) — de ahí sale toda la suavidad: nunca se dibujan
 *     las muestras crudas del puntero, que son las que producen quiebres.
 *  2. Esa cabeza se empuja a un historial FIFO (40 posiciones) a razón de una
 *     muestra por paso; el trazo es la polilínea de ese historial.
 *  3. Se pintan 5 capas anidadas de 8/16/24/32/40 puntos, todas de 2px con
 *     remate redondo. Al superponerse, la zona cercana al cursor acumula más
 *     capas (más opaca) y la cola queda con una sola (tenue): el degradado
 *     sale del apilado, no de calcular ancho/alpha por tramo.
 *
 * El paso es de timestep fijo (60/s) con acumulador, así el largo y la
 * velocidad de la estela son idénticos en pantallas de 60, 120 o 144 Hz.
 *
 * Se desactiva con `prefers-reduced-motion` y en punteros gruesos (touch).
 */

type Intensity = "low" | "med" | "high";

// Suavizado de la cabeza por paso (0 = no se mueve, 1 = pega el salto).
// El referente usa ~0.13, que se sentía lento/arrastrado: 0.28 hace que la
// cabeza alcance al cursor casi al instante y la estela quede más corta y viva.
const SMOOTHING = 0.28;
// Pasos por segundo del historial (fijo, independiente del refresco).
const STEP_HZ = 60;
// Puntos del historial = largo de la capa más larga. Menos puntos = cola más
// corta (a 60 pasos/s, 28 puntos ≈ 0.47 s de estela).
const HISTORY = 28;
// Puntos de cada capa, de la más larga (tenue) a la más corta (brillante).
const LAYERS = [28, 22, 17, 11, 6];
// Grosor del trazo en px CSS (el referente usa 2 en todas las capas).
const STROKE_WIDTH = 2;

// Alpha de cada capa, en el mismo orden que LAYERS. Al apilarse, la cabeza
// acumula las cinco y la cola sólo la primera.
// (`high` reproduce la rampa del referente 0.16 → 0.64; `med` y `low` la bajan).
const ALPHA_BY_INTENSITY: Record<Intensity, number[]> = {
  low: [0.07, 0.11, 0.15, 0.22, 0.28],
  med: [0.12, 0.18, 0.26, 0.38, 0.48],
  high: [0.16, 0.24, 0.34, 0.5, 0.64],
};

// Morado de marca: la cola tira a magenta profundo y la cabeza a rosa claro.
const TAIL_RGB = [150, 35, 122];
const HEAD_RGB = [233, 150, 222];

const mixRgb = (a: number[], b: number[], t: number) =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t));

export default function CursorTrail({ intensity = "med" }: { intensity?: Intensity }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Solo desktop con puntero fino y hover; y respetar reduce-motion.
    const fine = window.matchMedia?.("(pointer: fine)").matches;
    const canHover = window.matchMedia?.("(hover: hover)").matches;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!fine || !canHover || reduce) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const alphas = ALPHA_BY_INTENSITY[intensity] ?? ALPHA_BY_INTENSITY.med;
    // Color por capa: las capas cortas (cerca del cursor) más claras.
    const colors = LAYERS.map((n, i) => {
      const t = 1 - (n - LAYERS[LAYERS.length - 1]) / (LAYERS[0] - LAYERS[LAYERS.length - 1]);
      const [r, g, b] = mixRgb(TAIL_RGB, HEAD_RGB, t);
      return `rgba(${r},${g},${b},${alphas[i]})`;
    });

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
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = STROKE_WIDTH;
    };
    resize();

    // Objetivo (mouse crudo), cabeza suavizada e historial de la cabeza.
    let targetX = 0;
    let targetY = 0;
    let headX = 0;
    let headY = 0;
    let started = false;
    const hx = new Float32Array(HISTORY);
    const hy = new Float32Array(HISTORY);

    const STEP_MS = 1000 / STEP_HZ;
    let acc = 0;
    let last = performance.now();
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!started) {
        started = true;
        headX = targetX;
        headY = targetY;
        hx.fill(headX);
        hy.fill(headY);
        // El acumulador venía sumando desde el montaje: descartarlo para no
        // gastar una ráfaga de pasos en el primer movimiento.
        acc = 0;
        last = performance.now();
      }
    };

    const step = () => {
      headX += (targetX - headX) * SMOOTHING;
      headY += (targetY - headY) * SMOOTHING;
      // Historial FIFO: cada punto hereda la posición previa del anterior.
      hx.copyWithin(1, 0, HISTORY - 1);
      hy.copyWithin(1, 0, HISTORY - 1);
      hx[0] = headX;
      hy[0] = headY;
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      // Cap por si la pestaña estuvo en segundo plano.
      acc = Math.min(acc + (now - last), 200);
      last = now;
      if (!started) return;

      let stepped = false;
      while (acc >= STEP_MS) {
        acc -= STEP_MS;
        step();
        stepped = true;
      }
      if (!stepped) return;

      ctx.clearRect(0, 0, width, height);
      // Dentro de una sección con cursor a medida (CursorShapes) no se dibuja la
      // estela para que no se encimen los dos trazos.
      if ((window as any).__cursorShapeActive) return;

      for (let l = 0; l < LAYERS.length; l++) {
        const n = LAYERS[l];
        ctx.strokeStyle = colors[l];
        ctx.beginPath();
        ctx.moveTo(hx[0], hy[0]);
        for (let i = 1; i < n; i++) ctx.lineTo(hx[i], hy[i]);
        ctx.stroke();
      }
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
