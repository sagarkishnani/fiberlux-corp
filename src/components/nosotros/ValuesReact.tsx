import { useEffect, useState } from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import type { AboutQuery, AboutQueryVariables } from '../../../tina/__generated__/types';
import { tField } from '../../utils/i18n';
import type { Locale } from '../../i18n/config';
import { useSlider } from '../../hooks/useSlider';

/* ── Types ── */
interface ValuesProps {
  query: string;
  variables: AboutQueryVariables;
  data: AboutQuery;
  locale?: Locale;
}

interface ValueItem {
  icon?: string | null;
  name?: string | null;
  description?: string | null;
}

/* ── Icon map: clave del select en el CMS → path SVG (viewBox 0 0 24 24) ──
   Se usan paths sueltos (no react-icons) porque el trazo se dibuja en bucle con
   `pathLength="1"` + strokeDasharray, y eso necesita un <path> propio. */
const ICON_PATHS: Record<string, string> = {
  eye: 'M12 4.5c-4.4 0-7.6 3.4-8.8 6.2a1.9 1.9 0 0 0 0 1.6c1.2 2.8 4.4 6.2 8.8 6.2s7.6-3.4 8.8-6.2a1.9 1.9 0 0 0 0-1.6C19.6 7.9 16.4 4.5 12 4.5Zm0 4.4a3.1 3.1 0 1 1 0 6.2 3.1 3.1 0 0 1 0-6.2Z',
  shield: 'M12 2.6 4.4 5.8v5.6c0 4.6 3.1 8.5 7.6 10 4.5-1.5 7.6-5.4 7.6-10V5.8L12 2.6Zm-3.2 9.3 2.3 2.3 4.4-4.6',
  check: 'M4.5 12.5l4.2 4.2L19.5 6M4.5 18.5h15',
  pin: 'M12 21s6.6-5.6 6.6-10.4a6.6 6.6 0 1 0-13.2 0C5.4 15.4 12 21 12 21Zm0-8.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z',
  link: 'M9.5 14.5 14.5 9.5M8 12.8 5.6 15.2a3.4 3.4 0 0 0 4.8 4.8l2.4-2.4M16 11.2l2.4-2.4a3.4 3.4 0 0 0-4.8-4.8l-2.4 2.4',
  bolt: 'M13 2 4.5 13.2h6.2L10 22l8.6-11.3h-6.3L13 2Z',
  network: 'M12 7.6a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Zm-6.4 13.4a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Zm12.8 0a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6ZM12 7.6v4.6m0 0-5.2 4.2M12 12.2l5.2 4.2',
  clock: 'M12 3.4a8.6 8.6 0 1 0 0 17.2 8.6 8.6 0 0 0 0-17.2Zm0 4v5l3.4 2',
  users: 'M9 11.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Zm-6 8.6c0-3.3 2.7-5.4 6-5.4s6 2.1 6 5.4M16 5.2a3.4 3.4 0 0 1 0 6.6m1.6 2.9c2.1.6 3.4 2.2 3.4 4.3',
  spark: 'M12 3.2 13.9 9l5.9 1.9-5.9 1.9L12 18.8l-1.9-6L4.2 11 10.1 9 12 3.2ZM19 3.4v3M17.5 4.9h3',
  star: 'M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85L12 3.6Z',
};

const FALLBACK_ICON = 'spark';

/* Colores de la referencia (light) */
const C = {
  heading: '#6C1958',
  name: '#171717',
  body: '#6E6A6C',
  hairline: '#E9E4E7',
  brand: '#96237A',
};

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return mobile;
}

/* Agrupa los valores de a `size` para el slider mobile (2 filas por slide). */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function ValuesReact({ query, variables, data: initialData, locale = 'es' }: ValuesProps) {
  const { data } = useTina<AboutQuery>({ query, variables, data: initialData });

  // Fallback chain: useTina data → initialData
  const tinaAbout = data?.about;
  const fallbackAbout = initialData?.about;

  const tinaValues = tinaAbout?.values;
  const fallbackValues = fallbackAbout?.values;

  const title = tField(tinaValues as any, 'title', locale) || tField(fallbackValues as any, 'title', locale) || '';
  const subtitle =
    tField(tinaValues as any, 'subtitle', locale) || tField(fallbackValues as any, 'subtitle', locale) || '';

  const tinaItems = (tinaValues?.items || []).filter(Boolean) as ValueItem[];
  const fallbackItems = (fallbackValues?.items || []).filter(Boolean) as ValueItem[];
  const items = tinaItems.length > 0 ? tinaItems : fallbackItems;

  const valuesRef = tinaValues || fallbackValues;

  const isMobile = useIsMobile();
  // Hasta 4 valores caben en una sola fila; a partir de 5 volvemos a 3 columnas.
  const cols = items.length <= 4 ? items.length : 3;
  const lastRowStart = items.length - (items.length % cols || cols);
  const slides = chunk(items, 2);
  const slider = useSlider({ loop: false, align: 'center', active: isMobile && slides.length > 1 });

  if (items.length === 0) return null;

  return (
    <section className="bg-white overflow-hidden values-section">
      {/* Encabezado centrado */}
      <div className="max-w-[1220px] mx-auto px-6 md:px-10 pt-16 md:pt-[76px] pb-10 md:pb-14 text-center" data-reveal="up">
        <h2
          className="text-[34px] md:text-[52px] leading-[1.08] font-medium tracking-[-0.025em] mx-auto max-w-[820px]"
          style={{ color: C.heading }}
          data-tina-field={valuesRef ? tinaField(valuesRef, 'title') : undefined}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="mt-5 mx-auto max-w-[560px] text-[15px] md:text-base leading-[1.7]"
            style={{ color: C.body }}
            data-tina-field={valuesRef ? tinaField(valuesRef, 'subtitle') : undefined}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Grilla hairline — desktop */}
      <div className="relative hidden md:block pb-16 md:pb-20">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, #E9E4E7 22%, #E0D6DD 50%, #E9E4E7 78%, transparent)',
          }}
        />
        <div
          className="max-w-[1220px] mx-auto grid auto-rows-fr"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          data-reveal="up"
          data-reveal-stagger="0.07"
          data-reveal-distance="28"
        >
          {items.map((item, i) => (
            <div
              key={`d-${i}`}
              className="px-[34px] pt-[46px] pb-[52px] box-border"
              style={{
                borderRight: i % cols !== cols - 1 ? `1px solid ${C.hairline}` : 'none',
                borderBottom: i < lastRowStart ? `1px solid ${C.hairline}` : 'none',
              }}
            >
              <ValueCard item={item} index={i} locale={locale} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile — Embla, 2 filas por slide */}
      <div className="md:hidden pb-14">
        <div
          className="h-px mb-2"
          style={{ background: 'linear-gradient(90deg, transparent, #E9E4E7 50%, transparent)' }}
        />
        <div className="overflow-hidden px-6" ref={slider.viewportRef}>
          <div className="flex gap-4 items-stretch">
            {slides.map((group, gi) => (
              <div key={`s-${gi}`} className="flex-[0_0_84%] min-w-0 flex flex-col gap-3">
                {group.map((item, i) => (
                  <div
                    key={`m-${gi}-${i}`}
                    className="flex-1 flex flex-col justify-center box-border rounded-[18px] overflow-hidden"
                    style={{ border: `1px solid ${C.hairline}`, background: '#FCFAFB' }}
                  >
                    <ValueCard item={item} index={gi * 2 + i} locale={locale} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {slides.map((_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                aria-label={`Ir al grupo ${i + 1}`}
                onClick={() => slider.goTo(i)}
                className="h-[6px] rounded-full transition-all duration-300"
                style={{
                  width: slider.activeIndex === i ? 22 : 6,
                  background: slider.activeIndex === i ? C.brand : 'rgba(150,35,122,.22)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        /* Trazo del ícono dibujándose en bucle (referencia "Valores FLX"). */
        @keyframes vlDraw {
          0%   { stroke-dashoffset: 1; }
          45%  { stroke-dashoffset: 0; }
          82%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 1; }
        }
        /* Hover sutil: la tarjeta escala apenas y el icono acompaña. */
        .values-section .vl-cell {
          transition: transform .4s cubic-bezier(.22, .61, .36, 1);
        }
        .values-section .vl-icon {
          transition: transform .4s cubic-bezier(.22, .61, .36, 1),
                      box-shadow .4s cubic-bezier(.22, .61, .36, 1);
        }
        @media (hover: hover) {
          .values-section .vl-cell:hover { transform: scale(1.022); }
          .values-section .vl-cell:hover .vl-icon {
            transform: translateY(-2px);
            box-shadow: 0 10px 24px rgba(59, 14, 48, .10);
          }
        }
        .values-section .vl-ghost { opacity: .16; }
        .values-section .vl-trace {
          stroke-dasharray: 1;
          animation: vlDraw 4.2s cubic-bezier(.45, 0, .25, 1) infinite;
        }
        /* En móvil el trazo no se dibuja: se queda el ícono completo, quieto.
           stroke-dashoffset no es una propiedad que el compositor pueda
           resolver —obliga a REPINTAR el SVG en cada fotograma— y son un ícono
           por valor, en bucle, mientras el dedo scrollea. En una pantalla de
           teléfono el dibujo del trazo casi no se aprecia y costaba justo
           donde más duele; en desktop se conserva tal cual. */
        @media (max-width: 767px) {
          .values-section .vl-trace {
            animation: none;
            stroke-dasharray: none;
            stroke-dashoffset: 0;
          }
          /* Sin trazo animado encima, la copia tenue sobra: sería un segundo
             path pintado sobre el mismo dibujo. */
          .values-section .vl-ghost { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .values-section .vl-cell,
          .values-section .vl-cell:hover,
          .values-section .vl-icon,
          .values-section .vl-cell:hover .vl-icon { transform: none; transition: none; }
          .values-section .vl-ghost { display: none; }
          .values-section .vl-trace { animation: none; stroke-dasharray: none; }
        }
      `}</style>
    </section>
  );
}

/* ── Value Card ── */
function ValueCard({ item, index, locale }: { item: ValueItem; index: number; locale: Locale }) {
  const path = ICON_PATHS[item.icon || ''] || ICON_PATHS[FALLBACK_ICON];
  const name = tField(item as any, 'name', locale);
  const description = tField(item as any, 'description', locale);

  return (
    <div className="vl-cell h-full flex flex-col justify-center rounded-[18px] px-5 py-6 md:block md:px-[18px] md:pt-[22px] md:pb-[26px] text-center box-border">
      <div className="relative flex items-center justify-center h-[64px] md:h-[74px]">
        <div
          className="vl-icon relative flex items-center justify-center w-[52px] h-[52px] md:w-14 md:h-14 rounded-[16px]"
          style={{
            background: '#FFFFFF',
            border: '1px solid #EFE3EB',
            boxShadow: '0 6px 18px rgba(59, 14, 48, .06)',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="26"
            height="26"
            fill="none"
            stroke={C.brand}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Copia estatica tenue: el icono siempre se lee mientras el trazo se dibuja encima. */}
            <path className="vl-ghost" d={path} />
            <path className="vl-trace" d={path} pathLength={1} style={{ animationDelay: `${index * 320}ms` }} />
          </svg>
        </div>
      </div>
      <h3
        className="mt-5 md:mt-[26px] text-[19px] md:text-[21px] font-semibold tracking-[-0.02em] leading-[1.25]"
        style={{ color: C.name }}
      >
        {name}
      </h3>
      {description && (
        <p
          className="mt-3 mx-auto max-w-[320px] text-[13.5px] md:text-sm leading-[1.7]"
          style={{ color: C.body }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
