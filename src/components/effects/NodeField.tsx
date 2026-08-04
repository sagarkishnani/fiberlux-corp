import { useEffect, useRef } from "react";

/**
 * NodeField — red de partículas ("plexus"/constellation) sobre canvas 2D.
 *
 * Réplica de los settings de https://usenodefield.framer.website/ en morado de
 * marca: puntos que derivan lento y se conectan con líneas tenues cuando están
 * cerca (LINES on), y que se ATRAEN hacia el cursor (MODE attract, CURSOR on).
 *
 * Autocontenido, sin dependencias (canvas 2D nativo). Respeta
 * prefers-reduced-motion (frame estático) y pausa el rAF fuera de viewport.
 * Fondo transparente: el consumidor pone la base oscura debajo.
 *
 * Los parámetros del efecto viven en PARAMS (afinables sin tocar la lógica).
 */

const PARAMS = {
  count: 190, // COUNT — nº de partículas base (se escala por área del canvas)
  maxCount: 340, // techo de partículas en pantallas grandes
  minCount: 60, // piso de partículas en pantallas chicas
  speed: 0.18, // SPEED — velocidad de deriva base (px/frame en CSS px)
  linkDistance: 150, // DISTANCE — radio (CSS px) para conectar dos partículas
  cursorRadius: 240, // radio de influencia del cursor (CSS px)
  attractForce: 0.09, // FORCE — aceleración de atracción hacia el cursor
  relax: 0.03, // relajación hacia la deriva base (evita que las velocidades se disparen)
  dotRadius: 2.2, // radio de cada punto (CSS px)
  lineWidth: 1, // grosor de línea
  // Puntos en un morado CLARO para que resalten sobre negro; líneas en el
  // morado de marca (#96237A) con alpha por distancia.
  dotColor: [206, 102, 184] as [number, number, number], // magenta claro
  lineColor: [168, 52, 140] as [number, number, number], // morado de marca (algo más vivo)
  maxLineAlpha: 0.6, // opacidad máx. de línea (a distancia 0)
  dotAlpha: 1, // opacidad de los puntos
};

const AREA_REF = 1280 * 720; // área de referencia para la densidad responsive

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bvx: number; // deriva base (velocidad de reposo a la que relaja)
  bvy: number;
}

interface Props {
  className?: string;
  /* Dispara `fbx:hero-scene-loaded` en el primer frame (para el preloader). */
  signalReady?: boolean;
  /* Se llama si el contexto 2D no está disponible (el consumidor decide fallback). */
  onUnsupported?: () => void;
}

export default function NodeField({
  className,
  signalReady,
  onUnsupported,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      onUnsupported?.();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const finePointer =
      window.matchMedia?.("(pointer: fine)").matches ?? false;

    let cw = 0; // ancho en CSS px
    let ch = 0; // alto en CSS px
    let particles: Particle[] = [];

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    function seed() {
      const area = Math.max(1, cw * ch);
      const n = Math.round(
        Math.min(
          PARAMS.maxCount,
          Math.max(PARAMS.minCount, PARAMS.count * (area / AREA_REF))
        )
      );
      particles = new Array(n);
      for (let i = 0; i < n; i++) {
        const angle = rand(0, Math.PI * 2);
        const bvx = Math.cos(angle) * PARAMS.speed;
        const bvy = Math.sin(angle) * PARAMS.speed;
        particles[i] = {
          x: rand(0, cw),
          y: rand(0, ch),
          vx: bvx,
          vy: bvy,
          bvx,
          bvy,
        };
      }
    }

    function resize() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      cw = w;
      ch = h;
      const pw = Math.max(1, Math.floor(w * dpr));
      const ph = Math.max(1, Math.floor(h * dpr));
      if (canvas!.width !== pw || canvas!.height !== ph) {
        canvas!.width = pw;
        canvas!.height = ph;
      }
      // Trabajamos en CSS px; el contexto escala por DPR.
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }
    resize();
    window.addEventListener("resize", resize);

    // ── Cursor: se escucha en window y se mapea contra el rect del canvas,
    //    porque un contenido superpuesto (z superior) interceptaría los eventos.
    const cursor = { x: 0, y: 0, active: false };
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cursor.x = x;
      cursor.y = y;
      cursor.active = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
    };
    if (finePointer && !reduce) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    const [dr, dg, db] = PARAMS.dotColor;
    const [lr, lg, lb] = PARAMS.lineColor;

    function draw() {
      ctx!.clearRect(0, 0, cw, ch);

      // Líneas por distancia (O(n²), n ≤ maxCount).
      ctx!.lineWidth = PARAMS.lineWidth;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < PARAMS.linkDistance * PARAMS.linkDistance) {
            const d = Math.sqrt(d2);
            const alpha = PARAMS.maxLineAlpha * (1 - d / PARAMS.linkDistance);
            ctx!.strokeStyle = `rgba(${lr},${lg},${lb},${alpha})`;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      // Puntos.
      ctx!.fillStyle = `rgba(${dr},${dg},${db},${PARAMS.dotAlpha})`;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, PARAMS.dotRadius, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function step() {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Atracción hacia el cursor (MODE attract).
        if (cursor.active) {
          const dx = cursor.x - p.x;
          const dy = cursor.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d > 0.001 && d < PARAMS.cursorRadius) {
            const f = PARAMS.attractForce * (1 - d / PARAMS.cursorRadius);
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }

        // Relajación hacia la deriva base: al alejar el cursor, vuelve a flotar.
        p.vx += (p.bvx - p.vx) * PARAMS.relax;
        p.vy += (p.bvy - p.vy) * PARAMS.relax;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap en los bordes (densidad constante).
        if (p.x < 0) p.x += cw;
        else if (p.x > cw) p.x -= cw;
        if (p.y < 0) p.y += ch;
        else if (p.y > ch) p.y -= ch;
      }
    }

    let raf = 0;
    let visible = true;
    let signaled = false;

    function signalOnce() {
      if (signalReady && !signaled) {
        signaled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
    }

    function frame() {
      step();
      draw();
      signalOnce();
      if (!reduce && visible) raf = requestAnimationFrame(frame);
      else raf = 0; // permite reiniciar el loop al volver al viewport
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduce && !raf) raf = requestAnimationFrame(frame);
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    if (reduce) {
      // Frame estático: una sola siembra + dibujo, sin animación.
      draw();
      signalOnce();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      io.disconnect();
    };
  }, [signalReady]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
