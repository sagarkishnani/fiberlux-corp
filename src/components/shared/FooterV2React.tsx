import { useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { GlobalQuery, GlobalQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { localizeHref, tField } from "../../utils/i18n";
import { ChevronDownIcon, fxAsset, socialIconSrc } from "./fx/FxPrimitives";
import { mediaUrl } from "../../utils/mediaUrl";

interface FooterV2Props {
  query: string;
  variables: GlobalQueryVariables;
  data: GlobalQuery;
  locale?: Locale;
}

type LinkItem = { text?: string | null; text_en?: string | null; url?: string | null; external?: boolean | null };
type ColumnItem = { title?: string | null; title_en?: string | null; links?: (LinkItem | null)[] | null };

function FooterLink({ link, locale, className }: { link: LinkItem; locale: Locale; className: string }) {
  return (
    <a
      href={localizeHref(link.url, locale, link.external) || "#"}
      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={className}
      data-tina-field={tinaField(link as any, "text")}
    >
      {tField(link, "text", locale)}
    </a>
  );
}

export default function FooterV2React({ query, variables, data: initialData, locale = "es" }: FooterV2Props) {
  const { data } = useTina<GlobalQuery>({ query, variables, data: initialData });
  const footer = data?.global?.footer;
  const [openGroup, setOpenGroup] = useState(-1);
  if (!footer) return null;

  const columns = (footer.columns ?? []).filter(Boolean) as ColumnItem[];
  const middle = columns.slice(0, 2);
  const right = columns.slice(2);
  const socials = ((footer.social ?? []).filter(Boolean) as { platform?: string | null; url?: string | null }[]).filter((s) =>
    socialIconSrc(s.platform)
  );
  const copyright = (tField(footer as any, "copyright", locale) || "Copyright © {year} Fiberlux.").replace(
    "{year}",
    String(new Date().getFullYear())
  );
  const agencyLogo = mediaUrl((footer as any).agencyLogo) || fxAsset("twn-logo.svg");
  const agencyUrl = (footer as any).agencyUrl as string | null | undefined;

  const desktopColumn = (column: ColumnItem, key: number) => (
    <div key={key}>
      <div className="text-[15px] font-semibold" data-tina-field={tinaField(column as any, "title")}>
        {tField(column, "title", locale)}
      </div>
      <div className="mt-[18px] flex flex-col gap-3">
        {((column.links ?? []).filter(Boolean) as LinkItem[]).map((link, i) => (
          <FooterLink
            key={i}
            link={link}
            locale={locale}
            className="self-start text-[14px] text-fx-blush-soft transition-[color,transform] duration-300 hover:translate-x-1 hover:text-white"
          />
        ))}
      </div>
    </div>
  );

  const socialRow = (size: string) =>
    socials.map((s, i) => (
      <a
        key={i}
        href={s.url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={s.platform || ""}
        className={`block ${size} transition-[transform,filter] duration-300 ease-fx-spring lg:hover:-translate-y-[3px] lg:hover:brightness-[.8]`}
        data-tina-field={tinaField(s as any, "platform")}
      >
        <img src={socialIconSrc(s.platform)} alt={s.platform || ""} className={`block ${size}`} />
      </a>
    ));

  return (
    <footer className="rounded-t-[28px] bg-fx-purple-deep text-white lg:rounded-t-[40px]">
      <div className="fx-container pb-[120px] pt-14 lg:pb-10 lg:pt-24">
        <div className="lg:grid lg:grid-cols-[1.3fr_1fr_1.3fr] lg:gap-16">
          <div>
            <h2
              className="m-0 text-[32px] font-semibold leading-[1.12] tracking-[-.02em] lg:max-w-[460px] lg:text-[48px] lg:leading-[1.1]"
              data-tina-field={tinaField(footer as any, "tagline")}
            >
              {tField(footer as any, "tagline", locale)}
            </h2>
            <div className="mt-6 flex gap-2.5 lg:mt-10 lg:gap-3">{socialRow("h-11 w-11 lg:h-10 lg:w-10")}</div>
          </div>
          <div className="hidden flex-col gap-10 lg:flex">{middle.map(desktopColumn)}</div>
          <div className="hidden flex-col gap-10 lg:flex">{right.map((c, i) => desktopColumn(c, i + 2))}</div>
        </div>

        <div className="mt-10 border-t border-white/15 lg:hidden">
          {columns.map((column, gi) => {
            const open = openGroup === gi;
            return (
              <div key={gi} className="border-b border-white/15">
                <button
                  type="button"
                  onClick={() => setOpenGroup(open ? -1 : gi)}
                  aria-expanded={open}
                  className="flex h-[60px] w-full items-center justify-between text-[15px] font-semibold text-white"
                >
                  {tField(column, "title", locale)}
                  <ChevronDownIcon size={16} className={`transition-transform duration-[400ms] ease-fx-spring ${open ? "rotate-180" : ""}`} />
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.65,0,.35,1)]"
                  style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col pb-4">
                      {((column.links ?? []).filter(Boolean) as LinkItem[]).map((link, i) => (
                        <FooterLink
                          key={i}
                          link={link}
                          locale={locale}
                          className="flex min-h-10 items-center text-[14px] text-fx-blush-soft active:text-white"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-5 lg:mt-24 lg:flex-row lg:items-center lg:justify-between lg:border-t lg:border-white/15 lg:pt-8">
          <img src={fxAsset("logo-white.svg")} alt="Fiberlux" className="h-auto w-[132px] lg:w-[150px]" />
          <div className="flex flex-wrap items-center gap-2 text-[12px] leading-[1.6] text-fx-blush-soft lg:gap-3 lg:text-[14px]">
            <span data-tina-field={tinaField(footer as any, "copyright")}>{copyright}</span>
            {agencyUrl ? (
              <a
                href={agencyUrl}
                target="_blank"
                rel="noopener"
                aria-label="TWNSTUDIOS"
                className="flex transition-opacity duration-300 hover:opacity-70"
                data-tina-field={tinaField(footer as any, "agencyLogo")}
              >
                <img src={agencyLogo} alt="TWNSTUDIOS" className="block h-[13px] w-auto lg:h-[15px]" />
              </a>
            ) : (
              <img src={agencyLogo} alt="TWNSTUDIOS" className="block h-[13px] w-auto lg:h-[15px]" />
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
