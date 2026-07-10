import { tinaField } from "tinacms/dist/react";

export interface Cert {
  year?: string | null;
  logo?: string | null;
  title?: string | null;
  eyebrow?: string | null;
  heading?: string | null;
  description?: string | null;
}

interface CertCardProps {
  cert: Cert;
  /** Tina object for `data-tina-field` (the item in the list). */
  tinaItem?: any;
}

/** Card background — reused as the knockout halo behind the "ISO" glyph text. */
const CARD_BG = "#F7D9F0";

/**
 * ISO globe glyph (default logo when a card has no uploaded `logo`).
 * `currentColor` drives the line/text color; the "ISO" text carries a
 * card-colored stroke so it reads cleanly over the globe meridians.
 */
function IsoGlobe({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="ISO"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeWidth={3} fill="none" opacity={0.9}>
        <circle cx="60" cy="60" r="40" />
        <ellipse cx="60" cy="60" rx="16" ry="40" />
        <line x1="20" y1="60" x2="100" y2="60" />
        <path d="M27 35 C42 44, 78 44, 93 35" />
        <path d="M27 85 C42 76, 78 76, 93 85" />
      </g>
      <text
        x="60"
        y="72"
        textAnchor="middle"
        fontSize="34"
        fontWeight="900"
        fill="currentColor"
        stroke={CARD_BG}
        strokeWidth={6}
        fontFamily="'Arial Black', Arial, sans-serif"
        style={{ paintOrder: "stroke" }}
      >
        ISO
      </text>
    </svg>
  );
}

export default function CertCard({ cert, tinaItem }: CertCardProps) {
  return (
    <div
      className="flex flex-col h-full min-h-[440px] rounded-[26px] bg-[#F7D9F0] px-8 py-9 md:px-9 md:py-10"
    >
      {/* Year */}
      {cert.year && (
        <span
          className="block text-center text-[13px] tracking-[0.35em] text-black/45"
          style={{ fontFamily: "'Space Mono', ui-monospace, monospace" }}
          data-tina-field={tinaItem ? tinaField(tinaItem, "year") : undefined}
        >
          {cert.year}
        </span>
      )}

      {/* Logo (uploaded override, else default ISO glyph) */}
      <div className="flex justify-center my-5">
        {cert.logo ? (
          <img
            src={cert.logo}
            alt={cert.title || "Certificación"}
            className="h-16 w-auto object-contain"
            draggable={false}
            data-tina-field={tinaItem ? tinaField(tinaItem, "logo") : undefined}
          />
        ) : (
          <IsoGlobe className="h-16 w-auto text-black" />
        )}
      </div>

      {/* Title (ISO 27001) */}
      <h3
        className="text-center text-[30px] md:text-[34px] font-bold text-black"
        data-tina-field={tinaItem ? tinaField(tinaItem, "title") : undefined}
      >
        {cert.title}
      </h3>

      {/* Divider */}
      <div className="mt-6 mb-6 h-px bg-black/10" />

      {/* Eyebrow */}
      {cert.eyebrow && (
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#96237A]"
          data-tina-field={tinaItem ? tinaField(tinaItem, "eyebrow") : undefined}
        >
          {cert.eyebrow}
        </p>
      )}

      {/* Heading */}
      <h4
        className="mt-2 text-[19px] md:text-[21px] font-bold leading-snug text-black"
        data-tina-field={tinaItem ? tinaField(tinaItem, "heading") : undefined}
      >
        {cert.heading}
      </h4>

      {/* Description */}
      <p
        className="mt-2.5 text-[14px] leading-[1.7] text-black/60"
        data-tina-field={tinaItem ? tinaField(tinaItem, "description") : undefined}
      >
        {cert.description}
      </p>
    </div>
  );
}
