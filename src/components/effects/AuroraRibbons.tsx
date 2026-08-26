import { useEffect, useRef } from "react";

/**
 * AuroraRibbons — cintas de luz de fondo para la sección de soluciones
 * (SPEC 108).
 *
 * Port del shader que usa la sección *Solutions* de `agentflow.framer.ai`
 * (familia "warp" de Paper Shaders: turbulencia iterativa sobre el plano y
 * rampa de paleta interpolada en OkLCH). El volcado crudo del original, con los
 * uniformes con los que corre esa página, está en
 * `references/aurora-agentflow.frag.txt`.
 *
 * Diferencias con el original, a propósito:
 *   · La paleta va en morado de marca en vez del verde de la referencia.
 *   · Fuera el buffer de empuje del cursor y el modo "loop": la sección no
 *     reacciona al mouse y el original tampoco lo usa (`u_loop = 0`).
 *   · Se dibuja a resolución reducida y con el rAF capado: es una imagen de
 *     baja frecuencia, así que no se nota, y el requisito del cliente es que
 *     los fondos no cuesten rendimiento.
 *
 * Como el resto de efectos del repo: pausa fuera de viewport, un solo frame
 * con `prefers-reduced-motion` y `onUnsupported()` para que el padre monte su
 * fallback CSS si no hay WebGL2.
 */

interface Props {
  className?: string;
  /** Se llama si no hay WebGL2 o si el shader no compila. */
  onUnsupported?: () => void;
}

/** Palancas del efecto. Los valores replican los de la referencia salvo la
    paleta (retintada) y el dither (encendido para matar el banding del
    degradado morado sobre negro). */
const PARAMS = {
  /** Rampa de la paleta: negro → magenta encendido → negro → ciruela → negro.
      Misma estructura de 5 paradas que el original. */
  colors: ["#000000", "#c65fac", "#000000", "#2a0a22", "#000000"],
  seed: 651,
  speed: 0.3,
  scale: 0.62,
  turbAmp: 0.56,
  turbFreq: 0.1,
  turbIter: 7,
  waveFreq: 1,
  distBias: 0,
  exposure: 1.1,
  contrast: 1.1,
  saturation: 1,
  /** 0 = off, 1 = IGN (suave), 2 = grano. */
  ditherMode: 1,
  dither: 0.05,
  /** Rendimiento: el dibujo es de baja frecuencia, se renderiza por debajo de
      la resolución de pantalla y a 30 fps sin diferencia visible. */
  renderScale: 0.75,
  renderScaleMobile: 0.55,
  dprCap: 1.5,
  fpsCap: 30,
} as const;

const VERT = `#version 300 es
precision highp float;
out vec2 v_uv;
void main() {
  // Triángulo a pantalla completa derivado del índice de vértice: sin buffers.
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  v_uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

#define NUM_COLORS 5

uniform vec4 u_colors[NUM_COLORS];
uniform int u_colors_length;
uniform float u_seed;
uniform float u_speed;
uniform float u_scale;
uniform float u_turbAmp;
uniform float u_turbFreq;
uniform float u_turbIter;
uniform float u_waveFreq;
uniform float u_distBias;
uniform float u_ditherMode;
uniform float u_dither;
uniform float u_exposure;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_pixelRatio;

const float GOLDEN_ANGLE = 2.3999632;
const float TAU = 6.28318530;

// PCG hash — https://www.jcgt.org/published/0009/03/02/
uvec3 hash3(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}

vec3 seedRandom(float seedVal) {
  uvec3 s = uvec3(
    floatBitsToUint(seedVal),
    floatBitsToUint(seedVal * 1.5 + 7.31),
    floatBitsToUint(seedVal * 2.7 + 13.37)
  );
  s = hash3(s);
  return vec3(s) / float(0xFFFFFFFFu);
}

vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
vec3 toSrgb(vec3 c) { return pow(clamp(c, 0.0, 1.0), vec3(0.4545)); }

vec3 linearToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0);
  m = pow(max(m, 0.0), 1.0 / 3.0);
  s = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  );
}

vec3 oklabToLinear(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 oklabToLch(vec3 lab) { return vec3(lab.x, length(lab.yz), atan(lab.z, lab.y)); }
vec3 lchToOklab(vec3 lch) { return vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z)); }

vec3 mixLch(vec3 lab0, vec3 lab1, float t) {
  vec3 lch0 = oklabToLch(lab0);
  vec3 lch1 = oklabToLch(lab1);
  if (lch0.y < 0.05) lch0.z = lch1.z;
  if (lch1.y < 0.05) lch1.z = lch0.z;
  float dh = lch1.z - lch0.z;
  if (dh > 3.14159265) dh -= TAU;
  if (dh < -3.14159265) dh += TAU;
  return lchToOklab(vec3(mix(lch0.x, lch1.x, t), mix(lch0.y, lch1.y, t), lch0.z + dh * t));
}

vec3 getColor(int idx) {
  int safeIdx = clamp(idx, 0, u_colors_length - 1);
  return u_colors[safeIdx].rgb;
}

vec3 paletteN(float t, int count) {
  if (count < 1) return vec3(0.0);
  if (count < 2) return toLinear(getColor(0));
  float segmentSize = 1.0 / float(count - 1);
  t = clamp(t, 0.0, 1.0);
  int idx = min(int(floor(t / segmentSize)), count - 2);
  float localT = clamp((t - float(idx) * segmentSize) / segmentSize, 0.0, 1.0);
  vec3 lab0 = linearToOklab(toLinear(getColor(idx)));
  vec3 lab1 = linearToOklab(toLinear(getColor(idx + 1)));
  return oklabToLinear(mixLch(lab0, lab1, localT));
}

float IGN(vec2 uv) {
  return fract(52.9829189 * fract(dot(uv, vec2(0.06711056, 0.00583715))));
}
float quickNoise(vec2 I) {
  return fract(sin(dot(I, vec2(12.9898, 78.233))) * 43758.5453);
}
float getDither(vec2 I, float mode) {
  if (mode < 0.5) return 0.5;
  if (mode < 1.5) return IGN(I);
  return quickNoise(I);
}

vec3 softGamutMap(vec3 linearRgb) {
  float maxC = max(linearRgb.r, max(linearRgb.g, linearRgb.b));
  float minC = min(linearRgb.r, min(linearRgb.g, linearRgb.b));
  if (minC >= 0.0 && maxC <= 1.0) return linearRgb;
  vec3 lab = linearToOklab(max(linearRgb, 0.0));
  float L = clamp(lab.x, 0.0, 1.0);
  float C = length(lab.yz);
  float h = atan(lab.z, lab.y);
  float maxChroma = 0.4 * (1.0 - pow(abs(2.0 * L - 1.0), 2.0));
  if (C > maxChroma * 0.7) {
    float knee = maxChroma * 0.7;
    C = knee + (maxChroma - knee) * tanh((C - knee) / (maxChroma - knee + 0.001));
  }
  return clamp(oklabToLinear(vec3(L, C * cos(h), C * sin(h))), 0.0, 1.0);
}

vec3 applyContrastSaturation(vec3 linearRgb, float contrast, float saturation) {
  vec3 lab = linearToOklab(linearRgb);
  float C = length(lab.yz);
  float h = atan(lab.z, lab.y);
  lab.x = clamp((lab.x - 0.5) * contrast + 0.5, 0.0, 1.0);
  C *= saturation;
  lab.y = C * cos(h);
  lab.z = C * sin(h);
  return oklabToLinear(lab);
}

void main() {
  vec2 fragCoord = v_uv * u_resolution;
  vec2 r = u_resolution;
  vec2 p = (fragCoord * 2.0 - r) / r.y;

  float t = u_time * 0.3;

  vec3 seedOffset = seedRandom(u_seed);
  vec3 seedOffset2 = seedRandom(u_seed + 100.0);

  float seedAngle = u_seed * GOLDEN_ANGLE;
  vec2 seedPhase = (seedOffset2.xy - 0.5) * TAU;

  float cs = cos(seedAngle);
  float sn = sin(seedAngle);
  p = mat2(cs, -sn, sn, cs) * p;

  float dither = getDither(floor(fragCoord / u_pixelRatio), u_ditherMode);

  float totalVal = 0.0;
  float totalWeight = 0.0;
  int turbIter = int(u_turbIter);
  float freq = 1.0 / max(u_turbFreq, 0.01);

  for (float i = 0.0; i < 4.0; i++) {
    float eph = i / 4.0;
    vec2 q = p * u_scale;
    float a = seedPhase.x;
    float d = seedPhase.y;

    for (int j = 2; j < 13; j++) {
      if (j >= turbIter) break;
      float fj = float(j);
      float t1 = t * u_speed;
      q += u_turbAmp * sin(q.yx / freq * fj + t1 + vec2(a, d) + seedOffset.xy * fj) / fj;
      a += cos(fj + d * 1.2 + q.x * 2.0 - t1 + seedOffset2.z);
      d += sin(fj * q.y + a + seedOffset.z + t1 + seedOffset2.y);
    }

    float v = 0.5 + 0.5 * sin(length(q.yx + vec2(a, d) * 0.2) * u_waveFreq + i * i + seedOffset.x);
    float weight = smoothstep(0.0, 0.5, eph) * smoothstep(1.0, 0.5, eph);
    totalVal += v * weight;
    totalWeight += weight;
  }

  float val = totalVal / totalWeight;
  val = clamp((val - 0.3) / 0.4, 0.0, 1.0);
  val = pow(val, exp(-u_distBias));
  val = clamp(val + (dither - 0.5) * u_dither, 0.0, 1.0);

  vec3 col = paletteN(val, u_colors_length);
  col *= u_exposure;
  col = applyContrastSaturation(col, u_contrast, u_saturation);
  col = softGamutMap(col);
  col = toSrgb(col);

  fragColor = vec4(col, 1.0);
}`;

/** "#rrggbb" → [r, g, b, 1] en 0..1. */
function hexToVec4(hex: string): [number, number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
    1,
  ];
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function AuroraRibbons({ className = "", onUnsupported }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const failedRef = useRef(false);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const fail = () => {
      if (failedRef.current) return;
      failedRef.current = true;
      canvas.style.display = "none";
      onUnsupported?.();
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

    const loc = (name: string) => gl.getUniformLocation(prog, name);
    const uTime = loc("u_time");
    const uRes = loc("u_resolution");
    const uPixelRatio = loc("u_pixelRatio");

    // Uniformes que no cambian nunca: se escriben una sola vez.
    const flat: number[] = [];
    PARAMS.colors.forEach((c) => flat.push(...hexToVec4(c)));
    gl.uniform4fv(loc("u_colors"), new Float32Array(flat));
    gl.uniform1i(loc("u_colors_length"), PARAMS.colors.length);
    gl.uniform1f(loc("u_seed"), PARAMS.seed);
    gl.uniform1f(loc("u_speed"), PARAMS.speed);
    gl.uniform1f(loc("u_scale"), PARAMS.scale);
    gl.uniform1f(loc("u_turbAmp"), PARAMS.turbAmp);
    gl.uniform1f(loc("u_turbFreq"), PARAMS.turbFreq);
    gl.uniform1f(loc("u_turbIter"), PARAMS.turbIter);
    gl.uniform1f(loc("u_waveFreq"), PARAMS.waveFreq);
    gl.uniform1f(loc("u_distBias"), PARAMS.distBias);
    gl.uniform1f(loc("u_ditherMode"), PARAMS.ditherMode);
    gl.uniform1f(loc("u_dither"), PARAMS.dither);
    gl.uniform1f(loc("u_exposure"), PARAMS.exposure);
    gl.uniform1f(loc("u_contrast"), PARAMS.contrast);
    gl.uniform1f(loc("u_saturation"), PARAMS.saturation);

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const isMobile = window.matchMedia?.("(max-width: 767px)").matches ?? false;
    const renderScale = isMobile ? PARAMS.renderScaleMobile : PARAMS.renderScale;

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, PARAMS.dprCap) * renderScale;
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (w === width && h === height) return false;
      width = w;
      height = h;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uPixelRatio, dpr);
      return true;
    };

    const draw = (seconds: number) => {
      gl.uniform1f(uTime, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    resize();

    let raf = 0;
    let visible = true;
    let last = -1;
    const start = performance.now();
    const frameMs = 1000 / PARAMS.fpsCap;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      if (last >= 0 && now - last < frameMs) return;
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
      { rootMargin: "120px" },
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
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteVertexArray(vao);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [onUnsupported]);

  return (
    <div ref={hostRef} className={`absolute inset-0 ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
