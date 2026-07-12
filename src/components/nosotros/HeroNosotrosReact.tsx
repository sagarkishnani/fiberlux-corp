import { useTina, tinaField } from 'tinacms/dist/react';
import type { AboutQuery, AboutQueryVariables } from '../../../tina/__generated__/types';

/* ── Types ── */
interface HeroNosotrosProps {
  query: string;
  variables: AboutQueryVariables;
  data: AboutQuery;
}

export default function HeroNosotrosReact({ query, variables, data: initialData }: HeroNosotrosProps) {
  const { data } = useTina<AboutQuery>({ query, variables, data: initialData });

  const about = data?.about || initialData?.about;
  const hero = about?.hero;

  const title = hero?.title || 'La red que impulsa a las empresas del Perú';
  const subtitle = hero?.subtitle || '';

  return (
    <section
      className="relative min-h-[70vh] md:min-h-[85vh] flex flex-col overflow-hidden -mt-16"
      style={{ background: '#0a0a0a' }}
    >
      {/* Background gradient image */}
      <div className="absolute inset-0 z-0 hero-nosotros-bg" />

      {/* Content */}
      <div className="relative z-10 site-container flex flex-col flex-1">
        {/* Breadcrumb */}
        <nav className="pt-24 md:pt-28" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <a href="/" className="text-white/50 hover:text-white transition-colors">
                Inicio
              </a>
            </li>
            <li className="text-white/30">/</li>
            <li className="text-white font-medium">Nosotros</li>
          </ol>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Title */}
        <h1
          className="text-[36px] md:text-[64px] leading-[110%] font-medium text-white max-w-3xl mb-4 md:mb-6"
          data-tina-field={hero ? tinaField(hero, 'title') : undefined}
        >
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p
            className="text-white/60 text-sm md:text-base leading-relaxed max-w-xl mb-16 md:mb-20"
            data-tina-field={hero ? tinaField(hero, 'subtitle') : undefined}
          >
            {subtitle}
          </p>
        )}
      </div>

      <style>{`
        .hero-nosotros-bg {
          background-image: url(/images/nosotros/circular-gradient-bg.avif);
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center 70%;
        }
        @media (min-width: 768px) {
          .hero-nosotros-bg {
            background-position: center top;
          }
        }
      `}</style>
    </section>
  );
}