import { useRef, useState, useCallback, useEffect } from 'react';
import BlogCard from './BlogCard';

/* ── Types ── */
interface PostNode {
  title?: string | null;
  coverImage?: string | null;
  tags?: (string | null)[] | null;
  readTime?: string | null;
  date?: string | null;
  _sys: { filename: string };
}

interface PostEdge {
  node?: PostNode | null;
}

interface BlogHeroProps {
  posts: PostEdge[];
}

export default function BlogHero({ posts = [] }: BlogHeroProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [leftPad, setLeftPad] = useState(80);

  /* ── Measure left padding from content container ── */
  useEffect(() => {
    const measure = () => {
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        const paddingLeft =
          parseFloat(getComputedStyle(contentRef.current).paddingLeft) || 0;
        // Align the carousel's first card with the inner content (title + arrows),
        // not the container's outer edge — rect.left excludes the px-16 padding.
        setLeftPad(rect.left + paddingLeft);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

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
    const cardWidth = el.querySelector('article')?.offsetWidth || 600;
    const gap = 24;
    el.scrollBy({
      left: direction === 'right' ? cardWidth + gap : -(cardWidth + gap),
      behavior: 'smooth',
    });
  };

  const hasPosts = posts.length > 0;

  return (
    <section
      className="relative pb-20 overflow-hidden -mt-16"
      style={{
        background: `
          radial-gradient(
            circle at 85% 15%,
            rgba(150, 35, 122, 0.35) 0%,
            rgba(150, 35, 122, 0.08) 30%,
            transparent 60%
          ),
          #0a0a0a
        `,
      }}
    >
      {/* Content — pt accounts for fixed header */}
      <div
        ref={contentRef}
        className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-16 pt-28 md:pt-36"
      >
        {/* Breadcrumb */}
        <nav className="text-[13px] text-white/40 mb-3">
          <a
            href="/"
            className="hover:text-white/60 transition-colors !text-white/40"
          >
            Inicio
          </a>
          <span className="mx-2">/</span>
          <span className="text-white/80 font-medium">Blog</span>
        </nav>

        {/* Title */}
        <h1 className="text-[56px] md:text-[72px] leading-[64px] md:leading-[80px] font-semibold text-white mb-10">
          Blog
        </h1>
      </div>

      {/* Carousel — bleeds to right edge */}
      <div className="relative z-10">
        <div
          ref={carouselRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 select-none blog-hero-carousel"
          style={{
            cursor: 'grab',
            paddingLeft: `${leftPad}px`,
            paddingRight: 0,
            // Without this, snap-mandatory pulls the first card flush to the
            // container edge and cancels the padding — keep the snap start
            // aligned with the padding so the first card lines up with the title/arrows.
            scrollPaddingLeft: `${leftPad}px`,
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onClickCapture={onClickCapture}
        >
          {hasPosts
            ? posts.map((edge, i) => {
                const post = edge?.node;
                if (!post) return null;
                return (
                  <article
                    key={post._sys.filename}
                    className="snap-start shrink-0 w-[85%] md:w-[calc(52%-12px)]"
                  >
                    <BlogCard
                      title={post.title || 'Sin título'}
                      coverImage={post.coverImage}
                      tag={post.tags?.[0]}
                      readTime={post.readTime}
                      date={post.date}
                      slug={post._sys.filename}
                    />
                  </article>
                );
              })
            : [1, 2, 3].map((_, i) => (
                <article
                  key={i}
                  className="snap-start shrink-0 w-[85%] md:w-[calc(52%-12px)]"
                >
                  <div className="bg-greyscale-dark/30 border border-greyscale-dark/60 rounded-2xl h-[400px] flex items-center justify-center text-white/20 text-sm">
                    Blog card — próximamente
                  </div>
                </article>
              ))}
          {/* Right spacer */}
          <div className="shrink-0 w-4" />
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-16">
        <div className="flex gap-0 mt-6">
          <button
            onClick={() => scroll('left')}
            className="w-11 h-11 rounded-l-xl bg-greyscale-dark/50 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-greyscale-dark/70 transition-all"
            aria-label="Anterior"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-11 h-11 rounded-r-xl bg-brand-purple flex items-center justify-center text-white hover:bg-brand-purple-dark transition-all"
            aria-label="Siguiente"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .blog-hero-carousel {
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }
        .blog-hero-carousel::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}