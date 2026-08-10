import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * LightHalo — halo volumétrico de god-rays + polvo GPU, en morado de marca.
 *
 * Versión compacta y localizada del shader de god-rays de CinematicRays (SPEC 98):
 * la FUENTE DE LUZ se coloca donde está el candado (por defecto a la derecha),
 * de modo que los rayos parecen emanar detrás de él, dándole volumen y brillo
 * "cinematic" sin traer tiles/streams. WebGL autocontenido (Three.js).
 *
 * Rendimiento: render a escala reducida + DPR capado, pocas muestras (menos en
 * mobile), pausa el rAF fuera de viewport, respeta prefers-reduced-motion (un
 * solo frame estático) y libera todo al desmontar. Si WebGL no está disponible
 * llama onUnsupported y no rompe nada (el consumidor deja su fondo debajo).
 */

const PARAMS = {
  renderScale: 0.7,
  renderScaleMobile: 0.5,
  dprCap: 1.5,
  raySamples: 24,
  raySamplesMobile: 14,
  dustCount: 90,
  dustCountMobile: 40,
  color: [0x96, 0x23, 0x7a] as [number, number, number],
  colorLight: [0xe2, 0x4f, 0xb8] as [number, number, number],
  introMs: 1400,
} as const;

interface Props {
  className?: string;
  /* Posición de la fuente de luz en UV [0..1] (x der, y arriba). Detrás del candado. */
  lightPos?: [number, number];
  onUnsupported?: () => void;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

const QUAD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const rayFrag = (samples: number) => /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntro;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform vec2 uLight;
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
  float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<3;i++){ v+=a*noise(p); p*=2.02; a*=0.5; } return v; }

  void main(){
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 auv = vec2(uv.x * aspect, uv.y);
    vec2 lp = vec2(uLight.x * aspect, uLight.y) + uMouse * 0.04;

    // Marcha radial desde cada pixel hacia la fuente → god-rays.
    vec2 dir = auv - lp;
    vec2 delta = dir / float(N) * 0.9;
    vec2 pos = auv;
    float illum = 0.0, w = 1.0;
    for (int i = 0; i < N; i++){
      pos -= delta;
      float dd = distance(pos, lp);
      float glow = exp(-dd * dd * 3.0);
      float s = fbm(pos * vec2(4.0, 3.0) + vec2(0.0, -uTime * 0.03));
      illum += glow * (0.16 + 0.84 * s) * w;
      w *= 0.95;
    }
    illum = illum / float(N) * 1.15;
    illum = pow(clamp(illum, 0.0, 1.4), 1.6);

    vec2 sc = auv * 2.4; sc.y -= uTime * 0.02; sc += uMouse * 0.12;
    float haze = fbm(sc) * fbm(sc * 0.5 + 3.0);

    float pulse = 0.86 + 0.14 * sin(uTime * 1.5);
    float core = exp(-distance(auv, lp) * 3.0) * pulse;

    // Bloom apretado alrededor del candado + rayos suaves: deja ver la red plexus.
    float vig = smoothstep(0.85, 0.02, distance(uv, uLight) * 2.3);
    float intensity = (illum * 0.6 + haze * 0.03 + core * 0.7) * vig;
    intensity *= 0.95 * uIntro;

    vec3 col = mix(uColor, uColorLight, clamp(illum * 1.1, 0.0, 0.85));
    vec3 outc = col * intensity + uColorLight * core * 0.35 * uIntro;
    // Alpha = cobertura del halo: las zonas oscuras quedan transparentes para que
    // la red plexus (canvas debajo) se vea, y el bloom se compone sobre ella.
    gl_FragColor = vec4(outc, clamp(intensity, 0.0, 1.0));
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
    p += uMouse * (0.02 + aSize * 0.0015);
    vA = 0.30 + 0.70 * abs(sin(uTime * aSpeed * 1.5 + aPhase));
    gl_Position = vec4(p, 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio;
  }
`;

const DUST_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform float uIntro;
  varying float vA;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * vA * uIntro);
  }
`;

export default function LightHalo({ className, lightPos = [0.72, 0.5], onUnsupported }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const root = rootRef.current;
    if (!mount || !root) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const finePointer = window.matchMedia?.("(pointer: fine)").matches ?? false;
    const mobile = window.matchMedia?.("(max-width: 1023px)").matches ?? false;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
    } catch {
      onUnsupported?.();
      return;
    }
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "display:block;width:100%;height:100%;pointer-events:none;";
    mount.appendChild(canvas);

    const renderScale = mobile ? PARAMS.renderScaleMobile : PARAMS.renderScale;
    const pr = Math.min(window.devicePixelRatio || 1, PARAMS.dprCap) * renderScale;
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 6;

    const toVec3 = (c: readonly number[]) => new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255);
    const introUniform = { value: reduce ? 1 : 0 };

    // ── God-rays ──
    const samples = mobile ? PARAMS.raySamplesMobile : PARAMS.raySamples;
    const rayUniforms = {
      uTime: { value: 0 },
      uIntro: introUniform,
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uLight: { value: new THREE.Vector2(lightPos[0], lightPos[1]) },
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

    // ── Polvo de luz ──
    const dustCount = mobile ? PARAMS.dustCountMobile : PARAMS.dustCount;
    const dPos = new Float32Array(dustCount * 3);
    const dPhase = new Float32Array(dustCount);
    const dSize = new Float32Array(dustCount);
    const dSpeed = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      // Sesga el polvo hacia la fuente de luz (candado).
      dPos[i * 3] = (lightPos[0] * 2 - 1) + rand(-0.7, 0.7);
      dPos[i * 3 + 1] = (lightPos[1] * 2 - 1) + rand(-0.7, 0.7);
      dPos[i * 3 + 2] = 0;
      dPhase[i] = rand(0, Math.PI * 2);
      dSize[i] = rand(1.0, 4.0);
      dSpeed[i] = rand(0.2, 0.9);
    }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    dGeo.setAttribute("aPhase", new THREE.BufferAttribute(dPhase, 1));
    dGeo.setAttribute("aSize", new THREE.BufferAttribute(dSize, 1));
    dGeo.setAttribute("aSpeed", new THREE.BufferAttribute(dSpeed, 1));
    const dustMat = new THREE.ShaderMaterial({
      vertexShader: DUST_VERT,
      fragmentShader: DUST_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uIntro: introUniform,
        uMouse: rayUniforms.uMouse,
        uPixelRatio: { value: pr },
        uColor: { value: toVec3(PARAMS.colorLight) },
      },
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
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    const ptr = { tx: 0, ty: 0, cx: 0, cy: 0 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = root!.getBoundingClientRect();
      ptr.tx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      ptr.ty = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    };
    if (finePointer && !reduce) window.addEventListener("pointermove", onPointerMove, { passive: true });

    let raf = 0;
    let visible = true;
    let startMs = -1;

    function frame(ms: number) {
      if (startMs < 0) startMs = ms;
      const t = ms * 0.001;
      const intro = reduce ? 1 : Math.min(1, (ms - startMs) / PARAMS.introMs);
      introUniform.value = 1 - Math.pow(1 - intro, 3);

      ptr.cx += (ptr.tx - ptr.cx) * 0.05;
      ptr.cy += (ptr.ty - ptr.cy) * 0.05;
      rayUniforms.uTime.value = t;
      rayUniforms.uMouse.value.set(ptr.cx, -ptr.cy);
      dustMat.uniforms.uTime.value = t;

      renderer.render(scene, camera);
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
      introUniform.value = 1;
      renderer.render(scene, camera);
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
  }, [lightPos[0], lightPos[1]]);

  return (
    <div ref={rootRef} className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mountRef} aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
    </div>
  );
}
