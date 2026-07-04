import { useRef, useState, useCallback, useEffect } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type {
  HomeQuery,
  HomeQueryVariables,
} from "../../../tina/__generated__/types";
import BlogCard from "./BlogCard";

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
  const carouselRef = useRef<HTMLDivElement>(null);
  const titleH2Ref = useRef<HTMLHeadingElement>(null);
  const [leftPad, setLeftPad] = useState(64);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const title = blogPreview?.title || "Insights & Novedades";
  const buttonText = blogPreview?.buttonText || "Ver todos";
  const buttonUrl = blogPreview?.buttonUrl || "/blog";

  /* ── Measure exact left offset of the h2 text ── */
  useEffect(() => {
    const measure = () => {
      if (titleH2Ref.current) {
        const rect = titleH2Ref.current.getBoundingClientRect();
        setLeftPad(rect.left);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* ── Track scroll position to enable/disable the arrows ── */
  const updateArrows = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = carouselRef.current;
    el?.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el?.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

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
    el.style.cursor = "grabbing";
    el.style.scrollSnapType = "none";
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
      el.style.cursor = "grab";
      el.style.scrollSnapType = "";
    }
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  /* ── Button scroll ── */
  const scroll = (direction: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("article")?.offsetWidth || 400;
    const gap = 24;
    el.scrollBy({
      left: direction === "right" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth",
    });
  };

  const hasPosts = posts.length > 0;

  return (
    <section className="bg-greyscale-darkest rounded-t-3xl py-14 pb-24 md:py-20 md:pb-40">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 lg:px-16">
        {/* Header */}
        <div className="">
          <div className="flex items-center justify-between mb-12">
            <h2
              ref={titleH2Ref}
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
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 select-none blog-carousel"
            style={{
              cursor: "grab",
              // paddingLeft: `${leftPad}px`,
              paddingRight: 0,
              // Keep snap-mandatory from cancelling the padding so the first card
              // rests aligned and scrollLeft is 0 at start (arrow logic depends on it).
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
                      key={i}
                      className="snap-start shrink-0 w-[85%] md:w-[calc(66%-12px)]"
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
                    className="snap-start shrink-0 w-[85%] md:w-[calc(66%-12px)]"
                  >
                    <div className="bg-greyscale-dark/30 border border-greyscale-dark/60 rounded-2xl h-[400px] flex items-center justify-center text-white/20 text-sm">
                      Blog card — próximamente
                    </div>
                  </article>
                ))}
            <div className="shrink-0 w-4" />
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="max-w-[1440px] mx-auto">
          <div className="flex gap-0 mt-6">
            <button
              onClick={() => scroll("left")}
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
              onClick={() => scroll("right")}
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
