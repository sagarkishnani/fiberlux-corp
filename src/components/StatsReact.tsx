import { useState, useEffect, useRef } from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import type { HomeQuery, HomeQueryVariables } from '../../tina/__generated__/types';
import { tField } from '../utils/i18n';
import type { Locale } from '../i18n/config';
import { parseStat, formatNumber, useCounter } from '../hooks/useStatCounter';

/* ── Types ── */
interface StatsProps {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  locale?: Locale;
  /** Optional heading override; falls back to home `stats.title`. */
  titleOverride?: string;
  /** obs2: 'light' envuelve el panel morado en un marco claro (solo home). */
  frameTheme?: 'dark' | 'light';
}

interface StatItem {
  number?: string | null;
  label?: string | null;
  description?: string | null;
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

/* ── Individual Stat Card ── */
function StatCard({ item, index, locale }: { item: StatItem; index: number; locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  /* La cifra nace en su valor final (así queda en el HTML estático) y sólo se
     rebobina a 0 —para poder animarla— si al hidratar todavía no está en
     pantalla. Ver `useCounter`. */
  const [rebobinar, setRebobinar] = useState(false);

  const { prefix, value, suffix, decimals, hasCommas } = parseStat(item.number || '0');
  const count = useCounter(value, 1000 + index * 60, isVisible, rebobinar);

  // Intersection observer to trigger animation when visible
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* Rebobinar sólo si la cifra todavía no se está leyendo. La isla se hidrata
       con `client:visible`, o sea justo cuando el bloque asoma por el borde de
       abajo: ahí `top` ronda el alto del viewport y sí hay que rebobinar para
       que la cuenta se vea subir. Si alguien recarga con las cifras ya a media
       pantalla se quedan en su valor final, en vez de parpadear a cero. */
    const r = el.getBoundingClientRect();
    if (r.top > window.innerHeight * 0.5) setRebobinar(true);

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

  // En la banda xl (1280–1536) el grid ya es de 4 columnas pero las celdas son
  // estrechas; se reduce el número para que "+17,000 km" no invada la celda
  // vecina, y se vuelve a 64px en 2xl, donde hay espacio de sobra.
  const numberCls =
    "text-[44px] leading-[48px] sm:text-[64px] sm:leading-[68px] xl:text-[50px] xl:leading-[54px] 2xl:text-[64px] 2xl:leading-[68px] font-bold";
  const suffixCls =
    "text-[24px] leading-[28px] sm:text-[30px] sm:leading-[34px] xl:text-[24px] xl:leading-[28px] 2xl:text-[30px] 2xl:leading-[34px] font-semibold ml-0.5";

  return (
    <div ref={ref} className="flex flex-col gap-3">
      {/* SPEC 54: número protagonista suelto sobre el fondo (sin card), en lila malva con degradé. */}
      <p
        style={{ color: '#C9A9C4' }}
        data-tina-field={tinaField(item as any, 'number')}
      >
        {prefix && <span className={numberCls}>{prefix}</span>}
        <span className={numberCls}>{displayNumber}</span>
        {suffix && <span className={suffixCls}>{suffix}</span>}
      </p>

      {/* Description below number */}
      <p
        className="text-white/80 text-body-md leading-snug"
        data-tina-field={tinaField(item as any, 'description')}
      >
        {tField(item as any, "description", locale)}
      </p>
    </div>
  );
}

/**
 * StatsReact — "Nuestra red en cifras" section
 */
export default function StatsReact({ query, variables, data: initialData, titleOverride, frameTheme = "dark", locale = "es" }: StatsProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });

  const stats = data?.home?.stats;
  if (!stats) return null;

  const items = (stats.items || []).filter(Boolean) as StatItem[];
  const heading = titleOverride || tField(stats as any, "title", locale);
  const light = frameTheme === 'light';

  const panel = (
    <section
      className="rounded-t-3xl py-20 md:py-28"
      style={{
        // SPEC 54: base aubergine oscura con brillo magenta arriba-derecha (Figma).
        background:
          "radial-gradient(120% 130% at 100% 0%, #b32e94 0%, #7a1a62 34%, #4c0f3d 66%, #360c2c 100%)",
      }}
    >
      <div className="site-container">

        {/* Section title */}
        <h2
          className="text-subtitle-lg font-normal text-white mb-12 md:mb-14"
          data-tina-field={tinaField(stats, 'title')}
        >
          {renderHeading(heading || '')}
        </h2>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-10 items-start">
          {items.map((item, i) => (
            <StatCard key={i} item={item} index={i} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );

  // obs2: en home el panel morado se apoya sobre un marco claro (como testimonios)
  // en vez de sobre negro. El panel no cambia; cambia solo el fondo que lo rodea.
  // Sin padding extra: la seccion siguiente queda pegada, a ras del panel.
  if (light) {
    return <div className="bg-brand-purple-lightest">{panel}</div>;
  }

  return panel;
}