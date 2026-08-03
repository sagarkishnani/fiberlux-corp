import { useEffect, useRef } from "react";

/**
 * WaveformEffect — fondo animado de "rejilla de lentes + gradiente que fluye".
 *
 * Shader GLSL portado 1:1 del canvas WebGL2 del hero de
 * verity-template.framer.website (vertex + fragment idénticos, capturados en
 * runtime vía gl.shaderSource). Solo se cambia la PALETA: el acento cian del
 * original (#21D2ED) se sustituye por el magenta de marca de Fiberlux. El resto
 * de uniforms usa los valores exactos que Framer le pasa al shader.
 *
 * Requiere WebGL2 (usa `#version 300 es`, uint/floatBitsToUint). Sin
 * dependencias. Respeta prefers-reduced-motion (frame estático) y pausa el rAF
 * fuera de viewport.
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
uniform float u_ephemeralAmp;
uniform float u_lensScale;
uniform float u_lensSpacingX;
uniform float u_lensSpacingY;
uniform float u_lensRadius;
uniform float u_dispersionStrength;
uniform float u_edgeDisp;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_deltaTime;
uniform float u_pixelRatio;
uniform vec4 u_mousePosition;
uniform float u_mousePointerDown;
uniform float u_mouseHover;

// Interacción (SPEC 88+): ondas de agua. Click = onda fuerte; hover = estela de
// ondas ligeras siguiendo al cursor. Cada onda lleva su amplitud propia (.w).
uniform vec4  u_iRipples[16]; // (x, y, startTime, amplitud) por onda activa
uniform int   u_iRippleCount;

const int SAMPLES = 8;
const float EPHEMERAL_DRIP = 1.0;

const float I_RIPPLE_SPEED = 1.2;  // velocidad de expansión de la onda
const float I_RIPPLE_WIDTH = 0.13; // grosor del anillo
const float I_RIPPLE_AMP = 0.38;   // cuánto abre las líneas
const float I_RIPPLE_LIFE = 1.7;   // duración de la onda (s)

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
uvec3 seed;
vec3 random3f() {
    seed = hash3(seed);
    return vec3(seed) / float(-1u);
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

// === PALETTE SAMPLING ===
vec3 getColor(int idx) {
    if (u_colors_length < 1) return vec3(0.0);
    int safeIdx = clamp(idx, 0, u_colors_length - 1);
    return u_colors[safeIdx].rgb;
}

vec3 paletteN(float t, int count) {
    if (count < 1) return vec3(0.0);
    if (count < 2) return getColor(0);
    t = clamp(t, 0.0, 1.0) * float(count - 1);
    int idx = min(int(floor(t)), count - 2);
    float localT = fract(t);
    localT = localT * localT * (3.0 - 2.0 * localT);
    return mix(getColor(idx), getColor(idx + 1), localT);
}

// === Gradient Flow ===
float getGradientT(vec2 uv, float t, vec3 s1, vec3 s2) {
    // Seed-derived flow directions
    float angle1 = s1.x * 6.28;
    float angle2 = s1.y * 6.28;
    vec2 dir1 = vec2(cos(angle1), sin(angle1));
    vec2 dir2 = vec2(cos(angle2), sin(angle2));

    // Seed-derived frequencies
    float freq1 = 1.0 + s1.z * 2.0;
    float freq2 = 1.0 + s2.x * 1.5;
    float freq3 = 1.5 + s2.y * 2.0;

    float flow = dot(uv, dir1) + sin(dot(uv, dir2) * freq1 + t) * 0.3 + t * 0.2;
    float flow2 = dot(uv, dir2.yx) + cos(dot(uv, dir1.yx) * freq2 - t * 0.8) * 0.25;

    float gradT = sin(flow * 1.5) * 0.5 + 0.5;
    gradT += cos(flow2 * 1.2) * 1.3;
    gradT += sin(dot(uv, dir1 + dir2) * freq3 + t * 3.5) * 1.2;

    return smoothstep(0.0, 4.12, gradT);
}

// === BAND LENS ===
void applyBandLens(vec2 pp, float radiusSq, float iorOffset, out vec2 warpedUV, out float edgeFactor) {
    vec2 ppLens = pp;
    float spacingX = max(u_lensSpacingX, 0.001);
    float spacingY = max(u_lensSpacingY, 0.001);
    ppLens.x = fract(pp.x / spacingX + 0.5) * spacingX - spacingX * 0.5;
    ppLens.y = fract(pp.y / spacingY + 0.5) * spacingY - spacingY * 0.5;

    float sp = radiusSq - ppLens.x * ppLens.x - ppLens.y * ppLens.y;

    float lensAmount = smoothstep(-0.1, 0.05, sp);
    float baseLens = sqrt(max(sp, -sp * 0.1) / 0.3);
    edgeFactor = (1.0 - smoothstep(0.0, radiusSq, sp)) * lensAmount;

    float warpAmount = mix(1.0, baseLens * (1.0 + iorOffset), lensAmount);

    warpedUV = pp;
    warpedUV.x += (ppLens.x * warpAmount - ppLens.x);
    warpedUV.y *= warpAmount;
}

void main() {
    vec2 fragCoord = v_uv * u_resolution;
    seed = uvec3(uvec2(fragCoord), uint(fract(u_time) * 1000.0));

    vec2 r = u_resolution;
    vec2 p = (fragCoord * 2.0 - r) / r.y;
    float t = u_time * u_speed;

    // Posición base sin warp (para el hover) y warp de ondas (click):
    // cada onda empuja el dominio radialmente en un anillo que se expande,
    // "abriendo" las líneas como agua.
    vec2 p0 = p;
    for (int i = 0; i < 16; i++) {
        if (i >= u_iRippleCount) break;
        vec2 rc = u_iRipples[i].xy;
        float age = u_time - u_iRipples[i].z;
        if (age < 0.0 || age > I_RIPPLE_LIFE) continue;
        float d = distance(p0, rc);
        float R = age * I_RIPPLE_SPEED;
        float q = (d - R) / I_RIPPLE_WIDTH;
        float shell = exp(-q * q);
        float decay = 1.0 - age / I_RIPPLE_LIFE;
        vec2 dir = d > 1e-4 ? (p0 - rc) / d : vec2(0.0);
        p += dir * shell * I_RIPPLE_AMP * decay * u_iRipples[i].w;
    }

    int colorCount = u_colors_length;

    // Early out: no colors -> black
    if (colorCount < 1) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // Seed-based offsets for gradient flow
    vec3 seedOff1 = seedRandom(u_seed);
    vec3 seedOff2 = seedRandom(u_seed + 100.0);

    float dice = random3f().x;

    float radiusSq = u_lensRadius * u_lensRadius;
    vec3 iorOffsets = vec3(-1.0, 0.0, 1.0) * u_dispersionStrength;

    vec3 col = vec3(0.0);

    for (int i = 0; i < SAMPLES; i++) {
        float ephemeral = (float(i) + dice) / float(SAMPLES);
        float sqEph = ephemeral * ephemeral;

        vec2 pt = p;
        pt.x += u_ephemeralAmp * sqEph * sin(p.y * 2.0 + t);
        pt.y += u_ephemeralAmp * sqEph * cos(p.x * 1.5 - t) * 0.5;
        pt.y -= (1.0 - exp(-EPHEMERAL_DRIP * sqEph)) * abs(pt.y) * sign(pt.y) * 0.3;

        vec3 tint = smoothstep(1.0, 0.0, abs(3.0 * ephemeral - vec3(1.0, 1.5, 2.0)));

        vec3 gradTs = vec3(0.0);
        vec3 edgeFactors = vec3(0.0);

        for (int c = 0; c < 3; c++) {
            vec2 pp = pt * u_lensScale;
            vec2 warpedUV;
            float edgeFactor;
            applyBandLens(pp, radiusSq, iorOffsets[c], warpedUV, edgeFactor);

            vec2 gradUV = warpedUV / u_lensScale;
            gradTs[c] = getGradientT(gradUV, t * 0.8, seedOff1, seedOff2);
            edgeFactors[c] = edgeFactor;
        }

        vec3 convergentColor = paletteN(gradTs.g, colorCount);
        float edgeMix = max(max(edgeFactors.r, edgeFactors.g), edgeFactors.b);

        vec3 dispersedColor = vec3(
            paletteN(gradTs.r, colorCount).r,
            convergentColor.g,
            paletteN(gradTs.b, colorCount).b
        );

        vec3 finalColor = mix(convergentColor, dispersedColor, edgeMix * 2.0);

        vec3 rainbow = (gradTs - gradTs.g) * 3.0;
        finalColor += rainbow * edgeMix * u_edgeDisp;

        col += tint * finalColor * (3.0 / float(SAMPLES));
    }

    fragColor = vec4(col, 1.0);
}
`;

// ── Uniforms exactos capturados del original (Verity/Framer) ──
// Paleta: negro → ACENTO → negro. El original usa cian (#21D2ED); aquí va el
// magenta de marca de Fiberlux. Cambia ACCENT para reteñir la banda.
const DARK: [number, number, number] = [0.050980392, 0.050980392, 0.058823529]; // #0D0D0F
const ACCENT: [number, number, number] = [0.588235, 0.137255, 0.478431]; // #96237A brand-purple
const PARAMS = {
  colorsLength: 3,
  seed: 748,
  speed: 0.25,
  ephemeralAmp: 0,
  lensScale: 10,
  lensSpacingX: 0.4,
  lensSpacingY: 0.01,
  lensRadius: 0.1,
  dispersionStrength: 0,
  edgeDisp: 5,
};

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("WaveformEffect shader error:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

interface Props {
  className?: string;
  /** Dispara fbx:hero-scene-loaded al primer frame (para el preloader). */
  signalReady?: boolean;
}

export default function WaveformEffect({ className, signalReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
    }) as WebGL2RenderingContext | null;
    if (!gl) {
      console.warn("WaveformEffect: WebGL2 no disponible");
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("WaveformEffect link error:", gl.getProgramInfoLog(prog));
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

    // ── Uniforms constantes (se setean una vez) ──
    const colors = new Float32Array(8 * 4);
    const pal: Array<[number, number, number]> = [DARK, ACCENT, DARK];
    for (let i = 0; i < pal.length; i++) {
      colors[i * 4 + 0] = pal[i][0];
      colors[i * 4 + 1] = pal[i][1];
      colors[i * 4 + 2] = pal[i][2];
      colors[i * 4 + 3] = 1;
    }
    const U = (n: string) => gl.getUniformLocation(prog, n);
    gl.uniform4fv(U("u_colors"), colors);
    gl.uniform1i(U("u_colors_length"), PARAMS.colorsLength);
    gl.uniform1f(U("u_seed"), PARAMS.seed);
    gl.uniform1f(U("u_speed"), PARAMS.speed);
    gl.uniform1f(U("u_ephemeralAmp"), PARAMS.ephemeralAmp);
    gl.uniform1f(U("u_lensScale"), PARAMS.lensScale);
    gl.uniform1f(U("u_lensSpacingX"), PARAMS.lensSpacingX);
    gl.uniform1f(U("u_lensSpacingY"), PARAMS.lensSpacingY);
    gl.uniform1f(U("u_lensRadius"), PARAMS.lensRadius);
    gl.uniform1f(U("u_dispersionStrength"), PARAMS.dispersionStrength);
    gl.uniform1f(U("u_edgeDisp"), PARAMS.edgeDisp);

    const uRes = U("u_resolution");
    const uTime = U("u_time");
    const uIRipples = U("u_iRipples");
    const uIRippleCount = U("u_iRippleCount");

    // Cap de DPR a 1.5: menos píxeles a procesar (mejor performance) con
    // impacto visual mínimo en un shader tan suave.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
    }
    resize();
    window.addEventListener("resize", resize);

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let raf = 0;
    const start = performance.now();
    let visible = true;
    let signaled = false;

    // ── Interacción: ondas de agua. Misma onda del click, pero el hover emite
    //    una estela de ondas MUY ligeras siguiendo al cursor. ──
    const MAX_RIPPLES = 16;
    const RIPPLE_LIFE_S = 1.7; // = I_RIPPLE_LIFE del shader
    const HOVER_AMP = 0.045; // intensidad de la onda de hover (click = 1.0)
    const HOVER_EMIT_S = 0.34; // cada cuánto emite una onda al mover el mouse
    // La estela de hover solo con mouse real (evita spawnear ondas al arrastrar
    // el dedo en móvil → mejor performance y comportamiento correcto).
    const finePointer =
      window.matchMedia?.("(pointer: fine)").matches ?? true;
    const ripples: Array<{ x: number; y: number; t0: number; amp: number }> = [];
    const rippleBuf = new Float32Array(MAX_RIPPLES * 4);
    let lastEmit = -1;

    // Cliente → espacio p del shader (aspect-fix, y hacia arriba).
    function toP(clientX: number, clientY: number) {
      const rect = canvas.getBoundingClientRect();
      const uvx = (clientX - rect.left) / rect.width;
      const uvy = 1 - (clientY - rect.top) / rect.height;
      const aspect = rect.width / Math.max(rect.height, 1);
      return {
        x: (uvx * 2 - 1) * aspect,
        y: uvy * 2 - 1,
        inside: uvx >= 0 && uvx <= 1 && uvy >= 0 && uvy <= 1,
      };
    }
    function emit(x: number, y: number, amp: number) {
      ripples.push({ x, y, t0: (performance.now() - start) / 1000, amp });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
    }
    function onMove(e: PointerEvent) {
      if (!finePointer) return;
      const q = toP(e.clientX, e.clientY);
      if (!q.inside) return;
      const nowS = (performance.now() - start) / 1000;
      if (nowS - lastEmit < HOVER_EMIT_S) return; // throttle de la estela
      lastEmit = nowS;
      emit(q.x, q.y, HOVER_AMP);
    }
    function onDown(e: PointerEvent) {
      const q = toP(e.clientX, e.clientY);
      if (!q.inside) return;
      emit(q.x, q.y, 1.0); // onda fuerte
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerdown", onDown);

    function frame(now: number) {
      resize();
      const nowS = (now - start) / 1000;
      gl.uniform1f(uTime, nowS);

      // Interacción: purga ondas expiradas y sube las activas (x, y, t0, amp).
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (nowS - ripples[i].t0 > RIPPLE_LIFE_S) ripples.splice(i, 1);
      }
      const nR = Math.min(ripples.length, MAX_RIPPLES);
      for (let i = 0; i < nR; i++) {
        rippleBuf[i * 4] = ripples[i].x;
        rippleBuf[i * 4 + 1] = ripples[i].y;
        rippleBuf[i * 4 + 2] = ripples[i].t0;
        rippleBuf[i * 4 + 3] = ripples[i].amp;
      }
      gl.uniform4fv(uIRipples, rippleBuf);
      gl.uniform1i(uIRippleCount, nR);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (signalReady && !signaled) {
        signaled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
      // Al pausar (fuera de viewport) hay que resetear raf a 0; si no, el id
      // viejo impide que el IntersectionObserver reanude al volver a verse.
      if (!reduce && visible) raf = requestAnimationFrame(frame);
      else raf = 0;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduce && !raf) raf = requestAnimationFrame(frame);
        else if (!visible && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    if (reduce) {
      gl.uniform1f(uTime, 8.0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (signalReady)
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      io.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
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
