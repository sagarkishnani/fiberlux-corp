interface BlogCardProps {
  title: string;
  coverImage?: string | null;
  tag?: string | null;
  readTime?: string | null;
  date?: string | null;
  slug: string;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function BlogCard({
  title,
  coverImage,
  tag,
  readTime,
  date,
  slug,
}: BlogCardProps) {
  return (
    <a href={`/blog/${slug}`} className="block group h-full" draggable={false}>
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] bg-greyscale-dark/30 border border-greyscale-dark/60 rounded-2xl overflow-hidden h-full min-h-[280px] md:min-h-[340px] transition-all duration-300">
        <div className="relative overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full min-h-[200px] md:min-h-full bg-greyscale-dark flex items-center justify-center text-white/20 text-sm">
              Sin imagen
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between p-6 md:p-8">
          <div>
            {tag && (
              <span className="inline-block bg-greyscale-dark/80 text-white/80 text-xs font-medium px-3 py-1 rounded-md mb-4">
                {tag}
              </span>
            )}
            <h3 className="text-white text-xl md:text-2xl font-semibold leading-snug group-hover:text-brand-purple-light transition-colors">
              {title}
            </h3>
          </div>
          <div className="mt-6">
            {readTime && (
              <p className="text-white/40 text-sm mb-1">{readTime}</p>
            )}
            {date && (
              <p className="text-white text-sm font-medium">
                {formatDate(date)}
              </p>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}