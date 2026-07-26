/**
 * Efectos de scroll (SPEC 71) — Motion.
 *
 *   <span data-count-up>+40</span>          ← cuenta 0 → 40 al entrar (mantiene "+")
 *   <div  data-parallax="0.15">…</div>       ← parallax vertical sutil ligado al scroll
 *
 * Respeta prefers-reduced-motion: no anima (las cifras quedan en su valor final del
 * HTML; el parallax no se aplica).
 */
import { animate, inView, scroll } from "motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ── Count-up ── */
function initCountUp() {
  document.querySelectorAll<HTMLElement>("[data-count-up]").forEach((el) => {
    const raw = (el.textContent || "").trim();
    // prefijo (no dígito) + número (dígitos . ,) + sufijo (resto)
    const m = raw.match(/^([^\d-]*)(-?[\d.,]+)(.*)$/s);
    if (!m) return; // sin número → se deja tal cual
    const prefix = m[1];
    const numStr = m[2];
    const suffix = m[3];
    const target = parseFloat(numStr.replace(/,/g, "")); // "," como miles
    if (!isFinite(target)) return;
    const dot = numStr.lastIndexOf(".");
    const decimals = dot >= 0 ? numStr.length - dot - 1 : 0;
    const dur = Number(el.dataset.countDuration || 1.6);

    const fmt = (v: number) =>
      prefix +
      v.toLocaleString("es-PE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) +
      suffix;

    let stop: (() => void) | undefined;
    stop = inView(
      el,
      () => {
        animate(0, target, {
          duration: dur,
          ease: EASE,
          onUpdate: (v) => {
            el.textContent = fmt(v);
          },
        });
        stop?.();
      },
      { amount: 0.4 }
    );
  });
}

/* ── Parallax ── */
function initParallax() {
  document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
    const factor = Number(el.dataset.parallax || 0.15);
    const r = factor * 100; // px de desplazamiento a cada lado
    scroll(
      animate(el, { y: [-r, r] } as any, { ease: "linear" }),
      { target: el, offset: ["start end", "end start"] }
    );
  });
}

function init() {
  if (typeof window === "undefined") return;
  // Con reduced-motion no se anima nada: las cifras quedan en su valor final
  // (el del HTML) y no hay parallax.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  initCountUp();
  initParallax();
}

if (document.readyState !== "loading") init();
else document.addEventListener("DOMContentLoaded", init);
