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

  if (items.length === 0) return null;

  const refAt = (i: number) => tinaItems[i] || fallbackItems[i];

  const arrows = (
    <div className="flex w-fit overflow-hidden rounded-[12px] border-2 border-[#282445] bg-[#141223]">
      <button
        type="button"
        aria-label="Rubro anterior"
        className="flex h-[49px] w-[49px] items-center justify-center bg-[#141223] text-white opacity-40 transition-opacity hover:opacity-100"
      >
        <FaArrowLeft className="text-sm" />
      </button>
      <button
        type="button"
        aria-label="Rubro siguiente"
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
        className="flex min-h-[295px] flex-col justify-between rounded-[24.62px] bg-[rgba(42,42,42,0.5)] p-8 backdrop-blur-[2px]"
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

  return (
    <section className="rounded-t-[16px] bg-[#0a0a0a] px-[88px] pb-[100px] pt-[72px]">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-12 flex items-start justify-between gap-6">
          <h2
            className="max-w-[623px] text-[56px] font-medium leading-[1.15] tracking-tight text-white"
            data-tina-field={rubros ? tinaField(rubros, 'title') : undefined}
          >
            {rubros?.title}
          </h2>
          {arrows}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {items.map((item, i) => card(item, i))}
        </div>
      </div>
    </section>
  );
}
