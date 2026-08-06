import { useEffect, useMemo, useRef, useState } from "react";

/**
 * CinematicBackground — atmósfera "cinematic" del hero (SPEC 97).
 *
 * Interpretación de marca (morado) del look FXology: tres sub-capas sobre el
 * negro base que pone el consumidor.
 *
 *   1. GOD-RAYS  → conos de luz volumétrica que caen desde arriba (DOM/CSS).
 *                  Capa aislada y delimitada: puede subirse a un shader WebGL2
 *                  sin tocar el resto (ver bloque "GOD-RAYS LAYER").
 *   2. TOKENS    → tokens de conectividad (Gbps, 99.9%, ms…) derivando lento
 *                  con profundidad y parallax por puntero (DOM).
 *   3. DUST      → polvo de luz ambiental additive (canvas 2D).
 *
 * Autocontenido, sin dependencias (canvas 2D nativo). Respeta
 * prefers-reduced-motion (frame estático, sin barrido ni parallax) y pausa el
 * rAF fuera de viewport. Parallax por puntero solo en desktop (pointer: fine).
 *
 * Los parámetros del efecto viven en PARAMS (afinables sin tocar la lógica).
 */

const PARAMS = {
  dustCount: 90, // partículas de polvo (desktop)
  dustCountMobile: 40, // versión ligera mobile
  tokenCount: 16, // instancias de token (desktop)
  tokenCountMobile: 8, // versión ligera mobile
  dprCap: 2, // cap desktop; 1.5 en mobile
  color: [0x96, 0x23, 0x7a] as [number, number, number], // brand-purple #96237A
  colorLight: [0xd6, 0x4d, 0xb8] as [number, number, number], // acento claro
  rayCount: 3, // conos de luz volumétrica desde arriba
  parallaxStrength: 18, // px máx de desplazamiento por puntero (desktop)
  driftSpeed: 0.04, // velocidad de deriva autónoma de tokens/polvo
} as const;

// Default curado si el CMS no define tokens.
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
  /* Copy de los tokens flotantes (CMS). Si viene vacío se usa DEFAULT_TOKENS. */
  tokens?: string[];
  /* Dispara `fbx:hero-scene-loaded` en el primer frame (para el preloader). */
  signalReady?: boolean;
  /* Se llama si el contexto 2D no está disponible (el consumidor decide fallback). */
  onUnsupported?: () => void;
}

// Descriptor de un token flotante (posición base + profundidad, calculado 1 vez).
interface TokenSpec {
  text: string;
  xPct: number; // 0..100
  yPct: number; // 0..100
  depth: number; // 0 (lejos) .. 1 (cerca)
  phase: number;
  driftAmp: number; // px de deriva autónoma
  size: number; // px
  opacity: number;
  blur: number; // px
  parallax: number; // factor de parallax (mayor = más cerca)
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function CinematicBackground({
  className,
  tokens,
  signalReady,
  onUnsupported,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raysLayerRef = useRef<HTMLDivElement>(null);
  const tokensLayerRef = useRef<HTMLDivElement>(null);
  const tokenElsRef = useRef<HTMLSpanElement[]>([]);
  // Los tokens se posicionan con Math.random(): sólo se renderizan tras montar
  // en cliente para evitar mismatch de hidratación (SSR no los pinta).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Lista de tokens de contenido (CMS o default), estable por render.
  const tokenTexts = useMemo(() => {
    const t = (tokens || []).map((s) => (s || "").trim()).filter(Boolean);
    return t.length ? t : DEFAULT_TOKENS;
  }, [tokens]);

  // ── TOKENS: descriptores con profundidad (calculados 1 vez al montar). ──
  // Se biasan hacia los costados (como el ref) para no chocar con el texto.
  const isMobileGuess =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(max-width: 1023px)").matches ?? false);
  const tokenSpecs = useMemo<TokenSpec[]>(() => {
    const n = isMobileGuess ? PARAMS.tokenCountMobile : PARAMS.tokenCount;
    const specs: TokenSpec[] = [];
    for (let i = 0; i < n; i++) {
      const depth = Math.random(); // 0 lejos, 1 cerca
      // 70% a los costados, 30% libre — evita el centro donde va el titular.
      let xPct: number;
      if (Math.random() < 0.7) {
        xPct = Math.random() < 0.5 ? rand(3, 26) : rand(74, 97);
      } else {
        xPct = rand(6, 94);
      }
      specs.push({
        text: tokenTexts[i % tokenTexts.length],
        xPct,
        yPct: rand(8, 90),
        depth,
        phase: rand(0, Math.PI * 2),
        driftAmp: lerp(6, 20, depth),
        size: lerp(11, 30, depth),
        opacity: lerp(0.1, 0.34, depth),
        blur: lerp(2.4, 0, depth),
        parallax: lerp(0.35, 1.2, depth),
      });
    }
    return specs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenTexts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      onUnsupported?.();
      return;
    }

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const finePointer =
      window.matchMedia?.("(pointer: fine)").matches ?? false;
    const mobile =
      window.matchMedia?.("(max-width: 1023px)").matches ?? false;
    const dprCap = mobile ? 1.5 : PARAMS.dprCap;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);

    // ── DUST: sprite pre-renderizado (radial) para dibujar barato cada frame. ──
    const [clr, clg, clb] = PARAMS.colorLight;
    const sprite = document.createElement("canvas");
    sprite.width = 32;
    sprite.height = 32;
    const sctx = sprite.getContext("2d")!;
    const grad = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, `rgba(${clr},${clg},${clb},1)`);
    grad.addColorStop(0.4, `rgba(${clr},${clg},${clb},0.5)`);
    grad.addColorStop(1, `rgba(${clr},${clg},${clb},0)`);
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 32, 32);

    interface Dust {
      x: number;
      y: number;
      vx: number;
      vy: number;
      z: number; // profundidad 0..1
      r: number; // radio px
      phase: number;
      tw: number; // velocidad de parpadeo
    }

    let cw = 0;
    let ch = 0;
    let dust: Dust[] = [];

    function seed() {
      const n = mobile ? PARAMS.dustCountMobile : PARAMS.dustCount;
      dust = new Array(n);
      for (let i = 0; i < n; i++) {
        const z = Math.random();
        const ang = rand(0, Math.PI * 2);
        const spd = PARAMS.driftSpeed * lerp(0.4, 1.6, z) * 12;
        dust[i] = {
          x: rand(0, cw),
          y: rand(0, ch),
          vx: Math.cos(ang) * spd * 0.02,
          vy: Math.sin(ang) * spd * 0.02 - 0.02, // leve deriva hacia arriba
          z,
          r: lerp(0.6, 2.2, z),
          phase: rand(0, Math.PI * 2),
          tw: rand(0.6, 1.8),
        };
      }
    }

    function resize() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      cw = w;
      ch = h;
      const pw = Math.max(1, Math.floor(w * dpr));
      const ph = Math.max(1, Math.floor(h * dpr));
      if (canvas!.width !== pw || canvas!.height !== ph) {
        canvas!.width = pw;
        canvas!.height = ph;
      }
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }
    resize();
    window.addEventListener("resize", resize);

    // ── Parallax por puntero (solo desktop, no reduce). ──
    // target/current en [-1, 1]; se lerpea suave en el loop.
    const pointer = { tx: 0, ty: 0, cx: 0, cy: 0 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = root!.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / Math.max(1, rect.width);
      const ny = (e.clientY - rect.top) / Math.max(1, rect.height);
      pointer.tx = (nx - 0.5) * 2;
      pointer.ty = (ny - 0.5) * 2;
    };
    const parallaxOn = finePointer && !reduce;
    if (parallaxOn) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    function drawDust(time: number, px: number, py: number) {
      ctx!.clearRect(0, 0, cw, ch);
      ctx!.globalCompositeOperation = "lighter";
      for (let i = 0; i < dust.length; i++) {
        const p = dust[i];
        // Parpadeo suave.
        const tw = 0.55 + 0.45 * Math.sin(time * 0.001 * p.tw + p.phase);
        const alpha = tw * lerp(0.12, 0.5, p.z);
        // Parallax por profundidad.
        const ox = px * (0.3 + p.z) * PARAMS.parallaxStrength;
        const oy = py * (0.3 + p.z) * PARAMS.parallaxStrength;
        const s = p.r * 2.6;
        ctx!.globalAlpha = alpha;
        ctx!.drawImage(sprite, p.x + ox - s / 2, p.y + oy - s / 2, s, s);
      }
      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = "source-over";
    }

    function stepDust() {
      for (let i = 0; i < dust.length; i++) {
        const p = dust[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -4) p.x += cw + 8;
        else if (p.x > cw + 4) p.x -= cw + 8;
        if (p.y < -4) p.y += ch + 8;
        else if (p.y > ch + 4) p.y -= ch + 8;
      }
    }

    function applyTokens(time: number, px: number, py: number) {
      const els = tokenElsRef.current;
      for (let i = 0; i < tokenSpecs.length; i++) {
        const el = els[i];
        if (!el) continue;
        const s = tokenSpecs[i];
        const dx =
          Math.sin(time * 0.001 * PARAMS.driftSpeed * 6 + s.phase) * s.driftAmp;
        const dy =
          Math.cos(time * 0.001 * PARAMS.driftSpeed * 5 + s.phase * 1.3) *
          s.driftAmp *
          0.7;
        const ox = px * s.parallax * PARAMS.parallaxStrength;
        const oy = py * s.parallax * PARAMS.parallaxStrength;
        el.style.transform = `translate3d(${dx + ox}px, ${dy + oy}px, 0)`;
      }
    }

    function applyRays(px: number, py: number) {
      const layer = raysLayerRef.current;
      if (layer)
        layer.style.transform = `translate3d(${px * 10}px, ${py * 6}px, 0)`;
    }

    let raf = 0;
    let visible = true;
    let signaled = false;

    function signalOnce() {
      if (signalReady && !signaled) {
        signaled = true;
        window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
      }
    }

    function frame(time: number) {
      // Lerp del parallax hacia el target.
      pointer.cx += (pointer.tx - pointer.cx) * 0.06;
      pointer.cy += (pointer.ty - pointer.cy) * 0.06;
      stepDust();
      drawDust(time, pointer.cx, pointer.cy);
      applyTokens(time, pointer.cx, pointer.cy);
      applyRays(pointer.cx, pointer.cy);
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
      // Frame estático: polvo + tokens quietos, sin parallax ni barrido.
      drawDust(0, 0, 0);
      applyTokens(0, 0, 0);
      signalOnce();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalReady, tokenSpecs]);

  const [r, g, b] = PARAMS.color;
  const [lr, lg, lb] = PARAMS.colorLight;

  return (
    <div
      ref={rootRef}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {/* ══════════ GOD-RAYS LAYER — swappable a WebGL2 ══════════ */}
      {/* Conos de luz volumétrica que caen desde arriba. Toda esta capa está
          aislada: si el QA pide más profundidad, se reemplaza por un shader
          WebGL2 sin tocar tokens/polvo/parallax. */}
      <div
        ref={raysLayerRef}
        aria-hidden="true"
        className="cine-rays"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <span className="cine-ray cine-ray--a" />
        <span className="cine-ray cine-ray--b" />
        <span className="cine-ray cine-ray--c" />
        {/* Halo superior — glow difuso desde el borde de arriba. */}
        <span className="cine-glow-top" />
      </div>

      {/* ══════════ TOKENS LAYER — conectividad flotante ══════════ */}
      <div
        ref={tokensLayerRef}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {mounted &&
          tokenSpecs.map((s, i) => (
          <span
            key={i}
            ref={(el) => {
              if (el) tokenElsRef.current[i] = el;
            }}
            style={{
              position: "absolute",
              left: `${s.xPct}%`,
              top: `${s.yPct}%`,
              fontFamily: "'Space Mono', monospace",
              fontSize: `${s.size}px`,
              lineHeight: 1,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              color: `rgba(${lerp(r, lr, s.depth) | 0}, ${
                lerp(g, lg, s.depth) | 0
              }, ${lerp(b, lb, s.depth) | 0}, ${s.opacity})`,
              filter: s.blur ? `blur(${s.blur}px)` : undefined,
              textShadow: `0 0 ${8 + s.depth * 16}px rgba(${lr},${lg},${lb},${
                s.opacity * 0.9
              })`,
              willChange: "transform",
              userSelect: "none",
            }}
          >
            {s.text}
          </span>
        ))}
      </div>

      {/* ══════════ DUST LAYER — polvo de luz (canvas 2D) ══════════ */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          display: "block",
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />

      <style>{`
        .cine-ray {
          position: absolute;
          top: -20%;
          transform-origin: top center;
          mix-blend-mode: screen;
          filter: blur(38px);
          pointer-events: none;
          will-change: transform, opacity;
        }
        .cine-ray--a {
          left: 8%;
          width: 34vw; max-width: 520px; height: 130%;
          background: linear-gradient(180deg, rgba(${lr},${lg},${lb},0.28) 0%, rgba(${r},${g},${b},0.12) 42%, transparent 78%);
          clip-path: polygon(38% 0, 62% 0, 100% 100%, 0 100%);
          transform: rotate(-8deg);
          animation: cine-ray-a 13s ease-in-out infinite;
        }
        .cine-ray--b {
          left: 38%;
          width: 30vw; max-width: 460px; height: 128%;
          background: linear-gradient(180deg, rgba(${lr},${lg},${lb},0.34) 0%, rgba(${r},${g},${b},0.14) 40%, transparent 76%);
          clip-path: polygon(40% 0, 60% 0, 100% 100%, 0 100%);
          transform: rotate(3deg);
          animation: cine-ray-b 17s ease-in-out infinite;
        }
        .cine-ray--c {
          right: 6%;
          width: 32vw; max-width: 500px; height: 132%;
          background: linear-gradient(180deg, rgba(${lr},${lg},${lb},0.24) 0%, rgba(${r},${g},${b},0.1) 44%, transparent 80%);
          clip-path: polygon(36% 0, 64% 0, 100% 100%, 0 100%);
          transform: rotate(9deg);
          animation: cine-ray-c 15s ease-in-out infinite;
        }
        .cine-glow-top {
          position: absolute;
          top: -40%; left: 50%;
          width: 90%; height: 70%;
          transform: translateX(-50%);
          background: radial-gradient(ellipse at 50% 0%, rgba(${lr},${lg},${lb},0.22) 0%, rgba(${r},${g},${b},0.08) 35%, transparent 68%);
          mix-blend-mode: screen;
          filter: blur(30px);
          pointer-events: none;
        }
        @keyframes cine-ray-a {
          0%,100% { opacity: 0.55; transform: rotate(-8deg) translateX(0); }
          50% { opacity: 0.9; transform: rotate(-6deg) translateX(2%); }
        }
        @keyframes cine-ray-b {
          0%,100% { opacity: 0.7; transform: rotate(3deg) translateX(0); }
          50% { opacity: 1; transform: rotate(4.5deg) translateX(-1.5%); }
        }
        @keyframes cine-ray-c {
          0%,100% { opacity: 0.5; transform: rotate(9deg) translateX(0); }
          50% { opacity: 0.85; transform: rotate(7deg) translateX(1.5%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cine-ray { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
