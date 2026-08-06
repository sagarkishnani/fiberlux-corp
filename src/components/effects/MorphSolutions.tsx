import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import * as THREE from "three";
import type { IconType } from "react-icons";
import { FaServer, FaNetworkWired, FaShieldHalved, FaGears } from "react-icons/fa6";

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
  globeRadius: 1.15, // radio de la esfera en reposo
  clusterRadius: 0.34, // dispersión gaussiana de cada cúmulo
  color: 0x96237a, // brand-purple #96237A
  colorBright: 0xce66b8, // magenta claro para el brillo del punto
  morphDuration: 1.2, // s de interpolación globo↔nodos
  autoRevertMs: 6000, // ~6 s en estado morph → vuelve al globo
  idleRotationSpeed: 0.06, // rad/s de giro del globo en reposo
  cameraZ: 3.4,
  fov: 45,
  // Centros de los 4 cúmulos en coords de mundo (grid 2×2), z levemente frontal.
  clusters: [
    [-1.0, 0.62, 0.1],
    [1.0, 0.62, 0.1],
    [-1.0, -0.62, 0.1],
    [1.0, -0.62, 0.1],
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
  /** Dispara `fbx:hero-scene-loaded` en el primer frame (para el preloader). */
  signalReady?: boolean;
  /** ms en estado soluciones antes de revertir al globo (default 6000). */
  autoRevertMs?: number;
  /** Notifica cambios de fase (el consumidor desvanece el texto del hero). */
  onPhaseChange?: (phase: Phase) => void;
  /** Se llama si WebGL no está disponible (el consumidor decide fallback). */
  onUnsupported?: () => void;
}

/* Íconos: clave del CMS → glifo fa6. */
const ICONS: Record<string, IconType> = {
  datacenter: FaServer,
  conectividad: FaNetworkWired,
  ciberseguridad: FaShieldHalved,
  gestionados: FaGears,
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
  { className, nodes, signalReady, autoRevertMs, onPhaseChange, onUnsupported },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const anchorRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  // Nº de anclas con hover/focus (pausa el auto-revert); leído por el loop.
  const hoverCountRef = useRef(0);
  // Puente imperativo hacia el loop (definido en el efecto de montaje).
  const triggerRef = useRef<() => void>(() => {});

  useImperativeHandle(ref, () => ({ trigger: () => triggerRef.current() }), []);

  // Efecto de montaje: crea la escena una sola vez.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile = window.matchMedia?.("(max-width: 767px)").matches ?? false;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const revertMs = autoRevertMs ?? PARAMS.autoRevertMs;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      onUnsupported?.();
      return;
    }

    const dprCap = isMobile ? PARAMS.dprCapMobile : PARAMS.dprCap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setClearColor(0x000000, 0); // transparente

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(PARAMS.fov, 1, 0.1, 100);
    camera.position.z = PARAMS.cameraZ;

    const count = isMobile ? PARAMS.particleCountMobile : PARAMS.particleCount;

    // Posiciones objetivo precomputadas: home (esfera) y node (cúmulos).
    const homePos = new Float32Array(count * 3);
    const nodePos = new Float32Array(count * 3);
    const nodeCount = Math.min(4, Math.max(1, nodes.length || 4));
    for (let i = 0; i < count; i++) {
      const [hx, hy, hz] = fibonacciSphere(i, count, PARAMS.globeRadius);
      homePos[i * 3] = hx;
      homePos[i * 3 + 1] = hy;
      homePos[i * 3 + 2] = hz;
      // Reparto fijo por índice (~25% a cada cúmulo → densidad pareja).
      const cluster = Math.floor((i / count) * nodeCount) % nodeCount;
      const [cx, cy, cz] = PARAMS.clusters[cluster];
      nodePos[i * 3] = cx + gaussian() * PARAMS.clusterRadius;
      nodePos[i * 3 + 1] = cy + gaussian() * PARAMS.clusterRadius;
      nodePos[i * 3 + 2] = cz + gaussian() * PARAMS.clusterRadius * 0.5;
    }

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

    // ── Overlay: proyecta los centros de cúmulo a % de pantalla ──
    const centerVecs = PARAMS.clusters.map((c) => new THREE.Vector3(c[0], c[1], c[2]));
    const updateAnchors = () => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      const eased = easeInOutCubic(progress);
      const interactive = progress > 0.85 && phase !== "morphing-in";
      overlay.style.pointerEvents = interactive ? "auto" : "none";
      for (let k = 0; k < nodeCount; k++) {
        const a = anchorRefs.current[k];
        if (!a) continue;
        const v = centerVecs[k].clone().project(camera);
        const xPct = (v.x * 0.5 + 0.5) * 100;
        const yPct = (-v.y * 0.5 + 0.5) * 100;
        a.style.left = `${xPct}%`;
        a.style.top = `${yPct}%`;
        a.style.opacity = reduce ? "1" : `${eased}`;
        a.style.pointerEvents = interactive || reduce ? "auto" : "none";
      }
    };

    // ── Resize ──
    const resize = () => {
      const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
      const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      updateAnchors();
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Buffer: escribe la interpolación home↔node en el atributo de posición ──
    const arr = posAttr.array as Float32Array;
    const writeBuffer = (eased: number) => {
      for (let i = 0; i < count * 3; i++) {
        arr[i] = homePos[i] + (nodePos[i] - homePos[i]) * eased;
      }
      posAttr.needsUpdate = true;
    };

    let raf = 0;
    let visible = true;
    let signaled = false;
    let last = 0;

    const signalOnce = () => {
      if (signalReady && !signaled) {
        signaled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
    };

    const step = (dt: number) => {
      const dur = PARAMS.morphDuration;
      if (phase === "morphing-out") {
        progress = Math.min(1, progress + dt / dur);
        bufferDirty = true;
        if (progress >= 1) setPhase("solutions");
      } else if (phase === "morphing-in") {
        progress = Math.max(0, progress - dt / dur);
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

      // El giro del globo se apaga a medida que se morphea (nodos quedan upright).
      spin += PARAMS.idleRotationSpeed * dt;
      const eased = easeInOutCubic(progress);
      points.rotation.y = spin * (1 - eased);

      // El buffer solo se reescribe mientras hay transición (idle/solutions son estáticos).
      if (bufferDirty || phase === "morphing-out" || phase === "morphing-in") {
        writeBuffer(eased);
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
    io.observe(canvas);

    if (reduce) {
      // Frame estático del globo; las anclas quedan visibles y accesibles.
      writeBuffer(0);
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
    };
    // Montaje único: los datos de nodos se leen al montar. Cambios de contenido
    // (edición en Tina) remontan vía key en el consumidor si hiciera falta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = nodes.slice(0, 4);

  return (
    <div className={className} style={{ position: "absolute", inset: 0 }}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      {/* Overlay de nodos-solución (anclas HTML posicionadas sobre cada cúmulo). */}
      <div
        ref={overlayRef}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {shown.map((n, k) => {
          const Icon = (n.icon && ICONS[n.icon]) || FaServer;
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
                gap: "0.5rem",
                textDecoration: "none",
                color: "#fff",
                pointerEvents: "none",
                transition: "opacity 0.2s ease",
              }}
            >
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "9999px",
                  background: "rgba(150,35,122,0.18)",
                  border: "1px solid rgba(206,102,184,0.5)",
                  boxShadow: "0 0 24px rgba(150,35,122,0.55)",
                  color: "#fff",
                  fontSize: "1.25rem",
                }}
              >
                <Icon />
              </span>
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "0.72rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textAlign: "center",
                  maxWidth: "9rem",
                  lineHeight: 1.25,
                  textShadow: "0 2px 12px rgba(0,0,0,0.9)",
                }}
              >
                {n.label}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
});

export default MorphSolutions;
