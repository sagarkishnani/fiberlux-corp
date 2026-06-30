import { useState, useEffect, useRef } from 'react';
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

/* ── Count-up hook ──
   Animates from the previously displayed value to `target`.
   If `target` is null (non-numeric year), it skips animation.
   Cancels any in-flight frame before starting a new one. */
function useCountUp(target: number | null, animate: boolean, duration = 700): number {
  const [value, setValue] = useState(target ?? 0);
  const valueRef = useRef(target ?? 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target == null) return;
    if (!animate) {
      valueRef.current = target;
      setValue(target);
      return;
    }
    const from = valueRef.current;
    const to = target;
    if (from === to) return;

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const current = Math.round(from + (to - from) * eased);
      valueRef.current = current;
      setValue(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, animate, duration]);

  return value;
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

  const [activeIndex, setActiveIndex] = useState(0);

  const total = milestones.length;
  const safeIndex = total > 0 ? activeIndex % total : 0;
  const active = milestones[safeIndex];

  // Count-up of the giant year (all hooks must run before the early return)
  const curYearNum = parseInt(active?.year || '', 10);
  const animatedYear = useCountUp(isNaN(curYearNum) ? null : curYearNum, true);
  const yearDisplay = isNaN(curYearNum) ? active?.year : animatedYear;

  if (milestones.length === 0) return null;

  const goTo = (i: number) => setActiveIndex(((i % total) + total) % total);
  const prev = () => goTo(safeIndex - 1);
  const next = () => goTo(safeIndex + 1);

  const activeRef = tinaItems[safeIndex] || fallbackItems[safeIndex];

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
                onClick={prev}
                className="flex items-center justify-center w-[49px] h-[49px] bg-[#141223] text-white opacity-40 transition-opacity hover:opacity-100"
              >
                <FaArrowLeft className="text-sm" />
              </button>
              <button
                type="button"
                aria-label="Hito siguiente"
                onClick={next}
                className="flex items-center justify-center w-[49px] h-[49px] bg-[#96237a] text-white transition-colors hover:bg-[#b02a92]"
              >
                <FaArrowRight className="text-sm" />
              </button>
            </div>
          </div>

          {/* Giant year — centered, behind */}
          <div className="pointer-events-none absolute inset-x-0 top-[110px] md:top-[120px] flex justify-center">
            <span
              className="font-bold leading-none tracking-tighter text-[#836d7d] text-[120px] md:text-[255px] tabular-nums"
              data-tina-field={activeRef ? tinaField(activeRef, 'year') : undefined}
            >
              {yearDisplay}
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
              key={safeIndex}
              className="timeline-heading text-white font-medium leading-[1.15] tracking-tight text-[28px] md:text-[48px] max-w-[900px] mb-8"
              data-tina-field={activeRef ? tinaField(activeRef, 'heading') : undefined}
            >
              {active?.heading}
            </h2>

            {/* Progress bar */}
            <div className="relative h-[2px] w-full rounded-full bg-[#394247] overflow-hidden">
              <div
                className="timeline-bar-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#080618] to-[#96237a]"
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

      <style>{`
        .timeline-bar-fill {
          transition: width 700ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes timelineHeadingIn {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .timeline-heading {
          animation: timelineHeadingIn 600ms cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </section>
  );
}
