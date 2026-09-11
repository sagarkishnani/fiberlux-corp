import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/**
 * FiberTunnel — fondo del hero en modo `fiber` (SPEC 113).
 *
 * Filamentos de luz con paquetes recorriéndolos: es, literalmente, el producto
 * del cliente (luz viajando dentro de vidrio). Tres tratamientos sobre el mismo
 * shader, elegibles desde Tina:
 *
 *   · `tunel`    — haces convergiendo a un punto de fuga. El validado.
 *   · `haz`      — filamentos horizontales, más sobrio.
 *   · `reticula` — malla de nodos con paquetes recorriendo las aristas.
 *
 * WebGL2 crudo, sin three.js (mismo patrón que `AuroraRibbons`, SPEC 108): un
 * triángulo a pantalla completa y un fragment shader.
 *
 * ── LA COSTURA DE atan2 ────────────────────────────────────────────────────
 * El modo `tunel` trabaja en polares (`a = atan(c.y, c.x)`). Donde el ángulo
 * salta de π a −π hay una discontinuidad, y ahí `fwidth()` —la derivada por
 * píxel, que es lo que da el antialiasing de cada filamento— se dispara. Esa
 * fila de píxeles se ensancha hasta cruzar la pantalla y titila cada frame:
 * **no es un filamento, es el antialiasing reventando en la costura.** Fue la
 * "raya horizontal en el medio que parpadea" que reportó el cliente.
 *
 * Van dos medidas y hacen falta las dos:
 *   1. Acotar el ancho derivado (`min(..., SEAM_CAP)` en `filament()`).
 *   2. Un número ENTERO de filamentos por vuelta. Con un número no entero
 *      `fract()` no empalma en el salto de ±π y queda una costura permanente
 *      además del parpadeo. Es condición de diseño, no un ajuste fino: si
 *      alguien retoca la densidad, tiene que seguir siendo entera.
 *
 * Como el resto de efectos del repo: pausa fuera de viewport y con la pestaña
 * oculta, un solo frame con `prefers-reduced-motion`, auto-degradado de
 * resolución si el equipo no sostiene el frame, y `onUnsupported()` para que el
 * padre monte su fallback CSS si no hay WebGL2.
 */

export type FiberVariant = "tunel" | "haz" | "reticula";
export type FiberIntensity = "sutil" | "medio" | "intenso";

/** Handle imperativo: el capítulo del hero empuja aquí su progreso. */
export interface FiberTunnelHandle {
  /** 0→1 dentro del hero. Solo controla el fogonazo del núcleo. */
  setHero(p: number): void;
  /** 0→1 a lo largo del tramo narrativo. Avanza el viaje (monótono). */
  setTravel(p: number): void;
  /**
   * Opacidad del fondo. En 0 además DEJA DE RENDERIZAR: es lo que garantiza
   * que al entrar en Soluciones no queden dos canvas WebGL vivos (el aurora de
   * la SPEC 108 arranca justo ahí). El IntersectionObserver no sirve para esto
   * cuando el host es `fixed`, porque entonces siempre está en viewport.
   */
  setOpacity(v: number): void;
}

interface Props {
  variant?: FiberVariant;
  intensity?: FiberIntensity;
  /** Host `fixed` en vez de `absolute`: el fondo atraviesa varios capítulos. */
  fixed?: boolean;
  className?: string;
  /** Se llama si no hay WebGL2 o si el shader no compila. */
  onUnsupported?: () => void;
  /** Emite `fbx:hero-scene-loaded` tras el primer frame, como el resto de
      fondos del hero (lo escucha el prefetch de escenas de `index.astro`). */
  signalReady?: boolean;
}

/** Palancas del efecto. Todo lo caro se regula desde aquí. */
const PARAMS = {
  /** Multiplicador de brillo por opción de Tina. */
  intensity: { sutil: 0.72, medio: 1, intenso: 1.35 } as Record<FiberIntensity, number>,
  /** Velocidad base del viaje (sin scroll). */
  drift: 0.28,
  /** Cuánto avanza el viaje a lo largo de todo el tramo narrativo. */
  travelGain: 9,
  dprCap: 1.5,
  dprCapMobile: 1,
  renderScale: 1,
  renderScaleMobile: 0.85,
  /** Suelo de rendimiento: por debajo, baja la resolución sola. */
  fpsFloor: 46,
  fpsCap: 60,
  fpsCapMobile: 30,
  scaleStep: 0.25,
  scaleMin: 0.55,
  /** Frames renderizados entre mediciones de fps. */
  sampleFrames: 90,
} as const;

const MODE: Record<FiberVariant, number> = { tunel: 0, haz: 1, reticula: 2 };

const VERT = `#version 300 es
precision highp float;
void main() {
  // Triángulo a pantalla completa derivado del índice de vértice: sin buffers.
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
out vec4 O;

uniform vec2  u_res;
uniform float u_time;
uniform float u_travel;     // 0..1 a lo largo del tramo narrativo
uniform float u_hero;       // 0..1 dentro del hero (solo fogonazo)
uniform float u_intensity;
uniform vec2  u_mouse;
uniform int   u_mode;

const vec3 PLUM = vec3(0.231, 0.055, 0.188);  /* #3B0E30 */
const vec3 MAG  = vec3(0.588, 0.137, 0.478);  /* #96237A */
const vec3 HOT  = vec3(1.000, 0.420, 0.870);

/* Tope del ancho derivado. Sin él, el píxel de la costura de atan2 tiene
   derivada enorme y pinta una línea a pantalla completa. */
const float SEAM_CAP = 0.25;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

/* Filamento antialiasado. 'coord' va en vueltas: el centro del hilo está en
   cada .5 de la parte fraccionaria. */
float filament(float coord, float glow) {
  float d = abs(fract(coord) - 0.5);
  float w = min(fwidth(coord) * 1.6 + 0.0025, SEAM_CAP);
  float core = 1.0 - smoothstep(0.0, w, d);
  return core + glow * exp(-d * d * 260.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  /* El viaje es monótono y solo depende del tiempo y del progreso del tramo.
     Si dependiera de u_hero, al decaer el fogonazo se viajaría hacia atrás. */
  float travel = u_time * ${PARAMS.drift.toFixed(3)} + u_travel * ${PARAMS.travelGain.toFixed(1)};
  vec3 col = vec3(0.0);

  if (u_mode == 0) {
    /* ── TÚNEL ─────────────────────────────────────────────────────────── */
    vec2 c = uv - u_mouse * 0.10;
    float r = max(length(c), 0.0012);
    float a = atan(c.y, c.x);
    float z = 0.30 / r + travel;
    float g = 0.0;
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      /* ENTEROS, siempre: 9, 16, 23, 30. Con un número fraccionario, fract()
         no empalma en el salto de ±π y queda una costura permanente. */
      float n = 9.0 + fi * 7.0;
      float s = (a + sin(z * 0.22 + fi * 1.7) * 0.30) * n / 6.28318;
      float pulse = pow(0.5 + 0.5 * sin(z * 1.5 - u_time * (1.1 + fi * 0.45) + fi * 2.1), 5.0);
      g += filament(s, 0.5) * (0.16 + 1.05 * pulse) / (1.0 + fi * 0.55);
    }
    g *= smoothstep(0.015, 0.30, r) * 1.05 / (1.0 + r * r * 4.2);
    float core = pow(1.0 / (1.0 + r * 20.0), 1.8);
    col += g * mix(MAG, HOT, clamp(g, 0.0, 1.0));
    col += core * vec3(1.0, 0.62, 0.96) * (0.30 + u_hero * 1.7);
    col += PLUM * fbm(uv * 1.7 + u_time * 0.03) * 0.55 * (1.0 - min(r, 1.0));

  } else if (u_mode == 1) {
    /* ── HAZ ───────────────────────────────────────────────────────────── */
    vec2 p = uv;
    p.y += (fbm(p * 1.15 + vec2(u_time * 0.05, 0.0)) - 0.5) * 0.55;
    float g = 0.0;
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float y = p.y * (2.6 + fi * 2.1) + sin(p.x * 1.5 + u_time * 0.18 + fi) * 0.75 + fi * 0.9;
      float pulse = pow(0.5 + 0.5 * sin(p.x * 2.2 - u_time * (0.8 + fi * 0.25) - travel * 1.2 + fi), 6.0);
      g += filament(y, 0.35) * (0.14 + 0.95 * pulse) / (1.0 + fi * 0.32);
    }
    g *= smoothstep(1.15, 0.10, abs(uv.x) * 0.75);
    col += g * mix(MAG, HOT, clamp(g * 0.9, 0.0, 1.0));
    col += PLUM * fbm(uv * 1.3 - u_time * 0.02) * 0.7;
    col += vec3(1.0, 0.62, 0.96) * u_hero * 0.10;

  } else {
    /* ── RETÍCULA ──────────────────────────────────────────────────────── */
    vec2 gp = uv * 3.4 + vec2(travel * 0.22, u_time * 0.05);
    vec2 f = fract(gp) - 0.5;
    float w = min(fwidth(gp.x) * 1.6 + 0.004, SEAM_CAP);
    float grid = (1.0 - smoothstep(0.0, w * 2.2, abs(f.x)))
               + (1.0 - smoothstep(0.0, w * 2.2, abs(f.y)));
    float node = exp(-dot(f, f) * 70.0);
    float pk = pow(0.5 + 0.5 * sin((gp.x + gp.y) * 3.14159 - u_time * 1.6), 22.0);
    float fall = 1.0 / (1.0 + dot(uv, uv) * 2.2);
    col += (grid * 0.14 + node * (0.35 + pk * 1.5)) * mix(MAG, HOT, pk) * fall * 1.8;
    col += PLUM * fbm(uv * 1.1 + u_time * 0.02) * 0.6;
    col += vec3(1.0, 0.62, 0.96) * u_hero * 0.10;
  }

  col *= u_intensity;
  /* Viñeta: sin ella los cruces de filamentos se van a blanco en los bordes. */
  col *= 1.0 - 0.68 * smoothstep(0.30, 1.25, length(uv));
  col += (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.018;
  col = vec3(1.0) - exp(-col * 1.3);
  O = vec4(pow(max(col, vec3(0.0)), vec3(0.88)), 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    if (import.meta.env.DEV) console.error("[FiberTunnel]", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

const FiberTunnel = forwardRef<FiberTunnelHandle, Props>(function FiberTunnel(
  { variant = "tunel", intensity = "medio", fixed = false, className = "", onUnsupported, signalReady },
  ref
) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const failedRef = useRef(false);
  /* Estado que el capítulo empuja. Vive en una ref para que escribirlo no
     re-renderice React en cada frame de scroll. */
  const stateRef = useRef({ hero: 0, travel: 0, opacity: 1 });

  /* Igual que en AuroraRibbons: los callbacks van por ref y el efecto NO
     depende de ellos. Si dependiera, un padre con lambda inline re-ejecutaría
     el efecto en cada render y cada pasada crearía un contexto WebGL nuevo. */
  const unsupportedRef = useRef(onUnsupported);
  unsupportedRef.current = onUnsupported;
  const readyRef = useRef(signalReady);
  readyRef.current = signalReady;

  useImperativeHandle(ref, () => ({
    setHero(p: number) {
      stateRef.current.hero = Math.max(0, Math.min(1, p));
    },
    setTravel(p: number) {
      stateRef.current.travel = Math.max(0, Math.min(1, p));
    },
    setOpacity(v: number) {
      const o = Math.max(0, Math.min(1, v));
      stateRef.current.opacity = o;
      const host = hostRef.current;
      if (host) host.style.opacity = String(o);
    },
  }), []);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const fail = () => {
      if (failedRef.current) return;
      failedRef.current = true;
      canvas.style.display = "none";
      unsupportedRef.current?.();
    };

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      failIfMajorPerformanceCaveat: false,
    });
    if (!gl) {
      fail();
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = vs && fs ? gl.createProgram() : null;
    if (!vs || !fs || !prog) {
      fail();
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      fail();
      return;
    }
    gl.useProgram(prog);

    // WebGL2 exige un VAO ligado aunque el triángulo no use atributos.
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const loc = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = loc("u_res");
    const uTime = loc("u_time");
    const uTravel = loc("u_travel");
    const uHero = loc("u_hero");
    const uMouse = loc("u_mouse");

    gl.uniform1i(loc("u_mode"), MODE[variant] ?? 0);
    gl.uniform1f(loc("u_intensity"), PARAMS.intensity[intensity] ?? 1);

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const isMobile = window.matchMedia?.("(max-width: 767px)").matches ?? false;
    const finePointer = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;

    // `number` explícito: PARAMS es `as const` y sin esto el tipo se estrecha
    // a los dos literales y el auto-degradado no puede reasignarlo.
    let renderScale: number = isMobile ? PARAMS.renderScaleMobile : PARAMS.renderScale;
    let width = 0;
    let height = 0;

    const resize = (force = false) => {
      const rect = host.getBoundingClientRect();
      const dpr =
        Math.min(window.devicePixelRatio || 1, isMobile ? PARAMS.dprCapMobile : PARAMS.dprCap) *
        renderScale;
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (!force && w === width && h === height) return false;
      width = w;
      height = h;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      return true;
    };

    /* Paralaje de puntero, suavizado. Solo con puntero fino. */
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (finePointer && !reduce) {
      window.addEventListener("pointermove", onPointer, { passive: true });
    }

    let signalled = false;
    const draw = (seconds: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      gl.uniform1f(uTime, seconds);
      gl.uniform1f(uTravel, stateRef.current.travel);
      gl.uniform1f(uHero, stateRef.current.hero);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!signalled && readyRef.current) {
        signalled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
    };

    resize();

    let raf = 0;
    let visible = true;
    let last = -1;
    const start = performance.now();
    const frameMs = 1000 / (isMobile ? PARAMS.fpsCapMobile : PARAMS.fpsCap);
    /* Auto-degradado: se mide el intervalo real entre frames RENDERIZADOS. Si
       el equipo no sostiene el suelo de fps, se baja la resolución un escalón.
       Medir la cadencia del rAF no serviría: está capada a propósito. */
    const floorMs = 1000 / PARAMS.fpsFloor;
    let acc = 0;
    let samples = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      // Opacidad 0 ⇒ no se dibuja: ni un frame de trabajo fuera del tramo.
      if (!visible || document.hidden || stateRef.current.opacity <= 0.01) return;
      if (last >= 0) {
        const dt = now - last;
        if (dt < frameMs) return;
        acc += dt;
        samples++;
        if (samples >= PARAMS.sampleFrames) {
          if (acc / samples > floorMs && renderScale > PARAMS.scaleMin) {
            renderScale = Math.max(PARAMS.scaleMin, renderScale - PARAMS.scaleStep);
            resize(true);
          }
          acc = 0;
          samples = 0;
        }
      }
      last = now;
      resize();
      draw((now - start) / 1000);
    };

    if (reduce) {
      // Un frame y nada más: la imagen queda quieta.
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "120px" }
    );
    io.observe(host);

    const ro = new ResizeObserver(() => {
      if (resize() && reduce) draw(0);
    });
    ro.observe(host);

    return () => {
      io.disconnect();
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteVertexArray(vao);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [variant, intensity]);

  return (
    <div
      ref={hostRef}
      className={`${fixed ? "fixed" : "absolute"} inset-0 ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
});

export default FiberTunnel;
