import { useState, useEffect } from 'react';
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
  FaBriefcase,
  FaGears,
} from 'react-icons/fa6';
import type { AboutQuery, AboutQueryVariables } from '../../../tina/__generated__/types';
import { useDragSlider } from '../../hooks/useDragSlider';
import { mediaUrl } from '../../utils/mediaUrl';

/* ── Types ── */
interface Rubro {
  icon?: string | null;
  label?: string | null;
  image?: string | null;
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
  consultoria: FaBriefcase,
  servicios: FaGears,
};
const FALLBACK_ICON: IconType = FaBuilding;

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

export default function RubrosReact({ query, variables, data: initialData }: RubrosProps) {
  const { data } = useTina<AboutQuery>({ query, variables, data: initialData });

  // Fallback chain: useTina data → initialData
  const tinaRubros = data?.about?.rubros;
  const fallbackRubros = initialData?.about?.rubros;
  const rubros = tinaRubros || fallbackRubros;

  const tinaItems = (tinaRubros?.items || []).filter(Boolean) as Rubro[];
  const fallbackItems = (fallbackRubros?.items || []).filter(Boolean) as Rubro[];
  const items = tinaItems.length > 0 ? tinaItems : fallbackItems;

  const total = items.length;

  /* Shared drag/scroll engine: left-aligned cards, one card per arrow. */
  const slider = useDragSlider({
    slideSelector: '.rubro-slide',
    align: 'start',
    itemCount: total,
  });
  const { atStart, atEnd, goTo, next, prev } = slider;

  // Autoplay control (component-owned; drives the shared engine via its API).
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  // Autoplay: advance every 5s and wrap at the end; paused on hover/focus, while
  // interacting, and disabled with reduced motion.
  useEffect(() => {
    if (paused || reducedMotion || total <= 1) return;
    const id = setInterval(() => {
      if (atEnd) goTo(0);
      else next();
    }, 5000);
    return () => clearInterval(id);
  }, [paused, reducedMotion, total, atEnd, goTo, next]);

  if (total === 0) return null;

  // Arrows wrap around (Rubros-specific), unlike the other sliders.
  const handlePrev = () => (atStart ? goTo(total - 1) : prev());
  const handleNext = () => (atEnd ? goTo(0) : next());

  const refAt = (i: number) => tinaItems[i] || fallbackItems[i];

  const arrows = (
    <div className="flex w-fit overflow-hidden rounded-[12px] border-2 border-[#282445] bg-[#141223]">
      <button
        type="button"
        aria-label="Rubro anterior"
        onClick={handlePrev}
        className="flex h-[49px] w-[49px] items-center justify-center bg-[#141223] text-white opacity-40 transition-opacity hover:opacity-100"
      >
        <FaArrowLeft className="text-sm" />
      </button>
      <button
        type="button"
        aria-label="Rubro siguiente"
        onClick={handleNext}
        className="flex h-[49px] w-[49px] items-center justify-center bg-[#96237a] text-white transition-colors hover:bg-[#b02a92]"
      >
        <FaArrowRight className="text-sm" />
      </button>
    </div>
  );

  const card = (item: Rubro, i: number) => {
    const Icon = (item.icon && ICONS[item.icon]) || FALLBACK_ICON;
    const ref = refAt(i);
    const hasImage = Boolean(item.image);
    return (
      <article
        key={i}
        className={`rubro-slide snap-start relative overflow-hidden flex min-h-[295px] shrink-0 flex-col justify-between rounded-[24.62px] p-8 [width:calc((100%-3*0.5rem)/4)] max-md:[width:78%] ${
          hasImage ? '' : 'bg-[rgba(42,42,42,0.5)] backdrop-blur-[2px]'
        }`}
      >
        {hasImage && (
          <>
            {/* Imagen de fondo a sangre; el default (sin imagen) mantiene el look negro. */}
            <img
              src={mediaUrl(item.image)}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="absolute inset-0 z-0 h-full w-full object-cover"
            />
            {/* Overlay en degradado, más oscuro abajo (donde va el nombre) para legibilidad. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 z-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.30) 45%, rgba(10,10,10,0.82) 100%)',
              }}
            />
          </>
        )}
        <span className="relative z-10 flex h-[61px] w-[61px] items-center justify-center rounded-[12.31px] bg-[#b565a2] text-white">
          <Icon className="text-[28px]" />
        </span>
        <h3
          className="relative z-10 text-xl font-semibold text-white"
          data-tina-field={ref ? tinaField(ref, 'label') : undefined}
        >
          {item.label}
        </h3>
      </article>
    );
  };

  return (
    <section
      className="rounded-t-[16px] bg-[#0a0a0a] pb-[100px] pt-[72px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="site-container">
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

        <div
          ref={slider.ref}
          className="flex gap-2 overflow-x-auto snap-x snap-proximity select-none rubros-carousel"
          style={{ cursor: 'grab' }}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          {...slider.handlers}
        >
          {items.map((item, i) => card(item, i))}
        </div>

        {/* Mobile arrows: below, left-aligned */}
        <div className="mt-8 flex md:hidden">{arrows}</div>
      </div>

      <style>{`
        .rubros-carousel { scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; }
        .rubros-carousel::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
