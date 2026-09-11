import { useLayoutEffect, useRef } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import { actAnimate, chapterLen, chaptersEnabled } from "../../scripts/chapters";

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

  /* `useLayoutEffect` y no `useEffect`: el estado inicial (frases ocultas) se
     escribe antes del primer pintado. Si se escribiera después, la primera
     frase asomaría un frame ya montada. */
  useLayoutEffect(() => {
    if (!items.length || !chaptersEnabled()) return;
    const root = rootRef.current;
    const chapter = root?.closest("[data-chapter]") as HTMLElement | null;
    if (!root || !chapter) return;

    const acts = Array.from(root.querySelectorAll<HTMLElement>("[data-act]"));
    if (!acts.length) return;
    const len = chapterLen(chapter);
    const slot = 1 / acts.length;
    const stops: Array<() => void> = [];

    // Estado inicial: todo oculto salvo lo que el scroll vaya revelando.
    acts.forEach((a) => {
      a.style.opacity = "0";
      a.querySelectorAll<HTMLElement>("[data-line]").forEach((l) => {
        l.style.transform = "translateY(110%)";
      });
    });

    acts.forEach((actEl, i) => {
      const lines = Array.from(actEl.querySelectorAll<HTMLElement>("[data-line]"));
      const from = i * slot;

      // Entrada: la frase aparece y sus líneas suben desde detrás de la máscara.
      stops.push(actAnimate(chapter, len, from, from + slot * 0.2, actEl, { opacity: [0, 1] }));
      lines.forEach((line, k) => {
        const lead = k * slot * 0.06; // la segunda línea entra un pelo después
        stops.push(
          actAnimate(chapter, len, from + lead, from + lead + slot * 0.34, line, {
            transform: ["translateY(110%)", "translateY(0%)"],
          })
        );
      });

      // Relevo: todas menos la última se van hacia arriba para dejar sitio.
      if (i < acts.length - 1) {
        lines.forEach((line, k) => {
          const lead = k * slot * 0.04;
          stops.push(
            actAnimate(chapter, len, from + slot * 0.66 + lead, from + slot * 0.94 + lead, line, {
              transform: ["translateY(0%)", "translateY(-110%)"],
            })
          );
        });
        stops.push(
          actAnimate(chapter, len, from + slot * 0.78, from + slot * 0.98, actEl, {
            opacity: [1, 0],
          })
        );
      }
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
