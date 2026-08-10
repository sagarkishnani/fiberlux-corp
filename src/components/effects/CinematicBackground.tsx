import { useEffect, useRef } from "react";
import createGlobe from "cobe";

/**
 * CinematicBackground — hero "cinematic" (SPEC 97): PLANETA de fibra con COBE.
 *
 * Globo punteado WebGL (librería `cobe`, ~5KB) con paleta de marca Fiberlux:
 * mar oscuro, continentes en puntos blancos, halo/atmósfera en morado de marca
 * (#96237A) y cables de fibra que conectan hubs, dibujados como arcos FINOS
 * sobre la superficie del globo (misma proyección que COBE → quedan pegados a la
 * rotación y se cortan detrás del planeta). Se muestra ~50% del globo (recortado
 * abajo, estilo referencia). Entra con fade y se funde/rueda hacia arriba al
 * hacer scroll.
 *
 * RENDIMIENTO: una sola capa 2D (arcos + nodos + estrellas) y un único rAF que
 * también dirige el render de COBE. Nodos/pulsos y estrellas se pintan con un
 * sprite radial precomputado (drawImage, barato) en vez de gradientes o
 * shadowBlur por frame. El loop se pausa fuera del viewport.
 */

// ── Color de marca Fiberlux (#96237A) y variantes.
const BRAND = "150,35,122"; // #96237A
const BRAND_LIT = "205,85,170"; // marca aclarada (núcleos de línea / nodos)
const BRAND_N: [number, number, number] = [150 / 255, 35 / 255, 122 / 255]; // glow COBE
const WHITE: [number, number, number] = [1, 1, 1]; // continentes (puntos)

const BASE_THETA = 0.22;

// Hubs (lat, lng), con Lima (Perú) como centro de la red.
const LIMA: [number, number] = [-12.05, -77.04];
const NY: [number, number] = [40.71, -74.0];
const LDN: [number, number] = [51.5, -0.12];
const SP: [number, number] = [-23.55, -46.63];
const SG: [number, number] = [1.35, 103.8];
const TK: [number, number] = [35.68, 139.69];
const MX: [number, number] = [19.43, -99.13];

// Nodos únicos (con tamaño de glow) y rutas de fibra (pares conectados).
const HUBS: { loc: [number, number]; r: number }[] = [
  { loc: LIMA, r: 9 },
  { loc: NY, r: 6 },
  { loc: LDN, r: 6 },
  { loc: SP, r: 6 },
  { loc: SG, r: 6 },
  { loc: TK, r: 5.5 },
  { loc: MX, r: 5.5 },
];
// Rutas de fibra (SPEC 99 obs10): red más densa para que la lógica de
// conectividad sea más evidente — hub-and-spoke desde Lima + enlaces cruzados.
const ROUTES: [[number, number], [number, number]][] = [
  [LIMA, NY],
  [LIMA, SP],
  [LIMA, MX],
  [LIMA, LDN],
  [LIMA, SG],
  [LIMA, TK],
  [NY, LDN],
  [NY, MX],
  [LDN, SG],
  [SG, TK],
  [SP, LDN],
  [SP, MX],
];

// ── Proyección idéntica a la de COBE (para dibujar arcos ALINEADOS con el globo).
const DEG = Math.PI / 180;
const GLOBE_R = 0.8; // radio del globo en COBE (ee)

/** [lat, lng] → vector 3D unitario (misma fórmula que COBE `U`). */
function locToVec3([lat, lng]: [number, number]): [number, number, number] {
  const r = lat * DEG;
  const a = lng * DEG - Math.PI;
  const o = Math.cos(r);
  return [-o * Math.cos(a), Math.sin(r), o * Math.sin(a)];
}

/** Interpolación esférica (los puntos quedan sobre la superficie de la esfera). */
function slerp(
  u: [number, number, number],
  v: [number, number, number],
  t: number
): [number, number, number] {
  let d = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  d = Math.max(-1, Math.min(1, d));
  const om = Math.acos(d);
  if (om < 1e-4) return u;
  const s = Math.sin(om);
  const a = Math.sin((1 - t) * om) / s;
  const b = Math.sin(t * om) / s;
  return [a * u[0] + b * v[0], a * u[1] + b * v[1], a * u[2] + b * v[2]];
}

/** Proyecta un punto 3D (ya escalado por el radio) con phi/theta → fracción del
 *  canvas [0..1] + si está en el hemisferio frontal (misma matemática que `O`). */
function project(
  pt: [number, number, number],
  phi: number,
  theta: number
): { x: number; y: number; front: boolean } {
  const r = Math.cos(theta);
  const a = Math.cos(phi);
  const o = Math.sin(theta);
  const i = Math.sin(phi);
  const c = a * pt[0] + i * pt[2];
  const s = i * o * pt[0] + r * pt[1] - a * o * pt[2];
  const z = -i * r * pt[0] + o * pt[1] + a * r * pt[2];
  return { x: (c + 1) / 2, y: (-s + 1) / 2, front: z >= 0 };
}

interface Props {
  className?: string;
  iconKeys?: string[]; // (no usado)
  signalReady?: boolean;
  onUnsupported?: () => void;
}

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bvx: number;
  bvy: number;
}

export default function CinematicBackground({
  className,
  signalReady,
  onUnsupported,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const glow = glowRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !root) return;
    const octx = overlay?.getContext("2d") ?? null;

    // Vectores 3D precomputados (endpoints de rutas + nodos).
    const routeVecs = ROUTES.map(
      ([from, to]) => [locToVec3(from), locToVec3(to)] as const
    );
    const hubVecs = HUBS.map((hub) => ({ v: locToVec3(hub.loc), r: hub.r }));

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const mobile = window.matchMedia?.("(max-width: 1023px)").matches ?? false;
    const finePointer =
      window.matchMedia?.("(pointer: fine)").matches ?? false;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap por rendimiento

    // ── Sprite radial suave (glow) precomputado → drawImage barato por frame.
    const SP_SZ = 48;
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = SP_SZ;
    const sctx = sprite.getContext("2d");
    if (sctx) {
      const g = sctx.createRadialGradient(
        SP_SZ / 2,
        SP_SZ / 2,
        0,
        SP_SZ / 2,
        SP_SZ / 2,
        SP_SZ / 2
      );
      g.addColorStop(0, "rgba(255,228,248,1)");
      g.addColorStop(0.32, `rgba(${BRAND_LIT},0.85)`);
      g.addColorStop(1, `rgba(${BRAND},0)`);
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, SP_SZ, SP_SZ);
    }
    const drawSoft = (x: number, y: number, rad: number, alpha: number) => {
      if (!octx || alpha <= 0.01) return;
      octx.globalAlpha = alpha;
      octx.drawImage(sprite, x - rad, y - rad, rad * 2, rad * 2);
      octx.globalAlpha = 1;
    };

    // Tamaño del globo y geometría en coords del root.
    let sizePx = 0;
    let gLeft = 0;
    let gTop = 0;

    // ── Estrellas laterales (mismo canvas/loop → sin canvas ni rAF extra).
    let stars: Star[] = [];
    const seedStars = () => {
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;
      const n = Math.round(
        Math.min(120, Math.max(40, 72 * ((w * h) / (1280 * 720))))
      );
      stars = new Array(n);
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const bvx = Math.cos(ang) * 0.12; // deriva lenta
        const bvy = Math.sin(ang) * 0.12;
        stars[i] = {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: bvx,
          vy: bvy,
          bvx,
          bvy,
        };
      }
    };

    const computeSize = () => {
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;
      // SPEC 99 obs10: globo más grande → se ve ~50% (antes ~60%, fracción ≈ h/sizePx).
      sizePx = Math.min(w * 1.15, h * 2.0);
      const topPx = h * 0.16 - sizePx * 0.1;
      gLeft = w / 2 - sizePx / 2;
      gTop = topPx;

      // Overlay 2D a DPR 1 (líneas/glow suaves → no necesitan retina; ahorra
      // ~la mitad del fill-rate de esta capa).
      if (overlay && octx) {
        const pw = Math.max(1, Math.floor(w));
        const ph = Math.max(1, Math.floor(h));
        if (overlay.width !== pw || overlay.height !== ph) {
          overlay.width = pw;
          overlay.height = ph;
        }
        octx.setTransform(1, 0, 0, 1, 0, 0);
      }

      canvas.style.width = `${sizePx}px`;
      canvas.style.height = `${sizePx}px`;
      canvas.style.left = "50%";
      canvas.style.top = `${topPx}px`;
      canvas.style.transform = "translateX(-50%)";

      // Halo del borde del globo (SPEC 99 obs10). Antes era un `box-shadow`, cuyo
      // desenfoque enorme dejaba una banda plana morada-oscura alrededor del
      // planeta (el "círculo negro" que marcó el cliente). Ahora es un
      // radial-gradient MONÓTONO (brillante justo en el borde → transparente hacia
      // afuera): al no tener mínimos intermedios, no puede formar una banda oscura.
      // El fondo (fade radial) se define estático en el JSX; aquí solo el tamaño.
      if (glow) {
        const diam = sizePx * 1.6;
        const centerY = topPx + sizePx / 2;
        glow.style.width = `${diam}px`;
        glow.style.height = `${diam}px`;
        glow.style.left = "50%";
        glow.style.top = `${centerY - diam / 2}px`;
        glow.style.transform = "translateX(-50%)";
      }

      seedStars();
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
        diffuse: 2.2, // volumen (luz/sombra) → no plano
        mapSamples: mobile ? 7000 : 14000,
        mapBrightness: 4.5, // SPEC 99 obs10: planeta más oscuro (legibilidad del texto)
        mapBaseBrightness: 0.03, // océano casi negro
        baseColor: WHITE, // continentes blancos
        glowColor: BRAND_N, // atmósfera en morado de marca
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

    // ── Cursor: atracción MUY suave de las estrellas (mucho más leve que antes).
    const cursor = { x: 0, y: 0, active: false };
    const CURSOR_R = 170;
    const FORCE = 0.018; // suave (referencia previa era ~0.09)
    const RELAX = 0.02;
    const onPointerMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      cursor.x = x;
      cursor.y = y;
      cursor.active = x >= 0 && x <= r.width && y >= 0 && y <= r.height;
    };
    if (finePointer && !reduce) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

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

    const SEG = 44;
    const R = GLOBE_R * 1.004; // apenas por encima de la superficie

    const stepStars = (w: number, h: number) => {
      for (let i = 0; i < stars.length; i++) {
        const p = stars[i];
        if (cursor.active) {
          const dx = cursor.x - p.x;
          const dy = cursor.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d > 0.001 && d < CURSOR_R) {
            const f = FORCE * (1 - d / CURSOR_R);
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        p.vx += (p.bvx - p.vx) * RELAX;
        p.vy += (p.bvy - p.vy) * RELAX;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x += w;
        else if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h;
        else if (p.y > h) p.y -= h;
      }
    };

    // Dibuja toda la capa 2D: estrellas (costados) + arcos + nodos/pulsos, todo
    // sincronizado con la rotación del globo (misma proyección que COBE).
    const drawOverlay = (phi: number, theta: number, op: number, ms: number) => {
      if (!octx || !overlay) return;
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;
      octx.clearRect(0, 0, w, h);
      if (op <= 0.01) return;

      // Estrellas: más presentes hacia los costados (fade en el centro).
      const cx = w / 2;
      const half = w * 0.5;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const edge = Math.min(
          1,
          Math.max(0, (Math.abs(s.x - cx) / half - 0.2) / 0.45)
        );
        drawSoft(s.x, s.y, 2.6, edge * 0.9 * op);
      }

      // Arcos de fibra (línea fina + halo), recortados al hemisferio frontal.
      octx.lineCap = "round";
      for (let ri = 0; ri < routeVecs.length; ri++) {
        const [u, v] = routeVecs[ri];
        let started = false;
        octx.beginPath();
        for (let k = 0; k <= SEG; k++) {
          const p = slerp(u, v, k / SEG);
          const pr = project([p[0] * R, p[1] * R, p[2] * R], phi, theta);
          const sx = gLeft + pr.x * sizePx;
          const sy = gTop + pr.y * sizePx;
          if (pr.front) {
            if (!started) {
              octx.moveTo(sx, sy);
              started = true;
            } else octx.lineTo(sx, sy);
          } else started = false;
        }
        octx.lineWidth = 3.2;
        octx.strokeStyle = `rgba(${BRAND},${0.15 * op})`;
        octx.stroke();
        octx.lineWidth = 1.1;
        octx.strokeStyle = `rgba(${BRAND_LIT},${0.7 * op})`;
        octx.stroke();

        // Pulso de luz suave viajando por la ruta.
        const tp = (ms / 2600 + ri * 0.37) % 1;
        const pp = slerp(u, v, tp);
        const ppr = project([pp[0] * R, pp[1] * R, pp[2] * R], phi, theta);
        if (ppr.front) {
          drawSoft(gLeft + ppr.x * sizePx, gTop + ppr.y * sizePx, 6, 0.85 * op);
        }
      }

      // Nodos (hubs): glow suave sobre la superficie (sin borde duro).
      for (let i = 0; i < hubVecs.length; i++) {
        const { v, r } = hubVecs[i];
        const pr = project([v[0] * R, v[1] * R, v[2] * R], phi, theta);
        if (pr.front)
          drawSoft(gLeft + pr.x * sizePx, gTop + pr.y * sizePx, r, 0.8 * op);
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
      if (!reduce) phi += 0.0026; // rotación

      const theta = BASE_THETA + scrollP * 0.9;
      const op = introE * (1 - scrollP * 0.85);
      globe?.update({
        phi,
        theta, // al hacer scroll rueda hacia arriba (dirección del scroll)
        width: sizePx * dpr,
        height: sizePx * dpr,
        opacity: op,
      });
      if (glow) glow.style.opacity = `${op}`;
      stepStars(root.clientWidth || 1, root.clientHeight || 1);
      drawOverlay(phi, theta, op, ms);
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
      drawOverlay(0.6, BASE_THETA, 1, 0);
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
      {/* Resplandor de base (morado de marca) detrás del globo. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(115% 78% at 50% 74%, rgba(150,35,122,0.4) 0%, rgba(101,15,80,0.22) 38%, rgba(59,14,48,0.08) 60%, rgba(0,0,0,0) 76%)",
          pointerEvents: "none",
        }}
      />

      {/* Halo del borde de la Tierra (detrás del globo). Radial-gradient monótono:
          transparente en el centro (tapado por el globo), brillante justo en el
          borde de la esfera (~63% del radio del div = 1.6× el globo) y fade suave
          a transparente hacia afuera → sin banda oscura. */}
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          borderRadius: "50%",
          pointerEvents: "none",
          background:
            "radial-gradient(circle, rgba(0,0,0,0) 55%, rgba(214,77,184,0.55) 63%, rgba(214,77,184,0.24) 74%, rgba(150,35,122,0.08) 86%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Globo COBE. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: "absolute", display: "block", pointerEvents: "none" }}
      />

      {/* Capa 2D: estrellas laterales + arcos de fibra + nodos/pulsos (encima del globo). */}
      <canvas
        ref={overlayRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
