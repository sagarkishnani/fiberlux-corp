import { useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import { FaPlus, FaMinus } from "react-icons/fa6";
import type {
  ServiceQuery,
  ServiceQueryVariables,
} from "../../../tina/__generated__/types";

interface FaqProps {
  query: string;
  variables: ServiceQueryVariables;
  data: ServiceQuery;
}

interface FaqItem {
  question?: string | null;
  answer?: any;
}

/** True when the rich-text node has any non-empty text. */
function hasContent(answer: any): boolean {
  const children = answer?.children;
  if (!Array.isArray(children)) return false;
  const collect = (nodes: any[]): string =>
    nodes
      .map((n) =>
        typeof n?.text === "string"
          ? n.text
          : Array.isArray(n?.children)
          ? collect(n.children)
          : ""
      )
      .join("");
  return collect(children).trim().length > 0;
}

export default function FaqSolucionReact({
  query,
  variables,
  data: initialData,
}: FaqProps) {
  const { data } = useTina<ServiceQuery>({ query, variables, data: initialData });
  const [open, setOpen] = useState<number | null>(null);

  const faq = data?.service?.faq;
  if (!faq) return null;

  const items = (faq.items || []).filter(Boolean) as FaqItem[];
  if (items.length === 0) return null;

  return (
    <section className="faq-section bg-[#FBEAF4] py-16 md:py-24">
      <div className="max-w-[900px] mx-auto px-6">
        {faq.title && (
          <h2
            className="text-[28px] md:text-[40px] leading-[1.2] font-semibold text-[#3B0E30] text-center mb-10 md:mb-14"
            data-tina-field={tinaField(faq, "title")}
          >
            {faq.title}
          </h2>
        )}

        <div className="flex flex-col gap-3">
          {items.map((item, i) => {
            const isOpen = open === i;
            const showAnswer = isOpen && hasContent(item.answer);
            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#96237A]/10 overflow-hidden"
              >
                <h3 className="m-0">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-trigger-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 text-left px-5 md:px-7 py-4 md:py-5"
                  >
                    <span
                      className="text-body-md font-medium text-[#3B0E30]"
                      data-tina-field={tinaField(item as any, "question")}
                    >
                      {item.question}
                    </span>
                    <span
                      className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#96237A] text-white"
                      aria-hidden="true"
                    >
                      {isOpen ? <FaMinus size={11} /> : <FaPlus size={11} />}
                    </span>
                  </button>
                </h3>

                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  className={`faq-panel grid transition-all duration-300 ease-out ${
                    showAnswer ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      className="px-5 md:px-7 pb-5 md:pb-6 text-body-sm text-[#3B0E30]/80 faq-richtext"
                      data-tina-field={tinaField(item as any, "answer")}
                    >
                      {showAnswer && <TinaMarkdown content={item.answer} />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .faq-richtext p { margin: 0 0 0.75rem; }
        .faq-richtext p:last-child { margin-bottom: 0; }
        .faq-richtext a { color: #96237A; text-decoration: underline; }
        .faq-richtext ul { list-style: disc; padding-left: 1.25rem; margin: 0 0 0.75rem; }
        @media (prefers-reduced-motion: reduce) {
          .faq-panel { transition-duration: 0.01ms !important; }
        }
      `}</style>
    </section>
  );
}
