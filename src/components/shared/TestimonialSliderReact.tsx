import { useRef, useState, useCallback, useEffect } from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import type { HomeQuery, HomeQueryVariables } from '../../../tina/__generated__/types';
import TestimonialCard from './TestimonialCard';

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

  const carouselRef = useRef<HTMLDivElement>(null);
  const titleH2Ref = useRef<HTMLHeadingElement>(null);
  const [leftPad, setLeftPad] = useState(64);
  const [activeIndex, setActiveIndex] = useState(0);

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

  /* ── Track active slide ── */
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const onScroll = () => {
      const children = Array.from(el.querySelectorAll<HTMLElement>('.testimonial-slide'));
      if (!children.length) return;
      let closest = 0;
      let minDist = Infinity;
      children.forEach((child, i) => {
        const center = child.offsetLeft + child.offsetWidth / 2;
        const dist = Math.abs(center - el.scrollLeft - el.offsetWidth / 2);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setActiveIndex(closest);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [items.length]);

  /* ── Drag to scroll ── */
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const el = carouselRef.current;
    if (!el) return;
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX;
    startScrollLeft.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
    el.style.scrollSnapType = 'none';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const el = carouselRef.current;
    if (!el) return;
    const dx = e.pageX - startX.current;
    if (Math.abs(dx) > 5) hasDragged.current = true;
    el.scrollLeft = startScrollLeft.current - dx;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    const el = carouselRef.current;
    if (el) {
      el.style.cursor = 'grab';
      el.style.scrollSnapType = '';
    }
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  /* ── Button scroll ── */
  const scroll = (direction: 'left' | 'right') => {
    const el = carouselRef.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>('.testimonial-slide');
    if (!slide) return;
    const gap = 24;
    el.scrollBy({
      left: direction === 'right' ? slide.offsetWidth + gap : -(slide.offsetWidth + gap),
      behavior: 'smooth',
    });
  };

  const hasItems = items.length > 0;

  /* ── Arrow button component ── */
  const ArrowButton = ({
    direction,
    disabled,
  }: {
    direction: 'left' | 'right';
    disabled: boolean;
  }) => (
    <button
      onClick={() => scroll(direction)}
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

  return (
    <section className="bg-greyscale-darkest py-20 pb-40">
      {/* Header */}
      <div className='max-w-[1440px] mx-auto'>
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
            <ArrowButton direction="left" disabled={!canGoPrev} />
            <ArrowButton direction="right" disabled={!canGoNext} />
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div
          ref={carouselRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 select-none testimonial-carousel"
          style={{
            cursor: 'grab',
            paddingLeft: `${leftPad}px`,
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onClickCapture={onClickCapture}
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
          <ArrowButton direction="left" disabled={!canGoPrev} />
          <ArrowButton direction="right" disabled={!canGoNext} />
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