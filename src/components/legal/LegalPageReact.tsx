import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import type {
  LegalQuery,
  LegalQueryVariables,
} from "../../../tina/__generated__/types";

interface LegalPageProps {
  query: string;
  variables: LegalQueryVariables;
  data: LegalQuery;
}

export default function LegalPageReact({
  query,
  variables,
  data: initialData,
}: LegalPageProps) {
  const { data } = useTina<LegalQuery>({ query, variables, data: initialData });
  const legal = (data?.legal as any) || (initialData?.legal as any);

  const eyebrow = legal?.eyebrow;
  const title = legal?.title;
  const body = legal?.body;

  return (
    <section className="bg-white">
      <div className="max-w-[820px] mx-auto px-6 pt-28 md:pt-32 pb-10">
        {/* Eyebrow */}
        {eyebrow && (
          <p
            className="text-center text-[13px] font-semibold tracking-[0.12em] text-[#96237A] uppercase mb-4"
            data-tina-field={legal ? tinaField(legal, "eyebrow") : undefined}
          >
            {eyebrow}
          </p>
        )}

        {/* Title */}
        {title && (
          <h1
            className="text-center text-[#0a0a0a] font-semibold text-[34px] md:text-[44px] leading-[1.15] mb-8"
            data-tina-field={legal ? tinaField(legal, "title") : undefined}
          >
            {title}
          </h1>
        )}

        {/* Body — gray card + magenta accents */}
        <div
          className="rounded-2xl bg-[#faf8fa] border border-[#efe7ee] p-6 md:p-10"
          data-tina-field={legal ? tinaField(legal, "body") : undefined}
        >
          <div
            className="prose prose-sm md:prose-base max-w-none
              prose-p:text-[#3f3f3f] prose-p:leading-[26px]
              prose-a:text-[#96237A] prose-a:font-medium prose-a:no-underline hover:prose-a:underline
              prose-strong:text-[#0a0a0a]
              prose-ol:pl-1 marker:text-[#96237A] marker:font-semibold
              prose-li:text-[#3f3f3f] prose-li:my-1
              prose-h3:text-[#96237A] prose-h3:text-[18px] prose-h3:font-semibold prose-h3:mb-3
              prose-blockquote:border-l-4 prose-blockquote:border-[#96237A] prose-blockquote:bg-white
              prose-blockquote:not-italic prose-blockquote:text-[#3f3f3f] prose-blockquote:font-normal
              prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:px-5"
          >
            {body && <TinaMarkdown content={body} />}
          </div>
        </div>
      </div>
    </section>
  );
}
