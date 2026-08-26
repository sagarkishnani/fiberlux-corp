import { useEffect, useRef, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import { tField, localizeHref } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import { parseStat, formatNumber, useCounter } from "../../hooks/useStatCounter";
import { useSlider, type SliderEffect } from "../../hooks/useSlider";
import SliderSideArrows from "../shared/SliderSideArrows";
import TestimonialMiniCard from "./TestimonialMiniCard";
import { buttonClass } from "../shared/Button";

/**
 * EmpresasRed — bloque unificado "¿Por qué Fiberlux?" + Testimonios (home).
 *
 * Antes eran dos secciones seguidas (`Stats` con panel morado + `TestimonialSlider`
 * con panel claro). El cliente pidió fundirlas en un solo panel claro: título,
 * slider de testimonios (Embla, 3 tarjetas blancas iguales en desktop), cifras
 * y CTA a casos de éxito.
 *
 * La referencia del cliente reordenó el bloque (testimonios ARRIBA de las
 * cifras), descartó la tarjeta central destacada y quitó la franja de logos de
 * clientes: su copy ("+5,500 empresas") repetía la primera cifra. Los campos
 * `stats.clientLogos` / `clientsHighlight` / `clientsNote` siguen en el CMS por
 * si se quiere recuperar.
 *
 * `Stats` y `TestimonialSlider` siguen existiendo sin cambios: los usan Nosotros,
 * Soluciones, Fiberlux App y Soporte.
 */

interface EmpresasRedProps {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  locale?: Locale;
  autoplay?: boolean;
  intervalMs?: number;
  effect?: SliderEffect;
  /** Oculta el CTA a casos de éxito (en la propia página de casos sobra). */
  hideCta?: boolean;
}

interface StatItem {
  number?: string | null;
  label?: string | null;
  description?: string | null;
}

interface Testimonial {
  quote?: string | null;
  description?: string | null;
  name?: string | null;
  role?: string | null;
  company?: string | null;
  avatar?: string | null;
  logo?: string | null;
}

const UI = {
  es: { prev: "Anterior", next: "Siguiente" },
  en: { prev: "Previous", next: "Next" },
} as const;

/* ── Cifra suelta, tema claro (magenta sobre el panel rosa) ── */
function StatFigure({ item, index, locale }: { item: StatItem; index: number; locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const { prefix, value, suffix, decimals, hasCommas } = parseStat(item.number || "0");
  const count = useCounter(value, 1000 + index * 60, isVisible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const displayNumber = formatNumber(count, decimals, hasCommas);

  const numberCls =
    "text-[36px] leading-[40px] sm:text-[44px] sm:leading-[48px] xl:text-[52px] xl:leading-[56px] font-medium";
  const suffixCls =
    "text-[18px] leading-[22px] sm:text-[22px] sm:leading-[26px] xl:text-[26px] xl:leading-[30px] font-medium ml-0.5";

  return (
    <div ref={ref} className="flex flex-col items-center gap-3 px-4 text-center">
      <p className="text-brand-purple" data-tina-field={tinaField(item as any, "number")}>
        {prefix && <span className={numberCls}>{prefix}</span>}
        <span className={numberCls}>{displayNumber}</span>
        {suffix && <span className={suffixCls}>{suffix}</span>}
      </p>
      <p
        className="max-w-[210px] text-body-sm leading-snug text-brand-gray-dark"
        data-tina-field={tinaField(item as any, "description")}
      >
        {tField(item as any, "description", locale)}
      </p>
    </div>
  );
}

export default function EmpresasRedReact({
  query,
  variables,
  data: initialData,
  locale = "es",
  autoplay = true,
  intervalMs = 5000,
  effect = "none",
  hideCta = false,
}: EmpresasRedProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });

  const home = (data?.home as any) || (initialData?.home as any);
  const stats = home?.stats;
  const testimonials = home?.testimonials;

  const sectionTitle =
    tField(testimonials as any, "sectionTitle", locale) || "Empresas que confían en nuestra red";
  const statItems = ((stats?.items || []) as StatItem[]).filter(Boolean);
  const items: Testimonial[] = testimonials?.items || [];

  const ctaLabel = tField(testimonials as any, "ctaLabel", locale);
  const ctaUrl = localizeHref(testimonials?.ctaUrl || "", locale);

  const hasItems = items.length > 0;
  const enough = items.length > 1;
  const t = UI[locale] ?? UI.es;

  const slider = useSlider({
    // Sin loop: al dar la vuelta, Embla reposiciona los slides clonados y el
    // salto se notaba. Se prefirió el recorrido finito.
    align: "start",
    loop: false,
    autoplay: autoplay && enough,
    intervalMs,
    effect,
  });

  // En desktop entran las 3 tarjetas y no hay nada que desplazar: se ocultan
  // las flechas en vez de dejarlas muertas (vuelven al sumar testimonios).
  const scrollable = slider.canPrev || slider.canNext;

  // La sección se apaga desde el CMS igual que el slider de testimonios.
  if (testimonials?.visible !== true) return null;

  // El ancho incluye la separación: cada slide lleva `px-3` y no hay `gap`.
  // Mobile/tablet chico: una tarjeta ENTERA por vista (`basis-full` = ancho del
  // viewport de Embla, que ya lleva los 24px de `-mx-3`, así que la tarjeta cae
  // justo sobre los márgenes del contenedor, sin asomar la siguiente).
  const slideCls = "shrink-0 px-3 basis-full md:basis-1/2 lg:basis-1/3";

  return (
    <section className="rounded-t-[32px] bg-brand-purple-lightest md:rounded-t-[56px] py-20 md:py-28 md:pb-32">
      <div className="site-container">
        {/* `text-wrap: balance` reparte el título en dos líneas parejas sin
            hardcodear el salto (el texto viene del CMS y puede cambiar). */}
        <h2
          className="mx-auto max-w-[600px] text-center text-subtitle-lg text-brand-purple"
          style={{ textWrap: "balance" } as any}
          data-tina-field={testimonials ? tinaField(testimonials, "sectionTitle") : undefined}
        >
          {sectionTitle}
        </h2>

        {/* ── Slider de testimonios (Embla) ── */}
        <div className="relative mt-14 md:mt-20">
          {/* El recorte de Embla caía justo sobre el borde de la primera y la
              última tarjeta y les rebanaba la sombra. El aire NO puede venir de
              un `padding` horizontal en el viewport: Embla mide su border box y
              los slides se dimensionan contra el content box, así que el padding
              desfasa el cálculo del loop y termina recortando un slide entero.
              En su lugar la separación vive DENTRO del slide (`px-3`, sin `gap`)
              y el viewport se saca 12px con `-mx-3`: las tarjetas quedan
              alineadas al contenedor y el recorte pasa 12px por fuera de ellas. */}
          <div
            ref={slider.viewportRef}
            className="empresas-red-carousel -mx-3 select-none overflow-hidden pb-8"
            style={{ cursor: "grab" }}
          >
            <div className="flex items-stretch">
              {hasItems
                ? items.map((item, i) => (
                    <div
                      key={i}
                      className={slideCls}
                      data-tina-field={
                        testimonials?.items?.[i]
                          ? tinaField(testimonials.items[i], "quote")
                          : undefined
                      }
                    >
                      <TestimonialMiniCard
                        quote={tField(item as any, "quote", locale) || ""}
                        description={
                          locale === "en" && (item as any).description_en
                            ? (item as any).description_en
                            : item.description
                        }
                        name={item.name || ""}
                        role={tField(item as any, "role", locale) || ""}
                        company={item.company || ""}
                        logo={item.logo}
                      />
                    </div>
                  ))
                : [1, 2, 3].map((_, i) => (
                    <div key={i} className={slideCls}>
                      <div className="flex h-[360px] items-center justify-center rounded-2xl border border-brand-purple/20 bg-white/40 text-sm text-brand-purple/40">
                        Testimonio — próximamente
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          {/* Flechas laterales superpuestas (SPEC 94). En mobile van igual a los
              costados pero tenues, en vez de la píldora bajo el carrusel. */}
          {enough && scrollable && (
            <SliderSideArrows
              mobile
              canPrev={slider.canPrev}
              canNext={slider.canNext}
              onPrev={slider.prev}
              onNext={slider.next}
              labelPrev={t.prev}
              labelNext={t.next}
            />
          )}
        </div>

        {/* ── Cifras (antes sección "¿Por qué Fiberlux?") ── */}
        {statItems.length > 0 && (
          <div className="mt-16 grid grid-cols-2 gap-y-14 md:mt-20 xl:grid-cols-4">
            {statItems.map((item, i) => (
              <div
                key={i}
                className={[
                  "flex justify-center border-brand-purple/20",
                  // Separadores finos entre columnas: 2 columnas en mobile,
                  // 4 en xl → la primera de cada fila nunca lleva línea.
                  i % 2 !== 0 ? "border-l" : "",
                  i !== 0 && i % 2 === 0 ? "xl:border-l" : "",
                ].join(" ")}
              >
                <StatFigure item={item} index={i} locale={locale} />
              </div>
            ))}
          </div>
        )}

        {/* ── CTA a casos de éxito ── */}
        {!hideCta && ctaLabel && ctaUrl && (
          <div className="mt-10 flex justify-center md:mt-12">
            <a
              href={ctaUrl}
              className={buttonClass("primary")}
              data-tina-field={testimonials ? tinaField(testimonials, "ctaLabel") : undefined}
            >
              {ctaLabel}
            </a>
          </div>
        )}
      </div>

      <style>{`
        .empresas-red-carousel {
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }
        .empresas-red-carousel::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
