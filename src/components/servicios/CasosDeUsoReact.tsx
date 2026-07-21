import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import type { Components } from "tinacms/dist/rich-text";
import type {
  SubservicioQuery,
  SubservicioQueryVariables,
} from "../../../tina/__generated__/types";

interface CasosDeUsoProps {
  query: string;
  variables: SubservicioQueryVariables;
  data: SubservicioQuery;
}

/** True when the rich-text node has any non-empty text. */
function hasContent(node: any): boolean {
  const children = node?.children;
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

/** Render bold marks as magenta emphasis, per the design. */
const statementComponents: Components<{}> = {
  bold: (props: any) => (
    <strong className="font-semibold text-[#c65fac]">{props.children}</strong>
  ),
};

export default function CasosDeUsoReact({
  query,
  variables,
  data: initialData,
}: CasosDeUsoProps) {
  const { data } = useTina<SubservicioQuery>({
    query,
    variables,
    data: initialData,
  });

  const casos = data?.subservicio?.casosDeUso;
  if (!casos) return null;

  const showStatement = hasContent(casos.statement);
  if (!casos.eyebrow && !showStatement) return null;

  return (
    <section className="bg-greyscale-darkest pb-16 md:pb-24 mb-8">
      <div className="max-w-[1264px] mx-auto px-6 md:px-16">
        {casos.eyebrow && (
          <div className="border-t border-white/10 pt-8">
            <span
              className="font-mono text-xs md:text-sm tracking-[0.2em] text-greyscale"
              data-tina-field={tinaField(casos, "eyebrow")}
            >
              {casos.eyebrow}
            </span>
          </div>
        )}

        {showStatement && (
          <div
            className="mt-8 max-w-[960px] text-[24px] md:text-[36px] leading-[1.3] font-medium text-greyscale-white"
            data-tina-field={tinaField(casos, "statement")}
          >
            <TinaMarkdown
              content={casos.statement}
              components={statementComponents}
            />
          </div>
        )}
      </div>
    </section>
  );
}
