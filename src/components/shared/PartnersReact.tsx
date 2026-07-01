import { useTina, tinaField } from "tinacms/dist/react";
import type { GlobalQuery, GlobalQueryVariables } from "../../../tina/__generated__/types";

interface PartnersProps {
  query: string;
  variables: GlobalQueryVariables;
  data: GlobalQuery;
}

interface Logo {
  image?: string | null;
  alt?: string | null;
  url?: string | null;
}

/**
 * PartnersReact — "Trabajamos con los líderes de la industria"
 * Global strip of technology-partner logos (shared across pages).
 */
export default function PartnersReact({ query, variables, data: initialData }: PartnersProps) {
  const { data } = useTina<GlobalQuery>({ query, variables, data: initialData });

  const partners = data?.global?.partners;
  if (!partners) return null;

  const logos = (partners.logos || []).filter(Boolean) as Logo[];
  if (logos.length === 0) return null;

  return (
    <section className="bg-greyscale-darkest py-16 md:py-20">
      <div className="max-w-[1440px] mx-auto px-6 text-center">
        {partners.eyebrow && (
          <p
            className="font-mono text-xs md:text-sm tracking-[0.2em] text-white/50 uppercase mb-4"
            data-tina-field={tinaField(partners, "eyebrow")}
          >
            {partners.eyebrow}
          </p>
        )}

        {partners.title && (
          <h2
            className="text-subtitle-md md:text-subtitle-lg text-white mb-10 md:mb-14"
            data-tina-field={tinaField(partners, "title")}
          >
            {partners.title}
          </h2>
        )}

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 md:gap-x-16">
          {logos.map((logo, i) => {
            const img = (
              <img
                src={logo.image || ""}
                alt={logo.alt || "Partner"}
                loading="lazy"
                className="h-7 md:h-9 w-auto object-contain opacity-70 grayscale brightness-0 invert transition-opacity duration-300 hover:opacity-100"
                data-tina-field={tinaField(logo as any, "image")}
              />
            );
            return logo.url ? (
              <a key={i} href={logo.url} target="_blank" rel="noopener noreferrer">
                {img}
              </a>
            ) : (
              <span key={i}>{img}</span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
