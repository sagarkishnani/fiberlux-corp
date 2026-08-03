import { useTina, tinaField } from "tinacms/dist/react";
import { buttonClass } from "../shared/Button";
import type {
  HomeQuery,
  HomeQueryVariables,
} from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import BlogCard from "./BlogCard";
import { useSlider, type SliderEffect } from "../../hooks/useSlider";
import SliderArrows from "../shared/SliderArrows";

/* ── Types ── */
interface BlogPreviewProps {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  locale?: Locale;
  posts?: PostEdge[];
  autoplay?: boolean;
  intervalMs?: number;
  effect?: SliderEffect;
}

interface PostEdge {
  node?: {
    title?: string | null;
    coverImage?: string | null;
    tags?: (string | null)[] | null;
    readTime?: string | null;
    date?: string | null;
    _sys: { filename: string };
  } | null;
}

export default function BlogPreviewReact({
  query,
  variables,
  data: initialData,
  locale = "es",
  posts = [],
  autoplay = true,
  intervalMs = 6000,
  effect = "none",
}: BlogPreviewProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });

  const blogPreview =
    (data?.home as any)?.blogPreview || (initialData?.home as any)?.blogPreview;

  const title = tField(blogPreview as any, "title", locale) || "Insights & Novedades";
  const buttonText = tField(blogPreview as any, "buttonText", locale) || "Ver todos";
  const buttonUrl = blogPreview?.buttonUrl || "/blog";

  const hasPosts = posts.length > 0;
  const count = hasPosts ? posts.length : 3;
  const enough = count > 1;

  /* Embla slider: left-aligned cards, one per arrow, autoplay w/ loop. */
  const slider = useSlider({
    align: "start",
    loop: false,
    autoplay: autoplay && enough,
    intervalMs,
    effect,
  });

  return (
    <section className="bg-greyscale-darkest rounded-t-3xl py-14 pb-24 md:py-20 md:pb-40">
      <div className="site-container">
        {/* Header */}
        <div className="">
          <div className="flex items-center justify-between mb-12">
            <h2
              className="text-subtitle-lg text-white"
              data-tina-field={
                blogPreview ? tinaField(blogPreview, "title") : undefined
              }
            >
              {title}
            </h2>
            <a
              href={buttonUrl}
              className={buttonClass("secondary", "hidden md:inline-flex")}
              data-tina-field={
                blogPreview ? tinaField(blogPreview, "buttonText") : undefined
              }
            >
              {buttonText}
            </a>
          </div>
        </div>

        {/* Carousel (Embla) */}
        <div className="relative">
          <div
            ref={slider.viewportRef}
            className="overflow-hidden pb-4 select-none blog-carousel"
            style={{ cursor: "grab" }}
          >
            <div className="flex gap-6">
              {hasPosts
                ? posts.map((edge, i) => {
                    const post = edge?.node;
                    if (!post) return null;
                    return (
                      <article
                        key={i}
                        className="blog-slide shrink-0 w-[85%] md:w-[calc(66%-12px)]"
                      >
                        <BlogCard
                          title={tField(post as any, "title", locale) || "Sin título"}
                          coverImage={post.coverImage}
                          tag={post.tags?.[0]}
                          readTime={post.readTime}
                          date={post.date}
                          slug={post._sys.filename}
                          noHoverGlow
                        />
                      </article>
                    );
                  })
                : [1, 2, 3].map((_, i) => (
                    <article
                      key={i}
                      className="blog-slide shrink-0 w-[85%] md:w-[calc(66%-12px)]"
                    >
                      <div className="bg-greyscale-dark/30 border border-greyscale-dark/60 rounded-2xl h-[280px] md:h-[400px] flex items-center justify-center text-white/20 text-sm">
                        Blog card — próximamente
                      </div>
                    </article>
                  ))}
            </div>
          </div>
        </div>

        {/* Navigation arrows — pill compartido (magenta / oscuro en extremos). */}
        <div className="mt-6">
          <SliderArrows
            canPrev={slider.canPrev}
            canNext={slider.canNext}
            onPrev={slider.prev}
            onNext={slider.next}
          />
        </div>
      </div>
      <style>{`
        .blog-carousel {
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }
        .blog-carousel::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
