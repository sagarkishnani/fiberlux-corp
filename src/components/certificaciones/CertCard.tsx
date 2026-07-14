import { tinaField } from "tinacms/dist/react";
import type { IconType } from "react-icons";
import {
  FaShieldHalved,
  FaLock,
  FaMedal,
  FaLeaf,
  FaHelmetSafety,
  FaGears,
  FaStamp,
  FaScaleBalanced,
  FaCheck,
} from "react-icons/fa6";

export interface Cert {
  year?: string | null;
  icon?: string | null; // clave del set predefinido (reemplaza a `logo`)
  title?: string | null; // código ISO
  heading?: string | null; // categoría (se muestra en mayúsculas)
  description?: string | null;
}

interface CertCardProps {
  cert: Cert;
  /** Tina object for `data-tina-field` (the item in the list). */
  tinaItem?: any;
}

/* ── Icon map: CMS select key → react-icons component ── */
const ICONS: Record<string, IconType> = {
  antisoborno: FaShieldHalved,
  seguridad: FaLock,
  calidad: FaMedal,
  ambiental: FaLeaf,
  seguridad_st: FaHelmetSafety,
  procesos: FaGears,
  certificado: FaStamp,
  cumplimiento: FaScaleBalanced,
};
const FALLBACK_ICON: IconType = FaShieldHalved;

export default function CertCard({ cert, tinaItem }: CertCardProps) {
  const Icon = (cert.icon && ICONS[cert.icon]) || FALLBACK_ICON;

  return (
    <div className="flex h-full min-h-[320px] md:min-h-[420px] flex-col rounded-[24px] border border-white/[0.05] bg-[#111013] px-8 py-7">
      {/* Top row: year (left) + verified check-circle (right, decorative) */}
      <div className="flex items-center justify-between">
        <span
          className="text-[13px] tracking-[0.25em] text-[#b565a2]"
          style={{ fontFamily: "'Space Mono', ui-monospace, monospace" }}
          data-tina-field={tinaItem ? tinaField(tinaItem, "year") : undefined}
        >
          {cert.year}
        </span>
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#96237A] text-[#b565a2]"
        >
          <FaCheck className="text-[11px]" />
        </span>
      </div>

      {/* Central icon tile */}
      <div className="mb-8 mt-9 flex justify-center">
        <span
          className="flex h-[92px] w-[92px] items-center justify-center rounded-full text-[#d885c4]"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, rgba(150,35,122,0.28), rgba(150,35,122,0.06))",
            border: "1px solid rgba(150,35,122,0.35)",
          }}
        >
          <Icon className="text-[34px]" />
        </span>
      </div>

      {/* Category (eyebrow) */}
      <h4
        className="text-center text-[13px] font-semibold uppercase tracking-[0.12em] text-white/70"
        data-tina-field={tinaItem ? tinaField(tinaItem, "heading") : undefined}
      >
        {cert.heading}
      </h4>

      {/* ISO code */}
      <h3
        className="mt-2 text-center text-[26px] font-bold text-white"
        data-tina-field={tinaItem ? tinaField(tinaItem, "title") : undefined}
      >
        {cert.title}
      </h3>

      {/* Divider */}
      <div className="mx-auto mt-4 mb-5 h-[2px] w-10 rounded-full bg-[#96237A]" />

      {/* Description */}
      <p
        className="text-center text-[14px] leading-[1.7] text-white/45"
        data-tina-field={tinaItem ? tinaField(tinaItem, "description") : undefined}
      >
        {cert.description}
      </p>
    </div>
  );
}
