import { useTina, tinaField } from "tinacms/dist/react";
import type { IconType } from "react-icons";
import {
  FaGaugeHigh,
  FaArrowsUpDown,
  FaHeadset,
  FaShieldHalved,
  FaServer,
  FaCloud,
  FaClock,
  FaNetworkWired,
  FaPiggyBank,
  FaTowerBroadcast,
  FaChartLine,
  FaLayerGroup,
} from "react-icons/fa6";
import type {
  SubservicioQuery,
  SubservicioQueryVariables,
} from "../../../tina/__generated__/types";

interface BeneficiosProps {
  query: string;
  variables: SubservicioQueryVariables;
  data: SubservicioQuery;
}

interface Item {
  icon?: string | null;
  title?: string | null;
  text?: string | null;
}

const ICONS: Record<string, IconType> = {
  velocidad: FaGaugeHigh,
  simetria: FaArrowsUpDown,
  soporte: FaHeadset,
  escudo: FaShieldHalved,
  disponibilidad: FaServer,
  nube: FaCloud,
  reloj: FaClock,
  red: FaNetworkWired,
  ahorro: FaPiggyBank,
  cobertura: FaTowerBroadcast,
  escalabilidad: FaChartLine,
  generico: FaLayerGroup,
};

function ItemIcon({ name }: { name?: string | null }) {
  const Icon = (name && ICONS[name]) || FaLayerGroup;
  return (
    <span className="beneficio-icon relative z-10 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#96237A]/15 text-[#c65fac] transition-all duration-300 ease-out group-hover:bg-[#96237A]/30 group-hover:text-white group-hover:scale-105">
      <Icon size={22} />
    </span>
  );
}

export default function BeneficiosReact({
  query,
  variables,
  data: initialData,
}: BeneficiosProps) {
  const { data } = useTina<SubservicioQuery>({
    query,
    variables,
    data: initialData,
  });

  const beneficios = data?.subservicio?.beneficios;
  if (!beneficios) return null;

  const items = (beneficios.items || []).filter(Boolean) as Item[];
  if (items.length === 0) return null;

  return (
    <section className="bg-greyscale-darkest py-16 md:py-24">
      <div className="max-w-[1264px] mx-auto px-6 md:px-16">
        {beneficios.title && (
          <h2
            className="text-[28px] md:text-[44px] leading-[1.15] font-semibold text-greyscale-white text-center mb-10 md:mb-14"
            data-tina-field={tinaField(beneficios, "title")}
          >
            {beneficios.title}
          </h2>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
          {items.map((item, i) => (
            <div
              key={i}
              className="beneficio-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#96237A]/60 hover:bg-white/[0.06] hover:shadow-[0_18px_40px_-20px_rgba(150,35,122,0.7)]"
            >
              {/* Circular gradient glow — reveals on hover */}
              <span
                aria-hidden="true"
                className="beneficio-glow pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
              />

              <ItemIcon name={item.icon} />
              {item.title && (
                <h3
                  className="relative z-10 mt-5 text-[18px] lg:text-[20px] font-semibold text-greyscale-white"
                  data-tina-field={tinaField(item as any, "title")}
                >
                  {item.title}
                </h3>
              )}
              {item.text && (
                <p
                  className="relative z-10 mt-3 text-body-sm text-greyscale-light"
                  data-tina-field={tinaField(item as any, "text")}
                >
                  {item.text}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .beneficio-glow {
          background: radial-gradient(
            circle at 30% 20%,
            rgba(150, 35, 122, 0.45) 0%,
            rgba(150, 35, 122, 0.14) 34%,
            rgba(150, 35, 122, 0) 64%
          );
          filter: blur(26px);
        }
        @media (prefers-reduced-motion: reduce) {
          .beneficio-card, .beneficio-icon, .beneficio-glow {
            transition-duration: 0.01ms !important;
          }
          .beneficio-card:hover { transform: none !important; }
        }
      `}</style>
    </section>
  );
}
