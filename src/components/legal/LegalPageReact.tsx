import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import type { LegalQuery, LegalQueryVariables } from "../../../tina/__generated__/types";
import { tField, richField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { FaDownload } from "react-icons/fa6";
import LegalHero, { LegalShell } from "./LegalHero";

function withBase(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${import.meta.env.BASE_URL || "/"}/${path}`.replace(/\/{2,}/g, "/");
}

function formatUpdatedAt(value: string | null | undefined, locale: Locale) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale === "en" ? "en-US" : "es-PE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

interface LegalPageProps {
  query: string;
  variables: LegalQueryVariables;
  data: LegalQuery;
  locale?: Locale;
  hasForm?: boolean;
}

export default function LegalPageReact({ query, variables, data: initialData, locale = "es", hasForm = false }: LegalPageProps) {
  const { data } = useTina<LegalQuery>({ query, variables, data: initialData });
  const legal = (data?.legal as any) || (initialData?.legal as any);
  if (!legal) return null;
  const body = richField(legal, "body", locale);
  const pdfUrl = (legal.pdfUrl || "").trim();
  const updatedAt = formatUpdatedAt(legal.updatedAt, locale);

  return (
    <>
      <LegalHero
        locale={locale}
        section={t("legal.section", locale)}
        eyebrow={tField(legal, "eyebrow", locale)}
        title={tField(legal, "title", locale)}
        eyebrowTinaField={tinaField(legal, "eyebrow")}
        titleTinaField={tinaField(legal, "title")}
      />
      {pdfUrl && (
        <div className="mt-6 lg:mt-8">
          <LegalShell>
            <div
              data-reveal="up"
              data-reveal-distance="56"
              data-reveal-duration="1.2"
              data-reveal-ease="fx"
              data-reveal-delay="0.12"
              className="flex flex-wrap items-center gap-x-5 gap-y-3"
            >
              {updatedAt && (
                <span className="text-[14px] text-fx-muted" data-tina-field={tinaField(legal, "updatedAt")}>
                  {t("legal.updated", locale)}: <time dateTime={legal.updatedAt}>{updatedAt}</time>
                </span>
              )}
              <a
                href={withBase(pdfUrl)}
                download
                className="inline-flex items-center gap-2 rounded-full border border-fx-purple px-4 py-2 text-[14px] font-medium text-fx-purple transition-colors duration-300 hover:bg-fx-purple hover:text-white"
                data-tina-field={tinaField(legal, "pdfUrl")}
              >
                <FaDownload size={13} aria-hidden="true" />
                {t("legal.downloadPdf", locale)}
              </a>
            </div>
          </LegalShell>
        </div>
      )}
      {body && (
        <div className={pdfUrl ? "mt-6 lg:mt-8" : "mt-[34px] lg:mt-14"}>
          <LegalShell>
            <div
              data-reveal="up"
              data-reveal-distance="56"
              data-reveal-duration="1.2"
              data-reveal-ease="fx"
              data-reveal-delay="0.08"
              className={
                hasForm
                  ? "fx-intro rounded-[28px] border border-fx-lilac bg-[#FAF0F6] p-5 text-[15px] leading-[1.75] text-fx-ink [text-wrap:pretty] lg:px-11 lg:py-10"
                  : "fx-doc rounded-[28px] border border-fx-line bg-white px-[27px] py-6 text-[16px] leading-[1.8] text-fx-ink lg:px-16 lg:py-14"
              }
              data-tina-field={tinaField(legal, "body")}
            >
              <TinaMarkdown content={body} />
            </div>
          </LegalShell>
        </div>
      )}
    </>
  );
}
