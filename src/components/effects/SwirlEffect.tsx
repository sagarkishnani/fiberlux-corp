import { useEffect, useRef } from "react";

/**
 * SwirlEffect — franjas de luz que fluyen (swirl) sobre negro.
 *
 * Shader GLSL portado 1:1 del canvas WebGL2 del hero de jet.framer.website
 * (el shader "Swirl" de la librería open-source Paper Shaders). Vertex +
 * fragment idénticos, capturados en runtime vía gl.shaderSource; uniforms con
 * los valores exactos del original. Solo se cambia la PALETA: el teal original
 * (#00E6C5) → magenta de marca de Fiberlux.
 *
 * Requiere WebGL2. Sin dependencias. Respeta prefers-reduced-motion (frame
 * estático) y pausa el rAF fuera de viewport.
 */

const VERT = `#version 300 es
layout(location = 0) in vec4 a_position;

void main() {
  gl_Position = a_position;
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float u_time;
uniform float u_pixelRatio;
uniform vec2 u_resolution;

uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;


out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  // Smoothstep for interpolation
  vec2 u = f * f * (3.0 - 2.0 * f);

  // Do the interpolation as two nested mix operations
  // If you try to do this in one big operation, there's enough precision loss to be off by 1px at cell boundaries
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);

}

vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur) {
    vec3 color1 = c1.rgb * c1.a;
    vec3 color2 = c2.rgb * c2.a;
    vec3 color3 = c3.rgb * c3.a;

    float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);
    float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);

    vec3 blended_color_2 = mix(color1, color2, r1);
    float blended_opacity_2 = mix(c1.a, c2.a, r1);

    vec3 c = mix(blended_color_2, color3, r2);
    float o = mix(blended_opacity_2, c3.a, r2);
    return vec4(c, o);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv_original = uv;

    float t = .5 * u_time;

    float noise_scale = .0005 + .006 * u_scale;

    uv -= .5;
    uv *= (noise_scale * u_resolution);
    uv = rotate(uv, u_rotation * .5 * PI);
    uv /= u_pixelRatio;
    uv += .5;

    float n1 = noise(uv * 1. + t);
    float n2 = noise(uv * 2. - t);
    float angle = n1 * TWO_PI;
    uv.x += 4. * u_distortion * n2 * cos(angle);
    uv.y += 4. * u_distortion * n2 * sin(angle);

    float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));
    for (float i = 1.; i <= iterations_number; i++) {
        uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
        uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1. * uv.x);
    }

    float proportion = clamp(u_proportion, 0., 1.);

    float shape = 0.;
    float mixer = 0.;
    if (u_shape < .5) {
      vec2 checks_shape_uv = uv * (.5 + 3.5 * u_shapeScale);
      shape = .5 + .5 * sin(checks_shape_uv.x) * cos(checks_shape_uv.y);
      mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
    } else if (u_shape < 1.5) {
      vec2 stripes_shape_uv = uv * (.25 + 3. * u_shapeScale);
      float f = fract(stripes_shape_uv.y);
      shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
      mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
    } else {
      float sh = 1. - uv.y;
      sh -= .5;
      sh /= (noise_scale * u_resolution.y);
      sh += .5;
      float shape_scaling = .2 * (1. - u_shapeScale);
      shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));
      mixer = shape;
    }

    vec4 color_mix = blend_colors(u_color1, u_color2, u_color3, mixer, 1. - clamp(u_softness, 0., 1.), .01 + .01 * u_scale);

    fragColor = vec4(color_mix.rgb, color_mix.a);
}
`;

// Un color RGBA (0..1)
type RGBA = [number, number, number, number];

export interface SwirlConfig {
  color1: RGBA;
  color2: RGBA;
  color3: RGBA;
  scale: number;
  rotation: number;
  proportion: number;
  softness: number;
  distortion: number;
  swirl: number;
  swirlIterations: number;
  shapeScale: number;
  shape: number; // 0 = checks · 1 = stripes · 2 = gradiente (humo)
  speed: number; // multiplicador de tiempo
}

// Preset por defecto: "franjas de luz" (Jet/Paper Shaders), teal→magenta.
// Uniforms exactos del original; speed bajado a 0.35 (más smooth).
export const SWIRL_STREAKS: SwirlConfig = {
  color1: [0.87, 0.18, 0.62, 1], // magenta vivo (franjas)
  color2: [0.3, 0.06, 0.25, 1], // morado oscuro (medios)
  color3: [0, 0, 0, 1], // negro
  scale: 0,
  rotation: -2.9147,
  proportion: 0.92,
  softness: 0.28,
  distortion: 1.08,
  swirl: 0.75,
  swirlIterations: 3,
  shapeScale: 0.79,
  shape: 0,
  speed: 0.35,
};

// Preset "humo" (Portfolite): mismo shader, softness máx + shape=2 (gradiente),
// poca distorsión. Original negro→blanco→negro; aquí negro→MAGENTA→negro,
// deriva lenta (speed 0.3).
export const SWIRL_SMOKE: SwirlConfig = {
  color1: [0, 0, 0, 1], // negro
  color2: [0.82, 0.2, 0.62, 1], // magenta (el "humo")
  color3: [0, 0, 0, 1], // negro
  scale: 0.48,
  rotation: 0,
  proportion: 0.33,
  softness: 1,
  distortion: 0.08,
  swirl: 0.65,
  swirlIterations: 5,
  shapeScale: 0.48,
  shape: 2, // rama de gradiente vertical → humo
  speed: 0.3,
};

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("SwirlEffect shader error:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

interface Props {
  className?: string;
  signalReady?: boolean;
  /** Preset del shader; por defecto SWIRL_SMOKE (humo). Ver SWIRL_STREAKS. */
  config?: SwirlConfig;
}

export default function SwirlEffect({
  className,
  signalReady,
  config = SWIRL_SMOKE,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfgKey = JSON.stringify(config);

  useEffect(() => {
    const cfg = config;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
    }) as WebGL2RenderingContext | null;
    if (!gl) {
      console.warn("SwirlEffect: WebGL2 no disponible");
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
      console.error("SwirlEffect link error:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(0); // a_position (layout location = 0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    gl.uniform4f(U("u_color1"), ...cfg.color1);
    gl.uniform4f(U("u_color2"), ...cfg.color2);
    gl.uniform4f(U("u_color3"), ...cfg.color3);
    gl.uniform1f(U("u_scale"), cfg.scale);
    gl.uniform1f(U("u_rotation"), cfg.rotation);
    gl.uniform1f(U("u_proportion"), cfg.proportion);
    gl.uniform1f(U("u_softness"), cfg.softness);
    gl.uniform1f(U("u_distortion"), cfg.distortion);
    gl.uniform1f(U("u_swirl"), cfg.swirl);
    gl.uniform1f(U("u_swirlIterations"), cfg.swirlIterations);
    gl.uniform1f(U("u_shapeScale"), cfg.shapeScale);
    gl.uniform1f(U("u_shape"), cfg.shape);

    const uRes = U("u_resolution");
    const uTime = U("u_time");
    const uPr = U("u_pixelRatio");

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
    let visible = true;
    let signaled = false;

    function frame(now: number) {
      resize();
      gl.uniform1f(uTime, ((now - start) / 1000) * cfg.speed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (signalReady && !signaled) {
        signaled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
      if (!reduce && visible) raf = requestAnimationFrame(frame);
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
      gl.uniform1f(uTime, 4.0);
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
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalReady, cfgKey]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
