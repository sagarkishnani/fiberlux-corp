import { useTina, tinaField } from 'tinacms/dist/react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import type { AboutQuery, AboutQueryVariables } from '../../../tina/__generated__/types';

/* ── Types ── */
interface Milestone {
  year?: string | null;
  heading?: string | null;
}

interface TimelineProps {
  query: string;
  variables: AboutQueryVariables;
  data: AboutQuery;
}

/* ── Helpers ── */
function barProgress(yearStr: string, startStr: string, endStr: string): number {
  const cur = parseInt(yearStr, 10);
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);
  if (isNaN(cur) || isNaN(start) || isNaN(end)) return 0;
  if (end === start) return 1;
  return Math.min(1, Math.max(0, (cur - start) / (end - start)));
}

export default function TimelineReact({ query, variables, data: initialData }: TimelineProps) {
  const { data } = useTina<AboutQuery>({ query, variables, data: initialData });

  // Fallback chain: useTina data → initialData
  const tinaTimeline = data?.about?.timeline;
  const fallbackTimeline = initialData?.about?.timeline;
  const timeline = tinaTimeline || fallbackTimeline;

  const startYear = timeline?.startYear || '';
  const endYear = timeline?.endYear || '';

  const tinaItems = (tinaTimeline?.milestones || []).filter(Boolean) as Milestone[];
  const fallbackItems = (fallbackTimeline?.milestones || []).filter(Boolean) as Milestone[];
  const milestones = tinaItems.length > 0 ? tinaItems : fallbackItems;

  if (milestones.length === 0) return null;

  // Static for now (interaction lands in step 6)
  const activeIndex = 0;
  const active = milestones[activeIndex];
  const activeRef = tinaItems[activeIndex] || fallbackItems[activeIndex];

  const progress = barProgress(active?.year || '', startYear, endYear);

  return (
    <section className="bg-white overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="relative overflow-hidden rounded-[16px] bg-[#080618] min-h-[560px] md:min-h-[680px]">

          {/* Arrows — top-left */}
          <div className="absolute z-20 top-8 left-6 md:top-12 md:left-[92px]">
            <div className="flex rounded-[12px] border-2 border-[#282445] bg-[#141223] overflow-hidden">
              <button
                type="button"
                aria-label="Hito anterior"
                className="flex items-center justify-center w-[49px] h-[49px] bg-[#141223] opacity-30"
              >
                <FaArrowLeft className="text-white text-sm" />
              </button>
              <button
                type="button"
                aria-label="Hito siguiente"
                className="flex items-center justify-center w-[49px] h-[49px] bg-[#96237a]"
              >
                <FaArrowRight className="text-white text-sm" />
              </button>
            </div>
          </div>

          {/* Giant year — centered, behind */}
          <div className="pointer-events-none absolute inset-x-0 top-[110px] md:top-[120px] flex justify-center">
            <span
              className="font-bold leading-none tracking-tighter text-[#836d7d] text-[120px] md:text-[255px]"
              data-tina-field={activeRef ? tinaField(activeRef, 'year') : undefined}
            >
              {active?.year}
            </span>
          </div>

          {/* Bottom block: heading + bar + labels */}
          <div className="absolute left-6 right-6 md:left-[92px] md:right-[92px] bottom-10 md:bottom-[60px]">
            {timeline?.title && (
              <p
                className="text-sm uppercase tracking-[0.15em] text-[#909da4] mb-4"
                data-tina-field={timeline ? tinaField(timeline, 'title') : undefined}
              >
                {timeline.title}
              </p>
            )}

            <h2
              className="text-white font-medium leading-[1.15] tracking-tight text-[28px] md:text-[48px] max-w-[900px] mb-8"
              data-tina-field={activeRef ? tinaField(activeRef, 'heading') : undefined}
            >
              {active?.heading}
            </h2>

            {/* Progress bar */}
            <div className="relative h-[2px] w-full rounded-full bg-[#394247] overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#080618] to-[#96237a]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {/* Year labels */}
            <div className="flex justify-between mt-3">
              <span
                className="text-base uppercase tracking-tight text-[#909da4]"
                data-tina-field={timeline ? tinaField(timeline, 'startYear') : undefined}
              >
                {startYear}
              </span>
              <span
                className="text-base uppercase tracking-tight text-[#909da4]"
                data-tina-field={timeline ? tinaField(timeline, 'endYear') : undefined}
              >
                {endYear}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
