import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import type { LegalQuery, LegalQueryVariables } from "../../../tina/__generated__/types";
import { tField, richField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import LegalHero, { LegalShell } from "./LegalHero";

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
      {body && (
        <div className="mt-[34px] lg:mt-14">
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
