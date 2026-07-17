import { useRef, useState, useEffect } from 'react';
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

  const titleH2Ref = useRef<HTMLHeadingElement>(null);
  const [leftPad, setLeftPad] = useState(64);

  /* Shared drag/scroll engine: left-aligned cards (match snap-start), one per arrow. */
  const slider = useDragSlider({
    slideSelector: '.testimonial-slide',
    align: 'start',
    itemCount: items.length,
  });
  const { activeIndex } = slider;

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < items.length - 1;

  /* ── Measure exact left offset of the h2 text ── */
  useEffect(() => {
    const measure = () => {
      if (titleH2Ref.current) {
        const rect = titleH2Ref.current.getBoundingClientRect();
        setLeftPad(rect.left);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const hasItems = items.length > 0;

  /* ── Arrow button component ── */
  const ArrowButton = ({
    direction,
    disabled,
    onClick,
  }: {
    direction: 'left' | 'right';
    disabled: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 flex items-center justify-center transition-all ${
        direction === 'left' ? 'rounded-l-lg' : 'rounded-r-lg'
      } ${
        disabled
          ? 'bg-greyscale-dark/40 text-white/20 cursor-default'
          : direction === 'right'
            ? 'bg-brand-purple text-white hover:bg-brand-purple-dark'
            : 'bg-greyscale-dark/60 text-white/60 hover:text-white hover:bg-greyscale-dark'
      }`}
      aria-label={direction === 'left' ? 'Anterior' : 'Siguiente'}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {direction === 'left' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );

  if (!isVisible) return null;

  return (
    <section className="bg-greyscale-darkest py-14 pb-24 md:py-20 md:pb-40">
      {/* Header */}
      <div className='site-container'>
      <div className="">
        <div className="flex items-start md:items-center justify-between mb-12">
          <h2
            ref={titleH2Ref}
            className="text-subtitle-lg text-white md:max-w-[600px]"
            data-tina-field={
              testimonials ? tinaField(testimonials, 'sectionTitle') : undefined
            }
          >
            {sectionTitle}
          </h2>

          {/* Desktop arrows */}
          <div className="hidden md:flex">
            <ArrowButton direction="left" disabled={!canGoPrev} onClick={slider.prev} />
            <ArrowButton direction="right" disabled={!canGoNext} onClick={slider.next} />
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div
          ref={slider.ref}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 select-none testimonial-carousel"
          style={{
            cursor: 'grab',
            paddingLeft: `${leftPad}px`,
          }}
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
                  <div className="bg-greyscale-dark/30 border border-greyscale-dark/60 rounded-2xl h-[320px] md:h-[400px] flex items-center justify-center text-white/20 text-sm">
                    Testimonio — próximamente
                  </div>
                </div>
              ))}

          {/* Right spacer */}
          <div className="shrink-0 w-4" />
        </div>
      </div>

      {/* Mobile navigation arrows */}
      <div className="md:hidden px-6 mt-6">
        <div className="flex">
          <ArrowButton direction="left" disabled={!canGoPrev} onClick={slider.prev} />
          <ArrowButton direction="right" disabled={!canGoNext} onClick={slider.next} />
        </div>
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
