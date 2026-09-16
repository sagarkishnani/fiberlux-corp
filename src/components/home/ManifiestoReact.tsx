import { useLayoutEffect, useRef } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import {
  actAnimate,
  chapterLen,
  chaptersEnabled,
  slotWindow,
} from "../../scripts/chapters";

/**
 * Manifiesto — capítulo de frases del tramo narrativo (SPEC 113).
 *
 * Las frases se relevan de a una con el scroll, cada una revelada línea por
 * línea detrás de una máscara. El fondo es el mismo túnel de fibra del hero
 * (canvas `fixed`), que no se corta entre capítulos: eso es lo que hace que el
 * tramo se lea como una sola secuencia.
 *
 * El capítulo lo monta `Manifiesto.astro` con `len = items.length + 1`; la
 * pantalla de más es el traspaso (ver `src/scripts/chapters.ts`).
 *
 * Con `prefers-reduced-motion` no se registra ninguna animación: las frases se
 * renderizan visibles y apiladas, y el capítulo deja de ser alto.
 */

interface Props {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  locale?: Locale;
}

export default function ManifiestoReact({ query, variables, data, locale = "es" }: Props) {
  const { data: live } = useTina({ query, variables, data });
  const manifiesto = (live?.home as any)?.manifiesto;
  const items = (manifiesto?.items ?? []).filter(Boolean) as any[];
  const rootRef = useRef<HTMLDivElement>(null);

  /* El estado inicial (frases ocultas) NO se escribe aquí: lo pone el CSS
     gateado por `.reveal-js` que monta `Manifiesto.astro`, igual que el sistema
     de reveals del repo (SPEC 69). Así no hay un solo frame con las frases
     apiladas, y sin JS el texto se lee igual. */
  useLayoutEffect(() => {
    if (!items.length || !chaptersEnabled()) return;
    const root = rootRef.current;
    const chapter = root?.closest("[data-chapter]") as HTMLElement | null;
    if (!root || !chapter) return;

    const acts = Array.from(root.querySelectorAll<HTMLElement>("[data-act]"));
    if (!acts.length) return;
    const len = chapterLen(chapter);
    const stops: Array<() => void> = [];

    /* UNA sola animación por elemento y propiedad.
       Motion cancela la animación anterior cuando se lanza otra sobre la misma
       propiedad del mismo elemento: con un tween de entrada y otro de salida
       por separado, el de salida mataba al de entrada y las frases se quedaban
       en el primer fotograma del tween superviviente. Todo el ciclo de vida va
       en una sola llamada, con keyframes repartidos por igual a lo largo del
       turno de la frase: entra · aguanta · se va. */
    acts.forEach((actEl, i) => {
      const lines = Array.from(actEl.querySelectorAll<HTMLElement>("[data-line]"));
      // El reparto del capítulo entre frases vive en `chapters.ts`: lo comparte
      // con los elementos que se encienden con cada frase (SPEC 116).
      const [from, to] = slotWindow(i, acts.length);
      const last = i === acts.length - 1;

      stops.push(
        actAnimate(chapter, len, from, to, actEl, {
          opacity: last ? [0, 1, 1, 1] : [0, 1, 1, 0],
        })
      );

      lines.forEach((line) => {
        stops.push(
          actAnimate(chapter, len, from, to, line, {
            transform: last
              ? ["translateY(110%)", "translateY(0%)", "translateY(0%)", "translateY(0%)"]
              : [
                  "translateY(110%)",
                  "translateY(0%)",
                  "translateY(0%)",
                  "translateY(-110%)",
                ],
          })
        );
      });
    });

    /* `scroll()` deja un listener global vivo: hay que pararlo o sobrevive al
       swap de View Transitions apuntando a nodos que ya no existen (SPEC 110). */
    return () => stops.forEach((stop) => stop());
  }, [items.length]);

  if (!items.length) return null;

  const total = String(items.length).padStart(2, "0");

  return (
    <div ref={rootRef} className="site-container relative z-10 w-full">
      {/* Velo: el núcleo del túnel cae justo donde va el texto. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 35% 50%, rgba(7,6,10,0.82) 0%, rgba(7,6,10,0.55) 45%, rgba(7,6,10,0) 78%)",
        }}
      />

      <div className="grid min-h-[44svh] content-center motion-reduce:gap-14">
        {items.map((item, i) => (
          <div
            key={i}
            data-act={i}
            className="[grid-area:1/1] motion-reduce:[grid-area:auto]"
          >
            <span className="mb-4 block font-mono text-[11px] uppercase tracking-[0.2em] text-[#E356BE]">
              {String(i + 1).padStart(2, "0")} / {total}
            </span>
            <h2 className="max-w-[18ch] text-[clamp(1.9rem,5.4vw,4.4rem)] font-medium leading-[1.05] tracking-[-0.03em] text-white">
              {(["line1", "line2"] as const).map((key) => {
                const text = tField(item, key, locale) as string;
                if (!text) return null;
                return (
                  <span key={key} className="block overflow-hidden">
                    <span
                      data-line=""
                      className="block will-change-transform"
                      data-tina-field={tinaField(item, key)}
                    >
                      {text}
                    </span>
                  </span>
                );
              })}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}
