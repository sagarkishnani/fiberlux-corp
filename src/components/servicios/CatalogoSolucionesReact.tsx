import { useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { IconType } from "react-icons";
import {
  FaGlobe,
  FaServer,
  FaSatelliteDish,
  FaTowerBroadcast,
  FaNetworkWired,
  FaWaveSquare,
  FaCircleNodes,
  FaScaleBalanced,
  FaFireFlameCurved,
  FaLock,
  FaShieldVirus,
  FaEnvelopeOpenText,
  FaFingerprint,
  FaUserShield,
  FaShieldHalved,
  FaBoltLightning,
  FaEye,
  FaBug,
  FaCloud,
  FaDatabase,
  FaHardDrive,
  FaHeadset,
  FaWifi,
  FaVideo,
  FaLayerGroup,
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa6";
import type {
  ServiceQuery,
  ServiceQueryVariables,
} from "../../../tina/__generated__/types";

interface CatalogoProps {
  query: string;
  variables: ServiceQueryVariables;
  data: ServiceQuery;
}

interface Item {
  icon?: string | null;
  title?: string | null;
  description?: string | null;
  buttonLabel?: string | null;
  url?: string | null;
  colSpan?: string | null;
  featured?: boolean | null;
}

const SPAN_CLASS: Record<string, string> = {
  "1": "lg:col-span-1",
  "2": "lg:col-span-2",
  "3": "lg:col-span-3",
};

const ICONS: Record<string, IconType> = {
  internet: FaGlobe,
  disponibilidad: FaServer,
  satelital: FaSatelliteDish,
  radioenlace: FaTowerBroadcast,
  transmision: FaNetworkWired,
  "fibra-oscura": FaWaveSquare,
  "sd-wan": FaCircleNodes,
  balanceo: FaScaleBalanced,
  firewall: FaFireFlameCurved,
  vpn: FaLock,
  edr: FaShieldVirus,
  correo: FaEnvelopeOpenText,
  mfa: FaFingerprint,
  ztna: FaUserShield,
  waf: FaShieldHalved,
  ddos: FaBoltLightning,
  soc: FaEye,
  pentesting: FaBug,
  cloud: FaCloud,
  backup: FaDatabase,
  storage: FaHardDrive,
  "mesa-ayuda": FaHeadset,
  wifi: FaWifi,
  videovigilancia: FaVideo,
  generico: FaLayerGroup,
};

const PER_PAGE = 4;

function ItemIcon({ name }: { name?: string | null }) {
  const Icon = (name && ICONS[name]) || FaLayerGroup;
  return (
    <span className="relative z-10 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#96237A]/15 text-[#c65fac]">
      <Icon size={20} />
    </span>
  );
}

export default function CatalogoSolucionesReact({
  query,
  variables,
  data: initialData,
}: CatalogoProps) {
  const { data } = useTina<ServiceQuery>({ query, variables, data: initialData });
  const [page, setPage] = useState(0);

  const catalogo = data?.service?.catalogo;
  if (!catalogo) return null;

  const items = (catalogo.items || []).filter(Boolean) as Item[];
  if (items.length === 0) return null;

  const pageCount = Math.ceil(items.length / PER_PAGE);
  const pageItems = items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <section id="catalogo" className="bg-greyscale-darkest py-16 md:py-24 scroll-mt-24 mb-4">
      <div className="max-w-[1440px] mx-auto px-6 md:px-16">
        {catalogo.title && (
          <h2
            className="text-[28px] md:text-[40px] leading-[1.2] font-semibold text-greyscale-white text-center mb-10 md:mb-14"
            data-tina-field={tinaField(catalogo, "title")}
          >
            {catalogo.title}
          </h2>
        )}

        {/* ════ DESKTOP — configurable-span grid ════ */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {items.map((item, i) => {
            const CardTag = item.url ? "a" : "div";
            const span = SPAN_CLASS[item.colSpan || "1"] || "lg:col-span-1";
            const featured = !!item.featured;
            const number = String(i + 1).padStart(2, "0");

            const content = (
              <>
                {item.description && (
                  <p
                    className={`text-body-sm ${featured ? "text-white/75 max-w-[440px]" : "text-greyscale-light"}`}
                    data-tina-field={tinaField(item as any, "description")}
                  >
                    {item.description}
                  </p>
                )}
                {item.buttonLabel && item.description && (
                  <span
                    className={`mt-4 inline-flex items-center gap-2 text-sm font-medium rounded-full px-4 py-2 transition-colors ${
                      featured
                        ? "bg-white text-[#3B0E30] hover:bg-white/90"
                        : "bg-[#96237A] text-white hover:bg-[#650F50]"
                    }`}
                    data-tina-field={tinaField(item as any, "buttonLabel")}
                  >
                    {item.buttonLabel}
                    <FaArrowRight size={12} />
                  </span>
                )}
              </>
            );

            return (
              <CardTag
                key={i}
                {...(item.url ? { href: item.url } : {})}
                className={`catalog-card group relative flex flex-col overflow-hidden rounded-2xl border p-6 lg:p-7 transition-colors duration-300 ${span} ${
                  featured
                    ? "border-[#96237A]/40 bg-[radial-gradient(120%_120%_at_85%_0%,#5a1a4a_0%,#2a0a24_48%,#160512_100%)] min-h-[300px] justify-start"
                    : "border-white/10 bg-white/[0.03] hover:border-[#96237A]/60 hover:bg-white/[0.06]"
                }`}
              >
                {/* Circular gradient blur glow — reveals on hover (non-featured) */}
                {!featured && (
                  <span
                    aria-hidden="true"
                    className="catalog-glow pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                  />
                )}

                {/* Number badge */}
                <span className="absolute top-6 right-6 z-10 font-mono text-xs text-white/35 tabular-nums">
                  {number}
                </span>

                <ItemIcon name={item.icon} />

                {featured ? (
                  <div className="relative z-10 mt-auto pt-10">
                    <h3
                      className="text-[22px] lg:text-[28px] font-semibold text-greyscale-white mb-3"
                      data-tina-field={tinaField(item as any, "title")}
                    >
                      {item.title}
                    </h3>
                    {content}
                  </div>
                ) : (
                  <>
                    <h3
                      className="relative z-10 mt-5 text-[18px] lg:text-[20px] font-semibold text-greyscale-white"
                      data-tina-field={tinaField(item as any, "title")}
                    >
                      {item.title}
                    </h3>
                    {/* Reveal on hover / focus — smooth height + fade */}
                    <div className="catalog-reveal relative z-10 grid grid-rows-[0fr] opacity-0 transition-all duration-500 ease-out group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100">
                      <div className="overflow-hidden pt-3">{content}</div>
                    </div>
                  </>
                )}
              </CardTag>
            );
          })}
        </div>

        {/* ════ MOBILE — icon + title only, paginated ════ */}
        <div className="md:hidden">
          <div className="grid grid-cols-2 gap-3">
            {pageItems.map((item, i) => {
              const CardTag = item.url ? "a" : "div";
              return (
                <CardTag
                  key={i}
                  {...(item.url ? { href: item.url } : {})}
                  className="flex flex-col items-start rounded-2xl border border-white/10 bg-white/[0.03] p-5 min-h-[140px]"
                >
                  <ItemIcon name={item.icon} />
                  <h3 className="mt-4 text-[15px] font-semibold text-greyscale-white leading-snug">
                    {item.title}
                  </h3>
                </CardTag>
              );
            })}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                aria-label="Anteriores"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#96237A] text-white disabled:opacity-40 transition-opacity"
              >
                <FaChevronLeft size={14} />
              </button>
              <span className="text-caption-sm text-greyscale-light tabular-nums">
                {page + 1} / {pageCount}
              </span>
              <button
                type="button"
                aria-label="Siguientes"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#96237A] text-white disabled:opacity-40 transition-opacity"
              >
                <FaChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .catalog-glow {
          background: radial-gradient(
            circle at 32% 24%,
            rgba(150, 35, 122, 0.55) 0%,
            rgba(150, 35, 122, 0.18) 32%,
            rgba(150, 35, 122, 0) 62%
          );
          filter: blur(28px);
        }
        @media (prefers-reduced-motion: reduce) {
          .catalog-card, .catalog-reveal, .catalog-glow { transition-duration: 0.01ms !important; }
        }
      `}</style>
    </section>
  );
}
