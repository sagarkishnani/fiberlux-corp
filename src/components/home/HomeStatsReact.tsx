import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { tField } from "../../utils/i18n";

interface Props {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  locale?: Locale;
}

const COUNTABLE = /^[+-]?\d+[A-Za-z]*$/;

function splitFigure(raw: string) {
  const [main, ...rest] = raw.trim().split(/\s+/);
  return { main: main || "", unit: rest.join(" ") };
}

export default function HomeStatsReact({ query, variables, data: initialData, locale = "es" }: Props) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });
  const items = ((data?.home?.stats?.items || initialData?.home?.stats?.items || []).filter(Boolean) as any[]).slice(0, 4);
  if (!items.length) return null;

  return (
    <section className="fx-container relative z-[2] mt-10 lg:mt-5">
      <div
        data-reveal="scale"
        data-reveal-duration="1.2"
        data-reveal-ease="fx"
        className="relative grid grid-cols-2 overflow-hidden rounded-[24px] bg-fx-purple p-2 text-white lg:grid-cols-4 lg:rounded-[32px] lg:px-16 lg:py-[52px]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[30px] -top-[30px] h-[160px] w-[240px] bg-[radial-gradient(rgba(255,255,255,.16)_2px,transparent_2.5px)] bg-[length:14px_14px] [mask-image:radial-gradient(closest-side,#000,transparent)] lg:-right-10 lg:-top-10 lg:h-[260px] lg:w-[520px] lg:bg-[length:16px_16px]"
        />
        {items.map((item, i) => {
          const { main, unit } = splitFigure(item.number || "");
          const countable = COUNTABLE.test(main);
          return (
            <div
              key={i}
              className={[
                "relative px-[18px] py-[22px] lg:py-0",
                i % 2 === 0 ? "border-r border-white/20 lg:border-r-0" : "",
                i < 2 ? "border-b border-white/20 lg:border-b-0" : "",
                i === 0 ? "lg:pl-0 lg:pr-8" : "lg:border-l lg:border-white/20 lg:px-8",
                i === items.length - 1 ? "lg:pr-0" : "",
              ].join(" ")}
            >
              <div className="text-[12px] text-fx-blush lg:text-[14px]" data-tina-field={tinaField(item, "label")}>
                {tField(item, "label", locale)}
              </div>
              <div
                className="mt-1.5 text-[36px] font-light leading-none tracking-[-.03em] lg:mt-2 lg:text-[64px]"
                data-tina-field={tinaField(item, "number")}
              >
                {countable ? (
                  <span data-count-up data-count-nogroup data-count-duration="1.8">
                    {main}
                  </span>
                ) : (
                  main
                )}
                {unit && <span className="ml-1 text-[15px] font-normal lg:ml-1.5 lg:text-[22px]">{unit}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
