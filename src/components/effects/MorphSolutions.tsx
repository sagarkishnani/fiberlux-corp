import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import * as THREE from "three";
import type { IconType } from "react-icons";
// Íconos outline (Lucide), mismo lenguaje gráfico que el resto del sitio.
import { LuServer, LuNetwork, LuShieldCheck, LuActivity } from "react-icons/lu";

/**
 * MorphSolutions — globo de partículas de conectividad (Three.js) que, al
 * dispararse el trigger, morphea a 4 cúmulos-solución clicables y vuelve solo a
 * los ~6 s (SPEC 96).
 *
 * Autocontenido: renderiza el <canvas> WebGL (z-0, sin capturar el puntero) y un
 * overlay de 4 anclas HTML posicionadas sobre cada cúmulo. El consumidor pone el
 * negro base debajo, controla el trigger vía el ref (`trigger()`) y reacciona a
 * los cambios de fase con `onPhaseChange` (para desvanecer el texto del hero).
 *
 * Parámetros afinables en PARAMS. Respeta prefers-reduced-motion (frame estático
 * + links accesibles) y pausa el rAF fuera de viewport. Libera todos los recursos
 * de Three al desmontar.
 */

const PARAMS = {
  particleCount: 12000, // partículas base (desktop)
  particleCountMobile: 5000, // versión ligera mobile
  dprCap: 2, // cap desktop
  dprCapMobile: 1.5, // cap mobile
  globeRadius: 0.96, // radio de la esfera en reposo
  clusterRadius: 0.22, // dispersión gaussiana de cada cúmulo (cúmulos nítidos)
  color: 0x96237a, // brand-purple #96237A
  colorBright: 0xce66b8, // magenta claro para el brillo del punto
  morphDuration: 1.2, // s de interpolación globo→nodos (ida)
  morphInDuration: 0.7, // s de interpolación nodos→globo (regreso, más ágil)
  autoRevertMs: 3000, // s en estado morph antes de volver al globo
  idleRotationSpeed: 0.06, // rad/s de giro del globo en reposo
  idleShiftX: 1.15, // desktop: globo desplazado a la derecha en reposo (texto va a la izquierda)
  swirlAmp: 0.12, // amplitud del orbitado de cada partícula en estado soluciones
  swirlSpeedMin: 0.6, // rad/s mín. del orbitado por partícula
  swirlSpeedMax: 1.6, // rad/s máx.
  cameraZ: 3.4,
  fov: 45,
  // Centros de los 4 cúmulos en coords de mundo (grid 2×2), z levemente frontal.
  clusters: [
    [-1.15, 0.6, 0.1],
    [1.15, 0.6, 0.1],
    [-1.15, -0.6, 0.1],
    [1.15, -0.6, 0.1],
  ] as [number, number, number][],
} as const;

export type Phase = "idle" | "morphing-out" | "solutions" | "morphing-in";

export interface MorphHandle {
  /** Dispara el morph globo → soluciones (o revierte un morphing-in en curso). */
  trigger: () => void;
}

export interface MorphNode {
  label: string;
  url: string;
  icon?: string | null;
}

interface Props {
  className?: string;
  /** Nodos-solución ya localizados (label + url resueltos por el consumidor). */
  nodes: MorphNode[];
  /** Ruta del logo FIBERLUX (BASE_URL-aware) que va dentro del chip central. */
  logoSrc?: string;
  /** Dispara `fbx:hero-scene-loaded` en el primer frame (para el preloader). */
  signalReady?: boolean;
  /** ms en estado soluciones antes de revertir al globo (default 6000). */
  autoRevertMs?: number;
  /** Notifica cambios de fase (el consumidor desvanece el texto del hero). */
  onPhaseChange?: (phase: Phase) => void;
  /** Se llama si WebGL no está disponible (el consumidor decide fallback). */
  onUnsupported?: () => void;
}

/* Íconos: clave del CMS → glifo Lucide (outline de marca). */
const ICONS: Record<string, IconType> = {
  datacenter: LuServer,
  conectividad: LuNetwork,
  ciberseguridad: LuShieldCheck,
  gestionados: LuActivity,
};

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Textura de punto suave (glow radial) generada en canvas. */
function makeSprite(): THREE.Texture {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.65)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/** Muestra un punto uniforme sobre la esfera (espiral de Fibonacci). */
function fibonacciSphere(i: number, n: number, r: number): [number, number, number] {
  const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  ];
}

/** Gaussiana estándar (Box–Muller). */
function gaussian(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const MorphSolutions = forwardRef<MorphHandle, Props>(function MorphSolutions(
  {
    className,
    nodes,
    logoSrc,
    signalReady,
    autoRevertMs,
    onPhaseChange,
    onUnsupported,
  },
  ref
) {
  // Contenedor donde Three monta su propio canvas (patrón robusto ante el
  // doble-montaje de React en dev: cada montaje crea un canvas/contexto nuevo).
  const mountRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const anchorRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  // Chip central + trazos que conectan el chip con cada nodo-solución.
  const chipRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<SVGLineElement | null>>([]);
  // Nº de anclas con hover/focus (pausa el auto-revert); leído por el loop.
  const hoverCountRef = useRef(0);
  // Puente imperativo hacia el loop (definido en el efecto de montaje).
  const triggerRef = useRef<() => void>(() => {});

  useImperativeHandle(ref, () => ({ trigger: () => triggerRef.current() }), []);

  // Efecto de montaje: crea la escena una sola vez.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const isMobile = window.matchMedia?.("(max-width: 767px)").matches ?? false;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const revertMs = autoRevertMs ?? PARAMS.autoRevertMs;

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

    const dprCap = isMobile ? PARAMS.dprCapMobile : PARAMS.dprCap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setClearColor(0x000000, 0); // transparente

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(PARAMS.fov, 1, 0.1, 100);
    camera.position.z = PARAMS.cameraZ;

    const count = isMobile ? PARAMS.particleCountMobile : PARAMS.particleCount;

    // Posiciones objetivo: home (esfera) fija, y node (cúmulos) = centro del
    // cúmulo (responsivo al viewport) + offset gaussiano fijo por partícula.
    // Guardamos el offset e índice de cúmulo para recomputar los cúmulos al
    // redimensionar sin re-randomizar (evita saltos).
    const homePos = new Float32Array(count * 3);
    const nodePos = new Float32Array(count * 3);
    const nodeOff = new Float32Array(count * 3);
    const clusterIdx = new Uint8Array(count);
    const swirlPhase = new Float32Array(count);
    const swirlSpeed = new Float32Array(count);
    const swirlAmp = new Float32Array(count);
    const nodeCount = Math.min(4, Math.max(1, nodes.length || 4));
    for (let i = 0; i < count; i++) {
      const [hx, hy, hz] = fibonacciSphere(i, count, PARAMS.globeRadius);
      homePos[i * 3] = hx;
      homePos[i * 3 + 1] = hy;
      homePos[i * 3 + 2] = hz;
      // Reparto fijo por índice (~25% a cada cúmulo → densidad pareja).
      clusterIdx[i] = Math.floor((i / count) * nodeCount) % nodeCount;
      nodeOff[i * 3] = gaussian() * PARAMS.clusterRadius;
      nodeOff[i * 3 + 1] = gaussian() * PARAMS.clusterRadius;
      nodeOff[i * 3 + 2] = gaussian() * PARAMS.clusterRadius * 0.5;
      swirlPhase[i] = Math.random() * Math.PI * 2;
      swirlSpeed[i] =
        PARAMS.swirlSpeedMin +
        Math.random() * (PARAMS.swirlSpeedMax - PARAMS.swirlSpeedMin);
      swirlAmp[i] = (0.35 + Math.random() * 0.65) * PARAMS.swirlAmp;
    }

    // Centros de los 4 cúmulos (grid 2×2). Se calculan según el frustum visible
    // a z=0 para que, en pantallas angostas, no se salgan de cuadro ni corten
    // las etiquetas. Se recomputan en cada resize.
    const halfH =
      Math.tan(((PARAMS.fov * Math.PI) / 180) / 2) * PARAMS.cameraZ;
    const clusterCenters = [
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    ];
    const computeClusters = () => {
      const halfW = halfH * camera.aspect;
      const sx = Math.min(1.3, 0.5 * halfW); // spread horizontal (con techo)
      const sy = 0.64 * halfH; // spread vertical
      const grid: [number, number][] = [
        [-sx, sy],
        [sx, sy],
        [-sx, -sy],
        [sx, -sy],
      ];
      for (let k = 0; k < 4; k++) clusterCenters[k].set(grid[k][0], grid[k][1], 0.1);
      for (let i = 0; i < count; i++) {
        const c = clusterCenters[clusterIdx[i]];
        nodePos[i * 3] = c.x + nodeOff[i * 3];
        nodePos[i * 3 + 1] = c.y + nodeOff[i * 3 + 1];
        nodePos[i * 3 + 2] = c.z + nodeOff[i * 3 + 2];
      }
    };

    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(new Float32Array(homePos), 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", posAttr);

    const sprite = makeSprite();
    const mat = new THREE.PointsMaterial({
      size: isMobile ? 0.035 : 0.028,
      map: sprite,
      color: PARAMS.colorBright,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // ── Estado del morph ──
    let phase: Phase = "idle";
    let progress = 0; // 0 = globo, 1 = soluciones
    let spin = 0; // ángulo acumulado del giro del globo
    let solElapsed = 0; // s acumulados en 'solutions' (para auto-revert)
    let bufferDirty = true; // fuerza un update del buffer al cambiar de fase

    const setPhase = (p: Phase) => {
      if (p === phase) return;
      phase = p;
      if (p === "solutions") solElapsed = 0;
      onPhaseChange?.(p);
    };

    triggerRef.current = () => {
      if (reduce) return;
      if (phase === "idle" || phase === "morphing-in") setPhase("morphing-out");
    };

    // ── Overlay: proyecta los centros de cúmulo (nodos) y el centro (chip) a
    //    % de pantalla; posiciona anclas, chip y trazos chip↔nodo. ──
    const centerVecs = clusterCenters; // se actualizan en computeClusters()
    const chipVec = new THREE.Vector3(0, 0, 0);
    const project = (v: THREE.Vector3) => {
      const p = v.clone().project(camera);
      return { x: (p.x * 0.5 + 0.5) * 100, y: (-p.y * 0.5 + 0.5) * 100 };
    };
    const updateAnchors = () => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      camera.updateMatrixWorld();
      // Si la proyección aún no es válida (cámara sin matriz en el primer frame),
      // no escribimos coordenadas NaN en el SVG.
      const test = project(chipVec);
      if (!Number.isFinite(test.x) || !Number.isFinite(test.y)) return;
      const eased = easeInOutCubic(progress);
      const op = reduce ? 1 : eased;
      const interactive = progress > 0.85 && phase !== "morphing-in";
      overlay.style.pointerEvents = interactive ? "auto" : "none";

      // Chip central (proyección del origen de mundo).
      const c = project(chipVec);
      const chip = chipRef.current;
      if (chip) {
        chip.style.left = `${c.x}%`;
        chip.style.top = `${c.y}%`;
        chip.style.opacity = `${op}`;
      }

      for (let k = 0; k < nodeCount; k++) {
        const n = project(centerVecs[k]);
        const a = anchorRefs.current[k];
        if (a) {
          a.style.left = `${n.x}%`;
          a.style.top = `${n.y}%`;
          a.style.opacity = `${op}`;
          a.style.pointerEvents = interactive || reduce ? "auto" : "none";
        }
        // Trazo chip → nodo (en % del overlay).
        const line = lineRefs.current[k];
        if (line) {
          line.setAttribute("x1", `${c.x}%`);
          line.setAttribute("y1", `${c.y}%`);
          line.setAttribute("x2", `${n.x}%`);
          line.setAttribute("y2", `${n.y}%`);
          line.style.opacity = `${op * 0.9}`;
        }
      }
    };

    // ── Resize ──
    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      computeClusters(); // spread de cúmulos responsivo al nuevo aspect
      updateAnchors();
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Buffer: interpola home↔node y, en soluciones, orbita cada partícula
    //    alrededor de su punto del cúmulo (con amplitud proporcional a `eased`,
    //    así el movimiento aparece al llegar a los nodos y no en el globo). ──
    const arr = posAttr.array as Float32Array;
    const idleShiftX = isMobile ? 0 : PARAMS.idleShiftX;
    const writeBuffer = (eased: number, time: number) => {
      const swirl = eased > 0.001;
      for (let i = 0; i < count; i++) {
        const k = i * 3;
        let tx = nodePos[k];
        let ty = nodePos[k + 1];
        let tz = nodePos[k + 2];
        if (swirl) {
          const ph = swirlPhase[i];
          const sp = swirlSpeed[i];
          const amp = swirlAmp[i] * eased;
          tx += Math.cos(time * sp + ph) * amp;
          ty += Math.sin(time * sp + ph * 1.3) * amp;
          tz += Math.sin(time * sp * 0.7 + ph) * amp * 0.5;
        }
        arr[k] = homePos[k] + (tx - homePos[k]) * eased;
        arr[k + 1] = homePos[k + 1] + (ty - homePos[k + 1]) * eased;
        arr[k + 2] = homePos[k + 2] + (tz - homePos[k + 2]) * eased;
      }
      posAttr.needsUpdate = true;
    };

    let raf = 0;
    let visible = true;
    let signaled = false;
    let last = 0;
    let elapsed = 0; // reloj para el orbitado de las partículas

    const signalOnce = () => {
      if (signalReady && !signaled) {
        signaled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
    };

    const step = (dt: number) => {
      if (phase === "morphing-out") {
        progress = Math.min(1, progress + dt / PARAMS.morphDuration);
        bufferDirty = true;
        if (progress >= 1) setPhase("solutions");
      } else if (phase === "morphing-in") {
        progress = Math.max(0, progress - dt / PARAMS.morphInDuration);
        bufferDirty = true;
        if (progress <= 0) setPhase("idle");
      } else if (phase === "solutions") {
        if (hoverCountRef.current === 0) {
          solElapsed += dt;
          if (solElapsed * 1000 >= revertMs) setPhase("morphing-in");
        } else {
          solElapsed = 0; // hover/focus reinicia la cuenta
        }
      }

      elapsed += dt;

      // El giro del globo se apaga a medida que se morphea (nodos quedan upright).
      spin += PARAMS.idleRotationSpeed * dt;
      const eased = easeInOutCubic(progress);
      points.rotation.y = spin * (1 - eased);
      // Reposo: globo desplazado a la derecha (el texto ocupa la izquierda);
      // al morphear vuelve al centro y se reparte en los 4 cúmulos.
      points.position.x = idleShiftX * (1 - eased);

      // Se reescribe el buffer siempre que no estemos totalmente en reposo: en
      // 'solutions' (eased≈1) esto mantiene el orbitado vivo de las partículas.
      if (bufferDirty || eased > 0.001) {
        writeBuffer(eased, elapsed);
        bufferDirty = false;
      }

      if (progress > 0) updateAnchors();
    };

    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      step(dt);
      renderer.render(scene, camera);
      signalOnce();
      if (visible) raf = requestAnimationFrame(frame);
      else raf = 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduce && !raf) {
          last = 0;
          raf = requestAnimationFrame(frame);
        }
      },
      { threshold: 0 }
    );
    io.observe(mount);

    if (reduce) {
      // Frame estático del globo; las anclas quedan visibles y accesibles.
      writeBuffer(0, 0);
      points.position.x = idleShiftX;
      renderer.render(scene, camera);
      updateAnchors();
      signalOnce();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      io.disconnect();
      triggerRef.current = () => {};
      geo.dispose();
      mat.dispose();
      sprite.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      canvas.remove();
    };
    // Montaje único: los datos de nodos se leen al montar. Cambios de contenido
    // (edición en Tina) remontan vía key en el consumidor si hiciera falta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = nodes.slice(0, 4);

  return (
    <div className={className} style={{ position: "absolute", inset: 0 }}>
      {/* Host del canvas WebGL (Three monta aquí su propio <canvas>).
          Es el disparador por click real sobre el gráfico (reemplaza al botón).
          No es focusable: la accesibilidad por teclado la da un botón sr-only en
          el consumidor (evita auto-foco/auto-activación al cargar). El guardado
          por `isTrusted` ignora clicks sintéticos. */}
      <div
        ref={mountRef}
        aria-hidden="true"
        onClick={(e) => {
          if (e.nativeEvent.isTrusted) triggerRef.current();
        }}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "auto",
          cursor: "pointer",
        }}
      />
      {/* Overlay de nodos-solución (anclas HTML posicionadas sobre cada cúmulo). */}
      <div
        ref={overlayRef}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {/* Trazos que conectan el chip central con cada nodo (conectividad). */}
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden="true"
        >
          {shown.map((_, k) => (
            <line
              key={k}
              ref={(el) => {
                lineRefs.current[k] = el;
              }}
              className="morph-link"
              style={{ opacity: 0 }}
            />
          ))}
        </svg>

        {/* Chip central con el logo de Fiberlux dentro. */}
        <div ref={chipRef} className="morph-chip" style={{ opacity: 0 }}>
          {/* Pulso "radar" que emana + anillo orbital rotando (le dan vida). */}
          <span className="morph-chip__pulse" aria-hidden="true" />
          <span className="morph-chip__pulse morph-chip__pulse--2" aria-hidden="true" />
          <span className="morph-chip__orbit" aria-hidden="true" />
          <svg viewBox="0 0 100 100" className="morph-chip__frame" aria-hidden="true">
            {/* Cuerpo del chip */}
            <rect
              x="24"
              y="24"
              width="52"
              height="52"
              rx="9"
              fill="rgba(150,35,122,0.16)"
              stroke="#ce66b8"
              strokeWidth="1.6"
            />
            {/* Pines (4 lados) */}
            {[34, 50, 66].map((p) => (
              <g key={p} stroke="#ce66b8" strokeWidth="1.6" strokeLinecap="round">
                <line x1={p} y1="16" x2={p} y2="24" />
                <line x1={p} y1="76" x2={p} y2="84" />
                <line x1="16" y1={p} x2="24" y2={p} />
                <line x1="76" y1={p} x2="84" y2={p} />
              </g>
            ))}
          </svg>
          {logoSrc && (
            <img
              src={logoSrc}
              alt="Fiberlux"
              draggable={false}
              className="morph-chip__logo"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          )}
        </div>

        {shown.map((n, k) => {
          const Icon = (n.icon && ICONS[n.icon]) || LuServer;
          return (
            <a
              key={k}
              ref={(el) => {
                anchorRefs.current[k] = el;
              }}
              href={n.url || "#"}
              onMouseEnter={() => {
                hoverCountRef.current++;
              }}
              onMouseLeave={() => {
                hoverCountRef.current = Math.max(0, hoverCountRef.current - 1);
              }}
              onFocus={() => {
                hoverCountRef.current++;
              }}
              onBlur={() => {
                hoverCountRef.current = Math.max(0, hoverCountRef.current - 1);
              }}
              className="morph-node"
              style={{
                position: "absolute",
                transform: "translate(-50%, -50%)",
                opacity: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.7rem",
                textDecoration: "none",
                color: "#fff",
                pointerEvents: "none",
                transition: "opacity 0.2s ease",
              }}
            >
              <span className="morph-node__ring">
                <Icon size={30} strokeWidth={1.6} />
              </span>
              <span className="morph-node__label">{n.label}</span>
            </a>
          );
        })}
      </div>

      {/* Estilos del nodo: anillo de señal de marca + hover. */}
      <style>{`
        .morph-node__ring {
          position: relative;
          display: grid;
          place-items: center;
          width: 4.25rem;
          height: 4.25rem;
          border-radius: 9999px;
          color: #fff;
          background:
            radial-gradient(circle at 50% 42%, rgba(214,77,184,0.28) 0%, rgba(150,35,122,0.10) 55%, transparent 72%);
          border: 1px solid rgba(206,102,184,0.55);
          box-shadow:
            0 0 26px rgba(150,35,122,0.5),
            inset 0 0 18px rgba(214,77,184,0.18);
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        /* Segundo anillo (halo de señal) */
        .morph-node__ring::after {
          content: "";
          position: absolute;
          width: 5.5rem;
          height: 5.5rem;
          border-radius: 9999px;
          border: 1px solid rgba(206,102,184,0.22);
        }
        .morph-node:hover .morph-node__ring,
        .morph-node:focus-visible .morph-node__ring {
          transform: scale(1.09);
          border-color: rgba(255,212,244,0.9);
          box-shadow:
            0 0 38px rgba(214,77,184,0.8),
            inset 0 0 22px rgba(214,77,184,0.3);
        }
        .morph-node:hover, .morph-node:focus-visible { color: #FFD4F4; outline: none; }
        .morph-node__label {
          font-family: 'Space Mono', monospace;
          font-size: 0.74rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-align: center;
          max-width: 10rem;
          line-height: 1.3;
          text-shadow: 0 2px 12px rgba(0,0,0,0.9);
        }
        /* En pantallas angostas: chip, anillos y etiquetas más chicos, para que
           el conjunto no se salga ni se encime. */
        @media (max-width: 900px) {
          .morph-chip { width: 118px; height: 118px; }
          .morph-chip__logo { width: 52px; }
          .morph-node__ring { width: 3rem; height: 3rem; }
          .morph-node__ring::after { width: 3.9rem; height: 3.9rem; }
          .morph-node__label { font-size: 0.6rem; max-width: 6.5rem; letter-spacing: 0.1em; }
        }

        /* Chip central + logo de Fiberlux dentro. */
        .morph-chip {
          position: absolute;
          transform: translate(-50%, -50%);
          width: 178px;
          height: 178px;
          pointer-events: none;
          animation: morph-chip-glow 2.6s ease-in-out infinite;
        }
        @keyframes morph-chip-glow {
          0%, 100% { filter: drop-shadow(0 0 16px rgba(150,35,122,0.45)); }
          50% { filter: drop-shadow(0 0 30px rgba(214,77,184,0.8)); }
        }
        .morph-chip__frame {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          animation: morph-chip-breathe 2.6s ease-in-out infinite;
        }
        @keyframes morph-chip-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        /* Anillo orbital girando alrededor del chip. */
        .morph-chip__orbit {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 132%;
          height: 132%;
          transform: translate(-50%, -50%);
          border-radius: 9999px;
          border: 1px dashed rgba(206,102,184,0.45);
          animation: morph-orbit 9s linear infinite;
        }
        @keyframes morph-orbit {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        /* Pulso "radar" que emana del chip. */
        .morph-chip__pulse {
          position: absolute;
          left: 50%;
          top: 50%;
          border-radius: 9999px;
          border: 1px solid rgba(214,77,184,0.55);
          transform: translate(-50%, -50%);
          animation: morph-radar 2.6s ease-out infinite;
        }
        .morph-chip__pulse--2 { animation-delay: 1.3s; }
        @keyframes morph-radar {
          0% { width: 46%; height: 46%; opacity: 0.7; }
          100% { width: 165%; height: 165%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .morph-chip, .morph-chip__frame, .morph-chip__orbit, .morph-chip__pulse {
            animation: none;
          }
        }
        .morph-chip__logo {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 78px;
          height: auto;
        }

        /* Trazos chip → nodo (señal que fluye). */
        .morph-link {
          stroke: #ce66b8;
          stroke-width: 1.4;
          stroke-dasharray: 5 9;
          animation: morph-flow 0.9s linear infinite;
          filter: drop-shadow(0 0 4px rgba(206,102,184,0.7));
        }
        @keyframes morph-flow { to { stroke-dashoffset: -14; } }
        @media (prefers-reduced-motion: reduce) {
          .morph-link { animation: none; }
        }
      `}</style>
    </div>
  );
});

export default MorphSolutions;
