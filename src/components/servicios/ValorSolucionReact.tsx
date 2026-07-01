import { useTina, tinaField } from "tinacms/dist/react";
import { FaArrowRight } from "react-icons/fa6";
import type {
  ServiceQuery,
  ServiceQueryVariables,
} from "../../../tina/__generated__/types";

interface ValorSolucionProps {
  query: string;
  variables: ServiceQueryVariables;
  data: ServiceQuery;
}

interface Card {
  heading?: string | null;
  text?: string | null;
  image?: string | null;
}

export default function ValorSolucionReact({
  query,
  variables,
  data: initialData,
}: ValorSolucionProps) {
  const { data } = useTina<ServiceQuery>({ query, variables, data: initialData });

  const valor = data?.service?.valor;
  if (!valor) return null;

  const cards = (valor.cards || []).filter(Boolean) as Card[];
  if (cards.length === 0) return null;

  const [challenge, solution, industries] = cards;

  return (
    <section className="bg-greyscale-darkest py-16 md:py-24">
      <div className="max-w-[1264px] mx-auto px-6 md:px-16">
        {/* Section heading */}
        {valor.title && (
          <h2
            className="text-[28px] md:text-[44px] leading-[1.15] font-semibold text-greyscale-white text-center"
            data-tina-field={tinaField(valor, "title")}
          >
            {valor.title}
          </h2>
        )}
        {valor.subtitle && (
          <p
            className="mt-3 text-body-md text-greyscale-light text-center max-w-[640px] mx-auto"
            data-tina-field={tinaField(valor, "subtitle")}
          >
            {valor.subtitle}
          </p>
        )}

        {/* Bento */}
        <div className="mt-10 md:mt-14 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          {/* ── Left — El desafío (tall, dark purple + wave) ── */}
          {challenge && (
            <article className="relative lg:row-span-2 flex flex-col overflow-hidden rounded-[28px] border border-white/[0.08] min-h-[300px] lg:min-h-[560px] p-7 md:p-9 bg-[radial-gradient(120%_90%_at_15%_0%,#4a1240_0%,#2c0a26_45%,#180614_100%)]">
              {challenge.heading && (
                <h3
                  className="text-[22px] md:text-[26px] font-semibold text-greyscale-white mb-3"
                  data-tina-field={tinaField(challenge as any, "heading")}
                >
                  {challenge.heading}
                </h3>
              )}
              {challenge.text && (
                <p
                  className="text-body-sm md:text-body-md text-white/70 max-w-[420px]"
                  data-tina-field={tinaField(challenge as any, "text")}
                >
                  {challenge.text}
                </p>
              )}
              {challenge.image && (
                <img
                  src={challenge.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="pointer-events-none absolute inset-x-0 bottom-6 md:bottom-10 w-full px-6 opacity-90"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </article>
          )}

          {/* ── Right top — Nuestra solución (designed card, full-bleed image) ── */}
          {solution && (
            <article
              className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#D5A7CA]"
              data-tina-field={tinaField(solution as any, "image")}
            >
              {solution.image ? (
                <img
                  src={solution.image}
                  alt={solution.heading || "Nuestra solución"}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-7 md:p-9">
                  {solution.heading && (
                    <h3 className="text-[22px] md:text-[26px] font-semibold text-[#3B0E30] mb-3">
                      {solution.heading}
                    </h3>
                  )}
                  {solution.text && (
                    <p className="text-body-sm text-[#3B0E30]/80">{solution.text}</p>
                  )}
                </div>
              )}
            </article>
          )}

          {/* ── Right bottom — Industrias destacadas (magenta + arrow) ── */}
          {industries && (
            <article className="relative flex flex-col justify-start overflow-hidden rounded-[28px] min-h-[240px] p-7 md:p-9 bg-[linear-gradient(135deg,#9E2680_0%,#7c1c64_60%,#651551_100%)]">
              {/* diagonal light stripe */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(122deg, transparent 38%, rgba(255,255,255,0.10) 50%, transparent 62%)",
                }}
              />
              {/* big circular arrow */}
              <span
                aria-hidden="true"
                className="absolute right-7 md:right-9 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-white text-[#96237A] shadow-lg"
              >
                <FaArrowRight className="-rotate-45" size={24} />
              </span>

              <div className="relative z-10 max-w-[62%]">
                {industries.heading && (
                  <h3
                    className="text-[22px] md:text-[26px] font-semibold text-white mb-3"
                    data-tina-field={tinaField(industries as any, "heading")}
                  >
                    {industries.heading}
                  </h3>
                )}
                {industries.text && (
                  <p
                    className="text-body-sm text-white/85"
                    data-tina-field={tinaField(industries as any, "text")}
                  >
                    {industries.text}
                  </p>
                )}
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
