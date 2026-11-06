import { useMemo, useState } from "react";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { localizeHref, tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import { firstTag, postMeta, type PostSummary } from "../../utils/postMeta";
import { ArrowIcon } from "../shared/fx/FxPrimitives";
import PageHero from "../shared/fx/PageHero";

const ALL = "__all__";

function PostCard({ post, locale }: { post: PostSummary; locale: Locale }) {
  const tag = firstTag(post);
  return (
    <a href={localizeHref(`/blog/${post.slug}`, locale)} className="group/post flex flex-col text-fx-ink hover:text-fx-ink">
      <div className="relative h-[280px] overflow-hidden rounded-[28px] bg-[#E6E3E6]">
        {post.coverImage && (
          <img
            src={mediaUrl(post.coverImage)}
            alt={tField(post, "title", locale)}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-fx-out group-hover/post:scale-[1.06]"
          />
        )}
        {tag && (
          <span className="absolute left-4 top-4 rounded-full bg-white/[.92] px-3.5 py-2 text-[13px] font-medium text-fx-ink">{tag}</span>
        )}
        <span className="absolute bottom-4 right-4 grid h-12 w-12 translate-y-2.5 place-items-center rounded-full bg-fx-purple text-white opacity-0 transition-all duration-[450ms] ease-fx-spring group-hover/post:translate-y-0 group-hover/post:-rotate-45 group-hover/post:opacity-100">
          <ArrowIcon size={18} />
        </span>
      </div>
      <div className="mt-5 font-mono text-[12px] font-medium tracking-[.12em] text-fx-muted">{postMeta(post, locale)}</div>
      <h3 className="mb-0 mt-2.5 text-[19px] font-medium leading-[1.35] tracking-[-.01em] text-[#2B252C] transition-colors duration-300 [text-wrap:pretty] group-hover/post:text-fx-purple lg:text-[22px]">
        {tField(post, "title", locale)}
      </h3>
    </a>
  );
}

export default function BlogV2React({ posts, locale = "es" }: { posts: PostSummary[]; locale?: Locale }) {
  const [category, setCategory] = useState(ALL);
  const featured = posts[0];
  const categories = useMemo(() => {
    const seen = new Set<string>();
    posts.forEach((p) => {
      const tag = firstTag(p);
      if (tag) seen.add(tag);
    });
    return Array.from(seen);
  }, [posts]);
  const rest = posts.slice(1);
  const visible = category === ALL ? rest : rest.filter((p) => (p.tags || []).includes(category));

  return (
    <>
      <PageHero
        variant="soft"
        crumb={t("page.blog", locale)}
        title={t("page.blog", locale)}
        locale={locale}
        aside={
          <p
            data-reveal="up"
            data-reveal-distance="56"
            data-reveal-duration="1.2"
            data-reveal-ease="fx"
            data-reveal-delay="0.16"
            className="mb-0 mt-4 max-w-[440px] text-[17px] leading-[1.6] text-fx-body [text-wrap:pretty] lg:mt-0"
          >
            {t("blog.subtitle", locale)}
          </p>
        }
      >
        {featured && (
          <a
            href={localizeHref(`/blog/${featured.slug}`, locale)}
            data-reveal="up"
            data-reveal-distance="56"
            data-reveal-duration="1.2"
            data-reveal-ease="fx"
            data-reveal-delay="0.2"
            className="group/feat relative mt-[34px] block h-[372px] overflow-hidden rounded-[24px] bg-fx-ink text-white hover:text-white lg:mt-14 lg:h-[600px] lg:rounded-[40px]"
          >
            {featured.coverImage && (
              <img
                src={mediaUrl(featured.coverImage)}
                alt={tField(featured, "title", locale)}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-fx-out group-hover/feat:scale-[1.04]"
              />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(43,37,44,0)_35%,rgba(43,37,44,.82)_100%)]" />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 lg:inset-x-14 lg:bottom-14 lg:gap-12">
              <div className="max-w-[760px]">
                <div className="flex flex-wrap items-center gap-2 lg:gap-3.5">
                  <span className="rounded-full bg-fx-purple px-3 py-1.5 text-[12px] font-medium text-white lg:px-3.5 lg:py-2 lg:text-[13px]">
                    {t("blog.latest", locale)}
                  </span>
                  {firstTag(featured) && (
                    <span className="rounded-full bg-white/[.18] px-3.5 py-2 text-[13px] text-white backdrop-blur-[8px]">{firstTag(featured)}</span>
                  )}
                  <span className="font-mono text-[12px] font-medium tracking-[.12em] text-[#E6E3E6]">{postMeta(featured, locale)}</span>
                </div>
                <h2 className="mb-0 mt-3.5 text-[24px] font-medium leading-[1.2] tracking-[-.025em] text-white [text-wrap:balance] lg:mt-5 lg:text-[48px] lg:leading-[1.12]">
                  {tField(featured, "title", locale)}
                </h2>
              </div>
              <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-white text-fx-purple transition-all duration-[450ms] ease-fx-spring group-hover/feat:-rotate-45 group-hover/feat:bg-fx-purple group-hover/feat:text-white lg:h-[72px] lg:w-[72px]">
                <ArrowIcon size={22} />
              </span>
            </div>
          </a>
        )}
      </PageHero>

      <section className="fx-container mb-24 mt-[72px] lg:mb-40 lg:mt-[120px]">
        <div
          data-reveal="up"
          data-reveal-distance="56"
          data-reveal-duration="1.2"
          data-reveal-ease="fx"
          className="flex flex-col items-start gap-[18px] lg:flex-row lg:flex-wrap lg:items-end lg:justify-between lg:gap-10"
        >
          <h2 className="m-0 text-[27px] font-normal leading-[1.1] tracking-[-.02em] text-fx-ink lg:text-[40px]">{t("blog.allPosts", locale)}</h2>
          <div className="flex flex-wrap gap-2">
            {[ALL, ...categories].map((cat) => {
              const active = cat === category;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  aria-pressed={active}
                  className={`h-11 rounded-full border px-5 text-[14px] font-medium transition-all duration-300 hover:border-fx-purple ${
                    active ? "border-fx-purple bg-fx-purple text-white" : "border-[#E6E3E6] bg-white text-fx-ink"
                  }`}
                >
                  {cat === ALL ? t("blog.all", locale) : cat}
                </button>
              );
            })}
          </div>
        </div>
        {visible.length > 0 ? (
          <div className="mt-[34px] grid gap-x-6 gap-y-[22px] lg:mt-14 lg:grid-cols-3 lg:gap-y-12">
            {visible.map((post) => (
              <PostCard key={post.slug} post={post} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="mt-14 rounded-[28px] bg-white p-16 text-center text-[16px] text-fx-body">{t("blog.empty", locale)}</div>
        )}
      </section>
    </>
  );
}
