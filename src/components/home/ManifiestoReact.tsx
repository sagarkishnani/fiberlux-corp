import { useLayoutEffect, useRef } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import {
  actAnimate,
  actProgress,
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

  /* Cifras que acompañan a cada frase (SPEC 116). Sólo en modo `planeta`: el
     grupo puede estar sembrado en el JSON y el modo `fiber` debe seguir viéndose
     exactamente como lo dejó la SPEC 113. `frase` es 1-based en el CMS. */
  const isPlaneta = (live?.home as any)?.hero?.heroBackground === "planeta";
  const cifrasPorFrase = (() => {
    const out: any[][] = items.map(() => []);
    if (!isPlaneta) return out;
    const raw = (((live?.home as any)?.planeta?.cifras ?? []) as any[]).filter(
      Boolean
    );
    raw.forEach((c) => {
      const i = Number(c.frase) - 1;
      const valor = Number(c.valor);
      if (!Number.isFinite(i) || i < 0 || i >= out.length) return;
      if (!Number.isFinite(valor)) return;
      out[i].push(c);
    });
    return out;
  })();
  const numberFormat = locale === "en" ? "en-US" : "es-PE";

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

      /* Cifras: cuentan dentro del turno de SU frase y terminan en el 60 % de
         ese turno, no en el borde. Una cuenta que acaba en el borde del capítulo
         llega a su valor final con el panel ya fuera de pantalla — el error que
         dejó documentado la SPEC 113 con los contadores del prototipo. */
      const counters = Array.from(
        actEl.querySelectorAll<HTMLElement>("[data-cifra]")
      );
      counters.forEach((el) => {
        const target = Number(el.dataset.valor);
        const sufijo = el.dataset.sufijo || "";
        if (!Number.isFinite(target)) return;
        const end = from + (to - from) * 0.6;
        stops.push(
          actProgress(chapter, len, from, end, (p) => {
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent =
              Math.round(target * eased).toLocaleString(numberFormat) + sufijo;
          })
        );
      });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, isPlaneta, numberFormat]);

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

            {cifrasPorFrase[i]?.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-x-12 gap-y-5">
                {cifrasPorFrase[i].map((c: any, k: number) => {
                  const valor = Number(c.valor);
                  const sufijo = (c.sufijo as string) || "";
                  return (
                    <div key={k}>
                      {/* El texto inicial ya es el valor final: sin JS (o con
                          reduced-motion, donde no hay capítulo) la cifra se lee
                          igual. El estado a 0 lo pone la cuenta al registrarse,
                          con el acto todavía en opacidad 0. */}
                      <span
                        data-cifra=""
                        data-valor={valor}
                        data-sufijo={sufijo}
                        className="block font-mono text-[clamp(1.5rem,3.2vw,2.4rem)] leading-none text-white"
                      >
                        {valor.toLocaleString(numberFormat) + sufijo}
                      </span>
                      <span
                        className="mt-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-white/55"
                        data-tina-field={tinaField(c, "label")}
                      >
                        {tField(c, "label", locale) as string}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
