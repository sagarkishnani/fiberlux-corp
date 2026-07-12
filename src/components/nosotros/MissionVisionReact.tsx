import { useTina, tinaField } from 'tinacms/dist/react';
import type { AboutQuery, AboutQueryVariables } from '../../../tina/__generated__/types';

/* ── Types ── */
interface MissionVisionProps {
  query: string;
  variables: AboutQueryVariables;
  data: AboutQuery;
}

const DEFAULT_IMAGE = '/images/nosotros/ux-design.avif';

export default function MissionVisionReact({ query, variables, data: initialData }: MissionVisionProps) {
  const { data } = useTina<AboutQuery>({ query, variables, data: initialData });

  const about = data?.about;
  if (!about) return null;

  const mission = about.mission;
  const vision = about.vision;
  const image = about.missionImage || DEFAULT_IMAGE;

  // Section title from a dedicated field or fallback
  const sectionTitle = (about as any)?.missionVisionTitle || 'Comprometidos con el desarrollo tecnológico del Perú';

  return (
    <section
      className="rounded-t-2xl py-16 md:py-20"
      style={{ background: '#FFD4F4' }}
    >
      <div className="site-container">

        {/* ── Desktop layout ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-40">

          {/* Left column: Title + Cards */}
          <div className="flex flex-col">
            {/* Title */}
            <h2
              className="text-[40px] md:text-[48px] leading-[48px] md:leading-[56px] font-medium text-brand-purple-darkest mb-10"
              data-tina-field={tinaField(about as any, 'missionVisionTitle')}
            >
              {sectionTitle}
            </h2>

            {/* Mobile: Image appears here */}
            {image && (
              <div className="block md:hidden mb-8">
                <img
                  src={image}
                  alt="Compromiso tecnológico"
                  className="w-full h-auto rounded-2xl object-cover"
                  data-tina-field={tinaField(about, 'missionImage')}
                />
              </div>
            )}

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
                  <h3 className="text-lg font-semibold text-brand-purple-darkest">
                    {mission.title}
                  </h3>
                </div>
                <p
                  className="text-brand-purple-darkest/70 text-sm leading-relaxed"
                  data-tina-field={tinaField(mission, 'text')}
                >
                  {mission.text}
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
                  <h3 className="text-lg font-semibold text-brand-purple-darkest">
                    {vision.title}
                  </h3>
                </div>
                <p
                  className="text-brand-purple-darkest/70 text-sm leading-relaxed"
                  data-tina-field={tinaField(vision, 'text')}
                >
                  {vision.text}
                </p>
              </div>
            )}
          </div>

          {/* Right column: Image (desktop only) */}
          <div className="hidden md:flex items-start">
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
      </div>
    </section>
  );
}
