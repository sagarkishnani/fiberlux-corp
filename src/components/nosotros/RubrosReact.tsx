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
  /* Degradado radial morado de fondo. Se usa en Casos de éxito para separar el
     bloque del slider que va encima; en Nosotros va plano. */
  glow?: boolean;
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
  glow = false,
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
      <div key={key} className="rubro-tile shrink-0 flex flex-col items-center gap-3">
        <span className="grid h-[116px] w-[116px] place-items-center rounded-[22px] border border-white/10 bg-white/[0.03]">
          <Icon className="text-[38px] text-white/80" strokeWidth={1.5} />
        </span>
        <span
          className="whitespace-nowrap text-[15px] text-white/70"
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
    <section className="relative overflow-hidden rounded-t-[16px] bg-[#0a0a0a] pb-[64px] pt-[92px] md:pb-[116px]">
      {/* Halo radial tenue: marca el corte con el bloque anterior sin cambiar el
          fondo negro de la sección. El halo NACE del negro (máscara vertical que
          arranca transparente) para que no se vea una línea dura en el borde
          superior, y se apaga antes del final del bloque. */}
      {glow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(115% 68% at 50% 42%, rgba(150,35,122,0.26) 0%, rgba(150,35,122,0.12) 40%, rgba(10,10,10,0) 74%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 14%, #000 34%, #000 74%, rgba(0,0,0,0) 100%)',
            maskImage:
              'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 14%, #000 34%, #000 74%, rgba(0,0,0,0) 100%)',
          }}
        />
      )}
      <div className="relative site-container">
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:gap-14">
          {/* Columna izquierda: título + descripción (fija en desktop, arriba en móvil) */}
          <div className="shrink-0 md:max-w-[440px]">
            <h2
              className="text-[32px] font-medium leading-[1.15] tracking-tight text-white md:text-[52px]"
              data-tina-field={rubros ? tinaField(rubros, 'title') : undefined}
            >
              {tField(rubros as any, 'title', locale)}
            </h2>
            {tField(rubros as any, 'description', locale) && (
              <p
                className="mt-6 max-w-[440px] text-base leading-relaxed text-white/60 md:text-lg"
                data-tina-field={rubros ? tinaField(rubros, 'description') : undefined}
              >
                {tField(rubros as any, 'description', locale)}
              </p>
            )}
          </div>

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
          gap: 36px;
          opacity: 0.5;
        }
        .rubro-row {
          overflow: hidden;
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
        }
        .rubro-track {
          gap: 48px;
          padding-right: 48px; /* iguala el gap tras la última tile para un loop continuo */
          will-change: transform;
          animation: rubro-marquee 46s linear infinite;
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
          .rubro-marquee { gap: 28px; }
          .rubro-track { gap: 40px; padding-right: 40px; }
          .rubro-tile span:first-child { height: 100px; width: 100px; border-radius: 20px; }
          .rubro-tile span:first-child svg { font-size: 34px; }
        }
        @media (max-width: 767px) {
          .rubro-marquee { gap: 22px; }
          .rubro-track { gap: 28px; padding-right: 28px; }
          .rubro-tile span:first-child { height: 84px; width: 84px; border-radius: 17px; }
          .rubro-tile span:first-child svg { font-size: 30px; }
        }
      `}</style>
    </section>
  );
}
