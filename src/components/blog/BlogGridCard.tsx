/**
 * BlogGridCard — Vertical blog card for /blog listing
 *
 * Figma spec:
 * - White background, subtle gray border, rounded-2xl
 * - Image top with rounded corners
 * - Tag pills below image (gray bg, dark text) — shows first tag + "+N"
 * - Title in black, semibold, truncated ~4 lines
 * - readTime in light gray, date in dark gray
 * - Separator line before meta row
 */

interface BlogGridCardProps {
  title: string;
  coverImage?: string | null;
  tags?: (string | null)[] | null;
  readTime?: string | null;
  date?: string | null;
  slug: string;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function BlogGridCard({
  title,
  coverImage,
  tags,
  readTime,
  date,
  slug,
}: BlogGridCardProps) {
  const allTags = (tags || []).filter(Boolean);
  const visibleTags = allTags.slice(0, 1);
  const extraCount = Math.max(0, allTags.length - 1);

  return (
    <a href={`/blog/${slug}`} className="block group h-full">
      <article className="flex flex-col h-full bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden transition-all duration-300 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        {/* Image */}
        <div className="relative overflow-hidden">
          <div className="aspect-[16/10]">
            {coverImage ? (
              <img
                src={coverImage}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-[#f2f3f5] flex items-center justify-center text-[#717274] text-[13px]">
                Sin imagen
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 px-5 pt-4 pb-5">
          {/* Tag pills */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              {visibleTags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-[#f2f3f5] text-[#3f3f3f] text-[11px] font-medium px-2.5 py-1 rounded-md"
                >
                  {tag}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="bg-[#f2f3f5] text-[#717274] text-[11px] font-medium px-2 py-1 rounded-md">
                  +{extraCount}
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h3
            className="text-[#0a0a0a] text-[17px] leading-[24px] font-semibold mb-auto"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </h3>

          {/* Meta */}
          <div className="mt-5 pt-3 border-t border-[#e5e7eb]">
            {readTime && (
              <p className="text-[#b0b0b0] text-[12px] mb-0.5">{readTime}</p>
            )}
            {date && (
              <p className="text-[#3f3f3f] text-[13px] font-medium">
                {formatDate(date)}
              </p>
            )}
          </div>
        </div>
      </article>
    </a>
  );
}