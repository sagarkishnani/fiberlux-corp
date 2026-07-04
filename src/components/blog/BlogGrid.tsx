import { useState, useMemo } from 'react';
import BlogGridCard from './BlogGridCard';

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

interface BlogGridProps {
  posts: PostEdge[];
  availableTags: string[];
  postsPerPage?: number;
}

const POSTS_PER_PAGE = 9;

export default function BlogGrid({
  posts,
  availableTags,
  postsPerPage = POSTS_PER_PAGE,
}: BlogGridProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Filter posts ── */
  const filteredPosts = useMemo(() => {
    let result = posts.filter((edge) => edge?.node != null);
    if (activeTag) {
      result = result.filter((edge) =>
        edge.node?.tags?.some((t) => t === activeTag)
      );
    }
    return result;
  }, [posts, activeTag]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (safeCurrentPage - 1) * postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIdx, startIdx + postsPerPage);

  const handleTagClick = (tag: string | null) => {
    setActiveTag(tag);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    document.getElementById('blog-grid-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  /* ── Pagination range (max 5 visible) ── */
  const getPageRange = (): number[] => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, safeCurrentPage - 2);
    let end = start + maxVisible - 1;
    if (end > totalPages) {
      end = totalPages;
      start = end - maxVisible + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <section
      id="blog-grid-section"
      className="py-14 md:py-24 bg-white rounded-t-3xl"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-16">
        {/* Section title — italic bold, matching Figma */}
        <h2
          className="text-[#0a0a0a] font-semibold mb-6"
          style={{ fontSize: '48px', lineHeight: '56px' }}
        >
          Últimas publicaciones
        </h2>

        {/* Filters */}
        <div className="mb-10">
          {/* "Filtros" label */}
          <div className="flex items-center gap-3 mb-4">
            <svg
              className="w-4 h-4 text-[#717274]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="text-[#717274] text-[13px]">Filtros</span>
          </div>

          {/* Tag pills */}
          <div className="flex flex-wrap gap-2.5">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(activeTag === tag ? null : tag)}
                className={`px-5 py-2 rounded-full text-[13px] font-medium border transition-all duration-200 ${
                  activeTag === tag
                    ? 'bg-[#96237A] border-[#96237A] text-white'
                    : 'bg-white border-[#d1d5db] text-[#3f3f3f] hover:border-[#9ca3af] hover:text-[#0a0a0a]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {paginatedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPosts.map((edge) => {
              const post = edge.node!;
              return (
                <BlogGridCard
                  key={post._sys.filename}
                  title={post.title || 'Sin título'}
                  coverImage={post.coverImage}
                  tags={post.tags}
                  readTime={post.readTime}
                  date={post.date}
                  slug={post._sys.filename}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-20 text-[#717274] text-[15px]">
            No se encontraron publicaciones
            {activeTag ? ` con la etiqueta "${activeTag}"` : ''}.
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-14">
            {/* Prev */}
            <button
              onClick={() => goToPage(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                safeCurrentPage === 1
                  ? 'text-[#d1d5db] cursor-not-allowed'
                  : 'text-[#717274] hover:bg-[#f2f3f5] hover:text-[#0a0a0a]'
              }`}
              aria-label="Página anterior"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* First page + ellipsis */}
            {getPageRange()[0] > 1 && (
              <>
                <button
                  onClick={() => goToPage(1)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-[14px] font-medium text-[#717274] hover:bg-[#f2f3f5] hover:text-[#0a0a0a] transition-all duration-200"
                >
                  1
                </button>
                {getPageRange()[0] > 2 && (
                  <span className="w-10 h-10 flex items-center justify-center text-[#d1d5db] text-[14px]">
                    …
                  </span>
                )}
              </>
            )}

            {/* Page numbers */}
            {getPageRange().map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-[14px] font-medium transition-all duration-200 ${
                  page === safeCurrentPage
                    ? 'bg-[#96237A] text-white'
                    : 'text-[#717274] hover:bg-[#f2f3f5] hover:text-[#0a0a0a]'
                }`}
              >
                {page}
              </button>
            ))}

            {/* Last page + ellipsis */}
            {getPageRange()[getPageRange().length - 1] < totalPages && (
              <>
                {getPageRange()[getPageRange().length - 1] < totalPages - 1 && (
                  <span className="w-10 h-10 flex items-center justify-center text-[#d1d5db] text-[14px]">
                    …
                  </span>
                )}
                <button
                  onClick={() => goToPage(totalPages)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-[14px] font-medium text-[#717274] hover:bg-[#f2f3f5] hover:text-[#0a0a0a] transition-all duration-200"
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* Next */}
            <button
              onClick={() => goToPage(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                safeCurrentPage === totalPages
                  ? 'text-[#d1d5db] cursor-not-allowed'
                  : 'text-[#717274] hover:bg-[#f2f3f5] hover:text-[#0a0a0a]'
              }`}
              aria-label="Página siguiente"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}