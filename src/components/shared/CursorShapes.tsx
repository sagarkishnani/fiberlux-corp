import { useEffect, useRef } from "react";

/**
 * Cursores a medida "hilo fino" (basado en el prototipo cursores-hilo-fino.html).
 *
 * Canvas fijo a pantalla completa (pointer-events: none) montado en toda la web.
 * La forma (`reticle` = retícula técnica, `dot` = punto minimal) llega por prop
 * `shape` desde la config de cursor de Tina (SPEC 99 obs1). Cuando está montado
 * oculta el cursor nativo en toda la web y dibuja la forma con un "hilo fino" que
 * la sigue con lag; sobre enlaces/botones la forma crece (estado interactivo).
 *
 * Se desactiva en punteros gruesos (touch) y con `prefers-reduced-motion`.
 */

type CursorStyle = "reticle" | "dot";

export default function CursorShapes({ shape = "reticle" }: { shape?: CursorStyle }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

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

    let W = window.innerWidth;
    let H = window.innerHeight;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Activa el ocultado del cursor nativo dentro de las secciones data-cursor.
    document.documentElement.classList.add("cursor-shapes-ready");

    const mouse = { x: W / 2, y: H / 2, active: false };
    const style: CursorStyle = shape === "dot" ? "dot" : "reticle";
    let interactive = false;
    let pressed = false;

    // ── Hilo fino: cadena de puntos con lag que traza una cola suave ──
    const THREAD_LEN = 10;
    const thread = Array.from({ length: THREAD_LEN }, () => ({
      x: mouse.x,
      y: mouse.y,
    }));
    // Punto de anillo con lag (posición de la forma, más suave que el cursor).
    const ring = { x: mouse.x, y: mouse.y };

    const resolveInteractive = (target: EventTarget | null): void => {
      interactive =
        target instanceof Element &&
        !!target.closest("a, button, [role='button'], input, select, textarea");
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
      resolveInteractive(e.target);
      (window as any).__cursorShapeActive = true;
    };
    const onLeave = () => {
      mouse.active = false;
      (window as any).__cursorShapeActive = false;
    };
    const onDown = () => (pressed = true);
    const onUp = () => (pressed = false);

    // ── Utilidades de dibujo (colores de marca del prototipo) ──
    const centerDot = (a: number) => {
      ctx.fillStyle = `rgba(255,250,253,${a})`;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    };
    const softHalo = (x: number, y: number, r: number, a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(213,167,202,${a})`);
      g.addColorStop(1, "rgba(150,35,122,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawThread = () => {
      ctx.save();
      ctx.filter = "blur(0.6px)";
      ctx.lineCap = "round";
      for (let i = 0; i < thread.length - 1; i++) {
        const p0 = thread[i];
        const p1 = thread[i + 1];
        const prog = i / thread.length;
        ctx.strokeStyle = `rgba(224,196,218,${(1 - prog) * 0.22})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
      ctx.restore();
    };

    // ── Retícula técnica ──
    const drawReticle = (t: number) => {
      const baseR = interactive ? 13 : pressed ? 6 : 9;
      const dx = mouse.x - ring.x;
      const dy = mouse.y - ring.y;
      const stretch = Math.min(6, Math.sqrt(dx * dx + dy * dy) * 0.25);
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(ring.x, ring.y);
      ctx.rotate(angle);
      ctx.scale(1 + stretch * 0.04, 1 - stretch * 0.02);
      ctx.rotate(-angle);

      ctx.strokeStyle = "rgba(213,167,202,0.45)";
      ctx.lineWidth = 1;
      const tick = 3;
      const gap = baseR + 5;
      [0, 90, 180, 270].forEach((deg) => {
        const a = (deg * Math.PI) / 180 + t * 0.00025;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * gap, Math.sin(a) * gap);
        ctx.lineTo(Math.cos(a) * (gap + tick), Math.sin(a) * (gap + tick));
        ctx.stroke();
      });

      const breathe = Math.sin(t * 0.002) * 0.5 + 0.5;
      ctx.strokeStyle = `rgba(224,196,218,${0.55 + breathe * 0.15})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(0, 0, baseR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      centerDot(0.9);
      softHalo(ring.x, ring.y, baseR * 3.2, interactive ? 0.16 : 0.1);
    };

    // ── Punto minimal ──
    const drawDot = (t: number) => {
      const pulse = Math.sin(t * 0.0022) * 0.5 + 0.5;
      const mult = interactive ? 1.7 : 1;
      softHalo(
        ring.x,
        ring.y,
        (12 + pulse * 4) * mult,
        0.16 + pulse * 0.08
      );
      centerDot(0.85);
    };

    let raf = 0;
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);

      // Actualiza hilo fino (cadena con lag) y anillo aunque no se dibuje, para
      // que al reentrar a una sección no dé un salto.
      thread[0].x += (mouse.x - thread[0].x) * 0.1;
      thread[0].y += (mouse.y - thread[0].y) * 0.1;
      for (let i = 1; i < thread.length; i++) {
        thread[i].x += (thread[i - 1].x - thread[i].x) * 0.2;
        thread[i].y += (thread[i - 1].y - thread[i].y) * 0.2;
      }
      ring.x += (mouse.x - ring.x) * 0.22;
      ring.y += (mouse.y - ring.y) * 0.22;

      ctx.clearRect(0, 0, W, H);
      if (!mouse.active) return;

      drawThread();
      if (style === "reticle") drawReticle(t);
      else drawDot(t);
    };
    raf = requestAnimationFrame(frame);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("resize", resize);
      document.documentElement.classList.remove("cursor-shapes-ready");
      (window as any).__cursorShapeActive = false;
    };
  }, [shape]);

  return (
    <>
      <style>{`
        /* Con el cursor a medida activo (elegido en Tina) se oculta el cursor
           nativo en toda la web; la forma del canvas lo reemplaza. Solo cuando la
           isla se montó en desktop (clase en <html>). */
        html.cursor-shapes-ready,
        html.cursor-shapes-ready * { cursor: none !important; }
      `}</style>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />
    </>
  );
}
