import { useEffect, useMemo, useRef, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import type { PostQuery, PostQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { localizeHref, richField, tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import { firstTag, postMeta, type PostSummary } from "../../utils/postMeta";
import { ArrowIcon, PillLink } from "../shared/fx/FxPrimitives";
import { clamp, prefersReducedMotion, useScrollFrame } from "../home/useScrollFrame";

interface Props {
  query: string;
  variables: PostQueryVariables;
  data: PostQuery;
  locale?: Locale;
  related: PostSummary[];
}

const MONTHS_LONG_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_LONG_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function longDate(value: string | null | undefined, locale: Locale): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return locale === "en"
    ? `${MONTHS_LONG_EN[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
    : `${d.getUTCDate()} de ${MONTHS_LONG_ES[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function nodeText(node: any): string {
  if (!node) return "";
  if (typeof node.text === "string") return node.text;
  return (node.children || []).map(nodeText).join("");
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  );
}

function ShareButtons({ title, locale }: { title: string; locale: Locale }) {
  const [copied, setCopied] = useState(false);
  const button =
    "grid h-[52px] w-[52px] place-items-center rounded-[14px] border border-fx-line bg-white text-fx-ink transition-[background,color,border-color] duration-300 hover:border-fx-purple hover:bg-fx-purple hover:text-white";
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return;
      }
    }
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank", "noopener");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="flex gap-2">
      <button type="button" aria-label={t("article.share", locale)} onClick={share} className={button}>
        <ShareIcon />
      </button>
      <button type="button" aria-label={copied ? t("article.copied", locale) : t("article.copy", locale)} onClick={copy} className={button}>
        <LinkIcon />
      </button>
    </div>
  );
}

export default function ArticleV2React({ query, variables, data: initialData, locale = "es", related }: Props) {
  const { data } = useTina<PostQuery>({ query, variables, data: initialData });
  const post = (data?.post || initialData?.post) as any;
  const body = post ? richField(post, "body", locale) ?? post.body : null;
  const toc = useMemo(
    () =>
      ((body?.children || []) as any[])
        .filter((n) => n?.type === "h2")
        .map((n) => {
          const label = nodeText(n);
          return { id: slugify(label), label };
        })
        .filter((h) => h.id),
    [body]
  );
  const [activeId, setActiveId] = useState(toc[0]?.id || "");
  const heroImgRef = useRef<HTMLImageElement>(null);
  const tocBarRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    articleRef.current?.querySelectorAll("h2").forEach((h) => {
      h.id = slugify(h.textContent || "");
      h.classList.add("scroll-mt-[120px]");
    });
  }, [body]);

  useScrollFrame(() => {
    const img = heroImgRef.current;
    if (img && !prefersReducedMotion()) {
      const rect = img.parentElement!.getBoundingClientRect();
      const p = clamp(1 - rect.bottom / (window.innerHeight + rect.height), 0, 1);
      img.style.transform = `translate3d(0,${p * 8}%,0)`;
    }
    if (!toc.length) return;
    const line = window.innerHeight * 0.3;
    let current = toc[0].id;
    toc.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el && el.getBoundingClientRect().top < line) current = h.id;
    });
    setActiveId((prev) => (prev === current ? prev : current));
    if (tocBarRef.current) {
      const index = toc.findIndex((h) => h.id === current);
      tocBarRef.current.style.height = `${((index + 1) / toc.length) * 100}%`;
    }
  }, [toc]);

  useEffect(() => {
    if (toc.length) setActiveId(toc[0].id);
  }, [toc]);

  if (!post) return null;
  const title = tField(post, "title", locale);
  const tags = ((post.tags || []).filter(Boolean) as string[]);
  return (
    <>
      <section className="fx-container relative pt-5 lg:pt-12">
        <div data-reveal="up" data-reveal-distance="56" data-reveal-duration="1.2" data-reveal-ease="fx" className="flex items-center gap-2 lg:justify-between">
          <a
            href={localizeHref("/blog", locale)}
            className="group/back inline-flex h-[52px] min-w-0 flex-1 items-center gap-2.5 whitespace-nowrap rounded-[14px] border border-fx-line bg-white pl-3.5 pr-4 font-mono text-[12px] font-medium tracking-[.08em] lg:flex-none lg:gap-3.5 lg:pl-[18px] lg:pr-6 lg:text-[13px] lg:tracking-[.14em] text-fx-ink transition-[border-color,color] duration-300 hover:border-fx-purple hover:text-fx-purple"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 transition-transform duration-300 group-hover/back:-translate-x-1">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            {t("article.back", locale)}
          </a>
          <ShareButtons title={title} locale={locale} />
        </div>
        <h1
          data-reveal="up"
          data-reveal-distance="56"
          data-reveal-duration="1.2"
          data-reveal-ease="fx"
          data-reveal-delay="0.08"
          className="mb-0 mt-[43px] max-w-[1080px] text-[43px] font-semibold leading-[1.04] tracking-[-.04em] text-fx-ink [text-wrap:balance] lg:mt-[72px] lg:text-[72px]"
          data-tina-field={tinaField(post, "title")}
        >
          {title}
        </h1>
        <div
          data-reveal="up"
          data-reveal-distance="56"
          data-reveal-duration="1.2"
          data-reveal-ease="fx"
          data-reveal-delay="0.14"
          className="mt-8 flex flex-col gap-4 lg:mt-12 lg:flex-row lg:items-center lg:justify-between lg:gap-6"
        >
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-lg bg-[#FAF0F6] px-3.5 py-2 font-mono text-[13px] font-medium tracking-[.08em] text-fx-purple">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[16px] text-fx-muted">
            {post.readTime && <span>{post.readTime} {t("article.reading", locale)}</span>}
            {post.readTime && post.date && <span className="text-fx-line-strong">/</span>}
            {post.date && <span>{longDate(post.date, locale)}</span>}
          </div>
        </div>
        {post.coverImage && (
          <div
            data-reveal="scale"
            data-reveal-duration="1.2"
            data-reveal-ease="fx"
            data-reveal-delay="0.2"
            className="mt-8 rounded-[28px] border border-fx-line bg-white p-2 lg:mt-12 lg:rounded-[40px]"
          >
            <div className="relative h-[384px] overflow-hidden rounded-[24px] bg-fx-ink lg:h-[620px] lg:rounded-[32px]" data-tina-field={tinaField(post, "coverImage")}>
              <img ref={heroImgRef} src={mediaUrl(post.coverImage)} alt={title} className="absolute left-0 top-[-8%] h-[116%] w-full object-cover will-change-transform" />
            </div>
          </div>
        )}
      </section>

      <section className="fx-container mt-[58px] grid items-start gap-9 lg:mt-24 lg:grid-cols-[minmax(0,760px)_380px] lg:justify-between lg:gap-20">
        <article ref={articleRef} className="fx-art text-[19px] font-light leading-[1.75] text-fx-ink" data-tina-field={tinaField(post, "body")}>
          {tField(post, "excerpt", locale) && (
            <p className="!mb-7 text-[24px] font-normal leading-[1.55] text-fx-ink [text-wrap:pretty]">{tField(post, "excerpt", locale)}</p>
          )}
          {body && <TinaMarkdown content={body} />}
        </article>
        <aside className="lg:sticky lg:top-[120px]">
          {toc.length > 0 && (
            <>
              <div className="font-mono text-[13px] font-medium tracking-[.16em] text-fx-muted">{t("article.toc", locale)}</div>
              <nav className="relative mt-5 rounded-[24px] border border-fx-line bg-white py-7 pl-7 pr-10">
                <div className="absolute bottom-7 right-5 top-7 w-1 rounded bg-fx-soft">
                  <div ref={tocBarRef} className="h-0 w-full rounded bg-fx-purple transition-[height] duration-[400ms] ease-fx-out" />
                </div>
                <div className="flex flex-col gap-[18px]">
                  {toc.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className={`text-[16px] font-medium leading-[1.4] transition-colors duration-300 hover:text-fx-purple ${h.id === activeId ? "text-fx-purple" : "text-[#B3ACB4]"}`}
                    >
                      {h.label}
                    </a>
                  ))}
                </div>
              </nav>
            </>
          )}
          <div className="mt-10 font-mono text-[13px] font-medium tracking-[.16em] text-fx-muted">{t("article.shareTitle", locale)}</div>
          <div className="mt-4">
            <ShareButtons title={title} locale={locale} />
          </div>
          <a
            href={localizeHref("/contacto", locale)}
            className="group/cta mt-10 block rounded-[24px] bg-fx-purple p-8 text-white transition-colors duration-300 hover:bg-fx-purple-hover hover:text-white"
          >
            <div className="text-[20px] font-medium leading-[1.35]">{t("article.ctaTitle", locale)}</div>
            <div className="mt-5 flex items-center justify-between text-[14px] text-fx-blush">
              {t("article.ctaText", locale)}
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-fx-purple transition-transform duration-[450ms] ease-fx-spring group-hover/cta:-rotate-45">
                <ArrowIcon size={15} />
              </span>
            </div>
          </a>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="fx-container mt-24 pb-24 lg:mt-[140px] lg:pb-40">
          <div data-reveal="up" data-reveal-distance="56" data-reveal-duration="1.2" data-reveal-ease="fx" className="flex items-end justify-between gap-6">
            <h2 className="m-0 text-[30px] font-medium leading-[1.1] tracking-[-.025em] text-fx-ink lg:text-[44px]">{t("article.keepReading", locale)}</h2>
            <a href={localizeHref("/blog", locale)} className="hidden text-[15px] font-medium text-fx-purple hover:text-fx-purple-deep lg:inline">
              {t("blog.viewAllMobile", locale)}
            </a>
          </div>
          <div className="mt-8 grid gap-3 lg:mt-12 lg:grid-cols-3 lg:gap-6">
            {related.map((item) => (
              <a
                key={item.slug}
                href={localizeHref(`/blog/${item.slug}`, locale)}
                data-reveal="up"
                data-reveal-distance="56"
                data-reveal-duration="1.2"
                data-reveal-ease="fx"
                className="group/rel flex flex-col overflow-hidden rounded-[22px] border border-fx-line bg-white text-fx-ink transition-[box-shadow,border-color] duration-500 hover:border-fx-line-strong hover:text-fx-ink lg:rounded-[24px] lg:hover:shadow-[0_30px_60px_-30px_rgba(150,33,122,.35)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#EFECEF]">
                  {item.coverImage && (
                    <img
                      src={mediaUrl(item.coverImage)}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-fx-out group-hover/rel:scale-[1.07]"
                    />
                  )}
                  {firstTag(item) && (
                    <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-fx-purple">{firstTag(item)}</span>
                  )}
                </div>
                <div className="p-7">
                  <h3 className="m-0 text-[20px] font-medium leading-[1.4] transition-colors duration-300 [text-wrap:pretty] group-hover/rel:text-fx-purple">
                    {tField(item, "title", locale)}
                  </h3>
                  <div className="mt-5 font-mono text-[13px] text-fx-muted">{postMeta(item, locale)}</div>
                </div>
              </a>
            ))}
          </div>
          <div className="mt-6 flex flex-col lg:hidden">
            <PillLink href={localizeHref("/blog", locale)} variant="lilac" size="lg" className="justify-between">
              {t("blog.viewAllMobile", locale)}
            </PillLink>
          </div>
        </section>
      )}
    </>
  );
}
