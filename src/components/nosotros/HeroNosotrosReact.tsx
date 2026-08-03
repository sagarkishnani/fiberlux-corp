import { useState } from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import type { AboutQuery, AboutQueryVariables } from '../../../tina/__generated__/types';
import { tField } from '../../utils/i18n';
import type { Locale } from '../../i18n/config';
import FlowEffect from '../effects/FlowEffect';

/* ── Types ── */
interface HeroNosotrosProps {
  query: string;
  variables: AboutQueryVariables;
  data: AboutQuery;
  locale?: Locale;
}

export default function HeroNosotrosReact({ query, variables, data: initialData, locale = "es" }: HeroNosotrosProps) {
  const { data } = useTina<AboutQuery>({ query, variables, data: initialData });
  // La imagen fallback solo aparece si FlowEffect no puede inicializar (no como flash inicial).
  const [showFallback, setShowFallback] = useState(false);

  const about = data?.about || initialData?.about;
  const hero = about?.hero;

  const title = tField(hero as any, 'title', locale) || 'La red que impulsa a las empresas del Perú';
  const subtitle = tField(hero as any, 'subtitle', locale) || '';

  return (
    <section
      className="relative min-h-[70vh] md:min-h-[85vh] flex flex-col overflow-hidden -mt-16"
      style={{ background: '#0a0a0a' }}
    >
      {/* Imagen fallback: solo si FlowEffect no puede inicializar */}
      {showFallback && <div className="absolute inset-0 z-0 hero-nosotros-bg" />}
      <FlowEffect
        className="absolute inset-0 z-0 h-full w-full"
        onUnsupported={() => setShowFallback(true)}
      />
      {/* Capa oscura para atenuar el flow */}
      <div className="absolute inset-0 z-0 bg-black/40" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 site-container flex flex-col flex-1">
        {/* Breadcrumb */}
        <nav className="pt-24 md:pt-28" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <a href="/" className="text-white/50 hover:text-white transition-colors">
                {locale === 'en' ? 'Home' : 'Inicio'}
              </a>
            </li>
            <li className="text-white/30">/</li>
            <li className="text-white font-medium">{locale === 'en' ? 'About us' : 'Nosotros'}</li>
          </ol>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Title + subtitle (fade-in de entrada) */}
        <div data-reveal="up">
          <h1
            className="text-[36px] md:text-[64px] leading-[110%] font-medium text-white max-w-3xl mb-4 md:mb-6"
            data-tina-field={hero ? tinaField(hero, 'title') : undefined}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className="text-white/60 text-sm md:text-base leading-relaxed max-w-xl mb-16 md:mb-20"
              data-tina-field={hero ? tinaField(hero, 'subtitle') : undefined}
            >
              {subtitle}
            </p>
          )}
        </div>
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