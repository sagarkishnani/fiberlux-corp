import { useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import { FaWhatsapp, FaPhone, FaEnvelope, FaPlus, FaChevronRight } from "react-icons/fa6";
import type { IconType } from "react-icons";
import type {
  SoporteTecnicoQuery,
  SoporteTecnicoQueryVariables,
} from "../../../tina/__generated__/types";

interface CanalesSoporteProps {
  query: string;
  variables: SoporteTecnicoQueryVariables;
  data: SoporteTecnicoQuery;
}

const CHANNEL_ICONS: Record<string, IconType> = {
  whatsapp: FaWhatsapp,
  call: FaPhone,
  email: FaEnvelope,
};

/* Build the actionable href for a row from the channel type + value. */
function rowHref(type: string | null | undefined, value: string, message?: string | null): string {
  const v = value || "";
  if (type === "call") return `tel:${v.replace(/[^\d+]/g, "")}`;
  if (type === "email") return `mailto:${v.trim()}`;
  if (type === "whatsapp") {
    const digits = v.replace(/\D/g, "");
    const text = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${digits}${text}`;
  }
  return v;
}

export default function CanalesSoporte({
  query,
  variables,
  data: initialData,
}: CanalesSoporteProps) {
  const { data } = useTina<SoporteTecnicoQuery>({ query, variables, data: initialData });
  const page = data?.soporteTecnico;

  const channels = (page?.channels || []).filter(Boolean);

  // Initial open panel: first channel with defaultOpen, else the first one.
  const initialOpen = (() => {
    const idx = channels.findIndex((c) => c?.defaultOpen);
    return idx >= 0 ? idx : 0;
  })();
  const [openIndex, setOpenIndex] = useState(initialOpen);

  if (!page || channels.length === 0) return null;

  const renderRows = (channel: NonNullable<(typeof channels)[number]>) => {
    const rows = (channel.rows || []).filter(Boolean);
    if (rows.length === 0) return null;
    const isExternal = channel.type === "whatsapp";
    return (
      <ul className="flex flex-col gap-3">
        {rows.map((row, i) => {
          const value = row?.value || "";
          return (
            <li key={i}>
              <a
                href={rowHref(channel.type, value, row?.message)}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-brand-purple/10 bg-white px-5 py-4 transition-colors hover:border-brand-purple/40 hover:bg-brand-purple/[0.03]"
              >
                <span className="flex flex-col">
                  <span className="text-body-md font-semibold text-brand-purple">
                    {row?.label}
                  </span>
                  <span className="text-body-sm text-greyscale-dark/70">{value}</span>
                </span>
                {row?.optionLabel ? (
                  <span className="flex shrink-0 items-center gap-2 rounded-full bg-brand-purple/[0.06] px-3 py-1 text-caption-sm text-brand-purple">
                    {row.optionLabel}
                    <FaChevronRight className="h-2.5 w-2.5" />
                  </span>
                ) : (
                  <FaChevronRight className="h-3 w-3 shrink-0 text-brand-purple/60 transition-transform group-hover:translate-x-0.5" />
                )}
              </a>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <section className="bg-[#FBE3F1] py-16 lg:py-24">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        {/* Section header */}
        <h2
          className="text-[28px] md:text-[36px] font-semibold text-brand-purple mb-3"
          data-tina-field={tinaField(page, "sectionTitle")}
        >
          {page.sectionTitle}
        </h2>
        <p
          className="text-body-md text-brand-purple-dark/80 max-w-[640px] mb-10"
          data-tina-field={tinaField(page, "sectionSubtitle")}
        >
          {page.sectionSubtitle}
        </p>

        {/* ════ Accordion card ════ */}
        <div className="rounded-3xl border border-brand-purple/10 bg-white/60 p-3 shadow-[0_20px_60px_-30px_rgba(101,15,80,0.35)]">
          {/* Desktop — horizontal accordion */}
          <div className="hidden lg:flex gap-3 min-h-[340px]">
            {channels.map((channel, i) => {
              const isOpen = i === openIndex;
              const Icon = CHANNEL_ICONS[channel?.type || ""] || FaPhone;
              if (isOpen) {
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-2xl bg-[#F5F1F8] p-7"
                  >
                    <div className="flex items-start gap-3 mb-1">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
                        <Icon className="h-4 w-4" />
                      </span>
                      <h3
                        className="text-body-lg font-semibold text-brand-purple-dark pt-1"
                        data-tina-field={tinaField(channel, "title")}
                      >
                        {channel?.title}
                      </h3>
                    </div>
                    {channel?.subtitle && (
                      <p
                        className="text-body-sm text-greyscale-dark/70 mb-6 ml-12"
                        data-tina-field={tinaField(channel, "subtitle")}
                      >
                        {channel.subtitle}
                      </p>
                    )}
                    {renderRows(channel)}
                  </div>
                );
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOpenIndex(i)}
                  aria-expanded={false}
                  className="group flex w-[88px] shrink-0 flex-col items-center justify-between rounded-2xl bg-[#F0EDF4] py-7 transition-colors hover:bg-[#E9E3F1]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-purple shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span
                    className="text-body-md font-medium text-brand-purple-dark whitespace-nowrap"
                    style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                  >
                    {channel?.tabLabel}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-purple text-white transition-transform group-hover:scale-105">
                    <FaPlus className="h-3 w-3" />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mobile — stacked vertical accordion */}
          <div className="flex flex-col gap-3 lg:hidden">
            {channels.map((channel, i) => {
              const isOpen = i === openIndex;
              const Icon = CHANNEL_ICONS[channel?.type || ""] || FaPhone;
              return (
                <div key={i} className="rounded-2xl bg-[#F5F1F8] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-purple shadow-sm">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        className="text-body-md font-semibold text-brand-purple-dark"
                        data-tina-field={tinaField(channel, "tabLabel")}
                      >
                        {channel?.tabLabel}
                      </span>
                    </span>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full bg-brand-purple text-white transition-transform ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      <FaPlus className="h-3 w-3" />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5">
                      {channel?.subtitle && (
                        <p className="text-body-sm text-greyscale-dark/70 mb-4">
                          {channel.subtitle}
                        </p>
                      )}
                      {renderRows(channel)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
