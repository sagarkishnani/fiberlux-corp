import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * ParticleNebula — nube esférica de partículas que se dispersa con el scroll
 * (SPEC 100). Fondo del hero del home en `heroBackground: "dotfield"`.
 *
 * Referencia de dirección: guardz.com. Tres capas:
 *   1. rejilla tenue de fondo (CSS) sobre un halo radial morado,
 *   2. nube ESFÉRICA de miles de partículas detrás del texto — la mayoría
 *      tenues, unas pocas encendidas — que respira y gira lento,
 *   3. dispersión ligada al scroll: al bajar, la esfera se expande y se
 *      adelgaza hasta quedar un campo disperso de puntos sueltos.
 *
 * Todo el trabajo por partícula vive en el shader (posición radial, centelleo,
 * tamaño por profundidad): en JS solo se actualizan un puñado de uniforms por
 * frame, así que el coste no crece con el número de partículas.
 *
 * Transparente: el consumidor pone la base oscura debajo. Respeta
 * prefers-reduced-motion (esfera quieta, sin dispersión) y pausa el rAF fuera
 * de viewport.
 */

export type NebulaIntensity = "sutil" | "medio" | "intenso";
/**
 * `hero` manda: nube compacta que se dispersa al bajar.
 * `section` es atmósfera: entra dispersa, se recompone al centrarse la sección
 * en el viewport y se vuelve a dispersar al salir.
 */
export type NebulaVariant = "hero" | "section";

const PARAMS = {
  count: 12000, // partículas (desktop)
  countMobile: 4500,
  dprCap: 2,
  dprCapMobile: 1.5,

  radius: 1.0, // radio base de la nube (unidades de mundo)
  shell: 0.26, // grosor de la corteza: 0 = cáscara fina, 1 = bola maciza
  cameraZ: 2.85,
  fov: 45,

  sizeMin: 2.0, // tamaño de punto en px (a la distancia de cámara base)
  sizeMax: 6.8, // las "brillantes" son más gordas y hacen el bokeh del ref
  brightRatio: 0.17, // proporción de partículas encendidas
  accentRatio: 0.03, // acento frío (chispa cian del ref); 0 = solo morados

  rotationSpeed: 0.045, // rad/s de giro autónomo
  breathAmp: 0.035, // amplitud del "respiro" de la nube
  breathSpeed: 0.35,
  twinkleSpeed: 1.4,

  // Pulsos: el "ripple" del HTML de referencia trasladado a la esfera. El
  // frente viaja del centro hacia fuera y, al cruzar cada capa, ENCIENDE sus
  // partículas. Ojo con `push`: en el ref los puntos no se desplazan, solo
  // crecen y brillan — subirlo convierte la onda en un estallido de la esfera
  // entera, que es justo lo que no queremos. El movimiento es un apoyo mínimo.
  pulse: {
    maxActive: 4, // pulsos simultáneos (tamaño del array de uniforms)
    band: 0.1, // grosor del frente: fino = anillo legible
    speed: 1.15, // radios por segundo
    maxRadius: 2.1, // dónde muere el pulso
    push: 0.05, // desplazamiento hacia fuera (casi nulo, como en el ref)
    clickStrength: 1.0, // click
    autoStrength: 0.3, // pulso automático: presencia, no protagonismo
  },
  autoPulseMs: [3200, 5400] as [number, number],

  spreadMax: 3.6, // cuánto se expande la nube al final del scroll
  spreadFadeAt: 0.78, // desde qué punto del scroll empieza a desvanecerse
  pointerTilt: 0.16, // rad de inclinación máx. por posición del puntero
  pointerEase: 0.05,

  // Paleta: base morada de marca, encendidas en magenta claro, y un acento
  // frío muy minoritario (el guiño cian del ref). Subir `accentRatio` a 0 lo
  // deja 100% en paleta Fiberlux.
  colorDim: [0x7a, 0x3f, 0x92] as [number, number, number],
  colorMid: [0xce, 0x66, 0xb8] as [number, number, number],
  colorHot: [0xff, 0xa8, 0xe8] as [number, number, number],
  colorAccent: [0x4b, 0xd6, 0xe2] as [number, number, number],

  haloStops: ["#3B0E30", "#1A0716", "#0A0A0A"] as const,
  gridSize: 88, // px entre líneas de la rejilla de fondo
  gridAlpha: 0.05,
};

/**
 * La variante `section` va a media densidad: detrás de los logos de partners
 * la nube tiene que ser atmósfera, no protagonista (los logos son blancos y
 * una bola densa les resta legibilidad).
 */
const SECTION_MOD = { countMul: 0.55, opacityMul: 0.5, sizeMul: 0.95 };

/** Presets de `hero.dotfield.intensity`. */
const INTENSITY: Record<
  NebulaIntensity,
  { countMul: number; opacity: number; sizeMul: number }
> = {
  sutil: { countMul: 0.6, opacity: 0.85, sizeMul: 0.9 },
  medio: { countMul: 1.0, opacity: 1.3, sizeMul: 1.0 },
  intenso: { countMul: 1.35, opacity: 1.7, sizeMul: 1.15 },
};

const VERT = `
attribute float aRadius;   // radio propio dentro de la corteza
attribute float aSpread;   // cuánto se aleja esta partícula al dispersarse
attribute float aSize;     // tamaño base en px
attribute float aPhase;    // desfase de centelleo
attribute vec3  aColor;

uniform float uTime;
uniform float uSpread;     // 0 = nube compacta, 1 = totalmente dispersa
uniform float uOpacity;
uniform float uPixelRatio;
uniform float uSizeScale;
uniform float uBreath;
uniform float uPulseBand;
// (radio del frente, fuerza) por pulso activo; fuerza 0 = ranura libre.
uniform vec2  uPulses[${PARAMS.pulse.maxActive}];

varying float vAlpha;
varying vec3  vColor;

void main() {
  // El atributo position llega normalizado (dirección sobre la esfera) y el
  // radio va aparte: así la nube se expande sin recalcular nada en JS.
  float r = aRadius * uBreath * (1.0 + uSpread * aSpread * ${PARAMS.spreadMax.toFixed(
    2
  )});

  // Pulsos: el frente viaja del centro hacia fuera y, al cruzar la capa donde
  // está esta partícula, la empuja y la enciende. Es el anillo del HTML de
  // referencia, pero en el radio de la esfera en vez de en el plano.
  float boost = 0.0;
  for (int i = 0; i < ${PARAMS.pulse.maxActive}; i++) {
    vec2 pulse = uPulses[i];
    if (pulse.y > 0.0) {
      float diff = abs(r - pulse.x);
      if (diff < uPulseBand) {
        boost += (1.0 - diff / uPulseBand) * pulse.y;
      }
    }
  }
  r += boost * ${PARAMS.pulse.push.toFixed(2)};

  // Turbulencia lenta: la nube nunca queda del todo quieta, y al dispersarse
  // los puntos derivan más (se siente material, no una escala uniforme).
  vec3 drift = vec3(
    sin(uTime * 0.31 + aPhase * 6.28),
    cos(uTime * 0.27 + aPhase * 4.71),
    sin(uTime * 0.23 + aPhase * 3.14)
  ) * 0.02 * (1.0 + uSpread * 3.0);

  vec4 mv = modelViewMatrix * vec4(position * r + drift, 1.0);
  gl_Position = projectionMatrix * mv;

  float twinkle = 0.55 + 0.45 * sin(uTime * ${PARAMS.twinkleSpeed.toFixed(
    2
  )} + aPhase * 6.28);

  // Al dispersarse la nube se apaga, pero no del todo: queda el campo suelto.
  float fade = 1.0 - smoothstep(${PARAMS.spreadFadeAt.toFixed(
    2
  )}, 1.0, uSpread) * 0.55;

  vAlpha = uOpacity * twinkle * fade * (1.0 + boost * 1.7);
  vColor = aColor;

  gl_PointSize = aSize * uSizeScale * uPixelRatio * (1.0 + boost * 0.75) * (2.6 / -mv.z);
}
`;

const FRAG = `
precision mediump float;

varying float vAlpha;
varying vec3  vColor;

void main() {
  // Núcleo nítido + halo suave: es lo que da el "bokeh" de las partículas
  // grandes del ref sin necesidad de textura.
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float core = smoothstep(1.0, 0.0, d);
  float glow = smoothstep(1.0, 0.35, d) * 0.55;
  float a = (core * core + glow) * vAlpha;
  if (a <= 0.002) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

interface Props {
  className?: string;
  variant?: NebulaVariant;
  intensity?: NebulaIntensity;
  /** Dispara `fbx:hero-scene-loaded` en el primer frame (para el preloader). */
  signalReady?: boolean;
  onUnsupported?: () => void;
}

export default function ParticleNebula({
  className,
  variant = "hero",
  intensity = "medio",
  signalReady,
  onUnsupported,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onUnsupportedRef = useRef(onUnsupported);
  onUnsupportedRef.current = onUnsupported;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const preset = INTENSITY[intensity] ?? INTENSITY.medio;
    const isSection = variant === "section";
    const isMobile =
      window.matchMedia?.("(max-width: 1023px)").matches ?? false;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const hoverCapable =
      window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      onUnsupportedRef.current?.();
      return;
    }

    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "display:block;width:100%;height:100%;pointer-events:none;";
    mount.appendChild(canvas);

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      isMobile ? PARAMS.dprCapMobile : PARAMS.dprCap
    );
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(PARAMS.fov, 1, 0.1, 100);
    camera.position.z = PARAMS.cameraZ;

    // ── Nube ─────────────────────────────────────────────────────────────
    const count = Math.round(
      (isMobile ? PARAMS.countMobile : PARAMS.count) *
        preset.countMul *
        (isSection ? SECTION_MOD.countMul : 1)
    );

    const dir = new Float32Array(count * 3);
    const radii = new Float32Array(count);
    const spreads = new Float32Array(count);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const dim = PARAMS.colorDim.map((c) => c / 255);
    const mid = PARAMS.colorMid.map((c) => c / 255);
    const hot = PARAMS.colorHot.map((c) => c / 255);
    const acc = PARAMS.colorAccent.map((c) => c / 255);

    for (let i = 0; i < count; i++) {
      // Dirección uniforme sobre la esfera (método de la coordenada z).
      const z = Math.random() * 2 - 1;
      const t = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - z * z);
      dir[i * 3] = s * Math.cos(t);
      dir[i * 3 + 1] = s * Math.sin(t);
      dir[i * 3 + 2] = z;

      // Corteza: la densidad sube hacia el borde (por eso se ve el contorno
      // de la esfera y no una bola sólida), con algo de espesor.
      const u = Math.random();
      radii[i] =
        PARAMS.radius * (1 - PARAMS.shell * Math.pow(u, 2.2)) *
        (0.94 + Math.random() * 0.12);

      // Cada partícula se dispersa a su ritmo: sin esto la nube se escala
      // como un bloque y parece un zoom, no una dispersión.
      spreads[i] = 0.45 + Math.random() * 1.1;
      phases[i] = Math.random();

      const roll = Math.random();
      const bright = roll < PARAMS.brightRatio;
      const accent = roll > 1 - PARAMS.accentRatio;
      const pick = accent ? acc : bright ? hot : Math.random() < 0.35 ? mid : dim;
      colors[i * 3] = pick[0];
      colors[i * 3 + 1] = pick[1];
      colors[i * 3 + 2] = pick[2];

      sizes[i] = bright || accent
        ? PARAMS.sizeMin + Math.random() * (PARAMS.sizeMax - PARAMS.sizeMin)
        : PARAMS.sizeMin * (0.55 + Math.random() * 0.6);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(dir, 3));
    geometry.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
    geometry.setAttribute("aSpread", new THREE.BufferAttribute(spreads, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

    const uniforms = {
      uTime: { value: 0 },
      uSpread: { value: 0 },
      uOpacity: {
        value: preset.opacity * (isSection ? SECTION_MOD.opacityMul : 1),
      },
      uPixelRatio: { value: dpr },
      uSizeScale: {
        value: preset.sizeMul * (isSection ? SECTION_MOD.sizeMul : 1),
      },
      uBreath: { value: 1 },
      uPulseBand: { value: PARAMS.pulse.band },
      uPulses: {
        value: Array.from(
          { length: PARAMS.pulse.maxActive },
          () => new THREE.Vector2()
        ),
      },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false; // al dispersarse se sale del bounding sphere
    scene.add(points);

    // ── Medidas ──────────────────────────────────────────────────────────
    let cw = 0;
    let ch = 0;

    function resize() {
      const w = Math.max(1, mount!.clientWidth);
      const h = Math.max(1, mount!.clientHeight);
      if (w === cw && h === ch) return false;
      cw = w;
      ch = h;
      renderer.setSize(cw, ch, false);
      camera.aspect = cw / ch;
      // En pantallas apaisadas la nube tiene que llenar el alto; en móvil
      // (retrato) se aleja para que quepa entera detrás del texto.
      camera.position.z = PARAMS.cameraZ * (cw / ch < 1 ? 1.35 : 1);
      camera.updateProjectionMatrix();
      return true;
    }
    resize();

    let resizeRaf = 0;
    const onResize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        if (resize() && reduce) renderer.render(scene, camera);
      });
    };
    window.addEventListener("resize", onResize, { passive: true });

    // ── Dispersión por scroll ────────────────────────────────────────────
    // El progreso se mide contra el alto del propio hero: al salir de él la
    // nube ya está totalmente dispersa.
    let spreadTarget = 0;

    const readScroll = () => {
      const rect = mount!.getBoundingClientRect();

      if (isSection) {
        // Distancia del centro de la sección al centro del viewport,
        // normalizada: 0 centrada (nube compuesta), 1 en los extremos
        // (dispersa). Da la curva pedida — entra suelta, se arma al pasar por
        // el medio y se vuelve a soltar al salir — sin depender de dónde esté
        // la sección en la página.
        const vh = window.innerHeight || 1;
        const offset = rect.top + rect.height / 2 - vh / 2;
        const range = vh / 2 + rect.height / 2;
        spreadTarget = Math.min(1, Math.abs(offset) / range);
        return;
      }

      const h = rect.height || window.innerHeight;
      spreadTarget = Math.min(1, Math.max(0, window.scrollY / (h * 1.15)));
    };
    readScroll();
    const onScroll = () => {
      if (!reduce) readScroll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── Pulsos ───────────────────────────────────────────────────────────
    const pulses: { radius: number; strength: number }[] = [];

    function addPulse(strength: number) {
      if (reduce) return;
      if (pulses.length >= PARAMS.pulse.maxActive) pulses.shift();
      pulses.push({ radius: 0, strength });
    }

    function stepPulses(dt: number) {
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].radius += PARAMS.pulse.speed * dt;
        if (pulses[i].radius >= PARAMS.pulse.maxRadius) pulses.splice(i, 1);
      }
      const slots = uniforms.uPulses.value;
      for (let i = 0; i < PARAMS.pulse.maxActive; i++) {
        const p = pulses[i];
        // El pulso se apaga conforme se aleja, para que no muera de golpe.
        if (p)
          slots[i].set(
            p.radius,
            p.strength * Math.max(0, 1 - p.radius / PARAMS.pulse.maxRadius)
          );
        else slots[i].set(0, 0);
      }
    }

    // Click en el hero = pulso fuerte. Se escucha en window y se filtra por
    // el rect del contenedor: el canvas no recibe eventos (pointer-events
    // none) y encima hay contenido. Se ignoran los clicks sobre elementos
    // interactivos para no competir con los botones del hero.
    const onClick = (e: MouseEvent) => {
      if (reduce || !visible) return;
      const el = e.target as Element | null;
      if (el?.closest?.("a, button, input, select, textarea, label")) return;
      const rect = mount!.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      )
        return;
      addPulse(PARAMS.pulse.clickStrength);
    };
    if (!isSection) window.addEventListener("click", onClick, { passive: true });

    // Pulsos automáticos: la nube late sola aunque nadie toque nada.
    const [autoMin, autoMax] = PARAMS.autoPulseMs;
    let autoTimer = autoMin + Math.random() * (autoMax - autoMin);

    function stepAutoPulse(dtMs: number) {
      autoTimer -= dtMs;
      if (autoTimer > 0) return;
      autoTimer = autoMin + Math.random() * (autoMax - autoMin);
      addPulse(PARAMS.pulse.autoStrength);
    }

    // ── Puntero: la nube se inclina hacia el cursor ──────────────────────
    const tilt = { x: 0, y: 0 };
    const tiltTarget = { x: 0, y: 0 };
    const pointerEnabled = hoverCapable && !reduce;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const rect = mount!.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      tiltTarget.y = nx * 2 * PARAMS.pointerTilt;
      tiltTarget.x = ny * 2 * PARAMS.pointerTilt;
    };
    if (pointerEnabled) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    // ── Loop ─────────────────────────────────────────────────────────────
    let raf = 0;
    let visible = true;
    let signaled = false;
    let lastMs = 0;
    let spin = 0;

    function signalOnce() {
      if (signalReady && !signaled) {
        signaled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
    }

    const minFrameMs = hoverCapable ? 0 : 1000 / 30;
    let lastDrawMs = -Infinity;

    function frame(ms: number) {
      if (ms - lastDrawMs < minFrameMs) {
        raf = visible ? requestAnimationFrame(frame) : 0;
        return;
      }
      lastDrawMs = ms;
      const dt = lastMs ? Math.min((ms - lastMs) / 1000, 0.05) : 0.016;
      lastMs = ms;

      uniforms.uTime.value += dt;
      uniforms.uBreath.value =
        1 +
        Math.sin(uniforms.uTime.value * PARAMS.breathSpeed) * PARAMS.breathAmp;

      // Suavizado: el scroll llega a saltos y la nube no debe dar tirones.
      if (isSection) readScroll();
      stepAutoPulse(dt * 1000);
      stepPulses(dt);

      uniforms.uSpread.value +=
        (spreadTarget - uniforms.uSpread.value) * Math.min(1, dt * 6);

      spin += dt * PARAMS.rotationSpeed;
      tilt.x += (tiltTarget.x - tilt.x) * PARAMS.pointerEase;
      tilt.y += (tiltTarget.y - tilt.y) * PARAMS.pointerEase;
      points.rotation.set(tilt.x, spin + tilt.y, 0);

      renderer.render(scene, camera);
      signalOnce();
      if (!reduce && visible) raf = requestAnimationFrame(frame);
      else raf = 0;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduce && !raf) {
          lastMs = 0;
          raf = requestAnimationFrame(frame);
        }
      },
      { threshold: 0 }
    );
    io.observe(mount);

    if (reduce) {
      renderer.render(scene, camera);
      signalOnce();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("click", onClick);
      io.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    };
  }, [intensity, signalReady]);

  // Fondo: halo radial morado + rejilla tenue (la del ref). Van en CSS porque
  // son estáticos — meterlos en el shader solo añadiría píxeles que pintar.
  //
  // Solo en el hero: como telón de fondo de una sección, el halo pinta un
  // bloque morado con el borde recortado allí donde termina la sección. Ahí la
  // nube va sola sobre el negro de la página.
  const isSectionVariant = variant === "section";
  const halo = isSectionVariant
    ? undefined
    : `radial-gradient(120% 90% at 50% 35%, ${PARAMS.haloStops[0]} 0%, ${PARAMS.haloStops[1]} 45%, ${PARAMS.haloStops[2]} 100%)`;
  const grid =
    `repeating-linear-gradient(90deg, rgba(206,102,184,${PARAMS.gridAlpha}) 0 1px, transparent 1px ${PARAMS.gridSize}px), ` +
    `repeating-linear-gradient(0deg, rgba(206,102,184,${PARAMS.gridAlpha}) 0 1px, transparent 1px ${PARAMS.gridSize}px)`;

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ position: "relative", overflow: "hidden", background: halo }}
    >
      {/* Rejilla, atenuada hacia los bordes para que no se vea el corte. */}
      {!isSectionVariant && (
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: grid,
          maskImage:
            "radial-gradient(100% 80% at 50% 45%, #000 20%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(100% 80% at 50% 45%, #000 20%, transparent 85%)",
        }}
      />
      )}
      <div ref={mountRef} className="absolute inset-0" />
    </div>
  );
}
