import { useTina, tinaField } from "tinacms/dist/react";
import type {
  FormasDePagoQuery,
  FormasDePagoQueryVariables,
} from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";

interface HeroFormasPagoProps {
  query: string;
  variables: FormasDePagoQueryVariables;
  data: FormasDePagoQuery;
  locale?: Locale;
}

export default function HeroFormasPagoReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: HeroFormasPagoProps) {
  const { data } = useTina<FormasDePagoQuery>({
    query,
    variables,
    data: initialData,
  });

  const page = data?.formasDePago;
  if (!page) return null;

  return (
    <section
      className="relative overflow-hidden -mt-16"
      style={{ background: "#0a0a0a" }}
    >
      <div className="relative z-10 site-container pt-28 pb-10 md:pt-40 lg:pt-48 lg:pb-12" data-reveal="up">
        <h1
          className="text-[44px] md:text-[60px] leading-[1.15] font-medium text-greyscale-white max-w-[820px] tracking-[-1.6px]"
          data-tina-field={tinaField(page, "heading")}
        >
          {tField(page as any, "heading", locale)}
        </h1>

        {tField(page as any, "intro", locale) && (
          <p
            className="mt-6 text-[22px] leading-[34px] text-greyscale-light max-w-[640px]"
            data-tina-field={tinaField(page, "intro")}
          >
            {tField(page as any, "intro", locale)}
          </p>
        )}
      </div>
    </section>
  );
}
