import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * CinematicBackground — hero "cinematic" (SPEC 97): PLANETA de conectividad.
 *
 * Globo punteado (tipo tierra) al fondo, con atmósfera morada en el borde
 * (el resplandor de la base da el gradiente base-clara → morado → negro), arcos
 * de fibra conectándose sobre la superficie (cables submarinos), campo de
 * estrellas y rotación lenta. Todo en WebGL, en morado de marca.
 *
 * Rendimiento: geometría barata (points), DPR capado y render a menor escala.
 * Respeta reduced-motion (frame estático), pausa el rAF fuera de viewport y
 * libera todo al desmontar. Se funde/deriva al hacer scroll.
 */

const PARAMS = {
  globeRadius: 3.7,
  globeY: -4.05, // centro del globo bajo el viewport (solo se ve el casquete)
  dotCount: 7000,
  dotCountMobile: 3200,
  starCount: 260,
  starCountMobile: 120,
  arcCount: 9,
  arcCountMobile: 5,
  renderScale: 0.75,
  renderScaleMobile: 0.55,
  dprCap: 1.5,
  color: [0x96, 0x23, 0x7a] as [number, number, number], // brand-purple
  colorLight: [0xd6, 0x4d, 0xb8] as [number, number, number], // acento claro
  introMs: 1800,
  rotSpeed: 0.03, // rad/s del globo
  fov: 38,
  cameraZ: 7,
} as const;

interface Props {
  className?: string;
  iconKeys?: string[]; // (no usado: los íconos se reemplazaron por el planeta)
  signalReady?: boolean;
  onUnsupported?: () => void;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const toVec3 = (c: readonly number[]) =>
  new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255);

// Punto en esfera unidad (Fibonacci) para índice i de n.
function fib(i: number, n: number): [number, number, number] {
  const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  return [
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ];
}

// ── Fondo: resplandor morado en la base (gradiente base→morado→negro) ──
const BG_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const BG_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform vec3 uColorLight;
  uniform float uIntro;
  uniform float uScroll;
  void main(){
    // Resplandor desde la base (abajo-centro), aclarando hacia morado y a negro arriba.
    float d = distance(vUv, vec2(0.5, -0.02));
    float glow = exp(-d * d * 2.6);
    float baseLift = smoothstep(0.28, -0.05, vUv.y); // un pelín más claro al fondo
    vec3 col = uColor * (0.06 + 0.14 * baseLift) + uColorLight * glow * 0.5;
    float amt = (glow * 0.45 + baseLift * 0.08) * uIntro * (1.0 - uScroll * 0.55);
    gl_FragColor = vec4(col * amt, 1.0);
  }
`;

// ── Globo punteado ──
const DOT_VERT = /* glsl */ `
  uniform float uPixelRatio;
  varying float vFront;
  varying float vRim;
  void main(){
    vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
    vec3 n = normalize(mat3(modelMatrix) * position);
    vec3 vdir = normalize(cameraPosition - wp);
    float f = dot(n, vdir);
    vFront = smoothstep(-0.15, 0.35, f);
    vRim = smoothstep(0.55, 0.02, f) * step(0.0, f); // brilla cerca del borde
    vec4 mv = viewMatrix * vec4(wp, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPixelRatio * 90.0 / max(0.1, -mv.z);
  }
`;
const DOT_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform vec3 uColorLight;
  uniform float uIntro;
  uniform float uScroll;
  varying float vFront;
  varying float vRim;
  void main(){
    if (vFront <= 0.02) discard; // oculta el hemisferio trasero
    vec2 c = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.0, length(c));
    vec3 col = mix(uColor * 0.85, uColorLight, vRim * 0.9);
    float alpha = a * (0.05 + 0.16 * vFront + 0.5 * vRim) * uIntro * (1.0 - uScroll * 0.6);
    gl_FragColor = vec4(col, alpha);
  }
`;

// ── Atmósfera (fresnel en el borde) ──
const ATM_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vWP;
  void main(){
    vWP = (modelMatrix * vec4(position, 1.0)).xyz;
    vN = normalize(mat3(modelMatrix) * position);
    gl_Position = projectionMatrix * viewMatrix * vec4(vWP, 1.0);
  }
`;
const ATM_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColorLight;
  uniform float uIntro;
  uniform float uScroll;
  varying vec3 vN;
  varying vec3 vWP;
  void main(){
    vec3 vdir = normalize(cameraPosition - vWP);
    float fres = pow(1.0 - max(0.0, dot(vN, vdir)), 4.5);
    float a = fres * 0.42 * uIntro * (1.0 - uScroll * 0.55);
    gl_FragColor = vec4(uColorLight * a, a);
  }
`;

// ── Estrellas ──
const STAR_VERT = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScroll;
  varying float vA;
  void main(){
    vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vA = (0.4 + 0.6 * abs(sin(uTime * 0.8 + aPhase))) * (1.0 - uScroll * 0.7);
    gl_PointSize = aSize * uPixelRatio;
  }
`;
const STAR_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform float uIntro;
  varying float vA;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.0, length(c));
    gl_FragColor = vec4(uColor, a * vA * uIntro);
  }
`;

// ── Arcos de fibra ──
const ARC_VERT = /* glsl */ `
  attribute float aT;      // 0..1 a lo largo del arco
  attribute float aArc;    // id del arco
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScroll;
  varying float vA;
  void main(){
    vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
    vec4 mv = viewMatrix * vec4(wp, 1.0);
    gl_Position = projectionMatrix * mv;
    // Pulso viajando por el arco.
    float head = fract(uTime * 0.18 + aArc * 0.37);
    float dd = abs(aT - head);
    dd = min(dd, 1.0 - dd);
    float pulse = smoothstep(0.16, 0.0, dd);
    float base = 0.12;
    vA = (base + pulse) * (1.0 - uScroll * 0.7);
    gl_PointSize = uPixelRatio * (1.4 + pulse * 3.2) * 80.0 / max(0.1, -mv.z);
  }
`;
const ARC_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform vec3 uColorLight;
  uniform float uIntro;
  varying float vA;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.0, length(c));
    vec3 col = mix(uColor, uColorLight, clamp(vA, 0.0, 1.0));
    gl_FragColor = vec4(col, a * vA * uIntro);
  }
`;

export default function CinematicBackground({
  className,
  signalReady,
  onUnsupported,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const glMountRef = useRef<HTMLDivElement>(null);

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
    camera.position.set(0, 0.2, PARAMS.cameraZ);
    camera.lookAt(0, -0.9, 0);
    const scene = new THREE.Scene();

    const introUniform = { value: reduce ? 1 : 0 };
    const scrollUniform = { value: 0 };
    const col = { value: toVec3(PARAMS.color) };
    const colL = { value: toVec3(PARAMS.colorLight) };
    const prU = { value: pr };
    const timeU = { value: 0 };

    // ── Fondo (resplandor de base) ──
    const bgMat = new THREE.ShaderMaterial({
      vertexShader: BG_VERT,
      fragmentShader: BG_FRAG,
      uniforms: {
        uColor: col,
        uColorLight: colL,
        uIntro: introUniform,
        uScroll: scrollUniform,
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const bgQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
    bgQuad.frustumCulled = false;
    bgQuad.renderOrder = -10;
    scene.add(bgQuad);

    // Grupo del planeta (rota).
    const globe = new THREE.Group();
    globe.position.y = PARAMS.globeY;
    globe.scale.setScalar(PARAMS.globeRadius);
    globe.rotation.z = 0.35; // leve inclinación del eje
    scene.add(globe);

    // ── Puntos del globo ──
    const dotN = mobile ? PARAMS.dotCountMobile : PARAMS.dotCount;
    const dPos = new Float32Array(dotN * 3);
    for (let i = 0; i < dotN; i++) {
      const [x, y, z] = fib(i, dotN);
      dPos[i * 3] = x;
      dPos[i * 3 + 1] = y;
      dPos[i * 3 + 2] = z;
    }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    const dotMat = new THREE.ShaderMaterial({
      vertexShader: DOT_VERT,
      fragmentShader: DOT_FRAG,
      uniforms: {
        uColor: col,
        uColorLight: colL,
        uIntro: introUniform,
        uScroll: scrollUniform,
        uPixelRatio: prU,
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const dots = new THREE.Points(dGeo, dotMat);
    dots.frustumCulled = false;
    globe.add(dots);

    // ── Atmósfera ──
    const atmMat = new THREE.ShaderMaterial({
      vertexShader: ATM_VERT,
      fragmentShader: ATM_FRAG,
      uniforms: { uColorLight: colL, uIntro: introUniform, uScroll: scrollUniform },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const atm = new THREE.Mesh(new THREE.SphereGeometry(1.16, 48, 48), atmMat);
    atm.frustumCulled = false;
    globe.add(atm);

    // ── Arcos de fibra ──
    const arcN = mobile ? PARAMS.arcCountMobile : PARAMS.arcCount;
    const segs = 40;
    const aPos = new Float32Array(arcN * segs * 3);
    const aT = new Float32Array(arcN * segs);
    const aArc = new Float32Array(arcN * segs);
    const va = new THREE.Vector3();
    const vb = new THREE.Vector3();
    const vm = new THREE.Vector3();
    for (let k = 0; k < arcN; k++) {
      const A = fib(Math.floor(rand(0, dotN)), dotN);
      const B = fib(Math.floor(rand(0, dotN)), dotN);
      va.set(A[0], A[1], A[2]);
      vb.set(B[0], B[1], B[2]);
      vm.copy(va).add(vb).multiplyScalar(0.5).normalize();
      const lift = 1.0 + 0.18 + va.distanceTo(vb) * 0.12; // altura del arco
      vm.multiplyScalar(lift);
      for (let s = 0; s < segs; s++) {
        const t = s / (segs - 1);
        // Bézier cuadrática A→vm→B, normalizada suavemente a la altura.
        const x =
          (1 - t) * (1 - t) * va.x + 2 * (1 - t) * t * vm.x + t * t * vb.x;
        const y =
          (1 - t) * (1 - t) * va.y + 2 * (1 - t) * t * vm.y + t * t * vb.y;
        const z =
          (1 - t) * (1 - t) * va.z + 2 * (1 - t) * t * vm.z + t * t * vb.z;
        const idx = (k * segs + s) * 3;
        aPos[idx] = x;
        aPos[idx + 1] = y;
        aPos[idx + 2] = z;
        aT[k * segs + s] = t;
        aArc[k * segs + s] = k;
      }
    }
    const arcGeo = new THREE.BufferGeometry();
    arcGeo.setAttribute("position", new THREE.BufferAttribute(aPos, 3));
    arcGeo.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
    arcGeo.setAttribute("aArc", new THREE.BufferAttribute(aArc, 1));
    const arcMat = new THREE.ShaderMaterial({
      vertexShader: ARC_VERT,
      fragmentShader: ARC_FRAG,
      uniforms: {
        uColor: col,
        uColorLight: colL,
        uIntro: introUniform,
        uScroll: scrollUniform,
        uPixelRatio: prU,
        uTime: timeU,
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const arcs = new THREE.Points(arcGeo, arcMat);
    arcs.frustumCulled = false;
    globe.add(arcs);

    // ── Estrellas (fondo, no rotan con el globo) ──
    const starN = mobile ? PARAMS.starCountMobile : PARAMS.starCount;
    const sPos = new Float32Array(starN * 3);
    const sPhase = new Float32Array(starN);
    const sSize = new Float32Array(starN);
    for (let i = 0; i < starN; i++) {
      sPos[i * 3] = rand(-9, 9);
      sPos[i * 3 + 1] = rand(-2, 8);
      sPos[i * 3 + 2] = rand(-6, -1);
      sPhase[i] = rand(0, Math.PI * 2);
      sSize[i] = rand(1.0, 2.6);
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    sGeo.setAttribute("aPhase", new THREE.BufferAttribute(sPhase, 1));
    sGeo.setAttribute("aSize", new THREE.BufferAttribute(sSize, 1));
    const starMat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: {
        uColor: { value: new THREE.Color(0.9, 0.85, 0.95) },
        uIntro: introUniform,
        uScroll: scrollUniform,
        uPixelRatio: prU,
        uTime: timeU,
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(sGeo, starMat);
    stars.frustumCulled = false;
    scene.add(stars);

    // ── Resize / scroll ──
    let heroTop = 0;
    let heroHeight = 1;
    function resize() {
      const w = mount!.clientWidth || 1;
      const h = mount!.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const r = root!.getBoundingClientRect();
      heroTop = window.scrollY + r.top;
      heroHeight = r.height || 1;
    }
    resize();
    window.addEventListener("resize", resize);

    // Parallax por puntero (leve tilt del globo).
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

    function frame(ms: number) {
      if (startMs < 0) startMs = ms;
      const t = ms * 0.001;
      timeU.value = t;
      const intro = reduce ? 1 : Math.min(1, (ms - startMs) / PARAMS.introMs);
      introUniform.value = 1 - Math.pow(1 - intro, 3);

      const scrollP = Math.max(
        0,
        Math.min(1, (window.scrollY - heroTop) / heroHeight)
      );
      scrollUniform.value = scrollP;

      ptr.cx += (ptr.tx - ptr.cx) * 0.05;
      ptr.cy += (ptr.ty - ptr.cy) * 0.05;

      globe.rotation.y = t * PARAMS.rotSpeed + ptr.cx * 0.25;
      globe.rotation.x = 0.06 + ptr.cy * 0.12;
      globe.position.y = PARAMS.globeY + scrollP * 1.2; // sube al hacer scroll

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
      bgQuad.geometry.dispose();
      bgMat.dispose();
      dGeo.dispose();
      dotMat.dispose();
      atm.geometry.dispose();
      atmMat.dispose();
      arcGeo.dispose();
      arcMat.dispose();
      sGeo.dispose();
      starMat.dispose();
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [signalReady]);

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
