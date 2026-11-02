import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { localizeHref, tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import { renderEmphasis } from "../../utils/emphasis";
import { firstTag, postMeta, type PostSummary } from "../../utils/postMeta";
import { ArrowIcon, Eyebrow, PillLink } from "./fx/FxPrimitives";

interface Props {
  posts: PostSummary[];
  title: string;
  titleTinaField?: string;
  buttonText?: string;
  buttonHref?: string;
  buttonTinaField?: string;
  locale?: Locale;
  sectionClassName?: string;
}

export default function PostCardsSection({
  posts,
  title,
  titleTinaField,
  buttonText,
  buttonHref = "/blog",
  buttonTinaField,
  locale = "es",
  sectionClassName = "fx-container mt-[88px] lg:mt-[140px]",
}: Props) {
  if (!posts.length) return null;
  const href = localizeHref(buttonHref, locale);
  return (
    <section id="insights" className={sectionClassName}>
      <div data-reveal="up" data-reveal-distance="56" data-reveal-duration="1.2" data-reveal-ease="fx" className="lg:flex lg:items-end lg:justify-between">
        <div>
          <Eyebrow>{t("blog.eyebrow", locale)}</Eyebrow>
          <h2
            className="mb-0 mt-3.5 text-[32px] font-normal leading-[1.12] tracking-[-.02em] text-fx-ink lg:mt-[18px] lg:text-[48px] lg:leading-[1.1]"
            data-tina-field={titleTinaField}
          >
            {renderEmphasis(title)}
          </h2>
        </div>
        {buttonText && (
          <PillLink href={href} variant="lilac" className="hidden lg:inline-flex" data-tina-field={buttonTinaField}>
            {buttonText}
          </PillLink>
        )}
      </div>
      <div className="mt-7 flex flex-col gap-3 lg:mt-14 lg:grid lg:grid-cols-3 lg:gap-6">
        {posts.map((post, i) => {
          const tag = firstTag(post);
          return (
            <a
              key={i}
              href={localizeHref(`/blog/${post.slug}`, locale)}
              data-reveal="up"
              data-reveal-distance="56"
              data-reveal-duration="1.2"
              data-reveal-ease="fx"
              className="group/post flex flex-col overflow-hidden rounded-[22px] border border-fx-line bg-white text-fx-ink transition-[box-shadow,border-color,transform] duration-500 hover:border-fx-line-strong hover:text-fx-ink active:scale-[.985] lg:rounded-[24px] lg:hover:shadow-[0_30px_60px_-30px_rgba(150,33,122,.35)] lg:active:scale-100"
            >
              <div className="relative aspect-video overflow-hidden bg-[#EFECEF] lg:aspect-[16/10]">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#EFECEF_0_12px,#F7F5F7_12px_24px)]" />
                {post.coverImage && (
                  <img
                    src={mediaUrl(post.coverImage)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-fx-out group-hover/post:scale-[1.07]"
                  />
                )}
                {tag && (
                  <span className="absolute left-3.5 top-3.5 rounded-full bg-white px-[11px] py-[5px] text-[11px] font-medium text-fx-purple lg:left-5 lg:top-5 lg:px-3 lg:py-1.5 lg:text-[12px]">
                    {tag}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-[18px] lg:p-7">
                <h3 className="m-0 text-[18px] font-medium leading-[1.35] text-fx-ink transition-colors duration-300 [text-wrap:pretty] group-hover/post:text-fx-purple lg:text-[22px]">
                  {tField(post, "title", locale)}
                </h3>
                <div className="mt-4 flex items-center justify-between lg:mt-auto lg:pt-7">
                  <span className="font-mono text-[12px] text-fx-muted lg:text-[13px]">{postMeta(post, locale)}</span>
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-fx-line-strong text-fx-ink transition-all duration-[450ms] ease-fx-spring group-hover/post:-rotate-45 group-hover/post:border-fx-purple group-hover/post:bg-fx-purple group-hover/post:text-white lg:h-10 lg:w-10">
                    <ArrowIcon size={15} />
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
      {buttonText && (
        <a
          href={href}
          className="mt-4 flex h-14 items-center justify-between rounded-full bg-fx-lilac pl-6 pr-2 text-[15px] font-medium text-fx-ink active:bg-fx-line-strong lg:hidden"
        >
          {t("blog.viewAllMobile", locale)}
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-fx-purple">
            <ArrowIcon size={15} />
          </span>
        </a>
      )}
    </section>
  );
}
