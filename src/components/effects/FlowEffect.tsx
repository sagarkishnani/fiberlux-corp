import { useEffect, useRef } from "react";

/**
 * FlowEffect — gradiente líquido/aurora turbulento con dither, sobre negro.
 *
 * Shader GLSL portado 1:1 del canvas WebGL2 del hero de scalarr.framer.website
 * (shader de turbulencia + paleta OKLab + dither, de Paper Shaders). Vertex +
 * fragment idénticos, capturados en runtime vía gl.shaderSource; uniforms con
 * los valores exactos del original. Solo se cambia la PALETA: el azul original
 * → magenta de marca de Fiberlux.
 *
 * El original es multi-pass (una simulación de fluido para interacción con el
 * mouse escribe u_push_buffer). Aquí solo se implementa el paso de DISPLAY: la
 * animación base la mueve u_time (turbulencia), así que u_push_buffer se enlaza
 * a una textura de ceros (sin interacción de mouse) y el flujo anima igual.
 *
 * Requiere WebGL2. Sin dependencias. Respeta prefers-reduced-motion (frame
 * estático) y pausa el rAF fuera de viewport.
 */

const VERT = `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_texCoord;

out vec2 v_uv;

void main() {
    v_uv = a_texCoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

#define NUM_COLORS 8

uniform vec4 u_colors[NUM_COLORS];
uniform int u_colors_length;
uniform float u_seed;
uniform float u_speed;
uniform float u_loop;
uniform float u_scale;
uniform float u_turbAmp;
uniform float u_turbFreq;
uniform float u_turbIter;
uniform float u_waveFreq;
uniform float u_distBias;
uniform float u_jellify;
uniform float u_mousePush;
uniform float u_mouseRadius;
uniform float u_mouseStretch;
uniform float u_mousePersist;
uniform float u_ditherMode;
uniform float u_dither;
uniform float u_exposure;
uniform float u_contrast;
uniform float u_saturation;

uniform sampler2D u_push_buffer;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_deltaTime;
uniform float u_pixelRatio;
uniform vec4 u_mousePosition;
uniform float u_mousePointerDown;
uniform float u_mouseHover;

// === CONSTANTS ===
const float GOLDEN_ANGLE = 2.3999632;
const float TAU = 6.28318530;

// === PCG hash - https://www.jcgt.org/published/0009/03/02/
uvec3 hash3(uvec3 v) {
    v = v * 1664525u + 1013904223u;
    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;
    v ^= v >> 16u;
    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;
    return v;
}

// Seed
vec3 seedRandom(float seedVal) {
    uvec3 s = uvec3(
        floatBitsToUint(seedVal),
        floatBitsToUint(seedVal * 1.5 + 7.31),
        floatBitsToUint(seedVal * 2.7 + 13.37)
    );
    s = hash3(s);
    return vec3(s) / float(0xFFFFFFFFu);
}

// === COLOR SPACE UTILITIES ===
vec3 toLinear(vec3 c) {
    return pow(c, vec3(2.2));
}

vec3 toSrgb(vec3 c) {
    return pow(clamp(c, 0.0, 1.0), vec3(0.4545));
}

vec3 linearToOklab(vec3 c) {
    float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
    float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
    float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;

    l = pow(max(l, 0.0), 1.0/3.0);
    m = pow(max(m, 0.0), 1.0/3.0);
    s = pow(max(s, 0.0), 1.0/3.0);

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

    l = l * l * l;
    m = m * m * m;
    s = s * s * s;

    return vec3(
        +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    );
}

vec3 oklabToLch(vec3 lab) {
    return vec3(lab.x, length(lab.yz), atan(lab.z, lab.y));
}

vec3 lchToOklab(vec3 lch) {
    return vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z));
}

vec3 mixLch(vec3 lab0, vec3 lab1, float t) {
    vec3 lch0 = oklabToLch(lab0);
    vec3 lch1 = oklabToLch(lab1);

    if (lch0.y < 0.05) lch0.z = lch1.z;
    if (lch1.y < 0.05) lch1.z = lch0.z;

    float dh = lch1.z - lch0.z;
    if (dh > 3.14159265) dh -= 6.28318530;
    if (dh < -3.14159265) dh += 6.28318530;

    return lchToOklab(vec3(
        mix(lch0.x, lch1.x, t),
        mix(lch0.y, lch1.y, t),
        lch0.z + dh * t
    ));
}

// === PALETTE SAMPLING ===
vec3 getColor(int idx) {
    if (u_colors_length < 1) return vec3(0.0);
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

// === DITHER ===
float IGN(vec2 uv) {
    return fract(52.9829189 * fract(dot(uv, vec2(0.06711056, 0.00583715))));
}

float quickNoise(vec2 I) {
    return fract(sin(dot(I, vec2(12.9898, 78.233))) * 43758.5453);
}

// Dither Mode: 0=Off, 1=IGN, 2=quickNoise
float getDither(vec2 I, float mode) {
    if (mode < 0.5) return 0.5;          // 0: Off
    if (mode < 1.5) return IGN(I);       // 1: Smooth
    return quickNoise(I);                // 2: Grain
}

// === POST-PROCESS ===
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

// === MAIN ===
void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 r = u_resolution;
    vec2 p = (fragCoord * 2.0 - r) / r.y;

    int colorCount = u_colors_length;

    // Early out: no colors -> black
    if (colorCount < 1) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    float t = u_time * 0.3;

    // Map time onto a circle so animation seamlessly wraps.
    float looping = step(0.5, u_loop);
    float phase = TAU * u_time / max(u_loop, 0.01);
    float radius = u_loop * u_speed * 0.3 / TAU;
    float tA = sin(phase) * radius;
    float tB = (1.0 - cos(phase)) * radius;

    // Seed-based offsets
    vec3 seedOffset = seedRandom(u_seed);
    vec3 seedOffset2 = seedRandom(u_seed + 100.0);

    // Golden angle rotation
    float seedAngle = u_seed * GOLDEN_ANGLE;
    vec2 seedPhase = (seedOffset2.xy - 0.5) * TAU;

    // Seed-based rotation
    float cs = cos(seedAngle);
    float sn = sin(seedAngle);
    mat2 rot = mat2(cs, -sn, sn, cs);
    p = rot * p;

    // === MOUSE PUSH ===
    // Displace the domain by the accumulated push field so the pattern
    // drags in the direction the cursor moved, then relaxes as it decays.
    vec2 pushField = texture(u_push_buffer, v_uv).xy;
    p -= rot * pushField * 2.0;

    // Get dither value
    float dither = getDither(floor(fragCoord / u_pixelRatio), u_ditherMode);

    // === TURBULENCE ===
    float totalVal = 0.0;
    float totalWeight = 0.0;
    int turbIter = int(u_turbIter);

    float freq = 1.0 / max(u_turbFreq, 0.01);

    for (float i = 0.0; i < 4.0; i++) {
        float eph = i / 4.0;

        vec2 q = p * u_scale;
        float sq = eph * eph;

        if (u_jellify > 0.5) {
            q.yx *= mix(1.0, 0.5, 1.0 - exp(-sq));
        }

        float a = seedPhase.x;
        float d = seedPhase.y;

        for (int j = 2; j < 13; j++) {
            if (j >= turbIter) break;
            float fj = float(j);
            // When looping, use circular time. Otherwise original t.
            float t1 = mix(t * u_speed, tA, looping);
            float t2 = mix(t * u_speed, tB, looping);
            q += u_turbAmp * sin(q.yx / freq * fj + t1 + vec2(a, d) + seedOffset.xy * fj) / fj;
            a += cos(fj + d * 1.2 + q.x * 2.0 - t1 + seedOffset2.z + t2 * 0.3 * looping);
            d += sin(fj * q.y + a + seedOffset.z + t1 + seedOffset2.y + t2 * 0.3 * looping);
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

    vec3 col = paletteN(val, colorCount);
    col *= u_exposure;
    col = applyContrastSaturation(col, u_contrast, u_saturation);
    col = softGamutMap(col);
    col = toSrgb(col);

    fragColor = vec4(col, 1.0);
}
`;

// ── Uniforms exactos del original (Scalarr/Paper Shaders), paleta a magenta ──
// Original azul: #E6EEFE → #578CF7 → #002B8A → negro×3.
// Aquí: magenta/morado dominante con los colores de marca (sin blanco).
const COLORS: Array<[number, number, number, number]> = [
  [0.588, 0.137, 0.478, 1], // highlight: brand-purple #96237A
  [0.396, 0.059, 0.314, 1], // medio: brand-purple-dark #650F50
  [0.231, 0.055, 0.188, 1], // oscuro: brand-purple-darkest #3B0E30
  [0, 0, 0, 1],
  [0, 0, 0, 1],
  [0, 0, 0, 1],
];
const PARAMS = {
  colorsLength: 6,
  seed: 648,
  speed: 0.28,
  loop: 0,
  scale: 0.42,
  turbAmp: 0.6,
  turbFreq: 0.1,
  turbIter: 7,
  waveFreq: 3.8,
  distBias: 0,
  jellify: 0,
  ditherMode: 2,
  dither: 0.05,
  exposure: 1.1,
  contrast: 1.1,
  saturation: 1,
};

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("FlowEffect shader error:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/* Pass de SIMULACIÓN del empuje de fluido. Mantiene un campo de desplazamiento
   (RG) que el pass DISPLAY consume en `p -= rot * pushField * 2.0`: cada frame
   decae el campo (relajación) e inyecta desplazamiento con forma de gota,
   estirado en la dirección del movimiento del cursor. */
const SIM_FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_field;   // campo previo (ping-pong)
uniform vec2 u_mouse;        // posición del cursor en uv (0..1)
uniform vec2 u_vel;          // velocidad del cursor (uv, escalada)
uniform float u_active;      // 1 si hay hover (pointer fino) dentro del canvas
uniform float u_push;        // fuerza de inyección
uniform float u_radius;      // radio de la gota (uv)
uniform float u_stretch;     // estiramiento a lo largo de la velocidad
uniform float u_persist;     // factor de decaimiento por frame
uniform vec2 u_aspect;       // (ancho/alto, 1) para que la gota sea redonda

void main() {
    vec2 field = texture(u_field, v_uv).xy;
    field *= u_persist;
    if (u_active > 0.5) {
        vec2 d = (v_uv - u_mouse) * u_aspect;
        float vl = length(u_vel);
        vec2 vdir = vl > 1e-5 ? u_vel / vl : vec2(0.0);
        float along = dot(d, vdir);
        vec2 perpv = d - along * vdir;
        float perp = length(perpv);
        float a = along / (u_radius * u_stretch);
        float b = perp / u_radius;
        float g = exp(-(a * a + b * b));
        field += u_vel * u_push * g;
    }
    fragColor = vec4(field, 0.0, 1.0);
}
`;

interface Props {
  className?: string;
  signalReady?: boolean;
  /* Se llama si WebGL2/shaders no están disponibles: el consumidor muestra su
     propio fallback SOLO en ese caso (no como flash inicial). */
  onUnsupported?: () => void;
}

export default function FlowEffect({ className, signalReady, onUnsupported }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
    }) as WebGL2RenderingContext | null;
    if (!gl) {
      console.warn("FlowEffect: WebGL2 no disponible");
      onUnsupported?.();
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      onUnsupported?.();
      return;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    // Ubicaciones fijas 0/1 para compartir el mismo VBO con el pass de simulación.
    gl.bindAttribLocation(prog, 0, "a_position");
    gl.bindAttribLocation(prog, 1, "a_texCoord");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("FlowEffect link error:", gl.getProgramInfoLog(prog));
      onUnsupported?.();
      return;
    }
    gl.useProgram(prog);

    // Quad a pantalla completa: interleaved [x, y, u, v]
    const verts = new Float32Array([
      -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, -1, 1, 0, 1, 1, -1, 1, 0, 1, 1, 1,
      1,
    ]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_position");
    const aUv = gl.getAttribLocation(prog, "a_texCoord");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);

    // Textura de ceros para u_push_buffer (sin interacción de mouse)
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    gl.uniform1i(U("u_push_buffer"), 0);
    const flat = new Float32Array(8 * 4);
    for (let i = 0; i < COLORS.length; i++) {
      flat[i * 4] = COLORS[i][0];
      flat[i * 4 + 1] = COLORS[i][1];
      flat[i * 4 + 2] = COLORS[i][2];
      flat[i * 4 + 3] = COLORS[i][3];
    }
    gl.uniform4fv(U("u_colors"), flat);
    gl.uniform1i(U("u_colors_length"), PARAMS.colorsLength);
    gl.uniform1f(U("u_seed"), PARAMS.seed);
    gl.uniform1f(U("u_speed"), PARAMS.speed);
    gl.uniform1f(U("u_loop"), PARAMS.loop);
    gl.uniform1f(U("u_scale"), PARAMS.scale);
    gl.uniform1f(U("u_turbAmp"), PARAMS.turbAmp);
    gl.uniform1f(U("u_turbFreq"), PARAMS.turbFreq);
    gl.uniform1f(U("u_turbIter"), PARAMS.turbIter);
    gl.uniform1f(U("u_waveFreq"), PARAMS.waveFreq);
    gl.uniform1f(U("u_distBias"), PARAMS.distBias);
    gl.uniform1f(U("u_jellify"), PARAMS.jellify);
    gl.uniform1f(U("u_ditherMode"), PARAMS.ditherMode);
    gl.uniform1f(U("u_dither"), PARAMS.dither);
    gl.uniform1f(U("u_exposure"), PARAMS.exposure);
    gl.uniform1f(U("u_contrast"), PARAMS.contrast);
    gl.uniform1f(U("u_saturation"), PARAMS.saturation);

    const uRes = U("u_resolution");
    const uTime = U("u_time");
    const uPr = U("u_pixelRatio");
    const uDt = U("u_deltaTime");

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const pw = Math.max(1, Math.floor(w * dpr));
      const ph = Math.max(1, Math.floor(h * dpr));
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uPr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let raf = 0;
    const start = performance.now();
    let prev = start;
    let visible = true;
    let signaled = false;

    /* ── Interacción hover: pass de simulación que empuja el fluido ──
       Solo con puntero fino y soporte de texturas float; si no, se mantiene
       el buffer de ceros (comportamiento base sin interacción). */
    const finePointer =
      window.matchMedia?.("(pointer: fine)").matches ?? false;
    const floatExt = gl.getExtension("EXT_color_buffer_float");
    const SIM = 512; // resolución del campo de empuje (independiente del canvas)

    let simProg: WebGLProgram | null = null;
    let fieldA: { t: WebGLTexture; f: WebGLFramebuffer } | null = null;
    let fieldB: { t: WebGLTexture; f: WebGLFramebuffer } | null = null;
    let simU: Record<string, WebGLUniformLocation | null> = {};
    const mouse = { x: 0.5, y: 0.5, vx: 0, vy: 0, active: false, has: false, lastX: 0.5, lastY: 0.5 };

    // Se escucha en window (no en el canvas): el contenido del hero (z-10) tapa
    // el canvas (z-0) e interceptaría los eventos. Se mapea la posición contra
    // el rect del canvas y solo se activa el empuje si el cursor está dentro.
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const ux = (e.clientX - rect.left) / rect.width;
      const uy = 1 - (e.clientY - rect.top) / rect.height; // uv: origen abajo-izq
      const inside = ux >= 0 && ux <= 1 && uy >= 0 && uy <= 1;
      if (inside && mouse.has) {
        mouse.vx = Math.max(-0.8, Math.min(0.8, mouse.vx + (ux - mouse.lastX) * 4));
        mouse.vy = Math.max(-0.8, Math.min(0.8, mouse.vy + (uy - mouse.lastY) * 4));
      }
      mouse.x = ux;
      mouse.y = uy;
      mouse.lastX = ux;
      mouse.lastY = uy;
      mouse.active = inside;
      mouse.has = true;
    };

    if (finePointer && floatExt && !reduce) {
      const simFs = compile(gl, gl.FRAGMENT_SHADER, SIM_FRAG);
      if (simFs) {
        const sp = gl.createProgram()!;
        gl.attachShader(sp, vs);
        gl.attachShader(sp, simFs);
        gl.bindAttribLocation(sp, 0, "a_position");
        gl.bindAttribLocation(sp, 1, "a_texCoord");
        gl.linkProgram(sp);
        if (gl.getProgramParameter(sp, gl.LINK_STATUS)) simProg = sp;
      }
      const mkField = () => {
        const tx = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tx);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SIM, SIM, 0, gl.RGBA, gl.HALF_FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const fb = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tx, 0);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return { t: tx, f: fb };
      };
      if (simProg) {
        fieldA = mkField();
        fieldB = mkField();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(simProg);
        simU = {
          field: gl.getUniformLocation(simProg, "u_field"),
          mouse: gl.getUniformLocation(simProg, "u_mouse"),
          vel: gl.getUniformLocation(simProg, "u_vel"),
          active: gl.getUniformLocation(simProg, "u_active"),
          push: gl.getUniformLocation(simProg, "u_push"),
          radius: gl.getUniformLocation(simProg, "u_radius"),
          stretch: gl.getUniformLocation(simProg, "u_stretch"),
          persist: gl.getUniformLocation(simProg, "u_persist"),
          aspect: gl.getUniformLocation(simProg, "u_aspect"),
        };
        gl.useProgram(prog);
        window.addEventListener("pointermove", onPointerMove, { passive: true });
      }
    }
    const simActive = !!simProg && !!fieldA && !!fieldB;

    function frame(now: number) {
      resize();
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;

      if (simActive) {
        // Pass de simulación: decae el campo e inyecta empuje en el cursor.
        mouse.vx *= 0.82;
        mouse.vy *= 0.82;
        const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
        gl.useProgram(simProg);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fieldB!.f);
        gl.viewport(0, 0, SIM, SIM);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fieldA!.t);
        gl.uniform1i(simU.field, 1);
        gl.uniform2f(simU.mouse, mouse.x, mouse.y);
        gl.uniform2f(simU.vel, mouse.active ? mouse.vx : 0, mouse.active ? mouse.vy : 0);
        gl.uniform1f(simU.active, mouse.active ? 1 : 0);
        gl.uniform1f(simU.push, 0.06);
        gl.uniform1f(simU.radius, 0.16);
        gl.uniform1f(simU.stretch, 2.2);
        gl.uniform1f(simU.persist, 0.9);
        gl.uniform2f(simU.aspect, aspect, 1);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        const tmp = fieldA;
        fieldA = fieldB;
        fieldB = tmp; // swap ping-pong

        // El DISPLAY lee el campo recién escrito por u_push_buffer (unit 0).
        gl.useProgram(prog);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fieldA!.t);
      }

      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform1f(uDt, dt);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (signalReady && !signaled) {
        signaled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
      if (!reduce && visible) raf = requestAnimationFrame(frame);
      else raf = 0; // permite que el IntersectionObserver reinicie el loop al volver
    }

    // Limpia el campo de empuje (evita deformación residual congelada al volver).
    const clearFields = () => {
      for (const fld of [fieldA, fieldB]) {
        if (!fld) continue;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fld.f);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          if (!reduce && !raf) raf = requestAnimationFrame(frame);
        } else if (simActive) {
          // Al salir del viewport: sin velocidad ni empuje residual al regresar.
          mouse.vx = 0;
          mouse.vy = 0;
          mouse.active = false;
          mouse.has = false;
          clearFields();
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    if (reduce) {
      gl.uniform1f(uTime, 10.0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (signalReady)
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      io.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      gl.deleteProgram(prog);
      if (simProg) gl.deleteProgram(simProg);
      if (fieldA) {
        gl.deleteTexture(fieldA.t);
        gl.deleteFramebuffer(fieldA.f);
      }
      if (fieldB) {
        gl.deleteTexture(fieldB.t);
        gl.deleteFramebuffer(fieldB.f);
      }
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
      gl.deleteTexture(tex);
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
