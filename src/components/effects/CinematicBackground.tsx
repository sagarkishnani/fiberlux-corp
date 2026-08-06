import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * CinematicBackground — atmósfera "cinematic" del hero (SPEC 97), en WebGL.
 *
 * Interpretación de marca (morado) del look FXology: luz volumétrica a través
 * de humo, sobre el negro base que pone el consumidor.
 *
 *   1. GOD-RAYS + HAZE → shader de dispersión volumétrica: marcha hacia una
 *      fuente de luz en el borde superior acumulando densidad de humo (fbm),
 *      generando haces de luz difusos. Blending aditivo sobre negro.
 *   2. DUST/EMBERS     → partículas GPU (THREE.Points, shader propio) additivas
 *      flotando/parpadeando cerca del centro.
 *   3. TOKENS          → tokens de conectividad (Gbps, 99.9%, ms…) tenues, en
 *      DOM (editables desde el CMS), con profundidad y parallax por puntero.
 *
 * Respeta prefers-reduced-motion (frame estático, sin animación ni parallax),
 * pausa el rAF fuera de viewport y libera todos los recursos WebGL al desmontar.
 * Parallax por puntero solo en desktop (pointer: fine).
 *
 * Los parámetros del efecto viven en PARAMS (afinables sin tocar la lógica).
 */

const PARAMS = {
  dustCount: 220, // partículas de polvo (desktop)
  dustCountMobile: 90, // versión ligera mobile
  tokenCount: 13, // instancias de token (desktop)
  tokenCountMobile: 7, // versión ligera mobile
  renderScale: 0.9, // escala de render del shader (haze es baja frecuencia)
  renderScaleMobile: 0.6,
  raySamples: 48, // muestras de marcha del god-ray (desktop)
  raySamplesMobile: 26,
  color: [0x96, 0x23, 0x7a] as [number, number, number], // brand-purple #96237A
  colorLight: [0xd6, 0x4d, 0xb8] as [number, number, number], // acento claro
  parallaxStrength: 16, // px máx de desplazamiento de tokens por puntero
} as const;

// Default curado si el CMS no define tokens.
const DEFAULT_TOKENS = [
  "1 Gbps",
  "99.9%",
  "12 ms",
  "IPv6",
  "24/7",
  "SLA",
  "FTTH",
  "10G",
];

interface Props {
  className?: string;
  /* Copy de los tokens flotantes (CMS). Si viene vacío se usa DEFAULT_TOKENS. */
  tokens?: string[];
  /* Dispara `fbx:hero-scene-loaded` en el primer frame (para el preloader). */
  signalReady?: boolean;
  /* Se llama si WebGL no está disponible (el consumidor decide fallback). */
  onUnsupported?: () => void;
}

// Descriptor de un token flotante (posición base + profundidad, calculado 1 vez).
interface TokenSpec {
  text: string;
  xPct: number;
  yPct: number;
  depth: number;
  phase: number;
  driftAmp: number;
  size: number;
  opacity: number;
  blur: number;
  parallax: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ── Shaders ──────────────────────────────────────────────────────────────
// Quad a pantalla completa: escribe clip-space directo, sin cámara.
const QUAD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// God-rays volumétricos + haze. N (muestras) se inyecta por #define.
const rayFrag = (samples: number) => /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform vec3 uColor;
  uniform vec3 uColorLight;
  #define N ${samples}

  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.,0.)), c = hash(i + vec2(0.,1.)), d = hash(i + vec2(1.,1.));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 auv = vec2(uv.x * aspect, uv.y);

    // Fuente de luz: arriba, centrada, con leve parallax por puntero.
    vec2 lp = vec2(0.5 * aspect + uMouse.x * 0.05, 1.16 + uMouse.y * 0.03);

    // Marcha volumétrica hacia la luz acumulando densidad de humo (fbm).
    // Ruido anisotrópico (más frecuencia horizontal que vertical) → los huecos
    // del humo se alargan en vertical y producen haces/shafts definidos.
    vec2 dir = auv - lp;
    vec2 delta = dir / float(N) * 0.9;
    vec2 pos = auv;
    float illum = 0.0;
    float w = 1.0;
    for (int i = 0; i < N; i++){
      pos -= delta;
      float dd = distance(pos, lp);
      float glow = exp(-dd * dd * 2.7);
      float s = fbm(pos * vec2(5.0, 1.7) + vec2(0.0, -uTime * 0.03));
      illum += glow * (0.14 + 0.86 * s) * w;
      w *= 0.95;
    }
    illum = illum / float(N) * 1.9;
    illum = pow(clamp(illum, 0.0, 1.4), 1.4); // contraste → shafts definidos

    // Haze ambiental que deriva hacia arriba.
    vec2 sc = auv * 2.4;
    sc.y -= uTime * 0.02;
    sc += uMouse * 0.12;
    float haze = fbm(sc) * fbm(sc * 0.5 + 3.0);

    // Halo suave y contenido en el foco superior.
    float topGlow = exp(-distance(auv, lp) * 1.9);

    float intensity = illum + haze * 0.07 + topGlow * 0.24;

    // Viñeta: apaga bordes y base (deja bastante negro, como el ref).
    float vig = smoothstep(1.2, 0.15, length((uv - vec2(0.5, 0.6)) * vec2(1.05, 1.2)));
    intensity *= mix(0.18, 1.0, vig);
    intensity *= smoothstep(-0.05, 0.55, uv.y);
    intensity *= 0.82;

    vec3 col = mix(uColor, uColorLight, clamp(illum * 1.1, 0.0, 0.82));
    vec3 outc = col * intensity + uColorLight * topGlow * 0.16;

    gl_FragColor = vec4(outc, 1.0);
  }
`;

const DUST_VERT = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  attribute float aSpeed;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uPixelRatio;
  varying float vA;
  void main(){
    vec2 p = position.xy;
    p.x += sin(uTime * aSpeed + aPhase) * 0.06;
    p.y += cos(uTime * aSpeed * 0.7 + aPhase * 1.3) * 0.05;
    p.y += 0.10 * sin(uTime * 0.05 * aSpeed + aPhase);
    p += uMouse * (0.02 + aSize * 0.0015);
    vA = 0.30 + 0.70 * abs(sin(uTime * aSpeed * 1.5 + aPhase));
    gl_Position = vec4(p, 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio;
  }
`;

const DUST_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  varying float vA;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * vA);
  }
`;

export default function CinematicBackground({
  className,
  tokens,
  signalReady,
  onUnsupported,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const glMountRef = useRef<HTMLDivElement>(null);
  const tokenElsRef = useRef<HTMLSpanElement[]>([]);
  // Los tokens se posicionan con Math.random(): sólo se renderizan tras montar
  // en cliente para evitar mismatch de hidratación (SSR no los pinta).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tokenTexts = useMemo(() => {
    const t = (tokens || []).map((s) => (s || "").trim()).filter(Boolean);
    return t.length ? t : DEFAULT_TOKENS;
  }, [tokens]);

  const isMobileGuess =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(max-width: 1023px)").matches ?? false);

  // Tokens con profundidad, biasados a los costados (no chocan con el titular).
  const tokenSpecs = useMemo<TokenSpec[]>(() => {
    const n = isMobileGuess ? PARAMS.tokenCountMobile : PARAMS.tokenCount;
    const specs: TokenSpec[] = [];
    for (let i = 0; i < n; i++) {
      const depth = Math.random();
      let xPct: number;
      if (Math.random() < 0.72) {
        xPct = Math.random() < 0.5 ? rand(3, 24) : rand(76, 97);
      } else {
        xPct = rand(6, 94);
      }
      specs.push({
        text: tokenTexts[i % tokenTexts.length],
        xPct,
        yPct: rand(10, 88),
        depth,
        phase: rand(0, Math.PI * 2),
        driftAmp: lerp(5, 16, depth),
        size: lerp(11, 26, depth),
        opacity: lerp(0.06, 0.22, depth),
        blur: lerp(2.6, 0.2, depth),
        parallax: lerp(0.35, 1.15, depth),
      });
    }
    return specs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenTexts]);

  useEffect(() => {
    const mount = glMountRef.current;
    const root = rootRef.current;
    if (!mount || !root) return;

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const finePointer =
      window.matchMedia?.("(pointer: fine)").matches ?? false;
    const mobile = window.matchMedia?.("(max-width: 1023px)").matches ?? false;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      onUnsupported?.();
      return;
    }
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "display:block;width:100%;height:100%;pointer-events:none;";
    mount.appendChild(canvas);

    const renderScale = mobile
      ? PARAMS.renderScaleMobile
      : PARAMS.renderScale;
    const pr = Math.min(window.devicePixelRatio || 1, 2) * renderScale;
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x000000, 0);

    const camera = new THREE.Camera();
    const scene = new THREE.Scene();

    const toVec3 = (c: readonly number[]) =>
      new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255);

    // ── God-rays + haze (quad) ──
    const samples = mobile ? PARAMS.raySamplesMobile : PARAMS.raySamples;
    const rayUniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColor: { value: toVec3(PARAMS.color) },
      uColorLight: { value: toVec3(PARAMS.colorLight) },
    };
    const rayMat = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: rayFrag(samples),
      uniforms: rayUniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), rayMat);
    quad.frustumCulled = false;
    scene.add(quad);

    // ── Polvo (GPU points) ──
    const dustCount = mobile ? PARAMS.dustCountMobile : PARAMS.dustCount;
    const dPos = new Float32Array(dustCount * 3);
    const dPhase = new Float32Array(dustCount);
    const dSize = new Float32Array(dustCount);
    const dSpeed = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      // Concentrar hacia el centro (gaussiana ligera) como los embers del ref.
      const gx = (Math.random() + Math.random() - 1) * 0.9;
      const gy = (Math.random() + Math.random() - 1) * 0.8;
      dPos[i * 3] = gx;
      dPos[i * 3 + 1] = gy;
      dPos[i * 3 + 2] = 0;
      dPhase[i] = rand(0, Math.PI * 2);
      dSize[i] = rand(1.0, 4.2);
      dSpeed[i] = rand(0.2, 0.9);
    }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    dGeo.setAttribute("aPhase", new THREE.BufferAttribute(dPhase, 1));
    dGeo.setAttribute("aSize", new THREE.BufferAttribute(dSize, 1));
    dGeo.setAttribute("aSpeed", new THREE.BufferAttribute(dSpeed, 1));
    const dustUniforms = {
      uTime: { value: 0 },
      uMouse: { value: rayUniforms.uMouse.value },
      uPixelRatio: { value: pr },
      uColor: { value: toVec3(PARAMS.colorLight) },
    };
    const dustMat = new THREE.ShaderMaterial({
      vertexShader: DUST_VERT,
      fragmentShader: DUST_FRAG,
      uniforms: dustUniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dGeo, dustMat);
    dust.frustumCulled = false;
    scene.add(dust);

    function resize() {
      const w = mount!.clientWidth || 1;
      const h = mount!.clientHeight || 1;
      renderer.setSize(w, h, false);
      rayUniforms.uRes.value.set(w, h);
    }
    resize();
    window.addEventListener("resize", resize);

    // ── Parallax por puntero (solo desktop, no reduce). ──
    const ptr = { tx: 0, ty: 0, cx: 0, cy: 0 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = root!.getBoundingClientRect();
      ptr.tx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      ptr.ty = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    };
    const parallaxOn = finePointer && !reduce;
    if (parallaxOn)
      window.addEventListener("pointermove", onPointerMove, { passive: true });

    function applyTokens() {
      const els = tokenElsRef.current;
      const t = rayUniforms.uTime.value;
      for (let i = 0; i < tokenSpecs.length; i++) {
        const el = els[i];
        if (!el) continue;
        const s = tokenSpecs[i];
        const dx = Math.sin(t * 0.25 + s.phase) * s.driftAmp;
        const dy = Math.cos(t * 0.2 + s.phase * 1.3) * s.driftAmp * 0.7;
        const ox = ptr.cx * s.parallax * PARAMS.parallaxStrength;
        const oy = ptr.cy * s.parallax * PARAMS.parallaxStrength;
        el.style.transform = `translate3d(${dx + ox}px, ${dy + oy}px, 0)`;
      }
    }

    let raf = 0;
    let visible = true;
    let signaled = false;
    function signalOnce() {
      if (signalReady && !signaled) {
        signaled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
    }

    function frame(ms: number) {
      const t = ms * 0.001;
      ptr.cx += (ptr.tx - ptr.cx) * 0.05;
      ptr.cy += (ptr.ty - ptr.cy) * 0.05;
      rayUniforms.uTime.value = t;
      rayUniforms.uMouse.value.set(ptr.cx, -ptr.cy);
      dustUniforms.uTime.value = t;
      renderer.render(scene, camera);
      applyTokens();
      signalOnce();
      if (!reduce && visible) raf = requestAnimationFrame(frame);
      else raf = 0;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduce && !raf) raf = requestAnimationFrame(frame);
      },
      { threshold: 0 }
    );
    io.observe(root);

    if (reduce) {
      rayUniforms.uTime.value = 0.0;
      renderer.render(scene, camera);
      applyTokens();
      signalOnce();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      io.disconnect();
      quad.geometry.dispose();
      rayMat.dispose();
      dGeo.dispose();
      dustMat.dispose();
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalReady, tokenSpecs]);

  const [r, g, b] = PARAMS.color;
  const [lr, lg, lb] = PARAMS.colorLight;

  return (
    <div
      ref={rootRef}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {/* ══════════ WEBGL LAYER — god-rays + haze + polvo (Three.js) ══════════ */}
      <div
        ref={glMountRef}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />

      {/* ══════════ TOKENS LAYER — conectividad flotante (DOM, CMS) ══════════ */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {mounted &&
          tokenSpecs.map((s, i) => (
            <span
              key={i}
              ref={(el) => {
                if (el) tokenElsRef.current[i] = el;
              }}
              style={{
                position: "absolute",
                left: `${s.xPct}%`,
                top: `${s.yPct}%`,
                fontFamily: "'Space Mono', monospace",
                fontSize: `${s.size}px`,
                lineHeight: 1,
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                color: `rgba(${lerp(r, lr, s.depth) | 0}, ${
                  lerp(g, lg, s.depth) | 0
                }, ${lerp(b, lb, s.depth) | 0}, ${s.opacity})`,
                filter: s.blur ? `blur(${s.blur}px)` : undefined,
                textShadow: `0 0 ${8 + s.depth * 14}px rgba(${lr},${lg},${lb},${
                  s.opacity * 0.8
                })`,
                willChange: "transform",
                userSelect: "none",
              }}
            >
              {s.text}
            </span>
          ))}
      </div>
    </div>
  );
}
