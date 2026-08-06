import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * CinematicBackground — atmósfera "cinematic" del hero (SPEC 97), en WebGL.
 *
 * Interpretación de marca (morado) del look FXology: luz volumétrica a través
 * de humo, con elementos 3D ligeros volando por los costados, sobre el negro
 * base que pone el consumidor. Todo entra con un fade-in coreografiado (uIntro).
 *
 *   1. GOD-RAYS + HAZE → shader de dispersión volumétrica (marcha hacia una
 *      fuente de luz superior sobre densidad de humo fbm) → haces difusos.
 *   2. CHIPS 3D        → tarjetas/tokens de conectividad (Gbps, 99.9%, ms…) en
 *      marcos redondeados que tumblean en 3D y derivan por los costados
 *      (planos con textura de canvas, cámara en perspectiva).
 *   3. DUST/EMBERS     → partículas GPU additivas flotando cerca del centro.
 *
 * Respeta prefers-reduced-motion (frame estático, sin animación), pausa el rAF
 * fuera de viewport y libera todos los recursos WebGL al desmontar.
 */

const PARAMS = {
  dustCount: 220,
  dustCountMobile: 90,
  cardCount: 12, // chips 3D voladores (desktop)
  cardCountMobile: 6,
  renderScale: 0.9,
  renderScaleMobile: 0.6,
  raySamples: 48,
  raySamplesMobile: 26,
  color: [0x96, 0x23, 0x7a] as [number, number, number], // brand-purple #96237A
  colorLight: [0xd6, 0x4d, 0xb8] as [number, number, number], // acento claro
  introMs: 1600, // fade-in coreografiado de la escena
  fov: 50,
  cameraZ: 6,
} as const;

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
  tokens?: string[];
  signalReady?: boolean;
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
  float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5; } return v; }

  void main(){
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 auv = vec2(uv.x * aspect, uv.y);
    vec2 lp = vec2(0.5 * aspect + uMouse.x * 0.05, 1.16 + uMouse.y * 0.03);

    vec2 dir = auv - lp;
    vec2 delta = dir / float(N) * 0.9;
    vec2 pos = auv;
    float illum = 0.0, w = 1.0;
    for (int i = 0; i < N; i++){
      pos -= delta;
      float dd = distance(pos, lp);
      float glow = exp(-dd * dd * 2.7);
      float s = fbm(pos * vec2(5.0, 1.7) + vec2(0.0, -uTime * 0.03));
      illum += glow * (0.14 + 0.86 * s) * w;
      w *= 0.95;
    }
    illum = illum / float(N) * 1.9;
    illum = pow(clamp(illum, 0.0, 1.4), 1.4);

    vec2 sc = auv * 2.4; sc.y -= uTime * 0.02; sc += uMouse * 0.12;
    float haze = fbm(sc) * fbm(sc * 0.5 + 3.0);
    float topGlow = exp(-distance(auv, lp) * 1.9);

    float intensity = illum + haze * 0.07 + topGlow * 0.24;
    float vig = smoothstep(1.2, 0.15, length((uv - vec2(0.5, 0.6)) * vec2(1.05, 1.2)));
    intensity *= mix(0.18, 1.0, vig);
    intensity *= smoothstep(-0.05, 0.55, uv.y);
    intensity *= 0.82 * uIntro;

    vec3 col = mix(uColor, uColorLight, clamp(illum * 1.1, 0.0, 0.82));
    vec3 outc = col * intensity + uColorLight * topGlow * 0.16 * uIntro;
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
  uniform float uIntro;
  varying float vA;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * vA * uIntro);
  }
`;

// Textura de un chip: marco redondeado + texto (mono, glow). Cacheada por texto.
function makeChipTexture(text: string, light: readonly number[]): THREE.CanvasTexture {
  const W = 512, H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const [lr, lg, lb] = light;
  const pad = 26;
  const r = 46;
  // Marco.
  g.lineWidth = 7;
  g.strokeStyle = `rgba(${lr},${lg},${lb},0.55)`;
  g.shadowColor = `rgba(${lr},${lg},${lb},0.85)`;
  g.shadowBlur = 22;
  const x = pad, y = pad, w = W - pad * 2, h = H - pad * 2;
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
  g.stroke();
  // Texto (auto-fit).
  g.shadowBlur = 16;
  g.fillStyle = "rgba(255,236,251,0.92)";
  g.textAlign = "center";
  g.textBaseline = "middle";
  let fs = 92;
  do {
    g.font = `bold ${fs}px 'Space Mono', monospace`;
    if (g.measureText(text).width <= w - 48) break;
    fs -= 6;
  } while (fs > 30);
  g.fillText(text, W / 2, H / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

interface Card {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  vx: number;
  rvx: number;
  rvy: number;
  rvz: number;
  baseOpacity: number;
  z: number;
}

export default function CinematicBackground({
  className,
  tokens,
  signalReady,
  onUnsupported,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const glMountRef = useRef<HTMLDivElement>(null);

  const tokenTexts = useMemo(() => {
    const t = (tokens || []).map((s) => (s || "").trim()).filter(Boolean);
    return t.length ? t : DEFAULT_TOKENS;
  }, [tokens]);

  useEffect(() => {
    const mount = glMountRef.current;
    const root = rootRef.current;
    if (!mount || !root) return;

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const finePointer = window.matchMedia?.("(pointer: fine)").matches ?? false;
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

    const renderScale = mobile ? PARAMS.renderScaleMobile : PARAMS.renderScale;
    const pr = Math.min(window.devicePixelRatio || 1, 2) * renderScale;
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x000000, 0);

    const camera = new THREE.PerspectiveCamera(PARAMS.fov, 1, 0.1, 100);
    camera.position.z = PARAMS.cameraZ;
    const scene = new THREE.Scene();

    const toVec3 = (c: readonly number[]) =>
      new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255);

    const introUniform = { value: reduce ? 1 : 0 };

    // ── God-rays + haze (quad, ignora la cámara: siempre a pantalla completa) ──
    const samples = mobile ? PARAMS.raySamplesMobile : PARAMS.raySamples;
    const rayUniforms = {
      uTime: { value: 0 },
      uIntro: introUniform,
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
    quad.renderOrder = -2;
    scene.add(quad);

    // ── Chips 3D voladores ──
    const halfH = () => Math.tan((PARAMS.fov * Math.PI) / 360) * PARAMS.cameraZ;
    const halfW = () => halfH() * camera.aspect;
    const cardGeo = new THREE.PlaneGeometry(1, 1);
    const texCache = new Map<string, THREE.CanvasTexture>();
    const getTex = (t: string) => {
      let x = texCache.get(t);
      if (!x) {
        x = makeChipTexture(t, PARAMS.colorLight);
        texCache.set(t, x);
      }
      return x;
    };
    const cardN = mobile ? PARAMS.cardCountMobile : PARAMS.cardCount;
    const cards: Card[] = [];
    for (let i = 0; i < cardN; i++) {
      const text = tokenTexts[i % tokenTexts.length];
      const mat = new THREE.MeshBasicMaterial({
        map: getTex(text),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(cardGeo, mat);
      // z bien negativo → chips chicos por perspectiva (periféricos, no tapan).
      const z = rand(-6.5, -1.8);
      const depth = (z + 6.5) / 4.7; // 0 lejos .. 1 cerca
      const scale = 0.4 + depth * 0.5;
      mesh.scale.set(scale * 2, scale, 1); // chip 2:1
      // Reparto a los costados; algunos empiezan fuera de cuadro.
      const side = i % 2 === 0 ? -1 : 1;
      mesh.position.set(
        side * rand(0.45, 1.35) * halfW(),
        rand(-0.85, 0.85) * halfH(),
        z
      );
      mesh.rotation.set(rand(-0.5, 0.5), rand(-0.7, 0.7), rand(-0.4, 0.4));
      mesh.renderOrder = -1;
      scene.add(mesh);
      cards.push({
        mesh,
        mat,
        vx: -side * rand(0.14, 0.44) * (0.6 + depth), // deriva por el costado
        rvx: rand(-0.25, 0.25),
        rvy: rand(-0.35, 0.35),
        rvz: rand(-0.2, 0.2),
        baseOpacity: 0.1 + depth * 0.22,
        z,
      });
    }

    // ── Polvo (GPU points, clip-space) ──
    const dustCount = mobile ? PARAMS.dustCountMobile : PARAMS.dustCount;
    const dPos = new Float32Array(dustCount * 3);
    const dPhase = new Float32Array(dustCount);
    const dSize = new Float32Array(dustCount);
    const dSpeed = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      dPos[i * 3] = (Math.random() + Math.random() - 1) * 0.9;
      dPos[i * 3 + 1] = (Math.random() + Math.random() - 1) * 0.8;
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
    const dustUniforms = dustMat.uniforms;

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
    const parallaxOn = finePointer && !reduce;
    if (parallaxOn)
      window.addEventListener("pointermove", onPointerMove, { passive: true });

    let raf = 0;
    let visible = true;
    let signaled = false;
    let startMs = -1;
    let prevMs = -1;
    function signalOnce() {
      if (signalReady && !signaled) {
        signaled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
    }

    function updateCards(dt: number, intro: number) {
      const hw = halfW();
      for (let i = 0; i < cards.length; i++) {
        const cd = cards[i];
        const m = cd.mesh;
        m.position.x += cd.vx * dt;
        // Wrap por los costados.
        if (cd.vx < 0 && m.position.x < -hw * 1.4) m.position.x = hw * 1.4;
        else if (cd.vx > 0 && m.position.x > hw * 1.4) m.position.x = -hw * 1.4;
        m.rotation.x += cd.rvx * dt;
        m.rotation.y += cd.rvy * dt;
        m.rotation.z += cd.rvz * dt;
        m.position.x += ptr.cx * 0.15;
        m.position.y += -ptr.cy * 0.1;
        // Se atenúa fuerte al pasar por el centro (detrás del titular).
        const centerFade =
          0.12 + 0.88 * Math.min(1, Math.abs(m.position.x) / (hw * 0.5));
        cd.mat.opacity = cd.baseOpacity * centerFade * intro;
      }
    }

    function frame(ms: number) {
      if (startMs < 0) startMs = ms;
      const dt = prevMs < 0 ? 0.016 : Math.min(0.05, (ms - prevMs) / 1000);
      prevMs = ms;
      const t = ms * 0.001;
      const intro = reduce
        ? 1
        : Math.min(1, (ms - startMs) / PARAMS.introMs);
      // easeOutCubic para un fade-in cinematográfico.
      const introE = 1 - Math.pow(1 - intro, 3);
      introUniform.value = introE;

      ptr.cx += (ptr.tx - ptr.cx) * 0.05;
      ptr.cy += (ptr.ty - ptr.cy) * 0.05;
      rayUniforms.uTime.value = t;
      rayUniforms.uMouse.value.set(ptr.cx, -ptr.cy);
      dustUniforms.uTime.value = t;
      updateCards(dt, introE);

      renderer.render(scene, camera);
      signalOnce();
      if (!reduce && visible) raf = requestAnimationFrame(frame);
      else raf = 0;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduce && !raf) {
          prevMs = -1;
          raf = requestAnimationFrame(frame);
        }
      },
      { threshold: 0 }
    );
    io.observe(root);

    if (reduce) {
      introUniform.value = 1;
      updateCards(0, 1);
      renderer.render(scene, camera);
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
      cardGeo.dispose();
      cards.forEach((c) => c.mat.dispose());
      texCache.forEach((t) => t.dispose());
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalReady, tokenTexts]);

  return (
    <div
      ref={rootRef}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <div
        ref={glMountRef}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
    </div>
  );
}
