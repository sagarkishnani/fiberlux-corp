import { useTina, tinaField } from 'tinacms/dist/react';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import type {
  PostQuery,
  PostQueryVariables,
} from '../../../tina/__generated__/types';
import BlogGridCard from './BlogGridCard';

/* ── Types ── */
interface RelatedPost {
  title?: string | null;
  coverImage?: string | null;
  tags?: (string | null)[] | null;
  readTime?: string | null;
  date?: string | null;
  _sys: { filename: string };
}

interface BlogDetailProps {
  query: string;
  variables: PostQueryVariables;
  data: PostQuery;
  relatedPosts?: RelatedPost[];
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/* ── Share buttons (body sidebar + mobile) ── */
function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://fiberlux.com/blog/${slug}`;

  const encodedUrl = encodeURIComponent(url);

  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      label: 'Copiar enlace',
      href: '#',
      onClick: () => {
        navigator.clipboard?.writeText(url);
      },
      icon: (
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
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <p className="text-[#717274] text-[13px] font-medium mb-3">Compartir</p>
      <div className="flex gap-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={(e) => {
              if (link.onClick) {
                e.preventDefault();
                link.onClick();
              }
            }}
            target={link.href !== '#' ? '_blank' : undefined}
            rel={link.href !== '#' ? 'noopener noreferrer' : undefined}
            className="w-9 h-9 rounded-full border border-[#e5e7eb] flex items-center justify-center text-[#717274] hover:text-[#96237A] hover:border-[#96237A] transition-all"
            aria-label={link.label}
          >
            {link.icon}
          </a>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function BlogDetailReact({
  query,
  variables,
  data: initialData,
  relatedPosts = [],
}: BlogDetailProps) {
  const { data } = useTina<PostQuery>({ query, variables, data: initialData });

  const post = data?.post || initialData?.post;
  if (!post) return null;

  const { title, coverImage, date, readTime, tags, body, _sys } = post;
  const allTags = (tags || []).filter(Boolean) as string[];
  const slug = _sys.filename;
  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://fiberlux.com/blog/${slug}`;

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section
        className="relative overflow-hidden -mt-16"
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
        {/* All hero content shares same max-w as body */}
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 pt-28 md:pt-36">
          {/* Top row: Back pill + share/link icons */}
          <div className="flex items-center justify-between mb-12 md:mb-16">
            {/* Back pill */}
            <a
              href="/blog"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-[13px] font-medium px-4 py-2 rounded-full hover:bg-white/15 transition-colors !text-white"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Atrás
            </a>

            {/* Share + link icons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title, url: shareUrl });
                  }
                }}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all"
                aria-label="Compartir"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              <button
                onClick={() => { navigator.clipboard?.writeText(shareUrl); }}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all"
                aria-label="Copiar enlace"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-[32px] md:text-[48px] leading-[38px] md:leading-[56px] font-medium text-white mb-8"
            data-tina-field={tinaField(post, 'title')}
          >
            {title}
          </h1>

          {/* Tags + meta row */}
          <div className="flex flex-wrap items-center gap-3 mb-10">
            {allTags.map((tag) => (
              <span
                key={tag}
                className="border border-white/30 text-white/80 text-[12px] font-medium px-3.5 py-1.5 rounded-full"
              >
                {tag}
              </span>
            ))}
            {(readTime || date) && allTags.length > 0 && (
              <div className="flex-1" />
            )}
            {(readTime || date) && (
              <span className="text-white/50 text-[13px] italic">
                {readTime && <>{readTime} lectura</>}
                {readTime && date && (
                  <span className="mx-2.5 text-white/30">/</span>
                )}
                {date && formatDate(date)}
              </span>
            )}
          </div>

          {/* Cover image — same width as content */}
          {coverImage && (
            <div
              className="rounded-t-2xl overflow-hidden"
              data-tina-field={tinaField(post, 'coverImage')}
            >
              <img
                src={coverImage}
                alt={title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* ═══ BODY ═══ */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-10 md:gap-14">
            {/* Article content */}
            <article
              className="prose prose-lg max-w-none
                prose-headings:text-[#0a0a0a] prose-headings:font-bold
                prose-h2:text-[22px] prose-h2:leading-[30px] prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-[18px] prose-h3:leading-[26px] prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-[#3f3f3f] prose-p:text-[15px] prose-p:leading-[26px] prose-p:mb-4
                prose-a:text-[#96237A] prose-a:underline prose-a:decoration-[#96237A]/30 hover:prose-a:decoration-[#96237A]
                prose-strong:text-[#0a0a0a]
                prose-ul:text-[#3f3f3f] prose-ul:text-[15px] prose-ul:leading-[26px]
                prose-li:text-[#3f3f3f] prose-li:mb-1.5
                prose-img:rounded-xl prose-img:my-8
                prose-blockquote:border-l-[#96237A] prose-blockquote:text-[#717274] prose-blockquote:italic
              "
              data-tina-field={tinaField(post, 'body')}
            >
              {body && <TinaMarkdown content={body} />}
            </article>

            {/* Sidebar — share (desktop only) */}
            <aside className="hidden md:block">
              <div className="sticky top-28">
                <ShareButtons title={title} slug={slug} />
              </div>
            </aside>
          </div>

          {/* Mobile share */}
          <div className="md:hidden mt-8 pt-6 border-t border-[#e5e7eb]">
            <ShareButtons title={title} slug={slug} />
          </div>
        </div>
      </section>

      {/* ═══ NEWSLETTER ═══ */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-[960px] mx-auto px-6 md:px-10">
          <div
            className="rounded-2xl overflow-hidden p-8 md:p-12 relative"
            style={{
              background:
                'linear-gradient(135deg, #650F50 0%, #96237A 50%, #3B0E30 100%)',
            }}
          >
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
              <div>
                <h3 className="text-[28px] md:text-[32px] leading-[34px] md:leading-[40px] font-bold text-white mb-3">
                  Suscríbete a nuestro newsletter
                </h3>
                <p className="text-white/70 text-[14px] leading-[22px] mb-6">
                  Entérate de lo último sobre tecnología para empresas y recibe
                  información para potenciar tu conexión.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Tu correo electrónico"
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors"
                  />
                  <button className="bg-white text-[#96237A] font-semibold text-[14px] px-6 py-2.5 rounded-lg hover:bg-white/90 transition-colors shrink-0">
                    Enviar
                  </button>
                </div>
              </div>
              {/* Mail icon */}
              <div className="hidden md:flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm">
                <svg
                  className="w-10 h-10 text-white/80"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ RELATED POSTS ═══ */}
      {relatedPosts.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-[1440px] mx-auto px-6 md:px-16">
            <h2 className="text-[#0a0a0a] text-[32px] md:text-[40px] leading-[40px] md:leading-[48px] font-bold mb-10">
              Publicaciones relacionadas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.slice(0, 3).map((rp) => (
                <BlogGridCard
                  key={rp._sys.filename}
                  title={rp.title || 'Sin título'}
                  coverImage={rp.coverImage}
                  tags={rp.tags}
                  readTime={rp.readTime}
                  date={rp.date}
                  slug={rp._sys.filename}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}