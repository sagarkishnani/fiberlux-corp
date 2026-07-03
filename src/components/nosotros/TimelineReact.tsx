import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import type { AboutQuery, AboutQueryVariables } from '../../../tina/__generated__/types';

/* ── Animation constants (measured from effortel.com/about) ── */
const SLIDE_MS = 1000;

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

type Direction = 'next' | 'prev';

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

/* ── SlideWindow ──
   Vertical slide transition (effortel-style) for a single piece of content.
   When `activeKey` changes it renders BOTH the outgoing and the incoming
   content inside an `overflow:hidden` window and animates them in sync:
   - next: outgoing slides up & out the top, incoming slides up from below.
   - prev: outgoing slides down & out the bottom, incoming slides in from above.
   With reduced motion it swaps the content instantly (no second render).
   The incoming element flows normally so the window always fits the current
   content height; the outgoing element is overlaid absolutely. */
interface Anim {
  outgoing: number;
  direction: Direction;
  nonce: number;
}

function SlideWindow({
  activeKey,
  direction,
  reduced,
  windowClass = '',
  render,
}: {
  activeKey: number;
  direction: Direction;
  reduced: boolean;
  windowClass?: string;
  render: (idx: number) => ReactNode;
}) {
  // "Storing information from previous renders" pattern: detect the change
  // synchronously during render so the incoming element mounts already
  // carrying its enter-animation class (no one-frame flash).
  const [prevKey, setPrevKey] = useState(activeKey);
  const [anim, setAnim] = useState<Anim | null>(null);
  const nonceRef = useRef(0);

  if (activeKey !== prevKey) {
    const outgoing = prevKey;
    setPrevKey(activeKey);
    if (reduced) {
      setAnim(null);
    } else {
      nonceRef.current += 1;
      setAnim({ outgoing, direction, nonce: nonceRef.current });
    }
  }

  // Clear the outgoing layer once the slide has finished (or is superseded).
  const animNonce = anim?.nonce;
  useEffect(() => {
    if (animNonce == null) return;
    const t = setTimeout(() => {
      setAnim((cur) => (cur && cur.nonce === animNonce ? null : cur));
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [animNonce]);

  const inClass = anim ? `tl-anim tl-in-${anim.direction}` : '';

  return (
    <div className={`relative overflow-hidden ${windowClass}`}>
      {/* Incoming / current — in normal flow, defines the window size */}
      <div key={`cur-${activeKey}`} className={inClass}>
        {render(activeKey)}
      </div>
      {/* Outgoing — overlaid, slides out */}
      {anim && (
        <div
          key={`out-${anim.outgoing}-${anim.nonce}`}
          className={`absolute inset-0 tl-anim tl-out-${anim.direction}`}
          aria-hidden="true"
        >
          {render(anim.outgoing)}
        </div>
      )}
    </div>
  );
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
  const [direction, setDirection] = useState<Direction>('next');
  const [paused, setPaused] = useState(false);
  const [navTick, setNavTick] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  const total = milestones.length;
  const safeIndex = total > 0 ? activeIndex % total : 0;
  const active = milestones[safeIndex];

  // Autoplay: advances every 5s; paused on hover; navTick restarts the timer
  // whenever the user uses the arrows so it doesn't jump right after a click.
  useEffect(() => {
    if (paused || reducedMotion || total <= 1) return;
    const id = setInterval(() => {
      setDirection('next');
      setActiveIndex((i) => (i + 1) % total);
    }, 5000);
    return () => clearInterval(id);
  }, [paused, reducedMotion, total, navTick]);

  if (milestones.length === 0) return null;

  const goTo = (i: number, dir: Direction) => {
    setDirection(dir);
    setActiveIndex(((i % total) + total) % total);
    setNavTick((t) => t + 1);
  };
  const prev = () => goTo(safeIndex - 1, 'prev');
  const next = () => goTo(safeIndex + 1, 'next');

  const itemAt = (i: number) => milestones[((i % total) + total) % total];
  const refAt = (i: number) => {
    const k = ((i % total) + total) % total;
    return tinaItems[k] || fallbackItems[k];
  };

  const progress = barProgress(active?.year || '', startYear, endYear);

  /* ── Index-aware renderers (used by both layers of SlideWindow) ── */
  const renderYear = (i: number, sizeCls: string) => {
    const item = itemAt(i);
    const ref = refAt(i);
    return (
      <span
        className={`block font-bold leading-none tracking-tighter tabular-nums text-[#836d7d] ${sizeCls}`}
        data-tina-field={ref ? tinaField(ref, 'year') : undefined}
      >
        {item?.year}
      </span>
    );
  };

  const renderHeading = (i: number, sizeCls: string) => {
    const item = itemAt(i);
    const ref = refAt(i);
    return (
      <h2
        className={`max-w-[900px] font-medium leading-[1.15] tracking-tight text-white ${sizeCls}`}
        data-tina-field={ref ? tinaField(ref, 'heading') : undefined}
      >
        {item?.heading}
      </h2>
    );
  };

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
      className="relative overflow-hidden rounded-t-3xl bg-[#080618] pb-20"
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
          <div className="relative z-20 mx-auto hidden max-w-[1440px] md:block md:min-h-[852px]">
            {/* Arrows — top-left */}
            <div className="absolute left-[92px] top-12 z-20">{arrows}</div>

            {/* Giant year — centered, behind */}
            <div className="pointer-events-none absolute inset-x-0 top-[120px] z-10 flex justify-center">
              <SlideWindow
                activeKey={safeIndex}
                direction={direction}
                reduced={reducedMotion}
                windowClass="inline-block"
                render={(i) => renderYear(i, 'text-[255px]')}
              />
            </div>

            {/* Bottom block: heading + bar + labels */}
            <div className="absolute bottom-[60px] left-[92px] right-[92px] z-10">
              {eyebrow}
              <SlideWindow
                activeKey={safeIndex}
                direction={direction}
                reduced={reducedMotion}
                windowClass="mb-8"
                render={(i) => renderHeading(i, 'text-[48px]')}
              />
              {bar}
              {labels}
            </div>
          </div>

          {/* ── Mobile layout (heading on top, year below, arrows at bottom) ── */}
          <div className="relative z-10 flex min-h-[520px] flex-col px-6 pb-10 pt-14 md:hidden">
            {eyebrow}
            <SlideWindow
              activeKey={safeIndex}
              direction={direction}
              reduced={reducedMotion}
              render={(i) => renderHeading(i, 'text-[28px]')}
            />
            <div className="my-4 flex justify-end">
              <SlideWindow
                activeKey={safeIndex}
                direction={direction}
                reduced={reducedMotion}
                windowClass="inline-block"
                render={(i) => renderYear(i, 'text-[88px] opacity-60')}
              />
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
        .tl-anim {
          animation-duration: ${SLIDE_MS}ms;
          animation-timing-function: cubic-bezier(0.544, 0.001, 0, 0.995);
          animation-fill-mode: both;
          will-change: transform;
        }
        .tl-in-next { animation-name: tlInNext; }
        .tl-out-next { animation-name: tlOutNext; }
        .tl-in-prev { animation-name: tlInPrev; }
        .tl-out-prev { animation-name: tlOutPrev; }
        @keyframes tlInNext {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes tlOutNext {
          from { transform: translateY(0); }
          to { transform: translateY(-100%); }
        }
        @keyframes tlInPrev {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes tlOutPrev {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .timeline-bar-fill { transition: none; }
          .tl-anim { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
