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
 * Full-width, left-to-right infinite marquee of technology-partner logos.
 */
export default function PartnersReact({ query, variables, data: initialData }: PartnersProps) {
  const { data } = useTina<GlobalQuery>({ query, variables, data: initialData });

  const partners = data?.global?.partners;
  if (!partners) return null;

  const logos = (partners.logos || []).filter(Boolean) as Logo[];
  if (logos.length === 0) return null;

  // Repeat the set enough to overflow the widest screen, then duplicate the
  // whole run so the -50% → 0 loop is seamless.
  const run = Array.from({ length: 4 }, () => logos).flat();
  const track = [...run, ...run];

  const renderLogo = (logo: Logo, i: number) => {
    const img = (
      <img
        src={logo.image || ""}
        alt={logo.alt || "Partner"}
        loading="lazy"
        className="partner-logo h-7 md:h-9 w-auto object-contain"
      />
    );
    return (
      <span key={i} className="shrink-0 px-8 md:px-12" data-tina-field={tinaField(logo as any, "image")}>
        {logo.url ? (
          <a href={logo.url} target="_blank" rel="noopener noreferrer">
            {img}
          </a>
        ) : (
          img
        )}
      </span>
    );
  };

  return (
    <section className="bg-greyscale-darkest py-16 md:py-20 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 text-center mb-10 md:mb-14">
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
            className="text-subtitle-md md:text-subtitle-lg text-white"
            data-tina-field={tinaField(partners, "title")}
          >
            {partners.title}
          </h2>
        )}
      </div>

      {/* Full-width marquee */}
      <div className="partners-marquee w-full overflow-hidden">
        <div className="partners-track flex w-max items-center" aria-hidden="false">
          {track.map(renderLogo)}
        </div>
      </div>

      <style>{`
        .partner-logo { opacity: 1; filter: none; transition: filter 0.35s ease, opacity 0.35s ease; }
        @media (min-width: 768px) {
          .partner-logo { filter: brightness(0) invert(1); opacity: 0.55; }
          .partner-logo:hover { filter: none; opacity: 1; }
        }

        .partners-marquee {
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 7%, #000 93%, transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0%, #000 7%, #000 93%, transparent 100%);
        }
        .partners-track {
          animation: partners-marquee 42s linear infinite;
        }
        /* Left → right motion; both halves identical so the reset is seamless. */
        @keyframes partners-marquee {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .partners-marquee:hover .partners-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .partners-track { animation: none; transform: translateX(0); }
          .partner-logo { transition: none; }
        }
      `}</style>
    </section>
  );
}
