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
const LIMA: [number, number] = [-12.05, -77.04];
const NY: [number, number] = [40.71, -74.0];
const LDN: [number, number] = [51.5, -0.12];
const SP: [number, number] = [-23.55, -46.63];
const SG: [number, number] = [1.35, 103.8];
const TK: [number, number] = [35.68, 139.69];
const MX: [number, number] = [19.43, -99.13];

const MARKERS = [
  { location: LIMA, size: 0.07 },
  { location: NY, size: 0.045 },
  { location: LDN, size: 0.045 },
  { location: SP, size: 0.045 },
  { location: SG, size: 0.045 },
  { location: TK, size: 0.04 },
  { location: MX, size: 0.04 },
];

// Rutas de fibra: pares de hubs conectados por un arco fino sobre la superficie.
const ROUTES: [[number, number], [number, number]][] = [
  [LIMA, NY],
  [LIMA, SP],
  [LIMA, MX],
  [NY, LDN],
  [LDN, SG],
  [SG, TK],
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

export default function CinematicBackground({
  className,
  signalReady,
  onUnsupported,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const arcsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const glow = glowRef.current;
    const arcsCanvas = arcsRef.current;
    if (!canvas || !root) return;
    const actx = arcsCanvas?.getContext("2d") ?? null;

    // Vectores 3D precomputados de cada ruta de fibra (endpoints en la esfera).
    const routeVecs = ROUTES.map(
      ([from, to]) => [locToVec3(from), locToVec3(to)] as const
    );

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const mobile = window.matchMedia?.("(max-width: 1023px)").matches ?? false;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap por rendimiento

    // Tamaño del canvas (cuadrado): grande, de modo que se vea ~60% del globo
    // (el resto queda recortado abajo por el overflow del hero).
    let sizePx = 0;
    // Geometría del globo en coords del root (para dibujar los arcos encima).
    let gLeft = 0; // x del borde izq. del canvas del globo dentro del root
    let gTop = 0; // y del borde superior del canvas del globo dentro del root

    const computeSize = () => {
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;
      // Globo un poco más alejado (más pequeño) que la versión anterior.
      sizePx = Math.min(w * 1.0, h * 1.7);
      // Centrado horizontal; posicionado para ver el casquete superior (~60%).
      const topPx = h * 0.16 - sizePx * 0.1;
      gLeft = w / 2 - sizePx / 2;
      gTop = topPx;

      // Canvas de arcos: cubre todo el root (mismo sistema de coords que el globo).
      // A DPR 1 (líneas suaves con glow → no necesitan resolución retina; ahorra
      // ~la mitad del fill-rate de esta capa por frame).
      if (arcsCanvas && actx) {
        const pw = Math.max(1, Math.floor(w));
        const ph = Math.max(1, Math.floor(h));
        if (arcsCanvas.width !== pw || arcsCanvas.height !== ph) {
          arcsCanvas.width = pw;
          arcsCanvas.height = ph;
        }
        actx.setTransform(1, 0, 0, 1, 0, 0);
      }

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

    // Dibuja los arcos de fibra sobre la superficie del globo, sincronizados con
    // su rotación (misma proyección que COBE). Líneas finas + un pulso viajando;
    // se cortan al pasar por detrás del globo (solo hemisferio frontal).
    const SEG = 44;
    const R = GLOBE_R * 1.004; // apenas por encima de la superficie
    const drawArcs = (phi: number, theta: number, op: number, ms: number) => {
      if (!actx || !arcsCanvas) return;
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;
      actx.clearRect(0, 0, w, h);
      if (op <= 0.01) return;
      actx.lineCap = "round";

      for (let ri = 0; ri < routeVecs.length; ri++) {
        const [u, v] = routeVecs[ri];
        let started = false;
        actx.beginPath();
        for (let k = 0; k <= SEG; k++) {
          const p = slerp(u, v, k / SEG);
          const pr = project([p[0] * R, p[1] * R, p[2] * R], phi, theta);
          const sx = gLeft + pr.x * sizePx;
          const sy = gTop + pr.y * sizePx;
          if (pr.front) {
            if (!started) {
              actx.moveTo(sx, sy);
              started = true;
            } else actx.lineTo(sx, sy);
          } else started = false; // corta el trazo detrás del globo
        }
        // Glow en dos pasadas sobre la misma ruta (más barato que shadowBlur):
        // trazo ancho y tenue (halo) + trazo fino y brillante (núcleo).
        actx.lineWidth = 3.2;
        actx.strokeStyle = `rgba(205,95,235,${0.16 * op})`;
        actx.stroke();
        actx.lineWidth = 1.1;
        actx.strokeStyle = `rgba(235,175,248,${0.7 * op})`;
        actx.stroke();

        // Pulso brillante que recorre la ruta (halo + núcleo, sin shadowBlur).
        const tp = (ms / 2600 + ri * 0.37) % 1;
        const pp = slerp(u, v, tp);
        const ppr = project([pp[0] * R, pp[1] * R, pp[2] * R], phi, theta);
        if (ppr.front) {
          const px = gLeft + ppr.x * sizePx;
          const py = gTop + ppr.y * sizePx;
          actx.fillStyle = `rgba(210,110,240,${0.35 * op})`;
          actx.beginPath();
          actx.arc(px, py, 4, 0, 6.2832);
          actx.fill();
          actx.fillStyle = `rgba(255,220,255,${0.95 * op})`;
          actx.beginPath();
          actx.arc(px, py, 1.7, 0, 6.2832);
          actx.fill();
        }
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
      drawArcs(phi, BASE_THETA + scrollP * 0.9, op, ms);
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
      drawArcs(0.6, BASE_THETA, 1, 0);
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

      {/* Partículas tenues (estrellas que derivan) en las zonas oscuras de los
          costados — sin líneas y sin reacción al cursor, solo dinamismo sutil.
          Máscara horizontal: presentes a izquierda/derecha, ausentes en el centro. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.55,
          pointerEvents: "none",
          WebkitMaskImage:
            "linear-gradient(90deg, #000 0%, #000 12%, transparent 36%, transparent 64%, #000 88%, #000 100%)",
          maskImage:
            "linear-gradient(90deg, #000 0%, #000 12%, transparent 36%, transparent 64%, #000 88%, #000 100%)",
        }}
      >
        <NodeField className="h-full w-full" interactive={false} lines={false} />
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

      {/* Globo COBE. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: "absolute", display: "block", pointerEvents: "none" }}
      />

      {/* Arcos de fibra dibujados SOBRE la superficie del globo (encima del canvas). */}
      <canvas
        ref={arcsRef}
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
