import { useTina, tinaField } from "tinacms/dist/react";
import type {
  HomeQuery,
  HomeQueryVariables,
} from "../../../tina/__generated__/types";
import BlogCard from "./BlogCard";
import { useDragSlider } from "../../hooks/useDragSlider";

/* ── Types ── */
interface BlogPreviewProps {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  posts?: PostEdge[];
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
  posts = [],
}: BlogPreviewProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });

  const blogPreview =
    (data?.home as any)?.blogPreview || (initialData?.home as any)?.blogPreview;

  const title = blogPreview?.title || "Insights & Novedades";
  const buttonText = blogPreview?.buttonText || "Ver todos";
  const buttonUrl = blogPreview?.buttonUrl || "/blog";

  const hasPosts = posts.length > 0;
  const count = hasPosts ? posts.length : 3;

  /* Shared drag/scroll engine: left-aligned cards, one card per arrow. */
  const slider = useDragSlider({
    slideSelector: ".blog-slide",
    align: "start",
    itemCount: count,
  });
  const canScrollLeft = !slider.atStart;
  const canScrollRight = !slider.atEnd;

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
              className="hidden md:inline-flex items-center justify-center border border-white text-white rounded-full px-8 py-3 text-sm font-medium hover:bg-white hover:text-greyscale-darkest transition-all"
              data-tina-field={
                blogPreview ? tinaField(blogPreview, "buttonText") : undefined
              }
            >
              {buttonText}
            </a>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div
            ref={slider.ref}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 select-none blog-carousel"
            style={{ cursor: "grab", paddingRight: 0 }}
            {...slider.handlers}
          >
            {hasPosts
              ? posts.map((edge, i) => {
                  const post = edge?.node;
                  if (!post) return null;
                  return (
                    <article
                      key={i}
                      className="blog-slide snap-start shrink-0 w-[85%] md:w-[calc(66%-12px)]"
                    >
                      <BlogCard
                        title={post.title || "Sin título"}
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
                    className="blog-slide snap-start shrink-0 w-[85%] md:w-[calc(66%-12px)]"
                  >
                    <div className="bg-greyscale-dark/30 border border-greyscale-dark/60 rounded-2xl h-[280px] md:h-[400px] flex items-center justify-center text-white/20 text-sm">
                      Blog card — próximamente
                    </div>
                  </article>
                ))}
            <div className="shrink-0 w-4" />
          </div>
        </div>

        {/* Navigation arrows — se alinean con el carrusel dentro del site-container padre */}
        <div>
          <div className="flex gap-0 mt-6">
            <button
              onClick={slider.prev}
              disabled={!canScrollLeft}
              className={`w-11 h-11 rounded-l-xl flex items-center justify-center transition-all ${
                canScrollLeft
                  ? "bg-brand-purple text-white hover:bg-brand-purple-dark"
                  : "bg-greyscale-dark/50 text-white/30 cursor-not-allowed"
              }`}
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
              onClick={slider.next}
              disabled={!canScrollRight}
              className={`w-11 h-11 rounded-r-xl flex items-center justify-center transition-all ${
                canScrollRight
                  ? "bg-brand-purple text-white hover:bg-brand-purple-dark"
                  : "bg-greyscale-dark/50 text-white/30 cursor-not-allowed"
              }`}
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
