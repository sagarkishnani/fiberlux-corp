import { useEffect, useMemo, useRef, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as THREE from "three";
import {
  FaServer,
  FaNetworkWired,
  FaShieldHalved,
  FaGears,
  FaCloud,
  FaWifi,
  FaDatabase,
  FaLock,
  FaMicrochip,
  FaSatelliteDish,
  FaHeadset,
  FaGlobe,
  FaTowerBroadcast,
  FaCode,
  FaDesktop,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

/**
 * CinematicBackground — atmósfera "cinematic" del hero (SPEC 97), en WebGL.
 *
 *   1. GOD-RAYS + HAZE → shader de dispersión volumétrica (+ onda de luz al click
 *      y desvanecido por scroll).
 *   2. GLASS TILES 3D  → tiles "glass" con los íconos de las soluciones,
 *      distribuidos en columnas a los COSTADOS (sin solaparse), mecidos con
 *      leve inclinación (no giran → el ícono siempre se ve). Decorativos.
 *   3. DUST/EMBERS     → partículas GPU additivas.
 *
 * Al hacer scroll toda la escena se funde/deriva (transición al bajar). Respeta
 * reduced-motion, pausa el rAF fuera de viewport y libera todo al desmontar.
 */

const PARAMS = {
  dustCount: 150,
  dustCountMobile: 60,
  cardCount: 10,
  cardCountMobile: 6,
  // Rendimiento: la escena es de baja frecuencia (humo/luz), así que se renderiza
  // a menor resolución y con DPR capado sin pérdida visible; los god-rays usan
  // pocas muestras y el ruido pocas octavas.
  renderScale: 0.7,
  renderScaleMobile: 0.5,
  dprCap: 1.5,
  raySamples: 26,
  raySamplesMobile: 16,
  color: [0x96, 0x23, 0x7a] as [number, number, number],
  colorLight: [0xd6, 0x4d, 0xb8] as [number, number, number],
  introMs: 1800,
  fov: 50,
  cameraZ: 6,
} as const;

const ICONS: Record<string, IconType> = {
  datacenter: FaServer,
  conectividad: FaNetworkWired,
  ciberseguridad: FaShieldHalved,
  gestionados: FaGears,
  cloud: FaCloud,
  wifi: FaWifi,
  database: FaDatabase,
  lock: FaLock,
  microchip: FaMicrochip,
  satellite: FaSatelliteDish,
  headset: FaHeadset,
  globe: FaGlobe,
  broadcast: FaTowerBroadcast,
  code: FaCode,
  desktop: FaDesktop,
};
const DEFAULT_ICON_KEYS = [
  "datacenter",
  "conectividad",
  "ciberseguridad",
  "gestionados",
];
// Íconos extra (subservicios/tech) para dar variedad a los tiles y que no se
// repitan tanto. Se mezclan con los íconos de solución del CMS.
const EXTRA_ICON_KEYS = [
  "cloud",
  "database",
  "lock",
  "microchip",
  "satellite",
  "headset",
  "globe",
  "broadcast",
  "code",
  "desktop",
  "wifi",
];

interface Props {
  className?: string;
  iconKeys?: string[];
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
  uniform float uScroll;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform vec3 uColor;
  uniform vec3 uColorLight;
  uniform vec2 uRipplePos[3];
  uniform float uRippleStart[3];
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
    // La fuente de luz baja al hacer scroll (parallax).
    vec2 lp = vec2(0.5 * aspect + uMouse.x * 0.05, 1.16 + uMouse.y * 0.03 - uScroll * 0.22);

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
    intensity *= 0.78 * uIntro;
    // Se funde a negro al bajar.
    intensity *= (1.0 - uScroll * 0.5);

    // Onda de luz al click (suave): anillos que se expanden y se apagan.
    float ripple = 0.0;
    for (int i = 0; i < 3; i++){
      float age = uTime - uRippleStart[i];
      if (age > 0.0 && age < 2.2){
        float d = distance(uv, uRipplePos[i]);
        float radius = age * 0.55;
        float ring = exp(-pow((d - radius) / 0.045, 2.0));
        ripple += ring * (1.0 - age / 2.2);
      }
    }
    intensity += ripple * 0.1 * uIntro;

    vec3 col = mix(uColor, uColorLight, clamp(illum * 1.1, 0.0, 0.82));
    vec3 outc = col * intensity
      + uColorLight * topGlow * 0.15 * uIntro * (1.0 - uScroll * 0.5)
      + uColorLight * ripple * 0.09 * uIntro;
    gl_FragColor = vec4(outc, 1.0);
  }
`;

const DUST_VERT = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  attribute float aSpeed;
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uMouse;
  uniform float uPixelRatio;
  uniform vec2 uRipplePos[3];
  uniform float uRippleStart[3];
  varying float vA;
  void main(){
    vec2 p = position.xy;
    p.x += sin(uTime * aSpeed + aPhase) * 0.06;
    p.y += cos(uTime * aSpeed * 0.7 + aPhase * 1.3) * 0.05;
    p.y += 0.10 * sin(uTime * 0.05 * aSpeed + aPhase);
    p += uMouse * (0.02 + aSize * 0.0015);
    p.y += uScroll * 0.5; // deriva hacia arriba al bajar
    // Empuje suave por la onda de luz al click.
    for (int i = 0; i < 3; i++){
      float age = uTime - uRippleStart[i];
      if (age > 0.0 && age < 2.2){
        vec2 puv = vec2(p.x * 0.5 + 0.5, p.y * 0.5 + 0.5);
        vec2 diff = puv - uRipplePos[i];
        float d = length(diff);
        float radius = age * 0.55;
        float ring = exp(-pow((d - radius) / 0.05, 2.0));
        vec2 dir = d > 0.0001 ? diff / d : vec2(0.0);
        p += dir * ring * (1.0 - age / 2.2) * 0.03;
      }
    }
    vA = (0.30 + 0.70 * abs(sin(uTime * aSpeed * 1.5 + aPhase))) * (1.0 - uScroll * 0.6);
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

// Textura "glass" del tile: rect redondeado translúcido + brillo + ícono.
function makeGlassTexture(
  key: string,
  color: readonly number[],
  light: readonly number[]
): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d")!;
  const [cr, cg, cb] = color;
  const [lr, lg, lb] = light;
  const pad = 26;
  const r = 46;
  const x = pad, y = pad, w = S - pad * 2, h = S - pad * 2;
  const roundPath = () => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };
  g.save();
  roundPath();
  g.clip();
  const fill = g.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, `rgba(${lr},${lg},${lb},0.20)`);
  fill.addColorStop(0.5, `rgba(${cr},${cg},${cb},0.10)`);
  fill.addColorStop(1, `rgba(${cr},${cg},${cb},0.03)`);
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
  const shine = g.createLinearGradient(0, y, 0, y + h * 0.5);
  shine.addColorStop(0, "rgba(255,255,255,0.16)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = shine;
  g.fillRect(x, y, w, h * 0.5);
  g.restore();
  g.lineWidth = 2.5;
  g.strokeStyle = `rgba(${lr},${lg},${lb},0.6)`;
  roundPath();
  g.stroke();

  const tex = new THREE.CanvasTexture(c);
  const Icon = ICONS[key] || FaServer;
  try {
    const svg = renderToStaticMarkup(
      createElement(Icon, { color: "rgb(255,236,251)", size: 128 })
    );
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    const img = new Image();
    img.onload = () => {
      const sz = 104;
      g.save();
      g.shadowColor = `rgba(${lr},${lg},${lb},0.85)`;
      g.shadowBlur = 16;
      g.globalAlpha = 0.95;
      g.drawImage(img, (S - sz) / 2, (S - sz) / 2, sz, sz);
      g.restore();
      tex.needsUpdate = true;
    };
    img.src = url;
  } catch {
    /* si falla, queda el tile glass sin ícono */
  }
  return tex;
}

interface Card {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  xNorm: number; // posición normalizada en el costado (|x| en unidades halfW)
  yNorm: number; // posición vertical normalizada (halfH)
  homeX: number;
  homeY: number;
  bobPhase: number;
  bobSpeed: number;
  bobAmpX: number;
  bobAmpY: number;
  tiltPhase: number;
  tiltSpeed: number;
  tiltAmpX: number;
  tiltAmpY: number;
  baseOpacity: number;
  enterSide: number;
  introDelay: number;
  parallax: number; // cuánto sube al hacer scroll (mayor = más cerca)
}

export default function CinematicBackground({
  className,
  iconKeys,
  signalReady,
  onUnsupported,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const glMountRef = useRef<HTMLDivElement>(null);

  const keys = useMemo(() => {
    const k = (iconKeys || []).filter((s) => s && ICONS[s]);
    return k.length ? k : DEFAULT_ICON_KEYS;
  }, [iconKeys]);

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
    const pr =
      Math.min(window.devicePixelRatio || 1, PARAMS.dprCap) * renderScale;
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x000000, 0);

    const camera = new THREE.PerspectiveCamera(PARAMS.fov, 1, 0.1, 100);
    camera.position.z = PARAMS.cameraZ;
    const scene = new THREE.Scene();

    const toVec3 = (c: readonly number[]) =>
      new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255);

    const introUniform = { value: reduce ? 1 : 0 };
    const scrollUniform = { value: 0 };
    const rippleUniforms = {
      uRipplePos: {
        value: [
          new THREE.Vector2(-9, -9),
          new THREE.Vector2(-9, -9),
          new THREE.Vector2(-9, -9),
        ],
      },
      uRippleStart: { value: [-100, -100, -100] as number[] },
    };

    // ── God-rays + haze ──
    const samples = mobile ? PARAMS.raySamplesMobile : PARAMS.raySamples;
    const rayUniforms = {
      uTime: { value: 0 },
      uIntro: introUniform,
      uScroll: scrollUniform,
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColor: { value: toVec3(PARAMS.color) },
      uColorLight: { value: toVec3(PARAMS.colorLight) },
      uRipplePos: rippleUniforms.uRipplePos,
      uRippleStart: rippleUniforms.uRippleStart,
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

    // ── Glass tiles en columnas a los costados (distribución uniforme) ──
    const halfH = () => Math.tan((PARAMS.fov * Math.PI) / 360) * PARAMS.cameraZ;
    const halfW = () => halfH() * camera.aspect;
    const cardGeo = new THREE.PlaneGeometry(1, 1);
    const texCache = new Map<string, THREE.CanvasTexture>();
    const getTex = (k: string) => {
      let x = texCache.get(k);
      if (!x) {
        x = makeGlassTexture(k, PARAMS.color, PARAMS.colorLight);
        texCache.set(k, x);
      }
      return x;
    };
    const cardN = mobile ? PARAMS.cardCountMobile : PARAMS.cardCount;
    const perSide = Math.ceil(cardN / 2);
    // Pool de íconos = soluciones (CMS) + extras (subservicios/tech), sin repetir,
    // para que los tiles varíen.
    const pool: string[] = [];
    const seenKey = new Set<string>();
    for (const kk of [...keys, ...EXTRA_ICON_KEYS]) {
      if (ICONS[kk] && !seenKey.has(kk)) {
        seenKey.add(kk);
        pool.push(kk);
      }
    }
    const cards: Card[] = [];
    let leftK = 0;
    let rightK = 0;
    for (let i = 0; i < cardN; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const k = side < 0 ? leftK++ : rightK++;
      const key = pool[i % pool.length];
      const mat = new THREE.MeshBasicMaterial({
        map: getTex(key),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.NormalBlending,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(cardGeo, mat);
      const z = rand(-6.2, -2.2);
      const depth = (z + 6.2) / 4.0;
      const scale = 0.5 + depth * 0.42;
      mesh.scale.set(scale, scale, 1);
      mesh.renderOrder = -1;
      scene.add(mesh);
      // Vertical uniforme por costado (evita solapamiento) + X alternada.
      const frac = (k + 0.5) / perSide;
      const yNorm = 0.8 - frac * 1.6 + rand(-0.045, 0.045);
      const xNorm = 0.66 + (k % 2) * 0.18 + rand(-0.04, 0.04);
      cards.push({
        mesh,
        mat,
        xNorm,
        yNorm,
        homeX: 0,
        homeY: 0,
        bobPhase: rand(0, Math.PI * 2),
        bobSpeed: rand(0.15, 0.4),
        bobAmpX: (0.015 + depth * 0.02) * halfH(),
        bobAmpY: (0.02 + depth * 0.03) * halfH(),
        tiltPhase: rand(0, Math.PI * 2),
        tiltSpeed: rand(0.25, 0.5),
        tiltAmpX: rand(0.08, 0.16),
        tiltAmpY: rand(0.1, 0.18),
        baseOpacity: 0.42 + depth * 0.34,
        enterSide: side,
        introDelay: (i / cardN) * 0.5,
        parallax: 1.0 + depth * 2.0,
      });
    }
    const placeSides = () => {
      const hw = halfW();
      const hh = halfH();
      for (const cd of cards) {
        cd.homeX = cd.enterSide * cd.xNorm * hw;
        cd.homeY = cd.yNorm * hh;
      }
    };
    placeSides();

    // ── Polvo ──
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
        uScroll: scrollUniform,
        uMouse: rayUniforms.uMouse,
        uPixelRatio: { value: pr },
        uColor: { value: toVec3(PARAMS.colorLight) },
        uRipplePos: rippleUniforms.uRipplePos,
        uRippleStart: rippleUniforms.uRippleStart,
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

    // Cache de la posición del hero en el documento, para calcular el progreso
    // de scroll con window.scrollY (barato, sin forzar reflow por frame).
    let heroTop = 0;
    let heroHeight = 1;
    function resize() {
      const w = mount!.clientWidth || 1;
      const h = mount!.clientHeight || 1;
      renderer.setSize(w, h, false);
      rayUniforms.uRes.value.set(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      placeSides();
      const r = root!.getBoundingClientRect();
      heroTop = window.scrollY + r.top;
      heroHeight = r.height || 1;
    }
    resize();
    window.addEventListener("resize", resize);

    // Parallax por puntero (desktop).
    const ptr = { tx: 0, ty: 0, cx: 0, cy: 0 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = root!.getBoundingClientRect();
      ptr.tx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      ptr.ty = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    };
    if (finePointer && !reduce)
      window.addEventListener("pointermove", onPointerMove, { passive: true });

    let raf = 0;
    let visible = true;
    let signaled = false;
    let startMs = -1;
    function signalOnce() {
      if (signalReady && !signaled) {
        signaled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
    }

    // Onda de luz al click (shockwave).
    let rippleIdx = 0;
    const onDown = (e: PointerEvent) => {
      if (reduce) return;
      const rect = root!.getBoundingClientRect();
      const u = (e.clientX - rect.left) / Math.max(1, rect.width);
      const v = (e.clientY - rect.top) / Math.max(1, rect.height);
      rippleUniforms.uRipplePos.value[rippleIdx].set(u, 1 - v);
      rippleUniforms.uRippleStart.value[rippleIdx] = rayUniforms.uTime.value;
      rippleIdx = (rippleIdx + 1) % 3;
      if (!raf && visible) raf = requestAnimationFrame(frame);
    };
    root.addEventListener("pointerdown", onDown, { passive: true });
    root.style.pointerEvents = "auto";

    function updateCards(t: number, introE: number, scrollP: number) {
      const hw = halfW();
      const fade = 1 - scrollP * 0.6;
      for (let i = 0; i < cards.length; i++) {
        const cd = cards[i];
        const m = cd.mesh;
        const local = Math.max(
          0,
          Math.min(1, (introE - cd.introDelay) / (1 - 0.5))
        );
        const localE = 1 - Math.pow(1 - local, 3);
        const enterX = (1 - localE) * cd.enterSide * hw * 1.2;

        const bx = Math.sin(t * cd.bobSpeed + cd.bobPhase) * cd.bobAmpX;
        const by = Math.cos(t * cd.bobSpeed * 0.8 + cd.bobPhase) * cd.bobAmpY;
        m.position.x = cd.homeX + bx + enterX + ptr.cx * 0.2;
        // Parallax de scroll: los tiles suben (los cercanos, más rápido).
        m.position.y = cd.homeY + by - ptr.cy * 0.12 + scrollP * cd.parallax;

        m.rotation.x = Math.sin(t * cd.tiltSpeed + cd.tiltPhase) * cd.tiltAmpX;
        m.rotation.y =
          Math.sin(t * cd.tiltSpeed * 0.9 + cd.tiltPhase * 1.3) * cd.tiltAmpY;
        m.rotation.z = Math.sin(t * cd.tiltSpeed * 0.5) * 0.05;

        cd.mat.opacity = cd.baseOpacity * localE * fade;
      }
    }

    function frame(ms: number) {
      if (startMs < 0) startMs = ms;
      const t = ms * 0.001;
      const intro = reduce ? 1 : Math.min(1, (ms - startMs) / PARAMS.introMs);
      const introE = 1 - Math.pow(1 - intro, 3);
      introUniform.value = introE;

      // Progreso de scroll del hero (0 arriba .. 1 cuando sale por arriba).
      const scrollP = Math.max(
        0,
        Math.min(1, (window.scrollY - heroTop) / heroHeight)
      );
      scrollUniform.value = scrollP;

      ptr.cx += (ptr.tx - ptr.cx) * 0.05;
      ptr.cy += (ptr.ty - ptr.cy) * 0.05;
      rayUniforms.uTime.value = t;
      rayUniforms.uMouse.value.set(ptr.cx, -ptr.cy);
      dustUniforms.uTime.value = t;
      updateCards(t, introE, scrollP);

      renderer.render(scene, camera);
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
      introUniform.value = 1;
      updateCards(0, 1, 0);
      renderer.render(scene, camera);
      signalOnce();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerdown", onDown);
      root.style.pointerEvents = "";
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
  }, [signalReady, keys]);

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
