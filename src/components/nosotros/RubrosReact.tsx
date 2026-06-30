import { useState, useEffect, useRef, useCallback } from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import type { IconType } from 'react-icons';
import {
  FaArrowLeft,
  FaArrowRight,
  FaPersonDigging,
  FaUtensils,
  FaGraduationCap,
  FaBed,
  FaHeartPulse,
  FaCartShopping,
  FaBuildingColumns,
  FaIndustry,
  FaTruck,
  FaLandmark,
  FaHelmetSafety,
  FaTractor,
  FaLaptopCode,
  FaBolt,
  FaTowerCell,
  FaPlaneDeparture,
  FaMasksTheater,
  FaBuilding,
} from 'react-icons/fa6';
import type { AboutQuery, AboutQueryVariables } from '../../../tina/__generated__/types';

/* ── Types ── */
interface Rubro {
  icon?: string | null;
  label?: string | null;
}

interface RubrosProps {
  query: string;
  variables: AboutQueryVariables;
  data: AboutQuery;
}

/* ── Icon map: CMS select key → react-icons component ── */
const ICONS: Record<string, IconType> = {
  mineria: FaPersonDigging,
  restaurantes: FaUtensils,
  educacion: FaGraduationCap,
  hoteleria: FaBed,
  salud: FaHeartPulse,
  retail: FaCartShopping,
  banca: FaBuildingColumns,
  industria: FaIndustry,
  logistica: FaTruck,
  gobierno: FaLandmark,
  construccion: FaHelmetSafety,
  agroindustria: FaTractor,
  tecnologia: FaLaptopCode,
  energia: FaBolt,
  telecomunicaciones: FaTowerCell,
  turismo: FaPlaneDeparture,
  entretenimiento: FaMasksTheater,
  corporativo: FaBuilding,
};
const FALLBACK_ICON: IconType = FaBuilding;

export default function RubrosReact({ query, variables, data: initialData }: RubrosProps) {
  const { data } = useTina<AboutQuery>({ query, variables, data: initialData });

  // Fallback chain: useTina data → initialData
  const tinaRubros = data?.about?.rubros;
  const fallbackRubros = initialData?.about?.rubros;
  const rubros = tinaRubros || fallbackRubros;

  const tinaItems = (tinaRubros?.items || []).filter(Boolean) as Rubro[];
  const fallbackItems = (fallbackRubros?.items || []).filter(Boolean) as Rubro[];
  const items = tinaItems.length > 0 ? tinaItems : fallbackItems;

  /* ── Carousel state ── */
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // Measured geometry: px to advance per step, and max scrollable distance.
  const [step, setStep] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  // Drag state. dragDelta is the live pointer offset; dragStart/moved live in
  // a ref so move handlers don't churn renders for sub-threshold jitter.
  const [dragging, setDragging] = useState(false);
  const [dragDelta, setDragDelta] = useState(0);
  const dragRef = useRef({ startX: 0, active: false, moved: false });
  const DRAG_THRESHOLD = 8; // px before a press counts as a drag

  const total = items.length;

  // Measure card step (card width + gap) and the maximum scroll distance.
  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const first = track.children[0] as HTMLElement | undefined;
    const second = track.children[1] as HTMLElement | undefined;
    if (!first) return;
    const cardW = first.getBoundingClientRect().width;
    const gap = second
      ? second.getBoundingClientRect().left - first.getBoundingClientRect().right
      : 0;
    setStep(cardW + Math.max(0, gap));
    setMaxScroll(Math.max(0, track.scrollWidth - viewport.clientWidth));
  }, []);

  useEffect(() => {
    measure();
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [measure, total]);

  // Index at which the last card is flush against the right edge.
  const lastIndex = step > 0 ? Math.ceil(maxScroll / step) : 0;

  // Keep index in range if geometry shrinks (e.g. resize / fewer items).
  useEffect(() => {
    setIndex((i) => Math.min(i, lastIndex));
  }, [lastIndex]);

  if (total === 0) return null;

  const baseOffset = Math.min(index * step, maxScroll);

  const prev = () => setIndex((i) => (i <= 0 ? lastIndex : i - 1));
  const next = () => setIndex((i) => (i >= lastIndex ? 0 : i + 1));

  /* ── Pointer drag (mouse + touch) ── */
  const onPointerDown = (e: React.PointerEvent) => {
    if (step <= 0) return;
    dragRef.current = { startX: e.clientX, active: true, moved: false };
    setDragging(true);
    setDragDelta(0);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const delta = e.clientX - dragRef.current.startX;
    if (Math.abs(delta) > DRAG_THRESHOLD) dragRef.current.moved = true;
    setDragDelta(delta);
  };

  const endDrag = () => {
    if (!dragRef.current.active) return;
    const delta = dragDelta;
    dragRef.current.active = false;
    setDragging(false);
    setDragDelta(0);
    // Sub-threshold press = tap, not a drag: keep current index.
    if (Math.abs(delta) < DRAG_THRESHOLD || step <= 0) return;
    const target = Math.round((baseOffset - delta) / step);
    setIndex(Math.min(Math.max(target, 0), lastIndex));
  };

  const refAt = (i: number) => tinaItems[i] || fallbackItems[i];

  const arrows = (
    <div className="flex w-fit overflow-hidden rounded-[12px] border-2 border-[#282445] bg-[#141223]">
      <button
        type="button"
        aria-label="Rubro anterior"
        onClick={prev}
        className="flex h-[49px] w-[49px] items-center justify-center bg-[#141223] text-white opacity-40 transition-opacity hover:opacity-100"
      >
        <FaArrowLeft className="text-sm" />
      </button>
      <button
        type="button"
        aria-label="Rubro siguiente"
        onClick={next}
        className="flex h-[49px] w-[49px] items-center justify-center bg-[#96237a] text-white transition-colors hover:bg-[#b02a92]"
      >
        <FaArrowRight className="text-sm" />
      </button>
    </div>
  );

  const card = (item: Rubro, i: number) => {
    const Icon = (item.icon && ICONS[item.icon]) || FALLBACK_ICON;
    const ref = refAt(i);
    return (
      <article
        key={i}
        className="flex min-h-[295px] shrink-0 flex-col justify-between rounded-[24.62px] bg-[rgba(42,42,42,0.5)] p-8 backdrop-blur-[2px] [width:calc((100%-3*0.5rem)/4)] max-md:[width:78%]"
      >
        <span className="flex h-[61px] w-[61px] items-center justify-center rounded-[12.31px] bg-[#b565a2] text-white">
          <Icon className="text-[28px]" />
        </span>
        <h3
          className="text-xl font-semibold text-white"
          data-tina-field={ref ? tinaField(ref, 'label') : undefined}
        >
          {item.label}
        </h3>
      </article>
    );
  };

  // While dragging, follow the pointer (with a little overscroll allowance);
  // otherwise sit at the snapped offset.
  const dragOffset = baseOffset - dragDelta;
  const offset = dragging
    ? Math.min(Math.max(dragOffset, -40), maxScroll + 40)
    : baseOffset;

  const viewport = (
    <div
      ref={viewportRef}
      className="overflow-hidden touch-pan-y select-none"
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        ref={trackRef}
        className="flex gap-2"
        style={{
          transform: `translateX(${-offset}px)`,
          transition: dragging ? 'none' : 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {items.map((item, i) => card(item, i))}
      </div>
    </div>
  );

  return (
    <section className="rounded-t-[16px] bg-[#0a0a0a] px-6 pb-[100px] pt-[72px] md:px-[88px]">
      <div className="mx-auto max-w-[1440px]">
        {/* Desktop header: title left, arrows right */}
        <div className="mb-12 hidden items-start justify-between gap-6 md:flex">
          <h2
            className="max-w-[623px] text-[56px] font-medium leading-[1.15] tracking-tight text-white"
            data-tina-field={rubros ? tinaField(rubros, 'title') : undefined}
          >
            {rubros?.title}
          </h2>
          {arrows}
        </div>

        {/* Mobile header: title only */}
        <h2
          className="mb-8 max-w-[623px] text-[32px] font-medium leading-[1.15] tracking-tight text-white md:hidden"
          data-tina-field={rubros ? tinaField(rubros, 'title') : undefined}
        >
          {rubros?.title}
        </h2>

        {viewport}

        {/* Mobile arrows: below, left-aligned */}
        <div className="mt-8 flex md:hidden">{arrows}</div>
      </div>
    </section>
  );
}
