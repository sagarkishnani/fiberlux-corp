import { useTina, tinaField } from 'tinacms/dist/react';
import type { IconType } from 'react-icons';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6';
import type { AboutQuery, AboutQueryVariables } from '../../../tina/__generated__/types';
// obs_6: set de íconos en estilo outline (Lucide) para coincidir con la referencia.
import {
  LuPickaxe,
  LuUtensilsCrossed,
  LuGraduationCap,
  LuBedDouble,
  LuHeartPulse,
  LuShoppingCart,
  LuLandmark,
  LuFactory,
  LuTruck,
  LuBuilding2,
  LuHardHat,
  LuTractor,
  LuLaptop,
  LuZap,
  LuRadioTower,
  LuPlane,
  LuDrama,
  LuBuilding,
  LuBriefcase,
  LuSettings,
} from 'react-icons/lu';
import { useSlider } from '../../hooks/useSlider';
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
  autoplay?: boolean;
  intervalMs?: number;
}

/* ── Icon map: CMS select key → react-icons component ── */
const ICONS: Record<string, IconType> = {
  mineria: LuPickaxe,
  restaurantes: LuUtensilsCrossed,
  educacion: LuGraduationCap,
  hoteleria: LuBedDouble,
  salud: LuHeartPulse,
  retail: LuShoppingCart,
  banca: LuLandmark,
  industria: LuFactory,
  logistica: LuTruck,
  gobierno: LuBuilding2,
  construccion: LuHardHat,
  agroindustria: LuTractor,
  tecnologia: LuLaptop,
  energia: LuZap,
  telecomunicaciones: LuRadioTower,
  turismo: LuPlane,
  entretenimiento: LuDrama,
  corporativo: LuBuilding,
  consultoria: LuBriefcase,
  servicios: LuSettings,
};
const FALLBACK_ICON: IconType = LuBuilding;

export default function RubrosReact({
  query,
  variables,
  data: initialData,
  autoplay = true,
  intervalMs = 3500,
}: RubrosProps) {
  const { data } = useTina<AboutQuery>({ query, variables, data: initialData });

  // Fallback chain: useTina data → initialData
  const tinaRubros = data?.about?.rubros;
  const fallbackRubros = initialData?.about?.rubros;
  const rubros = tinaRubros || fallbackRubros;

  const tinaItems = (tinaRubros?.items || []).filter(Boolean) as Rubro[];
  const fallbackItems = (fallbackRubros?.items || []).filter(Boolean) as Rubro[];
  const items = tinaItems.length > 0 ? tinaItems : fallbackItems;

  const total = items.length;
  const enough = total > 1;

  /* Embla slider: left-aligned cards, autoplay w/ loop (arrows wrap via loop). */
  const slider = useSlider({
    align: 'start',
    loop: enough,
    autoplay: autoplay && enough,
    intervalMs,
  });

  if (total === 0) return null;

  // Con loop, prev/next envuelven en los extremos automáticamente.
  const handlePrev = slider.prev;
  const handleNext = slider.next;

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
        <span className="relative z-10 flex h-[61px] w-[61px] items-center justify-center rounded-[12.31px] bg-[#b565a2] text-[#3B0E30]">
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
    <section className="rounded-t-[16px] bg-[#0a0a0a] pb-[100px] pt-[72px]">
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
          ref={slider.viewportRef}
          className="overflow-hidden select-none rubros-carousel"
          style={{ cursor: 'grab' }}
        >
          <div className="flex gap-2">
            {items.map((item, i) => card(item, i))}
          </div>
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
