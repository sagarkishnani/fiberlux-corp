import { useTina, tinaField } from 'tinacms/dist/react';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import type { AboutQuery, AboutQueryVariables } from '../../../tina/__generated__/types';
import { tField, richField } from '../../utils/i18n';
import type { Locale } from '../../i18n/config';

/* ── Types ── */
interface MissionVisionProps {
  query: string;
  variables: AboutQueryVariables;
  data: AboutQuery;
  locale?: Locale;
}

const DEFAULT_IMAGE = '/images/nosotros/comprometidos-mision-vision.webp';

export default function MissionVisionReact({ query, variables, data: initialData, locale = "es" }: MissionVisionProps) {
  const { data } = useTina<AboutQuery>({ query, variables, data: initialData });

  const about = data?.about;
  if (!about) return null;

  const mission = about.mission;
  const vision = about.vision;
  const image = about.missionImage || DEFAULT_IMAGE;

  // Section title from a dedicated field or fallback
  const sectionTitle = tField(about as any, "missionVisionTitle", locale) || 'Comprometidos con el desarrollo tecnológico del Perú';

  /* Bloque Política SGSI (ISO 27001). Los números 01, 02… no se editan:
     salen del orden de la lista `sgsi.items` en Tina. */
  const sgsi = (about as any).sgsi;
  const sgsiBadge = sgsi ? tField(sgsi, "badge", locale) : '';
  const sgsiTitle = sgsi ? tField(sgsi, "title", locale) : '';
  const sgsiIntro = sgsi ? richField(sgsi, "intro", locale) : null;
  const sgsiItems: any[] = (sgsi?.items ?? []).filter(Boolean);

  return (
    <section
      className="rounded-t-2xl py-16 md:py-20"
      style={{ background: '#FFD4F4' }}
    >
      <div className="site-container">

        {/* ── Desktop layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-40">

          {/* Left column: Title + Cards.
              Desktop: toda la columna entra desde la izquierda (un solo scrub).
              Mobile (pedido del cliente): se parte en dos — título + imagen
              entran de izquierda a derecha, y las tarjetas de misión/visión de
              derecha a izquierda. `data-reveal-only` elige cuál corre en cada
              breakpoint (el que no aplica se muestra sin animar). */}
          <div className="flex flex-col" data-reveal="left" data-reveal-scrub data-reveal-only="desktop">

            {/* Bloque 1 — título + imagen (mobile: entra desde la izquierda) */}
            <div data-reveal="left" data-reveal-scrub data-reveal-only="mobile">
              <h2
                className="text-[30px] leading-[36px] min-[380px]:text-[36px] min-[380px]:leading-[42px] md:text-[48px] md:leading-[56px] font-medium text-brand-purple-darkest mb-10"
                data-tina-field={tinaField(about as any, 'missionVisionTitle')}
              >
                {sectionTitle}
              </h2>

              {/* Mobile: Image appears here */}
              {image && (
                <div className="block lg:hidden mb-8">
                  <img
                    src={image}
                    alt="Compromiso tecnológico"
                    className="w-full h-auto rounded-2xl object-cover"
                    data-tina-field={tinaField(about, 'missionImage')}
                  />
                </div>
              )}
            </div>

            {/* Bloque 2 — misión y visión (mobile: entra desde la derecha) */}
            <div data-reveal="right" data-reveal-scrub data-reveal-only="mobile">
              {/* Mission card */}
              {mission && (
                <div
                  className="border border-brand-purple-light rounded-2xl p-6 mb-4"
                  data-tina-field={tinaField(mission, 'title')}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {/* Mission icon */}
                    <svg className="w-5 h-5 text-brand-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20" />
                      <path d="M2 12h20" />
                    </svg>
                    <h3 className="text-lg md:text-2xl font-medium text-brand-purple-darkest">
                      {tField(mission as any, "title", locale)}
                    </h3>
                  </div>
                  <p
                    className="text-brand-purple-darkest/70 text-sm md:text-base leading-relaxed"
                    data-tina-field={tinaField(mission, 'text')}
                  >
                    {tField(mission as any, "text", locale)}
                  </p>
                </div>
              )}

              {/* Vision card */}
              {vision && (
                <div
                  className="border border-brand-purple-light rounded-2xl p-6"
                  data-tina-field={tinaField(vision, 'title')}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {/* Vision icon */}
                    <svg className="w-5 h-5 text-brand-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <h3 className="text-lg md:text-2xl font-medium text-brand-purple-darkest">
                      {tField(vision as any, "title", locale)}
                    </h3>
                  </div>
                  <p
                    className="text-brand-purple-darkest/70 text-sm md:text-base leading-relaxed"
                    data-tina-field={tinaField(vision, 'text')}
                  >
                    {tField(vision as any, "text", locale)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Image (desktop only) */}
          <div className="hidden lg:flex items-start" data-reveal="right" data-reveal-scrub>
            {image ? (
              <img
                src={image}
                alt="Compromiso tecnológico"
                className="w-full h-full rounded-2xl object-cover"
                data-tina-field={tinaField(about, 'missionImage')}
              />
            ) : (
              <div className="w-full h-full min-h-[400px] rounded-2xl bg-brand-purple-light/30 flex items-center justify-center text-brand-purple/30 text-sm">
                Agregar imagen desde Tina
              </div>
            )}
          </div>
        </div>

        {/* ── Política del SGSI (ISO 27001) ── */}
        {sgsi && (sgsiTitle || sgsiItems.length > 0) && (
          <div className="relative mt-14 md:mt-20 pt-12 md:pt-16">
            {/* Separador: línea de 1px que se intensifica al centro y se
                desvanece hacia los bordes (sin halo, pedido del cliente). */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, rgba(150,35,122,0) 0%, rgba(150,35,122,0.18) 15%, rgba(150,35,122,0.85) 50%, rgba(150,35,122,0.18) 85%, rgba(150,35,122,0) 100%)',
              }}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-24">

              {/* Columna izquierda: certificación + título + intro */}
              <div data-reveal="up">
                {sgsiBadge && (
                  <div className="flex items-center gap-4 mb-6">
                    <span className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-brand-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3l7 3v5.5c0 4.2-2.9 8.1-7 9.5-4.1-1.4-7-5.3-7-9.5V6l7-3z" />
                        <path d="M9.2 12.2l1.9 1.9 3.7-3.9" />
                      </svg>
                    </span>
                    <span
                      className="font-mono text-xs md:text-sm tracking-[0.2em] text-brand-purple-darkest"
                      data-tina-field={tinaField(sgsi, 'badge')}
                    >
                      {sgsiBadge}
                    </span>
                  </div>
                )}

                {sgsiTitle && (
                  <h3
                    className="text-[26px] leading-[32px] md:text-[36px] md:leading-[44px] font-medium text-brand-purple-darkest mb-6"
                    data-tina-field={tinaField(sgsi, 'title')}
                  >
                    {sgsiTitle}
                  </h3>
                )}

                {sgsiIntro && (
                  <div
                    className="text-brand-purple-darkest/70 text-sm md:text-base leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_strong]:text-brand-purple-darkest"
                    data-tina-field={tinaField(sgsi, 'intro')}
                  >
                    <TinaMarkdown content={sgsiIntro} />
                  </div>
                )}
              </div>

              {/* Columna derecha: compromisos numerados (01, 02…) */}
              {sgsiItems.length > 0 && (
                <ol className="flex flex-col gap-8 md:gap-10" data-reveal="up" data-reveal-stagger="0.08">
                  {sgsiItems.map((item, i) => (
                    <li key={i} className="flex gap-4 md:gap-6">
                      <span className="font-mono text-xs md:text-sm text-brand-purple/70 pt-1 w-6 md:w-7 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p
                        className="text-brand-purple-darkest/80 text-sm md:text-base leading-relaxed"
                        data-tina-field={tinaField(item, 'text')}
                      >
                        {tField(item, 'text', locale)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
