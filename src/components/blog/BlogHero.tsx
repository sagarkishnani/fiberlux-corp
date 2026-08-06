import { useRef, useState, useEffect } from 'react';
import BlogCard from './BlogCard';
import { tField } from '../../utils/i18n';
import type { Locale } from '../../i18n/config';
import { useSlider, type SliderEffect } from '../../hooks/useSlider';
import SliderArrows from '../shared/SliderArrows';
import SliderSideArrows from '../shared/SliderSideArrows';

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
  locale?: Locale;
  posts: PostEdge[];
  autoplay?: boolean;
  intervalMs?: number;
  effect?: SliderEffect;
}

export default function BlogHero({ posts = [], autoplay = true, intervalMs = 6000, effect = "none", locale = "es" }: BlogHeroProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [leftPad, setLeftPad] = useState(80);

  const hasPosts = posts.length > 0;
  const enough = posts.length > 1;

  /* Embla slider: left-aligned cards, autoplay, arrows disable at the edges. */
  const slider = useSlider({
    align: 'start',
    loop: false,
    autoplay: autoplay && enough,
    intervalMs,
    effect,
  });

  /* ── Measure left padding from content container so the first card lines up
       with the title/arrows (the carousel bleeds to the right edge). ── */
  useEffect(() => {
    const measure = () => {
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        const paddingLeft =
          parseFloat(getComputedStyle(contentRef.current).paddingLeft) || 0;
        setLeftPad(rect.left + paddingLeft);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

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
      <div ref={contentRef} className="relative z-10 site-container pt-28 md:pt-36">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-white/40 mb-3">
          <a href="/" className="hover:text-white/60 transition-colors !text-white/40">
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

      {/* Carousel (Embla) — bleeds to right edge */}
      <div className="relative z-10">
        <div
          ref={slider.viewportRef}
          className="overflow-hidden pb-4 select-none blog-hero-carousel"
          style={{ cursor: 'grab', paddingLeft: `${leftPad}px` }}
        >
          <div className="flex gap-6">
            {hasPosts
              ? posts.map((edge) => {
                  const post = edge?.node;
                  if (!post) return null;
                  return (
                    <article
                      key={post._sys.filename}
                      className="shrink-0 w-[85%] md:w-[calc(52%-12px)]"
                    >
                      <BlogCard
                        title={tField(post as any, 'title', locale) || 'Sin título'}
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
                  <article key={i} className="shrink-0 w-[85%] md:w-[calc(52%-12px)]">
                    <div className="bg-greyscale-dark/30 border border-greyscale-dark/60 rounded-2xl h-[400px] flex items-center justify-center text-white/20 text-sm">
                      Blog card — próximamente
                    </div>
                  </article>
                ))}
          </div>
        </div>

        {/* Desktop (lg+): flechas laterales. La izquierda se alinea con el gutter
            (leftPad) porque el carrusel sangra hacia la derecha (SPEC 94). */}
        {enough && (
          <SliderSideArrows
            canPrev={slider.canPrev}
            canNext={slider.canNext}
            onPrev={slider.prev}
            onNext={slider.next}
            leftOffset={`${Math.max(leftPad - 40, 8)}px`}
            rightOffset="0.5rem"
          />
        )}
      </div>

      {/* Navigation arrows — pill compartido (mobile/tablet; en lg+ laterales) */}
      <div className="relative z-10 site-container">
        <div className="mt-6 lg:hidden">
          <SliderArrows
            canPrev={slider.canPrev}
            canNext={slider.canNext}
            onPrev={slider.prev}
            onNext={slider.next}
          />
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
