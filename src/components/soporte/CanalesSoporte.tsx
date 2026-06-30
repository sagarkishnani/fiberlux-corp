import { useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import { FaPlus } from "react-icons/fa6";
import type {
  SoporteTecnicoQuery,
  SoporteTecnicoQueryVariables,
} from "../../../tina/__generated__/types";

interface CanalesSoporteProps {
  query: string;
  variables: SoporteTecnicoQueryVariables;
  data: SoporteTecnicoQuery;
}

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

const TRANSITION =
  "flex-grow 450ms cubic-bezier(0.4,0,0.2,1), flex-basis 450ms cubic-bezier(0.4,0,0.2,1)";

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

  type Channel = NonNullable<(typeof channels)[number]>;

  /* ── Rows shared by desktop + mobile ── */
  const renderRows = (channel: Channel) => {
    const rows = (channel.rows || []).filter(Boolean);
    if (rows.length === 0) return null;
    const isExternal = channel.type === "whatsapp";
    return (
      <ul>
        {rows.map((row, i) => {
          const value = row?.value || "";
          const isLast = i === rows.length - 1;
          return (
            <li key={i}>
              <a
                href={rowHref(channel.type, value, row?.message)}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`group flex items-center gap-3 py-4 ${
                  isLast ? "" : "border-b border-black/[0.07]"
                }`}
              >
                <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-purple/10 px-3 py-1 text-caption-sm font-bold text-brand-purple">
                  {row?.label}
                </span>
                <span className="text-body-md text-greyscale-darkest group-hover:text-brand-purple transition-colors whitespace-nowrap">
                  {value}
                </span>
                {row?.optionLabel && (
                  <span
                    className="text-body-sm text-greyscale-dark/45 whitespace-nowrap"
                    style={{ marginLeft: "auto" }}
                  >
                    {row.optionLabel}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    );
  };

  /* ── Desktop expanded panel content ── */
  const renderExpanded = (channel: Channel) => (
    <div className="p-8 lg:p-10 w-full max-w-full">
      <h3
        className="text-[24px] lg:text-[28px] font-semibold text-greyscale-darkest mb-2 whitespace-nowrap"
        data-tina-field={tinaField(channel, "title")}
      >
        {channel?.title}
      </h3>
      {channel?.subtitle && (
        <p
          className="text-body-sm text-greyscale-dark/60 mb-6 max-w-[640px]"
          data-tina-field={tinaField(channel, "subtitle")}
        >
          {channel.subtitle}
        </p>
      )}
      {renderRows(channel)}
    </div>
  );

  return (
    <section className="bg-[#FBDCEC] py-16 lg:py-24">
      <div className="max-w-[1440px] mx-auto px-6 md:px-16">
        {/* Section header */}
        <h2
          className="text-[34px] md:text-[48px] leading-[1.1] font-semibold text-brand-purple mb-4"
          data-tina-field={tinaField(page, "sectionTitle")}
        >
          {page.sectionTitle}
        </h2>
        <p
          className="text-body-lg text-brand-purple/80 max-w-[600px] mb-12"
          data-tina-field={tinaField(page, "sectionSubtitle")}
        >
          {page.sectionSubtitle}
        </p>

        {/* ════ Desktop — horizontal accordion (effortel-style width animation) ════ */}
        <div
          className="hidden lg:flex overflow-hidden rounded-[24px] bg-[#FCF4F9] border border-brand-purple/[0.08]"
          style={{ height: 478 }}
        >
          {channels.map((channel, i) => {
            const isOpen = i === openIndex;
            return (
              <div
                key={i}
                className="relative overflow-hidden"
                style={{
                  flexGrow: isOpen ? 1 : 0,
                  flexBasis: isOpen ? "0%" : "160px",
                  minWidth: 160,
                  transition: TRANSITION,
                }}
              >
                {isOpen ? (
                  <div className="h-full w-full bg-white">{renderExpanded(channel)}</div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenIndex(i)}
                    aria-expanded={false}
                    aria-label={channel?.tabLabel || "Abrir canal"}
                    className="group relative flex h-full w-full items-center justify-center transition-colors hover:bg-brand-purple/[0.03]"
                  >
                    <span
                      className="text-body-md font-semibold text-greyscale-darkest whitespace-nowrap"
                      style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                      data-tina-field={tinaField(channel, "tabLabel")}
                    >
                      {channel?.tabLabel}
                    </span>
                    <span
                      className="absolute flex items-center justify-center rounded-full bg-brand-purple text-white"
                      style={{ bottom: 32, left: "50%", transform: "translateX(-50%)", width: 40, height: 40 }}
                    >
                      <FaPlus className="h-3.5 w-3.5" />
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ════ Mobile — stacked vertical accordion ════ */}
        <div className="flex flex-col gap-4 lg:hidden">
          {channels.map((channel, i) => {
            const isOpen = i === openIndex;
            return (
              <div
                key={i}
                className="rounded-[20px] bg-[#FCF4F9] border border-brand-purple/[0.08] overflow-hidden"
              >
                {isOpen ? (
                  <div className="bg-white p-6">
                    <h3
                      className="text-[22px] font-semibold text-greyscale-darkest mb-2"
                      data-tina-field={tinaField(channel, "title")}
                    >
                      {channel?.title}
                    </h3>
                    {channel?.subtitle && (
                      <p className="text-body-sm text-greyscale-dark/60 mb-5">
                        {channel.subtitle}
                      </p>
                    )}
                    {renderRows(channel)}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenIndex(i)}
                    aria-expanded={false}
                    className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left"
                  >
                    <span
                      className="text-body-md font-semibold text-greyscale-darkest"
                      data-tina-field={tinaField(channel, "tabLabel")}
                    >
                      {channel?.tabLabel}
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple text-white">
                      <FaPlus className="h-3.5 w-3.5" />
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
