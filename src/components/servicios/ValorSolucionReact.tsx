import { useTina, tinaField } from "tinacms/dist/react";
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

/** Hide the illustration gracefully if the asset is missing. */
function CardImage({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="mt-6 w-full max-h-[220px] object-contain object-left-bottom"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
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

  const CardBody = ({ card }: { card: Card }) => (
    <>
      {card.heading && (
        <h3
          className="text-[22px] md:text-[26px] font-semibold text-greyscale-white mb-3"
          data-tina-field={tinaField(card as any, "heading")}
        >
          {card.heading}
        </h3>
      )}
      {card.text && (
        <p
          className="text-body-sm md:text-body-md text-greyscale-light"
          data-tina-field={tinaField(card as any, "text")}
        >
          {card.text}
        </p>
      )}
    </>
  );

  return (
    <section className="bg-greyscale-darkest py-16 md:py-24">
      <div className="max-w-[1440px] mx-auto px-6 md:px-16">
        {valor.title && (
          <h2
            className="text-[28px] md:text-[40px] leading-[1.2] font-semibold text-greyscale-white text-center mb-10 md:mb-14"
            data-tina-field={tinaField(valor, "title")}
          >
            {valor.title}
          </h2>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          {/* Left — El desafío (tall) */}
          {challenge && (
            <article className="lg:row-span-2 flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-7 md:p-9">
              <CardBody card={challenge} />
              {challenge.image && (
                <div className="mt-auto">
                  <CardImage src={challenge.image} alt={challenge.heading || ""} />
                </div>
              )}
            </article>
          )}

          {/* Right top — Nuestra solución */}
          {solution && (
            <article className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.05] p-7 md:p-9">
              <CardBody card={solution} />
              {solution.image && (
                <CardImage src={solution.image} alt={solution.heading || ""} />
              )}
            </article>
          )}

          {/* Right bottom — Industrias destacadas (brand magenta) */}
          {industries && (
            <article className="relative flex flex-col overflow-hidden rounded-3xl p-7 md:p-9 bg-gradient-to-br from-[#96237A] to-[#650F50]">
              <CardBody card={industries} />
              {industries.image && (
                <CardImage src={industries.image} alt={industries.heading || ""} />
              )}
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
