import { useState } from "react";
import { useTina } from "tinacms/dist/react";
import type {
  CasosDeExitoQuery,
  CasosDeExitoQueryVariables,
} from "../../../tina/__generated__/types";
import CasoCard, { type Caso } from "./CasoCard";
import VideoModal from "./VideoModal";
import { useSlider, type SliderEffect } from "../../hooks/useSlider";
import type { Locale } from "../../i18n/config";
import SliderArrows from "../shared/SliderArrows";
import SliderSideArrows from "../shared/SliderSideArrows";

interface CasosSliderProps {
  query: string;
  variables: CasosDeExitoQueryVariables;
  data: CasosDeExitoQuery;
  autoplay?: boolean;
  intervalMs?: number;
  effect?: SliderEffect;
  locale?: Locale;
}

export default function CasosSliderReact({
  query,
  variables,
  data: initialData,
  autoplay = true,
  intervalMs = 6000,
  effect = "none",
  locale = "es",
}: CasosSliderProps) {
  const { data } = useTina<CasosDeExitoQuery>({ query, variables, data: initialData });

  const page = data?.casosDeExito;
  const items = (page?.items || []).filter(Boolean) as any[];

  const [modalCaso, setModalCaso] = useState<Caso | null>(null);

  const enough = items.length > 1;

  /* Embla slider: la card activa va CENTRADA en el encuadre, con la anterior y
     la siguiente asomando por igual a cada lado (obs. cliente). Antes iba
     alineada al inicio: la card quedaba pegada al borde izquierdo y sólo se
     veía un trozo de la siguiente, así que el carrusel se leía descentrado.
     El loop es lo que garantiza la simetría también en el primer y el último
     caso — sin él, en los extremos falta el vecino de un lado. */
  const slider = useSlider({
    align: "center",
    loop: true,
    autoplay: autoplay && enough,
    intervalMs,
    effect,
  });
  const { activeIndex } = slider;

  const hasItems = items.length > 0;

  /* ¿Embla ya tomó las medidas? Hasta que no lo hace, el carrusel se pinta con
     el HTML crudo: los slides en fila desde el borde izquierdo, sin el
     desplazamiento que centra la card activa. Al hidratar, Embla escribe ese
     `transform` de golpe y la card SALTA de la izquierda al centro — que es lo
     que se veía al refrescar. Con esto el bloque se mantiene invisible hasta que
     está colocado y entra con un fundido corto. `scrollSnaps` se llena en el
     mismo momento en que el motor termina de inicializarse. */
  const colocado = slider.scrollSnaps.length > 0;

  const arrowsPill = (
    <SliderArrows
      canPrev={slider.canPrev}
      canNext={slider.canNext}
      onPrev={slider.prev}
      onNext={slider.next}
    />
  );

  return (
    <section className="bg-greyscale-darkest pt-2 pb-20 md:pt-4 md:pb-32">
      {/* obs10: sin título "Casos de éxito" (redundante con el H1 del hero).
          El viewport va dentro de site-container (igual que el hero) para que la
          primera card quede alineada al título y la descripción. */}
      <div className="site-container">
        {/* Móvil: una flecha a cada lado del video (centradas verticalmente),
            como un carrusel clásico. La card es alta y, con las flechas
            arriba/abajo, el usuario no notaba que podía moverse; a los lados del
            video quedan a la vista justo donde está mirando. Desktop: debajo. */}
        <div className="relative">
          {items.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Anterior"
                onClick={slider.prev}
                className="md:hidden absolute left-3 top-[148px] -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[#96237A] text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.7)] transition-colors hover:bg-[#650F50] active:bg-[#650F50]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                onClick={slider.next}
                className="md:hidden absolute right-3 top-[148px] -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[#96237A] text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.7)] transition-colors hover:bg-[#650F50] active:bg-[#650F50]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <div
            ref={slider.viewportRef}
            /* El canal entre cards va como padding de cada slide (no como `gap`
               del contenedor) y el viewport lo compensa con el `-mx`
               equivalente: así Embla mide el slide CON su separación y el bucle
               puede reubicar el vecino del otro extremo. Con `gap` el motor
               medía 880 y movía 936, y en el primer y el último caso el hueco
               lateral se quedaba vacío.

               El desborde no puede pasarse del gutter del site-container (24px
               en móvil, 40px desde md) o aparece scroll horizontal en la
               página, de ahí los dos valores. */
            data-listo={colocado ? "1" : undefined}
            className="-mx-3 md:-mx-7 overflow-hidden pt-2 pb-3 select-none casos-carousel"
            style={{ cursor: hasItems ? "grab" : "default" }}
          >
          <div className="flex">
            {hasItems ? (
              items.map((item, i) => (
                <div
                  key={i}
                  className={`caso-slide shrink-0 w-full max-w-[936px] px-3 md:px-7 transition-opacity duration-300 ${
                    i === activeIndex ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <CasoCard
                    caso={item as Caso}
                    locale={locale}
                    tinaItem={page?.items?.[i]}
                    onPlay={() => setModalCaso(item as Caso)}
                  />
                </div>
              ))
            ) : (
              <div className="caso-slide shrink-0 w-full max-w-[936px] px-3 md:px-7">
                <div className="bg-white/[0.04] border border-white/10 h-[400px] flex items-center justify-center text-white/20 text-sm">
                  Casos de éxito — próximamente
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Desktop (lg+): flechas laterales superpuestas (SPEC 94) */}
          {items.length > 1 && (
            <SliderSideArrows
              canPrev={slider.canPrev}
              canNext={slider.canNext}
              onPrev={slider.prev}
              onNext={slider.next}
            />
          )}
        </div>

        {/* Arrows: below the video (tablet md–lg); en lg+ se usan las laterales */}
        {items.length > 1 && <div className="hidden md:block lg:hidden mt-8">{arrowsPill}</div>}

        {/* Dots: indicador de progreso interactivo, centrado bajo el slider.
            El dot activo se alarga (px) y toma el magenta de marca; clic navega. */}
        {slider.scrollSnaps.length > 1 && (
          <div className="mt-8 flex justify-center gap-2.5" role="tablist" aria-label="Casos de éxito">
            {slider.scrollSnaps.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-label={`Ir al caso ${i + 1}`}
                aria-selected={i === activeIndex}
                onClick={() => slider.goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-6 bg-[#96237A]"
                    : "w-2 bg-white/25 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <VideoModal caso={modalCaso} onClose={() => setModalCaso(null)} />

      <style>{`
        .casos-carousel { scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; }
        .casos-carousel::-webkit-scrollbar { display: none; }

        /* Entrada sin salto: invisible hasta que Embla centra la card.
           El keyframe con retardo es la red de seguridad — si el JS no llega a
           ejecutarse (isla que no hidrata, error de red), el carrusel aparece
           igual a los 2s en vez de quedarse en negro para siempre. */
        .casos-carousel {
          opacity: 0;
          animation: casos-aparece 0.01s linear 2s forwards;
        }
        .casos-carousel[data-listo="1"] {
          opacity: 1;
          animation: none;
          transition: opacity 260ms ease-out;
        }
        @keyframes casos-aparece { to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .casos-carousel[data-listo="1"] { transition: none; }
        }

        /* ── Cantos desvanecidos (obs. cliente) ───────────────────────────
           Los casos vecinos asomaban a cada lado cortados en seco por el
           overflow-hidden del viewport: una línea recta vertical a media card.
           Esta máscara los funde hacia afuera.

           El ancho del degradado NO es fijo: tiene que terminar exactamente
           donde empieza la card activa, o le comería el borde. Esa distancia
           cambia con el ancho de la ventana — la card mide 880px como mucho, y
           el sobrante del viewport se reparte a los lados — así que se calcula:

             (ancho del viewport - 936) / 2  +  el px del slide

           936 = 880 de card + 56 de canal, que es lo que mide un slide. Cuando
           la ventana es angosta el viewport es más chico que el slide, el
           primer término se vuelve negativo y el max() deja sólo el px del
           slide: la card sigue intacta y el desvanecido queda igual de justo.

           Así el vecino se desvanece a lo largo de TODO su trozo visible (~126px
           a 1512px) y la card central no pierde ni un píxel de nitidez. */
        .casos-carousel {
          --casos-fade: 12px;
          -webkit-mask-image: linear-gradient(90deg,
            transparent 0,
            rgba(0,0,0,0.4) calc(var(--casos-fade) * 0.55),
            #000 var(--casos-fade),
            #000 calc(100% - var(--casos-fade)),
            rgba(0,0,0,0.4) calc(100% - var(--casos-fade) * 0.55),
            transparent 100%);
          mask-image: linear-gradient(90deg,
            transparent 0,
            rgba(0,0,0,0.4) calc(var(--casos-fade) * 0.55),
            #000 var(--casos-fade),
            #000 calc(100% - var(--casos-fade)),
            rgba(0,0,0,0.4) calc(100% - var(--casos-fade) * 0.55),
            transparent 100%);
        }
        @media (min-width: 768px) {
          .casos-carousel {
            --casos-fade: max(28px, calc((100% - 936px) / 2 + 28px));
          }
        }
      `}</style>
    </section>
  );
}
