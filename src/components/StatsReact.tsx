import { useState, useEffect, useRef, useCallback } from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import type { HomeQuery, HomeQueryVariables } from '../../tina/__generated__/types';

/* ── Types ── */
interface StatsProps {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  /** Optional heading override; falls back to home `stats.title`. */
  titleOverride?: string;
}

interface StatItem {
  number?: string | null;
  label?: string | null;
  description?: string | null;
}

function parseStat(raw: string) {
  const trimmed = raw.trim();

  // Extract prefix (+ or - at start)
  let prefix = '';
  let rest = trimmed;
  if (rest.startsWith('+') || rest.startsWith('-')) {
    prefix = rest[0];
    rest = rest.slice(1).trim();
  }

  // Extract suffix (km, %, etc. at end)
  const suffixMatch = rest.match(/\s*(km|%|ms|Gbps|Mbps)$/i);
  let suffix = '';
  if (suffixMatch) {
    suffix = suffixMatch[0].trim();
    rest = rest.slice(0, -suffixMatch[0].length).trim();
  }

  // Parse numeric value (remove commas)
  const numericStr = rest.replace(/,/g, '');
  const value = parseFloat(numericStr) || 0;

  // Check decimals
  const decimalMatch = numericStr.match(/\.(\d+)/);
  const decimals = decimalMatch ? decimalMatch[1].length : 0;

  // Check if original had commas (for formatting)
  const hasCommas = rest.includes(',');

  return { prefix, value, suffix, decimals, hasCommas };
}

/** Renders the section heading with the word "Fiberlux" in bold, rest in normal weight. */
function renderHeading(heading: string) {
  return heading.split(/(Fiberlux)/i).map((part, i) =>
    /^fiberlux$/i.test(part) ? (
      <strong key={i} className="font-bold">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function formatNumber(n: number, decimals: number, hasCommas: boolean): string {
  const fixed = n.toFixed(decimals);
  if (!hasCommas) return fixed;

  const [intPart, decPart] = fixed.split('.');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart ? `${formatted}.${decPart}` : formatted;
}

/* ── Counter Hook ── */
function useCounter(target: number, duration: number, shouldStart: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart || target === 0) return;

    let startTime: number | null = null;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad (less front-loaded than cubic → numbers keep climbing longer)
      const eased = 1 - Math.pow(1 - progress, 2);
      setCount(eased * target);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, shouldStart]);

  return count;
}

/* ── Individual Stat Card ── */
function StatCard({ item, index }: { item: StatItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const { prefix, value, suffix, decimals, hasCommas } = parseStat(item.number || '0');
  const count = useCounter(value, 2000 + index * 150, isVisible);

  // Intersection observer to trigger animation when visible
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const displayNumber = formatNumber(count, decimals, hasCommas);

  return (
    <div ref={ref} className="flex flex-col gap-3">
      {/* SPEC 54: número protagonista suelto sobre el fondo (sin card), en lila malva con degradé. */}
      <p
        className="bg-clip-text text-transparent"
        style={{ backgroundImage: 'linear-gradient(180deg, #E3C9DF 0%, #B98CB0 100%)' }}
        data-tina-field={tinaField(item as any, 'number')}
      >
        {prefix && (
          <span className="text-[44px] leading-[48px] sm:text-[64px] sm:leading-[68px] font-bold">
            {prefix}
          </span>
        )}
        <span className="text-[44px] leading-[48px] sm:text-[64px] sm:leading-[68px] font-bold">
          {displayNumber}
        </span>
        {suffix && (
          <span className="text-[24px] leading-[28px] sm:text-[30px] sm:leading-[34px] font-semibold ml-0.5">
            {suffix}
          </span>
        )}
      </p>

      {/* Description below number */}
      <p
        className="text-white/80 text-body-md leading-snug"
        data-tina-field={tinaField(item as any, 'description')}
      >
        {item.description}
      </p>
    </div>
  );
}

/**
 * StatsReact — "Nuestra red en cifras" section
 */
export default function StatsReact({ query, variables, data: initialData, titleOverride }: StatsProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });

  const stats = data?.home?.stats;
  if (!stats) return null;

  const items = (stats.items || []).filter(Boolean) as StatItem[];
  const heading = titleOverride || stats.title;

  return (
    <section
      className="rounded-t-3xl py-14 md:py-20"
      style={{
        // SPEC 54: base aubergine oscura con brillo magenta arriba-derecha (Figma).
        background:
          "radial-gradient(120% 130% at 100% 0%, #b32e94 0%, #7a1a62 34%, #4c0f3d 66%, #360c2c 100%)",
      }}
    >
      <div className="site-container">

        {/* Section title */}
        <h2
          className="text-subtitle-lg font-normal text-white mb-6"
          data-tina-field={tinaField(stats, 'title')}
        >
          {renderHeading(heading || '')}
        </h2>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 items-start">
          {items.map((item, i) => (
            <StatCard key={i} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}