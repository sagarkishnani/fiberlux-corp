import { useEffect, useRef } from "react";

/**
 * Malla de red con profundidad — SPEC 104.
 *
 * Nodos en un volumen 3D proyectados en perspectiva y dibujados en cuatro
 * CAPAS DE PROFUNDIDAD: las del fondo salen chicas, tenues y desenfocadas; las
 * del frente, nítidas y con halo. Los cruces se componen en modo aditivo, que
 * es lo que da el brillo de la referencia.
 *
 * Dos variantes:
 *   - `malla`        → nube fija, cámara orbitando muy lento + paralaje con el cursor.
 *   - `vuelo`        → la cámara avanza dentro de la malla (tramos encadenados en z).
 *   - `constelacion` → réplica de la referencia del cliente: malla densa anclada a
 *                      la derecha, cámara quieta, nodos que titilan y se disuelve
 *                      hacia la izquierda con una máscara (ahí va el texto).
 *
 * Rendimiento (requisito duro del cliente): canvas 2D, DPR capado a 2, pausa
 * fuera del viewport, menos nodos en pantallas chicas y un solo frame estático
 * con `prefers-reduced-motion`.
 */

type Variant = "malla" | "vuelo" | "constelacion";

interface NetworkDepthProps {
  variant?: Variant;
  className?: string;
  /** Multiplicador de densidad (1 = por defecto). */
  density?: number;
  /** Opacidad global de la malla. */
  opacity?: number;
}

/* Capas de profundidad: TRES lienzos apilados, cada uno con su desenfoque
   aplicado por CSS sobre el elemento entero. Es la diferencia entre 55 fps y 3:
   `ctx.filter` desenfoca CADA trazo por separado y con ~600 aristas hunde el
   frame; el filtro CSS lo resuelve el compositor una sola vez por capa. */
const BUCKETS = [
  { layer: 0, alpha: 0.55, width: 0.9, dot: 0.9 },
  { layer: 0, alpha: 0.8, width: 1.0, dot: 1.05 },
  { layer: 1, alpha: 0.95, width: 1.15, dot: 1.2 },
  { layer: 2, alpha: 1.0, width: 1.35, dot: 1.5 },
];
const LAYER_BLUR = ["blur(4.5px)", "blur(1.4px)", "none"];
const FOCAL = 620;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const tone = (t: number) =>
  t > 0.72 ? "#8f2f79" : t > 0.46 ? "#c65fae" : t > 0.22 ? "#e6a3d6" : "#fbeff8";
const bucketFor = (z: number, near: number, far: number) =>
  3 - Math.floor(Math.min(0.999, Math.max(0, (z - near) / (far - near))) * 4);

interface Node { x: number; y: number; r: number; b: number; a: number; c: string; halo: boolean }
interface Edge { x1: number; y1: number; x2: number; y2: number; b: number; w: number; a: number; c: string }

export default function NetworkDepth({
  variant = "malla",
  className = "",
  density = 1,
  opacity = 1,
}: NetworkDepthProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const layerRefs = [
    useRef<HTMLCanvasElement | null>(null),
    useRef<HTMLCanvasElement | null>(null),
    useRef<HTMLCanvasElement | null>(null),
  ];

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvases = layerRefs.map((r) => r.current);
    if (!wrap || canvases.some((c) => !c)) return;
    const ctxs = canvases.map((c) => c!.getContext("2d", { alpha: true }));
    if (ctxs.some((c) => !c)) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 767px)").matches;
    const scale = density * (small ? 0.55 : 1);

    let w = 0, h = 0;
    const state = { t: 0, mx: 0, my: 0 };

    /* ── Geometría ── */
    const build = () => {
      if (variant === "vuelo") {
        const TILE = 900, TILES = 3, PER = Math.round(78 * scale), NEAR = 200, FAR = 1900;
        const base = Array.from({ length: PER }, () => ({
          x: rnd(-1, 1) * 720, y: rnd(-1, 1) * 400, z: rnd(0, TILE),
          r: rnd(1, 2.6), hub: Math.random() > 0.86,
        }));
        const edges: [number, number][] = [];
        base.forEach((p, i) => {
          base
            .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y, (p.z - q.z) * 0.8) }))
            .filter((o) => o.j !== i)
            .sort((a, b) => a.d - b.d)
            .slice(0, 4)
            .forEach((o) => {
              if (o.j > i && o.d < 560) edges.push([i, o.j]);
            });
        });

        return (): { nodes: Node[]; edges: Edge[] } => {
          state.t += 1.9;
          const nodes: Node[] = [], out: Edge[] = [];
          for (let k = 0; k < TILES; k++) {
            const proj = base.map((p) => {
              const span = TILE * TILES;
              const z = (((p.z + k * TILE - state.t) % span) + span) % span + NEAR;
              const kk = FOCAL / z;
              const x = w * 0.5 + (p.x + state.mx * 90) * kk;
              const y = h * 0.5 + (p.y + state.my * 70) * kk;
              const t = Math.min(1, (z - NEAR) / (FAR - NEAR));
              return { x, y, k: kk, z, t, b: bucketFor(z, NEAR, FAR), r: p.r * kk * 1.1 + 0.4, hub: p.hub };
            });
            proj.forEach((p) =>
              nodes.push({
                x: p.x, y: p.y, r: Math.max(0.5, p.r), b: p.b,
                a: Math.min(1, (1 - p.t) * 1.15) * (p.z < 320 ? (p.z - NEAR) / 120 : 1),
                c: tone(p.t), halo: p.hub && p.t < 0.42,
              }),
            );
            edges.forEach(([i, j]) => {
              const a = proj[i], b = proj[j];
              if (Math.abs(a.z - b.z) > TILE * 0.6) return;
              const t = (a.t + b.t) / 2;
              out.push({
                x1: a.x, y1: a.y, x2: b.x, y2: b.y,
                b: Math.min(a.b, b.b), w: 1, a: (1 - t) * 0.78 + 0.1, c: tone(t),
              });
            });
          }
          return { nodes, edges: out };
        };
      }

      /* variantes `malla` y `constelacion`: mismo motor, distinta cámara. */
      const quieta = variant === "constelacion";
      const N = Math.round((quieta ? 300 : 260) * scale), NEAR = 250, FAR = 1500;
      /* La constelación se apiña hacia la derecha (como la referencia); la malla
         se reparte parejo por todo el hero. */
      const cxScene = quieta ? 0.66 : 0.5;
      const pts = Array.from({ length: N }, () => ({
        x: (quieta ? rnd(-0.55, 1) : rnd(-1, 1)) * 780,
        y: rnd(-1, 1) * 430,
        z: NEAR + Math.pow(Math.random(), 0.65) * (FAR - NEAR),
        r: rnd(1.1, 3.1), hub: Math.random() > (quieta ? 0.84 : 0.88),
        ph: rnd(0, 6.28), sp: rnd(0.3, 0.9),
      }));
      const edges: [number, number][] = [];
      pts.forEach((p, i) => {
        pts
          .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y, (p.z - q.z) * 0.75) }))
          .filter((o) => o.j !== i)
          .sort((a, b) => a.d - b.d)
          .slice(0, p.hub ? 8 : 4)
          .forEach((o) => {
            if (o.j > i && o.d < 520) edges.push([i, o.j]);
          });
      });

      return (): { nodes: Node[]; edges: Edge[] } => {
        state.t += quieta ? 0.0007 : 0.0016;
        /* Quieta: la cámara casi no se mueve, el paralaje del cursor manda. */
        const yaw = quieta
          ? Math.sin(state.t) * 0.03 + state.mx * 0.13
          : Math.sin(state.t) * 0.16 + state.mx * 0.1;
        const pitch = quieta
          ? Math.cos(state.t * 0.7) * 0.015 + state.my * 0.07
          : Math.cos(state.t * 0.7) * 0.06 + state.my * 0.06;
        const cos = Math.cos(yaw), sin = Math.sin(yaw);
        const proj = pts.map((p) => {
          const zc = p.z + Math.sin(state.t * 8 * p.sp + p.ph) * 6;
          const x0 = p.x * cos - (zc - 700) * sin;
          const z = p.x * sin + (zc - 700) * cos + 700;
          const y0 = p.y + pitch * z * 0.32;
          const kk = FOCAL / z;
          const t = (z - NEAR) / (FAR - NEAR);
          return {
            x: w * cxScene + x0 * kk, y: h * 0.48 + y0 * kk, z, t,
            b: bucketFor(z, NEAR, FAR), r: p.r * kk * 0.9 + 0.5, hub: p.hub,
            /* Titileo por nodo: más marcado en la constelación. */
            tw: quieta
              ? 0.62 + 0.38 * Math.sin(state.t * 26 * p.sp + p.ph)
              : 0.75 + 0.25 * Math.sin(state.t * 6 * p.sp + p.ph),
          };
        });
        return {
          nodes: proj.map((p) => ({
            x: p.x, y: p.y, r: Math.max(0.6, p.r), b: p.b,
            a: (1 - p.t * 0.45) * p.tw, c: tone(p.t), halo: p.hub && p.t < 0.55,
          })),
          edges: edges.map(([i, j]) => {
            const a = proj[i], b = proj[j];
            const t = (a.t + b.t) / 2;
            return {
              x1: a.x, y1: a.y, x2: b.x, y2: b.y,
              b: Math.min(a.b, b.b), w: 1, a: (1 - t) * 0.8 + 0.14, c: tone(t),
            };
          }),
        };
      };
    };

    const frame = build();

    /* ── Render ── */
    const draw = () => {
      for (const c of ctxs) {
        c!.clearRect(0, 0, w, h);
        c!.globalCompositeOperation = "lighter";
        c!.lineCap = "round";
      }
      const geo = frame();

      for (const e of geo.edges) {
        const B = BUCKETS[e.b];
        const c = ctxs[B.layer]!;
        c.globalAlpha = e.a * B.alpha * opacity;
        c.strokeStyle = e.c;
        c.lineWidth = e.w * B.width;
        c.beginPath();
        c.moveTo(e.x1, e.y1);
        c.lineTo(e.x2, e.y2);
        c.stroke();
      }

      for (const n of geo.nodes) {
        const B = BUCKETS[n.b];
        const c = ctxs[B.layer]!;
        const r = n.r * B.dot;
        c.globalAlpha = n.a * B.alpha * opacity;
        if (n.halo) {
          const g = c.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 9);
          g.addColorStop(0, "rgba(251,239,248,0.8)");
          g.addColorStop(0.24, "rgba(224,163,210,0.3)");
          g.addColorStop(1, "rgba(150,35,122,0)");
          c.fillStyle = g;
          c.beginPath();
          c.arc(n.x, n.y, r * 9, 0, 6.2832);
          c.fill();
        }
        c.fillStyle = n.c;
        c.beginPath();
        c.arc(n.x, n.y, r, 0, 6.2832);
        c.fill();
      }

      for (const c of ctxs) {
        c!.globalAlpha = 1;
        c!.globalCompositeOperation = "source-over";
      }
    };

    /* ── Tamaño ── */
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      /* Las capas borrosas se rasterizan a menos resolución: el desenfoque
         disimula la pérdida y baja el costo de pintado. */
      const dprBase = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvases.forEach((c, i) => {
        const dpr = i === 2 ? dprBase : dprBase * (i === 0 ? 0.5 : 0.75);
        c!.width = Math.max(1, Math.round(w * dpr));
        c!.height = Math.max(1, Math.round(h * dpr));
        ctxs[i]!.setTransform(dpr, 0, 0, dpr, 0, 0);
      });
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    /* ── Paralaje con el cursor (solo punteros finos) ── */
    const fine = window.matchMedia("(pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      state.mx = (e.clientX - r.left) / r.width - 0.5;
      state.my = (e.clientY - r.top) / r.height - 0.5;
    };
    const onLeave = () => { state.mx = 0; state.my = 0; };
    const host = wrap.parentElement;
    if (fine && !reduce && host) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
    }

    /* ── Bucle: solo mientras el hero está en pantalla ── */
    let raf: number | null = null;
    let visible = true;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (reduce) return;
        if (visible && raf == null) raf = requestAnimationFrame(loop);
        if (!visible && raf != null) { cancelAnimationFrame(raf); raf = null; }
      },
      { rootMargin: "80px" },
    );
    io.observe(wrap);
    if (!reduce) raf = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      io.disconnect();
      if (raf != null) cancelAnimationFrame(raf);
      if (host) {
        host.removeEventListener("pointermove", onMove);
        host.removeEventListener("pointerleave", onLeave);
      }
    };
  }, [variant, density, opacity]);

  /* La constelación se apaga hacia la izquierda para no pelear con el texto;
     en mobile la máscara se retira (el texto vive abajo, no al costado). */
  const maskStyle =
    variant === "constelacion"
      ? ({
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 26%, #000 52%, #000 100%)",
          maskImage:
            "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 26%, #000 52%, #000 100%)",
        } as const)
      : undefined;

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className={`network-depth relative h-full w-full ${className}`}
      style={maskStyle}
    >
      {LAYER_BLUR.map((blur, i) => (
        <canvas
          key={i}
          ref={layerRefs[i]}
          className="absolute inset-0 block h-full w-full"
          style={{ filter: blur === "none" ? undefined : blur }}
        />
      ))}
      <style>{`
        @media (max-width: 767px) {
          .network-depth {
            -webkit-mask-image: none !important;
            mask-image: none !important;
          }
        }
      `}</style>
    </div>
  );
}
