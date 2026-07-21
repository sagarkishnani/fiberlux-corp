import { useTina, tinaField } from 'tinacms/dist/react';
import type { HomeQuery, HomeQueryVariables } from '../../../tina/__generated__/types';
import TestimonialCard from './TestimonialCard';
import { useDragSlider } from '../../hooks/useDragSlider';

/* ── Types ── */
interface TestimonialSliderProps {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
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

export default function TestimonialSliderReact({
  query,
  variables,
  data: initialData,
}: TestimonialSliderProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });

  const testimonials =
    (data?.home as any)?.testimonials ||
    (initialData?.home as any)?.testimonials;

  const sectionTitle = testimonials?.sectionTitle || 'Empresas que confían en nuestra red';
  const items: Testimonial[] = testimonials?.items || [];
  // Hidden when the CMS toggle is off (default: hidden until there are enough quotes).
  const isVisible = testimonials?.visible === true;

  /* Shared drag/scroll engine: left-aligned cards (match snap-start), one per arrow. */
  const slider = useDragSlider({
    slideSelector: '.testimonial-slide',
    align: 'start',
    itemCount: items.length,
  });
  const { atStart, atEnd } = slider;
  const hasItems = items.length > 0;

  /* ── Prev/Next pill — light theme (matches the light testimonios panel).
       Prev tenue (rosa claro), next magenta con flecha blanca. ── */
  const arrowsPill = (
    <div className="inline-flex rounded-[12px] border border-brand-purple/25 bg-[#EBCFE0] overflow-hidden shadow-[0_8px_24px_-8px_rgba(150,35,122,0.25)]">
      <button
        type="button"
        onClick={slider.prev}
        disabled={atStart}
        aria-label="Anterior"
        className={`w-[49px] h-[49px] flex items-center justify-center transition-colors ${
          !atStart ? "text-brand-purple hover:bg-brand-purple/10" : "text-brand-purple/30 cursor-default"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={slider.next}
        disabled={atEnd}
        aria-label="Siguiente"
        className={`w-[49px] h-[49px] flex items-center justify-center transition-colors ${
          !atEnd ? "bg-brand-purple text-white hover:bg-brand-purple-dark" : "bg-brand-purple/40 text-white/60 cursor-default"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );

  if (!isVisible) return null;

  return (
    <section className="bg-brand-purple-lightest rounded-t-[32px] md:rounded-t-[56px] py-14 pb-24 md:py-20 md:pb-40">
      {/* Header */}
      <div className='site-container'>
      <div className="">
        <div className="flex items-start md:items-center justify-between mb-12">
          <h2
            className="text-subtitle-lg text-brand-purple md:max-w-[600px]"
            data-tina-field={
              testimonials ? tinaField(testimonials, 'sectionTitle') : undefined
            }
          >
            {sectionTitle}
          </h2>

          {/* Desktop arrows */}
          <div className="hidden md:flex">{arrowsPill}</div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div
          ref={slider.ref}
          className="flex gap-6 overflow-x-auto snap-x snap-proximity pb-4 select-none testimonial-carousel"
          style={{ cursor: 'grab' }}
          {...slider.handlers}
        >
          {hasItems
            ? items.map((item, i) => (
                <div
                  key={i}
                  className="testimonial-slide snap-start shrink-0 w-[calc(100%-48px)] md:w-[calc(80%-12px)] max-w-[1100px]"
                  data-tina-field={
                    testimonials?.items?.[i]
                      ? tinaField(testimonials.items[i], 'quote')
                      : undefined
                  }
                >
                  <TestimonialCard
                    quote={item.quote || ''}
                    description={item.description}
                    name={item.name || ''}
                    role={item.role || ''}
                    company={item.company || ''}
                    avatar={item.avatar}
                    logo={item.logo}
                  />
                </div>
              ))
            : [1, 2].map((_, i) => (
                <div
                  key={i}
                  className="testimonial-slide snap-start shrink-0 w-[calc(100%-48px)] md:w-[calc(80%-12px)] max-w-[1100px]"
                >
                  <div className="bg-white/40 border border-brand-purple/20 rounded-2xl h-[320px] md:h-[400px] flex items-center justify-center text-brand-purple/40 text-sm">
                    Testimonio — próximamente
                  </div>
                </div>
              ))}

          {/* Right spacer */}
          <div className="shrink-0 w-4" />
        </div>
      </div>

      {/* Mobile navigation arrows */}
      <div className="md:hidden mt-6">
        {arrowsPill}
      </div>

      <style>{`
        .testimonial-carousel {
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }
        .testimonial-carousel::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Tema oscuro anterior — reutilizar luego.
   Se conserva comentado por pedido del cliente. La sección era oscura
   (bg-greyscale-darkest), el título blanco y las flechas usaban el pill navy
   (#141223 / borde #282445, prev blanco/tenue, next magenta). El resto de la
   estructura (carousel, drag, placeholder) era idéntica.

   // Pill navy del tema oscuro:
   const arrowsPillDark = (
     <div className="inline-flex rounded-[12px] border-2 border-[#282445] bg-[#141223] overflow-hidden shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]">
       <button ... prev className={!atStart ? "text-white hover:bg-white/5" : "text-white/30 cursor-default"} ... />
       <button ... next className={!atEnd ? "bg-[#96237A] text-white hover:bg-[#650F50]" : "bg-[#96237A]/40 text-white/40 cursor-default"} ... />
     </div>
   );

   // Sección oscura:
   //   <section className="bg-greyscale-darkest py-14 pb-24 md:py-20 md:pb-40">
   //     <h2 className="text-subtitle-lg text-white md:max-w-[600px]"> … </h2>
   //     placeholder: <div className="bg-greyscale-dark/30 border border-greyscale-dark/60 rounded-2xl … text-white/20"> … </div>
──────────────────────────────────────────────────────────────────────────── */
