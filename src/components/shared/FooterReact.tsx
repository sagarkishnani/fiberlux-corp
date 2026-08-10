import { useTina, tinaField } from 'tinacms/dist/react';
import type { GlobalQuery, GlobalQueryVariables } from '../../../tina/__generated__/types';
import {
  FaFacebookF,
  FaLinkedinIn,
  FaInstagram,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
  FaTiktok,
  FaGithub,
} from 'react-icons/fa6';
import type { IconType } from 'react-icons';
import type { Locale } from '../../i18n/config';
import { tField, localizeHref } from '../../utils/i18n';

/* ── Types ── */
interface FooterProps {
  query: string;
  variables: GlobalQueryVariables;
  data: GlobalQuery;
  /** Idioma activo (SPEC 80). */
  locale?: Locale;
}

interface SocialItem {
  platform?: string | null;
  url?: string | null;
  icon?: string | null;
}

interface LinkItem {
  text?: string | null;
  url?: string | null;
  external?: boolean | null;
}

interface ColumnItem {
  title?: string | null;
  links?: (LinkItem | null)[] | null;
}

/* ── Icon map: platform name → react-icons component ── */
const iconMap: Record<string, IconType> = {
  Facebook: FaFacebookF,
  LinkedIn: FaLinkedinIn,
  Instagram: FaInstagram,
  WhatsApp: FaWhatsapp,
  X: FaXTwitter,
  YouTube: FaYoutube,
  TikTok: FaTiktok,
  GitHub: FaGithub,
};

/** Default logo path as fallback */
const DEFAULT_LOGO = '/images/logo/fiberlux.svg';

/**
 * FooterReact — visual-editable footer for TinaCMS
 *
 * Uses `client:tina` in Astro → only hydrates inside Tina's editor.
 * In production, renders static HTML with zero JS.
 */
export default function FooterReact({ query, variables, data: initialData, locale = 'es' }: FooterProps) {
  const { data } = useTina<GlobalQuery>({ query, variables, data: initialData });

  const footer = data?.global?.footer;
  if (!footer) return null;

  const currentYear = new Date().getFullYear();
  const logoSrc = (footer as any).logo || DEFAULT_LOGO;
  const copyrightTemplate =
    tField(footer as any, 'copyright', locale) ||
    '© {year} Fiberlux. Todos los derechos reservados';
  const copyrightText = copyrightTemplate.replace('{year}', String(currentYear));
  const agencyLogo = (footer as any).agencyLogo as string | null | undefined;
  const agencyUrl = (footer as any).agencyUrl as string | null | undefined;

  const columns = (footer.columns ?? []).filter(Boolean) as ColumnItem[];

  /* ── Fondo del footer (CMS) ──
     4 modos: morado sólido, oscuro con resplandor (default), imagen, o
     gradientes CSS personalizados. El resplandor se genera con color-mix
     para inyectar transparencia sobre el color de marca elegido. */
  const bg = (footer as any).background as
    | {
        mode?: string | null;
        baseColor?: string | null;
        glowColor?: string | null;
        image?: string | null;
        gradients?: ({ value?: string | null } | null)[] | null;
      }
    | null
    | undefined;

  const mode = bg?.mode || 'purple';
  const baseColor = bg?.baseColor || '#0A0A0A';
  const glowColor = bg?.glowColor || '#96237A';

  let footerBgClass = '';
  let footerBgStyle: React.CSSProperties = {};

  if (mode === 'image' && bg?.image) {
    footerBgStyle = {
      backgroundColor: baseColor,
      backgroundImage: `url("${bg.image}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  } else if (mode === 'custom') {
    const layers = (bg?.gradients ?? [])
      .map((g) => g?.value?.trim())
      .filter(Boolean) as string[];
    footerBgStyle = layers.length
      ? { background: `${layers.join(', ')}, ${baseColor}` }
      : { backgroundColor: baseColor };
  } else if (mode === 'dark-glow') {
    // Reflector magenta 100% en código (sin imagen). El degradado real vive
    // en el <style> `.footer-darkglow` de abajo para poder variar en mobile
    // vía media query; aquí solo inyectamos los colores como variables CSS.
    footerBgClass = 'footer-darkglow';
    footerBgStyle = {
      ['--fx-base' as any]: baseColor,
      ['--fx-glow' as any]: glowColor,
    };
  } else {
    // 'purple' (clásico) — fallback por defecto
    footerBgClass = 'bg-brand-purple';
  }

  const renderColumn = (column: ColumnItem, key: number) => {
    const links = (column.links?.filter(Boolean) as LinkItem[]) ?? [];
    // Long columns (e.g. "Legales") span the full width and lay their links
    // out in multiple columns (2 on tablet, 3 on desktop) to keep the footer
    // from getting too tall.
    const wide = links.length > 8;

    return (
      <div key={key} className={wide ? 'sm:col-span-2 lg:col-span-3' : ''}>
        <h3
          className="text-[18px] leading-[18px] font-semibold text-white mb-4"
          data-tina-field={tinaField(column, 'title')}
        >
          {tField(column as any, 'title', locale)}
        </h3>
        <ul
          className={`space-y-2.5 ${
            wide
              ? 'sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-8 sm:gap-y-2.5 sm:space-y-0'
              : ''
          }`}
        >
          {links.map((link: LinkItem, j: number) => (
            <li key={j}>
              <a
                href={localizeHref(link.url, locale, link.external) || '#'}
                {...(link.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="leading-[20px] text-white/70 hover:text-white transition-colors duration-200"
                data-tina-field={tinaField(link, 'text')}
              >
                {tField(link as any, 'text', locale)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <footer
      className={`footer-root relative overflow-hidden rounded-t-xl ${footerBgClass}`}
      style={footerBgStyle}
    >
      {/* SPEC 99 obs5: donde el fondo del footer ya es morado (`mode: 'purple'`),
          la selección morada global no se vería → se usa un resaltado claro. */}
      {mode === 'purple' && (
        <style>{`
          .footer-root ::selection { background: rgba(255, 255, 255, 0.35); color: #3B0E30; }
          .footer-root ::-moz-selection { background: rgba(255, 255, 255, 0.35); color: #3B0E30; }
        `}</style>
      )}
      {mode === 'dark-glow' && (
        <style>{`
          .footer-darkglow {
            background-color: var(--fx-base);
            /* Desktop: reflector desde arriba-centro que se abre en banda horizontal */
            background-image:
              radial-gradient(22% 82% at 54% -12%, color-mix(in srgb, var(--fx-glow) 72%, transparent) 0%, color-mix(in srgb, var(--fx-glow) 30%, transparent) 32%, transparent 60%),
              radial-gradient(90% 56% at 46% 54%, color-mix(in srgb, var(--fx-glow) 66%, transparent) 0%, color-mix(in srgb, var(--fx-glow) 30%, transparent) 42%, transparent 76%),
              radial-gradient(48% 34% at 43% 54%, color-mix(in srgb, var(--fx-glow) 60%, transparent) 0%, transparent 70%),
              radial-gradient(55% 60% at 9% 92%, color-mix(in srgb, var(--fx-glow) 26%, transparent) 0%, transparent 60%);
          }
          /* Tablet / desktop angosto (768–1279px): el footer es más alto, así
             que se sube el bloom y se reduce su alcance vertical para no saturar
             la mitad inferior; el reflector se mantiene. */
          @media (min-width: 768px) and (max-width: 1279px) {
            .footer-darkglow {
              background-image:
                radial-gradient(30% 58% at 55% -6%, color-mix(in srgb, var(--fx-glow) 62%, transparent) 0%, color-mix(in srgb, var(--fx-glow) 24%, transparent) 34%, transparent 62%),
                radial-gradient(96% 40% at 46% 38%, color-mix(in srgb, var(--fx-glow) 54%, transparent) 0%, color-mix(in srgb, var(--fx-glow) 22%, transparent) 46%, transparent 80%),
                radial-gradient(50% 26% at 42% 38%, color-mix(in srgb, var(--fx-glow) 44%, transparent) 0%, transparent 72%),
                radial-gradient(60% 34% at 8% 82%, color-mix(in srgb, var(--fx-glow) 18%, transparent) 0%, transparent 64%);
            }
          }
          /* Mobile: el footer es alto y angosto → un haz vertical se ve mal.
             Se reemplaza por un resplandor suave y ancho arriba + brillo inferior. */
          @media (max-width: 767px) {
            .footer-darkglow {
              background-image:
                radial-gradient(150% 24% at 50% 2%, color-mix(in srgb, var(--fx-glow) 55%, transparent) 0%, color-mix(in srgb, var(--fx-glow) 20%, transparent) 46%, transparent 82%),
                radial-gradient(160% 20% at 50% 100%, color-mix(in srgb, var(--fx-glow) 38%, transparent) 0%, transparent 72%);
            }
          }
        `}</style>
      )}
      {/* Banda superior negra (SPEC 99 obs8): el footer arranca en negro y funde
          hacia su color, en cualquier `mode`, para suavizar la transición desde
          una sección negra anterior. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 md:h-40"
        style={{
          background:
            'linear-gradient(to bottom, #0A0A0A 0%, rgba(10,10,10,0.72) 34%, rgba(10,10,10,0) 100%)',
        }}
      />
      {/* ═══ Main content ═══ */}
      <div className="site-container pt-16 sm:pt-20 pb-10 relative z-[2]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Left: Tagline + Social — below the links on mobile, first on desktop */}
          <div className="order-2 lg:order-1 flex flex-col justify-between gap-10">
            <h2
              className="text-[32px] leading-[36px] sm:text-[40px] xl:text-[56px] sm:leading-[60px] font-semibold text-white"
              data-tina-field={tinaField(footer, 'tagline')}
            >
              {tField(footer as any, 'tagline', locale)}
            </h2>
            <div className="flex flex-wrap gap-3">
              {footer.social?.map((item: SocialItem | null, i: number) => {
                if (!item) return null;
                const Icon = iconMap[item.platform || ''];
                if (!Icon) return null;
                return (
                  <a
                    key={i}
                    href={item.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.platform || ''}
                    className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center transition-all duration-200 hover:bg-white/10 hover:border-white/60"
                    data-tina-field={tinaField(item, 'platform')}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Right: Link groups — first on mobile. Short groups fill the top
              row (3 across on desktop); long groups span full width below with
              their links in multiple columns. `dense` backfills short groups
              into the gap left beside a spanning column. */}
          <div className="order-1 lg:order-2 col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-flow-row-dense gap-x-8 gap-y-10">
            {columns.map((column, ci) => renderColumn(column, ci))}
          </div>
        </div>
      </div>

      {/* ═══ Bottom bar ═══ */}
      <div className="border-t border-white/10 relative z-[2]">
        <div className="site-container py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Fiberlux logo */}
          <div data-tina-field={tinaField(footer as any, 'logo')}>
            <a href={localizeHref('/', locale)}>
            <img
              src={logoSrc}
              alt="Fiberlux"
              className="h-6 w-auto brightness-0 invert"
            />
            </a>
          </div>

          {/* Copyright + agency credit — flujo inline para que el logo de la
              agencia quede al costado del texto (no debajo) al envolver. */}
          <p className="text-white/80">
            <span data-tina-field={tinaField(footer, 'copyright')}>{copyrightText}</span>
            {agencyLogo &&
              (agencyUrl ? (
                <a
                  href={agencyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TWNSTUDIOS"
                  className="ml-2 inline-block align-middle"
                  data-tina-field={tinaField(footer as any, 'agencyLogo')}
                >
                  <img src={agencyLogo} alt="TWNSTUDIOS" className="inline h-4 w-auto brightness-0 invert" />
                </a>
              ) : (
                <img
                  src={agencyLogo}
                  alt="TWNSTUDIOS"
                  className="ml-2 inline-block h-4 w-auto align-middle brightness-0 invert"
                  data-tina-field={tinaField(footer as any, 'agencyLogo')}
                />
              ))}
          </p>
        </div>
      </div>
    </footer>
  );
}