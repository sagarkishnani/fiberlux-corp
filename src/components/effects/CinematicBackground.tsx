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
} from "react-icons/fa6";
import type { IconType } from "react-icons";

/**
 * CinematicBackground — atmósfera "cinematic" del hero (SPEC 97), en WebGL.
 *
 * Interpretación de marca (morado) del look FXology:
 *   1. GOD-RAYS + HAZE → shader de dispersión volumétrica.
 *   2. GLASS TILES 3D  → tiles "glass" con los íconos de las soluciones,
 *      ubicados en los COSTADOS (no al centro), que entran volando desde los
 *      lados y se mecen con una leve inclinación (NO giran del todo → el ícono
 *      siempre se ve bien). Decorativos (sin click).
 *   3. DUST/EMBERS     → partículas GPU additivas cerca del centro.
 *
 * Respeta prefers-reduced-motion, pausa el rAF fuera de viewport y libera todo
 * al desmontar. Parallax por puntero (desktop).
 */

const PARAMS = {
  dustCount: 220,
  dustCountMobile: 90,
  cardCount: 12,
  cardCountMobile: 6,
  renderScale: 0.9,
  renderScaleMobile: 0.6,
  raySamples: 48,
  raySamplesMobile: 26,
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
};
const DEFAULT_ICON_KEYS = [
  "datacenter",
  "conectividad",
  "ciberseguridad",
  "gestionados",
];

interface Props {
  className?: string;
  /* Íconos de las soluciones (del CMS o default). Solo decorativo. */
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
    intensity *= 0.78 * uIntro;

    vec3 col = mix(uColor, uColorLight, clamp(illum * 1.1, 0.0, 0.82));
    vec3 outc = col * intensity + uColorLight * topGlow * 0.15 * uIntro;
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

// Textura "glass" del tile: rect redondeado con relleno translúcido + brillo
// superior + borde + ícono de solución. Cacheada por clave.
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

  // Relleno glass (gradiente vertical translúcido).
  g.save();
  roundPath();
  g.clip();
  const fill = g.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, `rgba(${lr},${lg},${lb},0.20)`);
  fill.addColorStop(0.5, `rgba(${cr},${cg},${cb},0.10)`);
  fill.addColorStop(1, `rgba(${cr},${cg},${cb},0.03)`);
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
  // Brillo superior (highlight de vidrio).
  const shine = g.createLinearGradient(0, y, 0, y + h * 0.5);
  shine.addColorStop(0, "rgba(255,255,255,0.16)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = shine;
  g.fillRect(x, y, w, h * 0.5);
  g.restore();

  // Borde.
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
  homeX: number; // posición de reposo (en un costado)
  homeY: number;
  z: number;
  bobPhase: number;
  bobSpeed: number;
  bobAmpX: number;
  bobAmpY: number;
  tiltPhase: number;
  tiltSpeed: number;
  tiltAmpX: number;
  tiltAmpY: number;
  baseOpacity: number;
  enterSide: number; // -1 izq, 1 der
  introDelay: number;
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
    const pr = Math.min(window.devicePixelRatio || 1, 2) * renderScale;
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x000000, 0);

    const camera = new THREE.PerspectiveCamera(PARAMS.fov, 1, 0.1, 100);
    camera.position.z = PARAMS.cameraZ;
    const scene = new THREE.Scene();

    const toVec3 = (c: readonly number[]) =>
      new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255);

    const introUniform = { value: reduce ? 1 : 0 };

    // ── God-rays + haze ──
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

    // ── Glass tiles en los costados ──
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
    const cards: Card[] = [];
    for (let i = 0; i < cardN; i++) {
      const key = keys[i % keys.length];
      const mat = new THREE.MeshBasicMaterial({
        map: getTex(key),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.NormalBlending,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(cardGeo, mat);
      const z = rand(-6.5, -1.8);
      const depth = (z + 6.5) / 4.7;
      const scale = 0.5 + depth * 0.55;
      mesh.scale.set(scale, scale, 1);
      const side = i % 2 === 0 ? -1 : 1;
      // Reposo en un costado (|x| grande), fuera de la zona del texto.
      const homeX = side * rand(0.6, 1.06) * halfH() * (16 / 9); // aprox; se recalcula abajo
      const homeY = rand(-0.82, 0.86) * halfH();
      mesh.position.set(homeX, homeY, z);
      mesh.renderOrder = -1;
      scene.add(mesh);
      cards.push({
        mesh,
        mat,
        homeX,
        homeY,
        z,
        bobPhase: rand(0, Math.PI * 2),
        bobSpeed: rand(0.15, 0.4),
        bobAmpX: (0.03 + depth * 0.05) * halfH(),
        bobAmpY: (0.04 + depth * 0.06) * halfH(),
        tiltPhase: rand(0, Math.PI * 2),
        tiltSpeed: rand(0.25, 0.5),
        tiltAmpX: rand(0.08, 0.18),
        tiltAmpY: rand(0.1, 0.2),
        baseOpacity: 0.42 + depth * 0.36,
        enterSide: side,
        introDelay: (i / cardN) * 0.5,
      });
    }
    // Reajusta homeX a los costados según el ancho real del frustum.
    const placeSides = () => {
      const hw = halfW();
      for (let i = 0; i < cards.length; i++) {
        const cd = cards[i];
        cd.homeX = cd.enterSide * rand(0.62, 1.05) * hw;
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
      placeSides();
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

    function updateCards(t: number, introE: number) {
      const hw = halfW();
      for (let i = 0; i < cards.length; i++) {
        const cd = cards[i];
        const m = cd.mesh;
        const local = Math.max(
          0,
          Math.min(1, (introE - cd.introDelay) / (1 - 0.5))
        );
        const localE = 1 - Math.pow(1 - local, 3);
        const enterX = (1 - localE) * cd.enterSide * hw * 1.2;

        // Mecido suave alrededor del reposo (sin cruzar al centro).
        const bx = Math.sin(t * cd.bobSpeed + cd.bobPhase) * cd.bobAmpX;
        const by = Math.cos(t * cd.bobSpeed * 0.8 + cd.bobPhase) * cd.bobAmpY;
        m.position.x = cd.homeX + bx + enterX + ptr.cx * 0.2;
        m.position.y = cd.homeY + by - ptr.cy * 0.12;

        // Inclinación leve (no gira del todo → el ícono siempre se ve).
        m.rotation.x = Math.sin(t * cd.tiltSpeed + cd.tiltPhase) * cd.tiltAmpX;
        m.rotation.y =
          Math.sin(t * cd.tiltSpeed * 0.9 + cd.tiltPhase * 1.3) * cd.tiltAmpY;
        m.rotation.z = Math.sin(t * cd.tiltSpeed * 0.5) * 0.05;

        cd.mat.opacity = cd.baseOpacity * localE;
      }
    }

    function frame(ms: number) {
      if (startMs < 0) startMs = ms;
      const t = ms * 0.001;
      const intro = reduce ? 1 : Math.min(1, (ms - startMs) / PARAMS.introMs);
      const introE = 1 - Math.pow(1 - intro, 3);
      introUniform.value = introE;

      ptr.cx += (ptr.tx - ptr.cx) * 0.05;
      ptr.cy += (ptr.ty - ptr.cy) * 0.05;
      rayUniforms.uTime.value = t;
      rayUniforms.uMouse.value.set(ptr.cx, -ptr.cy);
      dustUniforms.uTime.value = t;
      updateCards(t, introE);

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
