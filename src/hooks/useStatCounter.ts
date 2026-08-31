import { useEffect, useRef } from "react";

/**
 * Motor compartido de las cifras animadas ("+5,500", "+17,000 km", "100%").
 *
 * Vivía dentro de `StatsReact`; se extrajo aquí porque el bloque unificado del
 * home (`EmpresasRedReact`) reusa las mismas cifras con otro tema visual.
 */

export interface ParsedStat {
  /** Signo inicial ("+" / "-") si lo hubiera. */
  prefix: string;
  value: number;
  /** Unidad final ("km", "%", "Gbps"…). */
  suffix: string;
  decimals: number;
  hasCommas: boolean;
}

export function parseStat(raw: string): ParsedStat {
  const trimmed = raw.trim();

  // Extract prefix (+ or - at start)
  let prefix = "";
  let rest = trimmed;
  if (rest.startsWith("+") || rest.startsWith("-")) {
    prefix = rest[0];
    rest = rest.slice(1).trim();
  }

  // Extract suffix (km, %, etc. at end)
  const suffixMatch = rest.match(/\s*(km|%|ms|Gbps|Mbps)$/i);
  let suffix = "";
  if (suffixMatch) {
    suffix = suffixMatch[0].trim();
    rest = rest.slice(0, -suffixMatch[0].length).trim();
  }

  // Parse numeric value (remove commas)
  const numericStr = rest.replace(/,/g, "");
  const value = parseFloat(numericStr) || 0;

  // Check decimals
  const decimalMatch = numericStr.match(/\.(\d+)/);
  const decimals = decimalMatch ? decimalMatch[1].length : 0;

  // Check if original had commas (for formatting)
  const hasCommas = rest.includes(",");

  return { prefix, value, suffix, decimals, hasCommas };
}

export function formatNumber(n: number, decimals: number, hasCommas: boolean): string {
  const fixed = n.toFixed(decimals);
  if (!hasCommas) return fixed;

  const [intPart, decPart] = fixed.split(".");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart ? `${formatted}.${decPart}` : formatted;
}

/**
 * Cuenta de 0 a `target` con ease-out quad cuando `shouldStart` pasa a true.
 *
 * Devuelve una **ref para el nodo del número**, no un valor de estado. La cifra
 * se escribe directamente en el DOM (`textContent`) desde el bucle de
 * animación: la versión anterior hacía `setState` en cada fotograma, o sea un
 * render de React por cifra y por frame —cuatro cifras a 60 fps son ~240
 * renders por segundo— justo mientras el dedo scrollea. En un teléfono eso se
 * siente. Escribir el texto no reconcilia nada y el resultado en pantalla es
 * idéntico.
 *
 * El nodo se pinta en el HTML con la CIFRA FINAL, no con 0. El sitio es
 * estático y las islas se renderizan en build, así que ese valor es el que
 * queda escrito: si el bundle no llega —sin JS, o con la conexión caída a media
 * carga, que es lo que reportó el cliente— las cifras se leen igual en vez de
 * quedarse en cero para siempre.
 *
 * `rebobinar` es lo que devuelve la cuenta a 0 para poder animarla. Lo decide
 * quien llama (ver `StatsReact`) y sólo lo activa si la cifra todavía no se
 * está leyendo: rebobinar algo que ya está en pantalla sería un parpadeo del
 * número final al cero.
 */
export function useCounter(
  target: number,
  duration: number,
  shouldStart: boolean,
  rebobinar = false,
  decimals = 0,
  hasCommas = false
) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (rebobinar && !shouldStart && ref.current) {
      ref.current.textContent = formatNumber(0, decimals, hasCommas);
    }
  }, [rebobinar, shouldStart, decimals, hasCommas]);

  useEffect(() => {
    if (!shouldStart || target === 0 || !rebobinar) return;

    let startTime: number | null = null;
    let rafId: number;

    const escribir = (v: number) => {
      const el = ref.current;
      if (el) el.textContent = formatNumber(v, decimals, hasCommas);
    };

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad (less front-loaded than cubic → numbers keep climbing longer)
      const eased = 1 - Math.pow(1 - progress, 2);
      escribir(eased * target);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        escribir(target);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, shouldStart, rebobinar, decimals, hasCommas]);

  return ref;
}
