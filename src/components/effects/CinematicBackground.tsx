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
const LAND: [number, number, number] = [0.93, 0.87, 0.98]; // continentes (puntos), lila muy claro

const BASE_THETA = 0.22;

// NOTA: la atenuación de los puntos/arcos por detrás del texto (para que no
// compitan con la tipografía) NO se hace aquí: es el velo radial que HeroHomeReact
// pinta en z-[1], sobre este fondo y bajo el contenido. Enmascarar el canvas WebGL
// resultaba ~2.5 ms/frame más caro y el resultado sobre negro es el mismo.

// Hubs (lat, lng), con Lima (Perú) como centro de la red.
const LIMA: [number, number] = [-12.05, -77.04];
const NY: [number, number] = [40.71, -74.0];
const LDN: [number, number] = [51.5, -0.12];
const SP: [number, number] = [-23.55, -46.63];
const SG: [number, number] = [1.35, 103.8];
const TK: [number, number] = [35.68, 139.69];
const MX: [number, number] = [19.43, -99.13];
const LA: [number, number] = [34.05, -118.24];
const MAD: [number, number] = [40.42, -3.7];
const DXB: [number, number] = [25.2, 55.27];
const SYD: [number, number] = [-33.87, 151.21];

// Nodos únicos (con tamaño de glow) y rutas de fibra (pares conectados).
const HUBS: { loc: [number, number]; r: number }[] = [
  { loc: LIMA, r: 9 },
  { loc: NY, r: 6 },
  { loc: LDN, r: 6 },
  { loc: SP, r: 6 },
  { loc: SG, r: 6 },
  { loc: TK, r: 5.5 },
  { loc: MX, r: 5.5 },
  { loc: LA, r: 5.5 },
  { loc: MAD, r: 5.5 },
  { loc: DXB, r: 5 },
  { loc: SYD, r: 5 },
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
  [LIMA, LA],
  [LA, NY],
  [LDN, MAD],
  [MAD, NY],
  [LDN, DXB],
  [DXB, SG],
  [SG, SYD],
  [TK, SYD],
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

// Estrella: la posición base (x,y) deriva con velocidad CONSTANTE y envuelve por
// los bordes, así que el campo se mantiene uniforme para siempre. La reacción al
// cursor vive en un desplazamiento aparte (ox,oy) con muelle de vuelta a 0: por eso
// el cursor ya no puede "arrastrar" estrellas de forma permanente hacia un costado
// (bug: tras un rato la escena acababa con los puntos apelmazados en los bordes).
interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ox: number;
  oy: number;
  ovx: number;
  ovy: number;
}

export default function CinematicBackground({
  className,
  signalReady,
  onUnsupported,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
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
    // Cap de DPR por rendimiento. En mobile el planeta pasó a ocupar toda la
    // pantalla (antes era un globo pequeño al centro), así que el canvas cubre
    // ~5× más píxeles: se baja el cap para que el coste por frame no suba en
    // equipos ligeros (los puntos no necesitan retina, sólo la tipografía).
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.15 : 1.5);

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
    // ── Sprite del HALO del limbo. Referencia del cliente: una línea de luz fina
    // y muy brillante sobre el borde del planeta (núcleo casi blanco) que se
    // difumina hacia afuera en morado hasta morir en negro, con el interior
    // oscuro. Al ser un gradiente radial estático se pinta UNA vez en un canvas
    // pequeño y cada frame sólo se estira con drawImage: un blit barato en vez de
    // reevaluar el gradiente sobre millones de píxeles (el hero debe seguir
    // corriendo en equipos ligeros).
    const HALO_SZ = 1024;
    const HALO_INNER = 0.5; // radio interior, en fracción del radio de puntos
    const HALO_OUTER = 1.6; // radio exterior (bloom hacia el espacio)
    const haloSprite = document.createElement("canvas");
    haloSprite.width = haloSprite.height = HALO_SZ;
    {
      const hctx = haloSprite.getContext("2d");
      if (hctx) {
        const c = HALO_SZ / 2;
        const g = hctx.createRadialGradient(
          c,
          c,
          c * (HALO_INNER / HALO_OUTER),
          c,
          c,
          c
        );
        // El limbo cae en t = (1 - HALO_INNER) / (HALO_OUTER - HALO_INNER)
        // ≈ 0.455. Alrededor de ese punto la luz es ANCHA y suave (atmósfera),
        // no un filo blanco: es lo que hacía que el planeta se leyera como un
        // "arco de neón" en vez de como un mundo (obs. cliente).
        g.addColorStop(0, "rgba(120,28,98,0)");
        g.addColorStop(0.3, "rgba(140,34,114,0.05)"); // interior casi limpio
        g.addColorStop(0.4, "rgba(178,60,146,0.2)");
        g.addColorStop(0.455, "rgba(228,155,210,0.5)"); // limbo (banda ancha)
        g.addColorStop(0.5, "rgba(190,80,160,0.34)");
        g.addColorStop(0.6, "rgba(150,38,124,0.16)");
        g.addColorStop(0.78, "rgba(115,24,94,0.06)");
        g.addColorStop(1, "rgba(101,15,80,0)");
        hctx.fillStyle = g;
        hctx.fillRect(0, 0, HALO_SZ, HALO_SZ);
      }
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
    let narrowView = false; // viewport angosto → geometría/halo de mobile

    // ── Estrellas laterales (mismo canvas/loop → sin canvas ni rAF extra).
    let stars: Star[] = [];
    const seedStars = () => {
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;
      // Si ya hay campo (resize / aparición del scrollbar) sólo se reencuadra:
      // volver a sembrar haría "parpadear" las estrellas a otra posición.
      if (stars.length) {
        for (let i = 0; i < stars.length; i++) {
          const p = stars[i];
          p.x = ((p.x % w) + w) % w;
          p.y = ((p.y % h) + h) % h;
        }
        return;
      }
      const n = Math.round(
        Math.min(120, Math.max(40, 72 * ((w * h) / (1280 * 720))))
      );
      stars = new Array(n);
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        stars[i] = {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(ang) * 0.12, // deriva lenta (constante)
          vy: Math.sin(ang) * 0.12,
          ox: 0,
          oy: 0,
          ovx: 0,
          ovy: 0,
        };
      }
    };

    const computeSize = () => {
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;
      // Geometría del planeta (obs. cliente: "se ve como un arco de neón más que
      // un mundo"). Se razona sobre el DIÁMETRO REAL de los puntos —COBE dibuja
      // el planeta con radio 0.4·sizePx— y no sobre el lienzo:
      //  · Desktop: diámetro ~0.9·ancho ⇒ los costados de la esfera caen DENTRO
      //    del viewport, así que se percibe la curvatura de un globo (antes era
      //    1.06·ancho y el limbo cruzaba plano de borde a borde = arco).
      //  · Mobile: el globo es mucho mayor que antes (llenaba sólo el centro
      //    como un anillo completo) y se recorta por abajo con el hero, para que
      //    se vea "medio mundo" igual que en desktop.
      const narrow = w < 768;
      narrowView = narrow;
      const diameter = narrow
        ? Math.max(w * 1.45, Math.min(h * 0.88, w * 2.4))
        : Math.min(w * 0.9, h * 1.34);
      sizePx = diameter / 0.8;
      // Ápice del limbo (borde superior de los puntos) anclado a una fracción
      // del alto del hero; el resto del planeta baja y se recorta abajo.
      const topPx = h * (narrow ? 0.13 : 0.11) - sizePx * 0.1;
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

      // El halo del planeta ya no se dibuja con un box-shadow externo (llenaba las
      // esquinas de forma dura): ahora es un gradiente radial en la capa 2D
      // (drawOverlay), centrado en la esfera. Aquí solo geometría del globo.

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
        dark: 1.05,
        diffuse: 1.5, // volumen (luz/sombra) → no plano, sin quemar el terminador
        mapSamples: mobile ? 11000 : 20000,
        // Continentes VISIBLES (obs. cliente: debe leerse como un mundo). La
        // legibilidad del titular la resuelven los velos radiales de
        // HeroHomeReact (z-[1]), no el apagado de los puntos.
        mapBrightness: 3.2,
        mapBaseBrightness: 0.055, // océano: silueta oscura pero perceptible
        baseColor: LAND, // continentes en blanco lila
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
    // El ancho del hero también cambia sin evento `resize` (al aparecer el
    // scrollbar tras montar, por ejemplo): sin esto el canvas se quedaba con la
    // geometría del primer frame y desfasado respecto al layout real.
    let lastW = root.clientWidth;
    let lastH = root.clientHeight;
    const ro = new ResizeObserver(() => {
      const w = root.clientWidth;
      const h = root.clientHeight;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      onResize();
    });
    ro.observe(root);

    // ── Cursor: atracción MUY suave de las estrellas (mucho más leve que antes).
    const cursor = { x: 0, y: 0, active: false };
    const CURSOR_R = 170;
    const FORCE = 0.018; // suave (referencia previa era ~0.09)
    const SPRING = 0.006; // devuelve el desplazamiento por cursor a 0
    const DAMP = 0.93;
    const MAX_OFF = 90; // tope del desplazamiento por cursor (px)
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
        // Deriva base: velocidad constante + envolvente por los bordes → el campo
        // NUNCA se desbalancea, por muy larga que sea la sesión.
        p.x += p.vx;
        p.y += p.vy;
        p.x = ((p.x % w) + w) % w;
        p.y = ((p.y % h) + h) % h;

        // Reacción al cursor: sólo mueve el offset, que vuelve solo a cero.
        if (cursor.active) {
          const dx = cursor.x - (p.x + p.ox);
          const dy = cursor.y - (p.y + p.oy);
          const d = Math.hypot(dx, dy);
          if (d > 0.001 && d < CURSOR_R) {
            const f = FORCE * (1 - d / CURSOR_R);
            p.ovx += (dx / d) * f;
            p.ovy += (dy / d) * f;
          }
        }
        p.ovx = (p.ovx - p.ox * SPRING) * DAMP;
        p.ovy = (p.ovy - p.oy * SPRING) * DAMP;
        p.ox += p.ovx;
        p.oy += p.ovy;
        if (p.ox > MAX_OFF) p.ox = MAX_OFF;
        else if (p.ox < -MAX_OFF) p.ox = -MAX_OFF;
        if (p.oy > MAX_OFF) p.oy = MAX_OFF;
        else if (p.oy < -MAX_OFF) p.oy = -MAX_OFF;
      }
    };

    // Dibuja toda la capa 2D: estrellas (costados) + arcos + nodos/pulsos, todo
    // sincronizado con la rotación del globo (misma proyección que COBE).
    const drawOverlay = (phi: number, theta: number, op: number, ms: number) => {
      if (!octx || !overlay) return;
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;
      // Se limpia TODO el buffer, no sólo el área CSS: si el canvas quedó más
      // ancho que el root (p.ej. el scrollbar aparece después del montaje), la
      // franja sobrante nunca se borraba y acumulaba una costra de puntos pegada
      // al borde derecho que crecía con el tiempo.
      octx.clearRect(0, 0, overlay.width, overlay.height);
      if (op <= 0.01) return;

      // Halo/atmósfera del planeta: blit del sprite precomputado, anclado al
      // borde REAL de los puntos (radio 0.4·sizePx, porque la proyección de COBE
      // usa GLOBE_R = 0.8), para que la línea de luz quede PEGADA al planeta.
      {
        const gcx = gLeft + sizePx / 2;
        const gcy = gTop + sizePx / 2;
        const rOuter = sizePx * 0.4 * HALO_OUTER;
        octx.globalCompositeOperation = "lighter";
        // En mobile el planeta ocupa toda la pantalla y sobre él va un velo
        // oscuro (HeroHomeReact): sin este refuerzo el limbo queda casi apagado.
        octx.globalAlpha = Math.min(1, op * (narrowView ? 1.45 : 1));
        octx.drawImage(
          haloSprite,
          gcx - rOuter,
          gcy - rOuter,
          rOuter * 2,
          rOuter * 2
        );
        octx.globalAlpha = 1;

        // Luz DIRECCIONAL: la atmósfera es más intensa arriba (de donde viene la
        // luz) y se apaga hacia abajo, como en las referencias. Sin esto el halo
        // rodea la esfera con la misma intensidad y vuelve a leerse como un aro
        // de neón. Se aplica antes de pintar estrellas/arcos para no borrarlos.
        const fade = octx.createLinearGradient(0, gcy - rOuter, 0, gcy + rOuter);
        fade.addColorStop(0, "rgba(0,0,0,0)");
        fade.addColorStop(0.42, "rgba(0,0,0,0)");
        fade.addColorStop(0.72, `rgba(0,0,0,${narrowView ? 0.3 : 0.42})`);
        fade.addColorStop(1, `rgba(0,0,0,${narrowView ? 0.55 : 0.72})`);
        octx.globalCompositeOperation = "destination-out";
        octx.fillStyle = fade;
        octx.fillRect(0, 0, overlay.width, overlay.height);
        octx.globalCompositeOperation = "source-over";
      }

      // Estrellas: más presentes hacia los costados (fade en el centro).
      const cx = w / 2;
      const half = w * 0.5;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const sx = s.x + s.ox;
        const sy = s.y + s.oy;
        const edge = Math.min(
          1,
          Math.max(0, (Math.abs(sx - cx) / half - 0.2) / 0.45)
        );
        drawSoft(sx, sy, 2.6, edge * 0.9 * op);
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
      ro.disconnect();
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
      {/* Resplandor de base (morado de marca) detrás del globo. Más bajo y más
          contenido que antes: el "espacio" alrededor del planeta debe quedar casi
          negro para que el limbo brille por contraste (referencia del cliente). */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(96% 62% at 50% 86%, rgba(150,35,122,0.16) 0%, rgba(101,15,80,0.08) 40%, rgba(59,14,48,0.03) 62%, rgba(0,0,0,0) 78%)",
          pointerEvents: "none",
        }}
      />

      {/* El halo del planeta se dibuja en la capa 2D (overlay) como gradiente
          radial centrado en la esfera — ver drawOverlay. */}

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
