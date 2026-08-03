import { useTina, tinaField } from 'tinacms/dist/react';
import type { IconType } from 'react-icons';
import type { AboutQuery, AboutQueryVariables } from '../../../tina/__generated__/types';
import { tField } from '../../utils/i18n';
import type { Locale } from '../../i18n/config';
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
  locale?: Locale;
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
  locale = 'es',
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
  if (total === 0) return null;

  // Fila 2 arranca rotada respecto a la 1 para que no se vean sincronizadas.
  const rowTop = items;
  const rowBottom = [...items.slice(Math.floor(total / 2)), ...items.slice(0, Math.floor(total / 2))];

  // Cada tile del marquee. `ref` (solo copia original de la fila superior) habilita edición inline.
  const tile = (item: Rubro, key: string, ref?: Rubro) => {
    const Icon = (item.icon && ICONS[item.icon]) || FALLBACK_ICON;
    return (
      <div key={key} className="rubro-tile shrink-0 flex flex-col items-center gap-2.5">
        <span className="grid h-[88px] w-[88px] place-items-center rounded-[18px] border border-white/10 bg-white/[0.03]">
          <Icon className="text-[30px] text-white/80" strokeWidth={1.5} />
        </span>
        <span
          className="whitespace-nowrap text-sm text-white/70"
          data-tina-field={ref ? tinaField(ref as any, 'label') : undefined}
        >
          {tField(item as any, 'label', locale)}
        </span>
      </div>
    );
  };

  // Track = contenido duplicado ([...base, ...base]) para loop sin costura.
  const track = (base: Rubro[], rowKey: string, withRefs: boolean) => (
    <div className={`rubro-track rubro-track--${rowKey} flex w-max`}>
      {[...base, ...base].map((item, i) => {
        const inFirstCopy = i < base.length;
        const ref = withRefs && inFirstCopy ? item : undefined;
        return tile(item, `${rowKey}-${i}`, ref);
      })}
    </div>
  );

  return (
    <section className="rounded-t-[16px] bg-[#0a0a0a] pb-[100px] pt-[72px]">
      <div className="site-container">
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:gap-12">
          {/* Título: fijo a la izquierda (desktop), arriba (móvil) */}
          <h2
            className="shrink-0 text-[32px] font-medium leading-[1.15] tracking-tight text-white md:max-w-[360px] md:text-[52px]"
            data-tina-field={rubros ? tinaField(rubros, 'title') : undefined}
          >
            {tField(rubros as any, 'title', locale)}
          </h2>

          {/* Marquee: 2 filas en sentidos opuestos, opacidad tenue + fade en bordes */}
          <div className="rubro-marquee min-w-0 flex-1">
            <div className="rubro-row">{track(rowTop, 'top', true)}</div>
            <div className="rubro-row">{track(rowBottom, 'bottom', false)}</div>
          </div>
        </div>
      </div>

      <style>{`
        .rubro-marquee {
          display: flex;
          flex-direction: column;
          gap: 28px;
          opacity: 0.5;
        }
        .rubro-row {
          overflow: hidden;
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
        }
        .rubro-track {
          gap: 40px;
          padding-right: 40px; /* iguala el gap tras la última tile para un loop continuo */
          will-change: transform;
          animation: rubro-marquee 42s linear infinite;
        }
        /* Fila superior corre a la derecha (reverse); inferior a la izquierda (normal). */
        .rubro-track--top { animation-direction: reverse; }
        .rubro-track--bottom { animation-direction: normal; }
        @keyframes rubro-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rubro-track { animation: none; }
        }
        @media (max-width: 1024px) {
          .rubro-track { gap: 32px; padding-right: 32px; }
        }
        @media (max-width: 767px) {
          .rubro-marquee { gap: 20px; }
          .rubro-track { gap: 24px; padding-right: 24px; }
          .rubro-tile span:first-child { height: 72px; width: 72px; border-radius: 15px; }
          .rubro-tile span:first-child svg { font-size: 26px; }
        }
      `}</style>
    </section>
  );
}
