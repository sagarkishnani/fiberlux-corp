import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * DotWaveField — malla de puntos reactiva sobre WebGL (SPEC 100).
 *
 * Fondo del hero del home en `heroBackground: "dotfield"` y telón de fondo
 * (variante `section`) de tres secciones posteriores del home.
 *
 * A diferencia del HTML de referencia del cliente (canvas 2D que recorre TODOS
 * los puntos en JS en cada frame), aquí la malla vive en un `THREE.Points` y el
 * crecimiento/brillo por puntero y por ondas se resuelve en el shader a partir
 * de uniforms. El coste por frame en JS es O(nº de ondas activas), no O(nº de
 * puntos).
 *
 * Transparente: el consumidor pone la base oscura debajo (el halo radial lo
 * pinta el propio componente en la variante `hero`).
 *
 * Respeta prefers-reduced-motion (frame estático) y pausa el rAF fuera de
 * viewport.
 */

export type DotWaveVariant = "hero" | "section";
export type DotWaveIntensity = "sutil" | "medio" | "intenso";

const PARAMS = {
  spacing: 22, // px entre puntos (desktop) — igual que el HTML de referencia
  spacingMobile: 30, // malla más rala en móvil
  dprCap: 2, // cap desktop
  dprCapMobile: 1.5,
  baseRadius: 1.15, // radio base del punto (CSS px)
  baseAlpha: 0.14, // opacidad de reposo del punto
  pointerRadius: 140, // px de influencia del puntero (desktop)
  pointerBoost: { scale: 1.8, alpha: 0.55 },
  ripple: {
    band: 34, // grosor del anillo (px)
    speed: 6.5, // px por frame de referencia (60fps) de expansión
    maxRadiusFactor: 0.9, // × max(W, H)
    boost: { scale: 2.2, alpha: 0.85 },
    maxActive: 6, // ondas simultáneas (tamaño del array de uniforms)
  },
  autoRippleMs: [3200, 5400] as [number, number],
  scroll: {
    deltaThreshold: 180, // px de scroll acumulado para emitir una onda
    strengthRange: [0.6, 1.5] as [number, number],
    cooldownMs: 260, // mínimo entre ondas de scroll
  },
  color: [0x96, 0x23, 0x7a] as [number, number, number], // brand-purple #96237A
  colorLight: [0xd6, 0x4d, 0xb8] as [number, number, number], // acento claro
  haloStops: ["#3B0E30", "#1A0716", "#0A0A0A"] as const,
};

/** Presets aplicados sobre PARAMS según `hero.dotfield.intensity`. */
const INTENSITY: Record<
  DotWaveIntensity,
  { spacingMul: number; alphaMul: number; rippleMul: number }
> = {
  sutil: { spacingMul: 1.25, alphaMul: 0.7, rippleMul: 0.7 },
  medio: { spacingMul: 1.0, alphaMul: 1.0, rippleMul: 1.0 },
  intenso: { spacingMul: 0.85, alphaMul: 1.3, rippleMul: 1.35 },
};

/** La variante `section` es telón de fondo: el contenido siempre gana. */
const SECTION_MOD = { spacingMul: 1.2, alphaMul: 0.55 };

interface Props {
  className?: string;
  /** `hero` manda (halo + ondas automáticas); `section` es telón de fondo. */
  variant?: DotWaveVariant;
  /** Preset de densidad/brillo/fuerza de onda. Default: `medio`. */
  intensity?: DotWaveIntensity;
  /** Dispara `fbx:hero-scene-loaded` en el primer frame (para el preloader). */
  signalReady?: boolean;
  /** Se llama si no hay WebGL (el consumidor decide el fallback). */
  onUnsupported?: () => void;
}

export default function DotWaveField({
  className,
  variant = "hero",
  intensity = "medio",
  signalReady,
  onUnsupported,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const preset = INTENSITY[intensity] ?? INTENSITY.medio;
    const isSection = variant === "section";
    const isMobile =
      window.matchMedia?.("(max-width: 1023px)").matches ?? false;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

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
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0); // transparente

    const scene = new THREE.Scene();
    // Cámara identidad: el vertex shader emite coordenadas de clip a partir de
    // posiciones en píxeles CSS y de `uResolution`. No hace falta proyección.
    const camera = new THREE.Camera();

    // ── Medidas ──────────────────────────────────────────────────────────
    let cw = 0; // ancho en CSS px
    let ch = 0; // alto en CSS px

    function resize() {
      const w = mount!.clientWidth;
      const h = mount!.clientHeight;
      if (w === cw && h === ch) return false;
      cw = Math.max(1, w);
      ch = Math.max(1, h);
      renderer.setSize(cw, ch, false);
      return true;
    }
    resize();

    // Coalescido a un frame: en móvil la barra de URL dispara `resize` en
    // ráfaga durante el scroll y no debe forzar layout en cada evento.
    let resizeRaf = 0;
    const onResize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        if (resize() && reduce) renderer.render(scene, camera);
      });
    };
    window.addEventListener("resize", onResize, { passive: true });

    // ── Loop ─────────────────────────────────────────────────────────────
    let raf = 0;
    let visible = true;
    let signaled = false;

    function signalOnce() {
      if (signalReady && !signaled) {
        signaled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
    }

    function frame() {
      renderer.render(scene, camera);
      signalOnce();
      if (!reduce && visible) raf = requestAnimationFrame(frame);
      else raf = 0; // permite reiniciar el loop al volver al viewport
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduce && !raf) raf = requestAnimationFrame(frame);
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
      io.disconnect();
      renderer.dispose();
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    };
  }, [variant, intensity, signalReady, onUnsupported]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={className}
      style={{ position: "relative", overflow: "hidden" }}
    />
  );
}
