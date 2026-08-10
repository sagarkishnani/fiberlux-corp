import { useState } from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import type { AboutQuery, AboutQueryVariables } from '../../../tina/__generated__/types';
import { tField } from '../../utils/i18n';
import type { Locale } from '../../i18n/config';
import OrbitLock from '../effects/OrbitLock';
import NodeField from '../effects/NodeField';
import LightHalo from '../effects/LightHalo';

/* ── Types ── */
interface HeroNosotrosProps {
  query: string;
  variables: AboutQueryVariables;
  data: AboutQuery;
  locale?: Locale;
}

export default function HeroNosotrosReact({ query, variables, data: initialData, locale = "es" }: HeroNosotrosProps) {
  const { data } = useTina<AboutQuery>({ query, variables, data: initialData });
  // Si WebGL no está disponible, se oculta el halo de god-rays (la red plexus en
  // canvas 2D y el candado CSS siguen dando el fondo del hero).
  const [haloOk, setHaloOk] = useState(true);

  const about = data?.about || initialData?.about;
  const hero = about?.hero;

  const title = tField(hero as any, 'title', locale) || 'La red que impulsa a las empresas del Perú';
  const subtitle = tField(hero as any, 'subtitle', locale) || '';

  return (
    <section
      className="relative min-h-[88vh] flex items-center overflow-hidden -mt-16"
      style={{ background: '#0a0a0a' }}
    >
      {/* Capa 1 — Red viva (plexus): "la red que impulsa a las empresas" */}
      <NodeField className="absolute inset-0 z-0 pointer-events-none" lines interactive />

      {/* Capa 2 — Halo de god-rays (Three.js) detrás del candado (derecha en
          desktop, centrado en mobile) */}
      {haloOk && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <LightHalo
            className="h-full w-full"
            lightPos={[0.72, 0.46]}
            lightPosMobile={[0.5, 0.58]}
            onUnsupported={() => setHaloOk(false)}
          />
        </div>
      )}

      {/* Velo desktop: más oscuro a la izquierda (texto) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] hidden lg:block"
        style={{
          background:
            'linear-gradient(90deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.26) 30%, rgba(10,10,10,0) 56%, rgba(10,10,10,0) 100%)',
        }}
      />
      {/* Velo mobile: opacidad general al fondo + más oscuro abajo (texto encima) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] lg:hidden"
        style={{
          background:
            'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.82) 20%, rgba(10,10,10,0.45) 42%, rgba(10,10,10,0.30) 68%, rgba(10,10,10,0.30) 100%)',
        }}
      />

      {/* Content: dos columnas (texto izquierda · candado derecha, misma altura) */}
      <div className="relative z-10 site-container w-full pt-28 pb-16 md:py-24">
        <div className="grid items-center gap-0 lg:gap-12 lg:grid-cols-2 lg:min-h-[74vh]">
          {/* Texto (en mobile solapa un poco el gráfico y va por encima) */}
          <div className="order-2 lg:order-1 relative z-20 -mt-12 lg:mt-0" data-reveal="up">
            {/* Breadcrumb */}
            <nav className="mb-6" aria-label="Breadcrumb">
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

            <h1
              className="text-[34px] md:text-[58px] leading-[108%] font-medium text-white max-w-2xl mb-5 md:mb-6"
              style={{ textShadow: '0 0 28px rgba(150,35,122,0.4)' }}
              data-tina-field={hero ? tinaField(hero, 'title') : undefined}
            >
              {title}
            </h1>

            {subtitle && (
              <p
                className="text-white/60 text-sm md:text-base leading-relaxed max-w-xl"
                data-tina-field={hero ? tinaField(hero, 'subtitle') : undefined}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Candado orbital (SVG/CSS, sin WebGL). En mobile va centrado, detrás
              del texto (z menor) y algo atenuado. */}
          <div
            className="order-1 lg:order-2 relative z-0 lg:z-auto flex justify-center lg:justify-end opacity-80 lg:opacity-100"
            data-reveal="up"
          >
            <OrbitLock className="w-full max-w-[380px] sm:max-w-[460px] lg:max-w-[540px] aspect-square" />
          </div>
        </div>
      </div>
    </section>
  );
}