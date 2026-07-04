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

/* ── Types ── */
interface FooterProps {
  query: string;
  variables: GlobalQueryVariables;
  data: GlobalQuery;
}

interface SocialItem {
  platform?: string | null;
  url?: string | null;
  icon?: string | null;
}

interface LinkItem {
  text?: string | null;
  url?: string | null;
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
export default function FooterReact({ query, variables, data: initialData }: FooterProps) {
  const { data } = useTina<GlobalQuery>({ query, variables, data: initialData });

  const footer = data?.global?.footer;
  if (!footer) return null;

  const currentYear = new Date().getFullYear();
  const logoSrc = (footer as any).logo || DEFAULT_LOGO;
  const copyrightTemplate =
    (footer as any).copyright || '© {year} Fiberlux. Todos los derechos reservados';
  const copyrightText = copyrightTemplate.replace('{year}', String(currentYear));
  const agencyLogo = (footer as any).agencyLogo as string | null | undefined;
  const agencyUrl = (footer as any).agencyUrl as string | null | undefined;

  /* Split the link groups into two visual columns (ceil(n/2) on the left). */
  const columns = (footer.columns ?? []).filter(Boolean) as ColumnItem[];
  const splitAt = Math.ceil(columns.length / 2);
  const visualColumns = [columns.slice(0, splitAt), columns.slice(splitAt)];

  const renderColumn = (column: ColumnItem, key: number) => (
    <div key={key}>
      <h3
        className="text-[18px] leading-[18px] font-semibold text-white mb-4"
        data-tina-field={tinaField(column, 'title')}
      >
        {column.title}
      </h3>
      <ul className="space-y-2.5">
        {column.links?.map((link: LinkItem | null, j: number) => {
          if (!link) return null;
          return (
            <li key={j}>
              <a
                href={link.url || '#'}
                className="leading-[20px] text-white/70 hover:text-white transition-colors duration-200"
                data-tina-field={tinaField(link, 'text')}
              >
                {link.text}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <footer className="bg-brand-purple rounded-t-xl">
      {/* ═══ Main content ═══ */}
      <div className="max-w-[1440px] mx-auto px-6 sm:px-16 pt-16 sm:pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Left: Tagline + Social — below the links on mobile, first on desktop */}
          <div className="order-2 md:order-1 flex flex-col justify-between gap-10">
            <h2
              className="text-[32px] leading-[36px] sm:text-[40px] lg:text-[56px] sm:leading-[60px] font-semibold text-white"
              data-tina-field={tinaField(footer, 'tagline')}
            >
              {footer.tagline}
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

          {/* Right: Link groups in two visual columns — first on mobile */}
          <div className="order-1 md:order-2 col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
            {visualColumns.map((group, gi) => (
              <div key={gi} className="flex flex-col gap-10">
                {group.map((column, ci) => renderColumn(column, ci))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Bottom bar ═══ */}
      <div className="border-t border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-16 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Fiberlux logo */}
          <div data-tina-field={tinaField(footer as any, 'logo')}>
            <a href="/">
            <img
              src={logoSrc}
              alt="Fiberlux"
              className="h-6 w-auto brightness-0 invert"
            />
            </a>
          </div>

          {/* Copyright + agency credit */}
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-white/80">
            <span data-tina-field={tinaField(footer, 'copyright')}>{copyrightText}</span>
            {agencyLogo &&
              (agencyUrl ? (
                <a
                  href={agencyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TWNSTUDIOS"
                  data-tina-field={tinaField(footer as any, 'agencyLogo')}
                >
                  <img src={agencyLogo} alt="TWNSTUDIOS" className="h-4 w-auto brightness-0 invert" />
                </a>
              ) : (
                <img
                  src={agencyLogo}
                  alt="TWNSTUDIOS"
                  className="h-4 w-auto brightness-0 invert"
                  data-tina-field={tinaField(footer as any, 'agencyLogo')}
                />
              ))}
          </p>
        </div>
      </div>
    </footer>
  );
}