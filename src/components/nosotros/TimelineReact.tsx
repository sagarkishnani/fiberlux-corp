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

/* ── Reduced-motion hook ── */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
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
  const [paused, setPaused] = useState(false);
  const [navTick, setNavTick] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  const total = milestones.length;
  const safeIndex = total > 0 ? activeIndex % total : 0;
  const active = milestones[safeIndex];

  // Count-up of the giant year (all hooks must run before the early return)
  const curYearNum = parseInt(active?.year || '', 10);
  const animatedYear = useCountUp(isNaN(curYearNum) ? null : curYearNum, !reducedMotion);
  const yearDisplay = isNaN(curYearNum) ? active?.year : animatedYear;

  // Autoplay: advances every 5s; paused on hover; navTick restarts the timer
  // whenever the user uses the arrows so it doesn't jump right after a click.
  useEffect(() => {
    if (paused || reducedMotion || total <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % total);
    }, 5000);
    return () => clearInterval(id);
  }, [paused, reducedMotion, total, navTick]);

  if (milestones.length === 0) return null;

  const goTo = (i: number) => {
    setActiveIndex(((i % total) + total) % total);
    setNavTick((t) => t + 1);
  };
  const prev = () => goTo(safeIndex - 1);
  const next = () => goTo(safeIndex + 1);

  const activeRef = tinaItems[safeIndex] || fallbackItems[safeIndex];

  const progress = barProgress(active?.year || '', startYear, endYear);

  /* ── Shared pieces (reused by the desktop and mobile layouts) ── */
  const arrows = (
    <div className="flex w-fit overflow-hidden rounded-[12px] border-2 border-[#282445] bg-[#141223]">
      <button
        type="button"
        aria-label="Hito anterior"
        onClick={prev}
        className="flex h-[49px] w-[49px] items-center justify-center bg-[#141223] text-white opacity-40 transition-opacity hover:opacity-100"
      >
        <FaArrowLeft className="text-sm" />
      </button>
      <button
        type="button"
        aria-label="Hito siguiente"
        onClick={next}
        className="flex h-[49px] w-[49px] items-center justify-center bg-[#96237a] text-white transition-colors hover:bg-[#b02a92]"
      >
        <FaArrowRight className="text-sm" />
      </button>
    </div>
  );

  const eyebrow = timeline?.title ? (
    <p
      className="mb-4 text-sm uppercase tracking-[0.15em] text-[#909da4]"
      data-tina-field={tinaField(timeline, 'title')}
    >
      {timeline.title}
    </p>
  ) : null;

  const renderHeading = (sizeCls: string) => (
    <h2
      key={safeIndex}
      className={`timeline-heading max-w-[900px] font-medium leading-[1.15] tracking-tight text-white ${sizeCls}`}
      data-tina-field={activeRef ? tinaField(activeRef, 'heading') : undefined}
    >
      {active?.heading}
    </h2>
  );

  const renderYear = (sizeCls: string) => (
    <span
      className={`font-bold leading-none tracking-tighter tabular-nums text-[#836d7d] ${sizeCls}`}
      data-tina-field={activeRef ? tinaField(activeRef, 'year') : undefined}
    >
      {yearDisplay}
    </span>
  );

  const bar = (
    <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-[#394247]">
      <div
        className="timeline-bar-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#080618] to-[#96237a]"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );

  const labels = (
    <div className="mt-3 flex justify-between">
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
  );

  return (
    <section
      className="relative overflow-hidden rounded-t-3xl bg-[#080618]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >

          {/* Background — CSS approximation of the Figma magenta light beams */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            {/* Corner radial glow (top-right) */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(75% 60% at 88% 2%, rgba(150,35,122,0.55) 0%, rgba(150,35,122,0.18) 32%, rgba(8,6,24,0) 62%)',
              }}
            />
            {/* Bright diagonal beam */}
            <div
              className="absolute -top-1/3 right-[6%] h-[170%] w-[220px] rotate-[35deg] origin-top opacity-80 blur-[40px]"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(214,77,184,0.9) 0%, rgba(150,35,122,0.35) 45%, rgba(150,35,122,0) 80%)',
              }}
            />
            {/* Softer secondary beam */}
            <div
              className="absolute -top-1/3 right-[20%] h-[160%] w-[340px] rotate-[35deg] origin-top opacity-40 blur-[60px]"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(150,35,122,0.7) 0%, rgba(150,35,122,0) 70%)',
              }}
            />
          </div>

          {/* ── Desktop layout (year on top, heading below) ── */}
          <div className="relative z-10 mx-auto hidden max-w-[1440px] md:block md:min-h-[680px]">
            {/* Arrows — top-left */}
            <div className="absolute left-[92px] top-12 z-20">{arrows}</div>

            {/* Giant year — centered, behind */}
            <div className="pointer-events-none absolute inset-x-0 top-[120px] z-10 flex justify-center">
              {renderYear('text-[255px]')}
            </div>

            {/* Bottom block: heading + bar + labels */}
            <div className="absolute bottom-[60px] left-[92px] right-[92px] z-10">
              {eyebrow}
              {renderHeading('mb-8 text-[48px]')}
              {bar}
              {labels}
            </div>
          </div>

          {/* ── Mobile layout (heading on top, year below, arrows at bottom) ── */}
          <div className="relative z-10 flex min-h-[520px] flex-col px-6 pb-10 pt-14 md:hidden">
            {eyebrow}
            {renderHeading('text-[28px]')}
            <div className="my-4 flex justify-end">
              {renderYear('text-[88px] opacity-60')}
            </div>
            <div className="mt-auto">
              {bar}
              {labels}
              <div className="mt-8">{arrows}</div>
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
        @media (prefers-reduced-motion: reduce) {
          .timeline-bar-fill { transition: none; }
          .timeline-heading { animation: none; }
        }
      `}</style>
    </section>
  );
}
