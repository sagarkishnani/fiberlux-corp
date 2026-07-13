import { useTina, tinaField } from 'tinacms/dist/react';
import type { AboutQuery, AboutQueryVariables } from '../../../tina/__generated__/types';

/* ── Types ── */
interface ValuesProps {
  query: string;
  variables: AboutQueryVariables;
  data: AboutQuery;
}

interface ValueItem {
  name?: string | null;
}

export default function ValuesReact({ query, variables, data: initialData }: ValuesProps) {
  const { data } = useTina<AboutQuery>({ query, variables, data: initialData });

  // Fallback chain: useTina data → initialData
  const tinaAbout = data?.about;
  const fallbackAbout = initialData?.about;

  const tinaValues = tinaAbout?.values;
  const fallbackValues = fallbackAbout?.values;

  // Use Tina values if they have items, otherwise fallback
  const title = tinaValues?.title || fallbackValues?.title || '';
  const subtitle = tinaValues?.subtitle || fallbackValues?.subtitle || '';

  const tinaItems = (tinaValues?.items || []).filter(Boolean) as ValueItem[];
  const fallbackItems = (fallbackValues?.items || []).filter(Boolean) as ValueItem[];
  const items = tinaItems.length > 0 ? tinaItems : fallbackItems;

  if (items.length === 0) return null;

  // For tinaField, prefer tina data object if available
  const valuesRef = tinaValues || fallbackValues;

  const midpoint = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, midpoint);
  const rightItems = items.slice(midpoint);

  const duplicated = (arr: ValueItem[]) => [...arr, ...arr, ...arr];

  return (
    <section className="bg-white overflow-hidden">
      <div className="max-w-[1680px] mx-auto py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-0">

          {/* Left: Title + Subtitle (with padding) */}
          <div className="flex flex-col justify-center px-6 md:px-16 mb-10 md:mb-0">
            <h2
              className="text-[40px] md:text-[48px] leading-[120%] font-medium mb-6"
              style={{ color: '#6C1958' }}
              data-tina-field={valuesRef ? tinaField(valuesRef, 'title') : undefined}
            >
              {title}
            </h2>
            <p
              className="text-base leading-relaxed max-w-md"
              style={{ color: 'rgba(108, 25, 88, 0.7)' }}
              data-tina-field={valuesRef ? tinaField(valuesRef, 'subtitle') : undefined}
            >
              {subtitle}
            </p>
          </div>

          {/* Right: Marquee columns — desktop */}
          <div className="hidden md:grid grid-cols-2 gap-4 h-[500px] overflow-hidden marquee-container">
            {/* Left column — marquee UP */}
            <div className="relative overflow-hidden">
              <div className="values-marquee-up flex flex-col gap-4">
                {duplicated(leftItems).map((item, i) => (
                  <ValueCard key={`l-${i}`} item={item} />
                ))}
              </div>
            </div>

            {/* Right column — marquee DOWN */}
            <div className="relative overflow-hidden">
              <div className="values-marquee-down flex flex-col gap-4">
                {duplicated(rightItems).map((item, i) => (
                  <ValueCard key={`r-${i}`} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: Single column marquee */}
          <div className="md:hidden h-[400px] overflow-hidden marquee-container">
            <div className="values-marquee-down flex flex-col gap-4 px-6">
              {duplicated(items).map((item, i) => (
                <ValueCard key={`m-${i}`} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marqueeUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-33.33%); }
        }
        @keyframes marqueeDown {
          0% { transform: translateY(-33.33%); }
          100% { transform: translateY(0); }
        }
        .values-marquee-up {
          animation: marqueeUp 20s linear infinite;
        }
        .values-marquee-down {
          animation: marqueeDown 20s linear infinite;
        }
        .values-marquee-up:hover,
        .values-marquee-down:hover {
          animation-play-state: paused;
        }
        .marquee-container {
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
        }
      `}</style>
    </section>
  );
}

/* ── Value Card ── */
function ValueCard({ item }: { item: ValueItem }) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        background: 'rgba(150, 35, 122, 0.06)',
        border: '1px solid rgba(150, 35, 122, 0.1)',
        borderRadius: '14px',
        aspectRatio: '7 / 5',
        padding: '24px',
      }}
    >
      <span
        className="text-sm font-medium text-center"
        style={{ color: '#7F1866' }}
      >
        {item.name}
      </span>
    </div>
  );
}