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
  dotCount: 13000,
  dotCountMobile: 6000,
  starCount: 520,
  starCountMobile: 240,
  dustCount: 200, // polvo/luz ambiental que llena el espacio (dinamismo)
  dustCountMobile: 100,
  arcCount: 20,
  arcCountMobile: 11,
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

// Máscara de tierra (continentes aproximados, equirectangular) → sampler
// (lat,lon) => 1 si es tierra, 0 si es océano. Da al globo aspecto de Tierra.
function makeLandSampler(): (lat: number, lon: number) => number {
  const W = 360,
    H = 180;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#fff";
  const px = (lon: number) => ((lon + 180) / 360) * W;
  const py = (lat: number) => ((90 - lat) / 180) * H;
  const blob = (lon: number, lat: number, rwDeg: number, rhDeg: number) => {
    g.beginPath();
    g.ellipse(
      px(lon),
      py(lat),
      (rwDeg / 360) * W,
      (rhDeg / 180) * H,
      0,
      0,
      Math.PI * 2
    );
    g.fill();
  };
  // Norteamérica
  blob(-100, 48, 26, 20); blob(-90, 36, 18, 14); blob(-118, 60, 16, 12); blob(-80, 27, 9, 9);
  // Centroamérica
  blob(-85, 15, 6, 9);
  // Sudamérica
  blob(-62, -12, 15, 20); blob(-68, -35, 8, 16);
  // Groenlandia
  blob(-42, 72, 11, 8);
  // África
  blob(20, 3, 19, 24); blob(26, -20, 13, 15); blob(12, 22, 11, 10);
  // Europa
  blob(15, 52, 15, 9); blob(35, 57, 11, 8);
  // Asia
  blob(92, 50, 42, 24); blob(70, 34, 18, 16); blob(112, 30, 17, 16); blob(135, 62, 14, 12);
  // India / Sudeste asiático
  blob(78, 22, 8, 12); blob(115, 5, 10, 8);
  // Australia
  blob(134, -25, 16, 11);
  // Antártida (franja inferior)
  g.fillRect(0, H - 12, W, 12);

  const data = g.getImageData(0, 0, W, H).data;
  return (lat: number, lon: number) => {
    let x = Math.floor(((lon + 180) / 360) * W);
    let y = Math.floor(((90 - lat) / 180) * H);
    x = ((x % W) + W) % W;
    y = Math.max(0, Math.min(H - 1, y));
    return data[(y * W + x) * 4] > 128 ? 1 : 0;
  };
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
    vec3 col = uColor * (0.05 + 0.08 * baseLift) + uColorLight * glow * 0.18;
    float amt = (glow * 0.12 + baseLift * 0.04) * uIntro * (1.0 - uScroll * 0.55);
    gl_FragColor = vec4(col * amt, 1.0);
  }
`;

// ── Globo punteado ──
const DOT_VERT = /* glsl */ `
  attribute float aLand;
  uniform float uPixelRatio;
  varying float vFront;
  varying float vRim;
  varying float vLand;
  void main(){
    vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
    vec3 n = normalize(mat3(modelMatrix) * position);
    vec3 vdir = normalize(cameraPosition - wp);
    float f = dot(n, vdir);
    vFront = smoothstep(-0.15, 0.35, f);
    vRim = smoothstep(0.55, 0.02, f) * step(0.0, f); // brilla cerca del borde
    vLand = aLand;
    vec4 mv = viewMatrix * vec4(wp, 1.0);
    gl_Position = projectionMatrix * mv;
    // Puntos distintos (halftone); tierra algo más grande.
    gl_PointSize = uPixelRatio * (17.0 + aLand * 20.0) / max(0.1, -mv.z);
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
  varying float vLand;
  void main(){
    if (vFront <= 0.02) discard; // oculta el hemisferio trasero
    // Disco NÍTIDO (no gaussiano) → puntos distintos (halftone), no un wash.
    float a = 1.0 - smoothstep(0.32, 0.48, length(gl_PointCoord - 0.5));
    // Tierra clara y definida (pop sobre globo oscuro); borde brilla.
    vec3 col = mix(uColor * 0.85, uColorLight, max(vRim * 0.9, vLand * 0.7));
    float landB = mix(0.24, 1.7, vLand);
    float alpha = a * landB * (0.62 + 0.3 * vFront + 0.45 * vRim) * uIntro * (1.0 - uScroll * 0.6);
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
  uniform float uPow;
  uniform float uAmp;
  varying vec3 vN;
  varying vec3 vWP;
  void main(){
    vec3 vdir = normalize(cameraPosition - vWP);
    float fres = pow(1.0 - max(0.0, dot(vN, vdir)), uPow);
    float a = fres * uAmp * uIntro * (1.0 - uScroll * 0.55);
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
    float head = fract(uTime * 0.16 + aArc * 0.37);
    float dd = abs(aT - head);
    dd = min(dd, 1.0 - dd);
    float pulse = smoothstep(0.1, 0.0, dd);
    float base = 0.13;
    vA = (base + pulse * 0.9) * (1.0 - uScroll * 0.7);
    gl_PointSize = uPixelRatio * (1.5 + pulse * 1.8) * 80.0 / max(0.1, -mv.z);
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

// ── Polvo / luz ambiental (clip-space, llena el espacio → dinamismo) ──
const DUST_VERT = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  attribute float aSpeed;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScroll;
  varying float vA;
  void main(){
    vec2 p = position.xy;
    p.x += sin(uTime * aSpeed + aPhase) * 0.05;
    p.y += cos(uTime * aSpeed * 0.7 + aPhase * 1.3) * 0.04;
    p.y += 0.12 * sin(uTime * 0.05 * aSpeed + aPhase);
    vA = (0.28 + 0.72 * abs(sin(uTime * aSpeed * 1.4 + aPhase))) * (1.0 - uScroll * 0.6);
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
    float a = smoothstep(0.5, 0.0, length(c));
    gl_FragColor = vec4(uColor, a * vA * uIntro);
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

    // Cuerpo sólido oscuro del planeta: da un globo real y hace que los puntos
    // resalten encima (con depth test), en vez de un disco de glow translúcido.
    const bodyMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.11, 0.03, 0.09),
      depthWrite: true,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.955, 64, 64), bodyMat);
    body.frustumCulled = false;
    body.renderOrder = 0;
    globe.add(body);

    // ── Puntos del globo: GRILLA regular lat/lon (look de globo punteado
    //    "halftone") + máscara de continentes. Tierra = puntos brillantes y
    //    grandes; océano = puntos tenues. ──
    const land = makeLandSampler();
    const D2R = Math.PI / 180;
    const step = mobile ? 3.2 : 2.3; // grados entre puntos (grilla densa tipo halftone)
    const posArr: number[] = [];
    const landArr: number[] = [];
    const landPoints: [number, number, number][] = []; // para los cables
    for (let lat = -88; lat <= 88; lat += step) {
      const rad = lat * D2R;
      const ring = Math.cos(rad);
      const yy = Math.sin(rad);
      const count = Math.max(1, Math.round((360 / step) * ring));
      for (let j = 0; j < count; j++) {
        const lon = (j / count) * 360 - 180;
        const lr = lon * D2R;
        const x = ring * Math.cos(lr);
        const z = ring * Math.sin(lr);
        const l = land(lat, lon);
        posArr.push(x, yy, z);
        landArr.push(l);
        if (l > 0.5) landPoints.push([x, yy, z]);
      }
    }
    const dotN = landArr.length;
    const dPos = new Float32Array(posArr);
    const dLand = new Float32Array(landArr);
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    dGeo.setAttribute("aLand", new THREE.BufferAttribute(dLand, 1));
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
      depthTest: false, // el hemisferio trasero ya se descarta por vFront (sin z-fighting)
      blending: THREE.AdditiveBlending,
    });
    const dots = new THREE.Points(dGeo, dotMat);
    dots.frustumCulled = false;
    globe.add(dots);

    // ── Atmósfera (halo): capa interna nítida en el borde + capa externa
    //    difusa que se funde al espacio → halo real, no una franja. ──
    const makeAtm = (radius: number, pow: number, amp: number) => {
      const m = new THREE.ShaderMaterial({
        vertexShader: ATM_VERT,
        fragmentShader: ATM_FRAG,
        uniforms: {
          uColorLight: colL,
          uIntro: introUniform,
          uScroll: scrollUniform,
          uPow: { value: pow },
          uAmp: { value: amp },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 48), m);
      mesh.frustumCulled = false;
      globe.add(mesh);
      return m;
    };
    const atmInnerMat = makeAtm(1.012, 4.2, 0.75); // rim fino y brillante en el borde
    const atmOuterMat = makeAtm(1.45, 1.1, 0.4); // glow difuso hacia el espacio

    // ── Cables de fibra: conectan puntos de TIERRA (a través de océanos),
    //    como los cables submarinos. Línea densa con un pulso viajando. ──
    const arcN = mobile ? PARAMS.arcCountMobile : PARAMS.arcCount;
    const segs = 64;
    const aPos = new Float32Array(arcN * segs * 3);
    const aT = new Float32Array(arcN * segs);
    const aArc = new Float32Array(arcN * segs);
    const va = new THREE.Vector3();
    const vb = new THREE.Vector3();
    const vm = new THREE.Vector3();
    const pick = () =>
      landPoints.length
        ? landPoints[Math.floor(rand(0, landPoints.length))]
        : fib(Math.floor(rand(0, dotN)), dotN);
    for (let k = 0; k < arcN; k++) {
      let A = pick();
      let B = pick();
      va.set(A[0], A[1], A[2]);
      vb.set(B[0], B[1], B[2]);
      // Reintenta para que los extremos estén razonablemente lejos (cruzan mar).
      for (let tryi = 0; tryi < 6 && va.distanceTo(vb) < 1.0; tryi++) {
        B = pick();
        vb.set(B[0], B[1], B[2]);
      }
      vm.copy(va).add(vb).multiplyScalar(0.5).normalize();
      const lift = 1.0 + 0.05 + va.distanceTo(vb) * 0.08; // arco pegado al globo
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
      depthTest: true, // el cuerpo oculta los cables del lado trasero
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
      sPos[i * 3] = rand(-13, 13);
      sPos[i * 3 + 1] = rand(-3, 10);
      sPos[i * 3 + 2] = rand(-7, -1);
      sPhase[i] = rand(0, Math.PI * 2);
      sSize[i] = rand(0.9, 2.8);
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

    // ── Polvo / luz ambiental (clip-space, llena el espacio) ──
    const dustN = mobile ? PARAMS.dustCountMobile : PARAMS.dustCount;
    const duPos = new Float32Array(dustN * 3);
    const duPhase = new Float32Array(dustN);
    const duSize = new Float32Array(dustN);
    const duSpeed = new Float32Array(dustN);
    for (let i = 0; i < dustN; i++) {
      duPos[i * 3] = rand(-1, 1);
      duPos[i * 3 + 1] = rand(-1, 1);
      duPos[i * 3 + 2] = 0;
      duPhase[i] = rand(0, Math.PI * 2);
      duSize[i] = rand(1.2, 4.4);
      duSpeed[i] = rand(0.2, 0.9);
    }
    const duGeo = new THREE.BufferGeometry();
    duGeo.setAttribute("position", new THREE.BufferAttribute(duPos, 3));
    duGeo.setAttribute("aPhase", new THREE.BufferAttribute(duPhase, 1));
    duGeo.setAttribute("aSize", new THREE.BufferAttribute(duSize, 1));
    duGeo.setAttribute("aSpeed", new THREE.BufferAttribute(duSpeed, 1));
    const dustMat = new THREE.ShaderMaterial({
      vertexShader: DUST_VERT,
      fragmentShader: DUST_FRAG,
      uniforms: {
        uTime: timeU,
        uIntro: introUniform,
        uScroll: scrollUniform,
        uPixelRatio: prU,
        uColor: colL,
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(duGeo, dustMat);
    dust.frustumCulled = false;
    dust.renderOrder = -5;
    scene.add(dust);

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
      body.geometry.dispose();
      bodyMat.dispose();
      dGeo.dispose();
      dotMat.dispose();
      atmInnerMat.dispose();
      atmOuterMat.dispose();
      arcGeo.dispose();
      arcMat.dispose();
      sGeo.dispose();
      starMat.dispose();
      duGeo.dispose();
      dustMat.dispose();
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
