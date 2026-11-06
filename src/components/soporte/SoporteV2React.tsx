import { useRef, useState, type ReactNode } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { SoporteTecnicoQuery, SoporteTecnicoQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { localizedPath, tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import { prefersReducedMotion, useScrollFrame } from "../home/useScrollFrame";
import { ArrowIcon, PillLink } from "../shared/fx/FxPrimitives";

interface Props {
  query: string;
  variables: SoporteTecnicoQueryVariables;
  data: SoporteTecnicoQuery;
  locale?: Locale;
}

const REVEAL = { "data-reveal-distance": "56", "data-reveal-duration": "1.2", "data-reveal-ease": "fx" } as const;

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: "M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z",
  call: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  email: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
};

const PHONE_RE = /\(\d{2}\)\s?\d{3}[\s-]?\d{4}/;

function ChannelIcon({ type, size = 18 }: { type?: string | null; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={CHANNEL_ICONS[type || ""] || CHANNEL_ICONS.call} />
    </svg>
  );
}

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

/* El número de la central dentro del subtítulo se vuelve un enlace tel: como en el prototipo. */
function linkifyPhone(text: string): ReactNode {
  const match = text.match(PHONE_RE);
  if (!match || match.index === undefined) return text;
  const phone = match[0];
  return (
    <>
      {text.slice(0, match.index)}
      <a href={`tel:+51${phone.replace(/\D/g, "").replace(/^0/, "")}`} className="font-semibold text-fx-purple-deep hover:text-fx-purple">
        {phone}
      </a>
      {text.slice(match.index + phone.length)}
    </>
  );
}

function hasRows(channel: any): boolean {
  return (channel?.rows || []).some((row: any) => row && (row.label || row.value));
}

function initialChannel(channels: any[]): number {
  const idx = channels.findIndex((c) => c?.defaultOpen);
  return idx >= 0 ? idx : 0;
}

export default function SoporteV2React({ query, variables, data: initialData, locale = "es" }: Props) {
  const { data } = useTina<SoporteTecnicoQuery>({ query, variables, data: initialData });
  const page = (data?.soporteTecnico || initialData?.soporteTecnico) as any;
  const channels = ((page?.channels || []).filter(hasRows) as any[]);
  const [selected, setActive] = useState(() => initialChannel(channels));
  const [mobileSelected, setMobileOpen] = useState(() => initialChannel(channels));
  const active = selected < channels.length ? selected : initialChannel(channels);
  const mobileOpen = mobileSelected < channels.length ? mobileSelected : -1;
  const imgRef = useRef<HTMLImageElement>(null);

  useScrollFrame(() => {
    const img = imgRef.current;
    if (!img || prefersReducedMotion()) return;
    const rect = img.parentElement!.getBoundingClientRect();
    const progress = Math.max(-1, Math.min(1, rect.top / window.innerHeight));
    img.style.transform = `translate3d(0,${progress * -36}px,0)`;
  });

  if (!page) return null;
  const heroImage = mediaUrl(page.heroImage);

  const renderRows = (channel: any, mobile: boolean) => {
    const rows = ((channel.rows || []).filter((row: any) => row && (row.label || row.value)) as any[]);
    return (
      <div className={`flex flex-col ${mobile ? "mt-4" : "mt-9"}`}>
        {rows.map((row, i) => {
          const href = rowHref(channel.type, row.value, row.message);
          const external = href.startsWith("http");
          const option = tField(row, "optionLabel", locale);
          return (
            <a
              key={i}
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={`group/row flex items-center text-[#2B252C] hover:text-[#2B252C] ${mobile ? "gap-3.5 py-4" : "gap-5 py-3.5"} ${
                i < rows.length - 1 ? "border-b border-fx-soft" : ""
              }`}
              data-tina-field={tinaField(row, "value")}
            >
              <span className={`grid shrink-0 place-items-center rounded-full bg-fx-purple text-white transition-transform duration-[350ms] ease-fx-out group-hover/row:scale-[1.08] ${mobile ? "h-10 w-10" : "h-11 w-11"}`}>
                <ChannelIcon type={channel.type} />
              </span>
              {mobile ? (
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#FAF0F6] px-3 py-1 text-[12px] font-semibold text-fx-purple">{tField(row, "label", locale)}</span>
                    <span className="break-all text-[16px]">{row.value}</span>
                  </span>
                  {option && <span className="text-[13px] text-[#A39AA4]">{option}</span>}
                </span>
              ) : (
                <>
                  <span className="shrink-0 rounded-full bg-[#FAF0F6] px-3.5 py-1.5 text-[13px] font-semibold text-fx-purple">{tField(row, "label", locale)}</span>
                  <span className="min-w-0 flex-1 truncate text-[18px] transition-colors duration-300 group-hover/row:text-fx-purple">{row.value}</span>
                  {option && <span className="shrink-0 text-[15px] text-[#B3ACB4]">{option}</span>}
                </>
              )}
            </a>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <section className="fx-container pt-5 lg:pt-8">
        <div data-reveal="scale" data-reveal-duration="1.2" data-reveal-ease="fx" className="relative overflow-hidden rounded-[24px] bg-[#1C0F19] lg:h-[640px] lg:rounded-[40px]">
          {heroImage && (
            <img
              ref={imgRef}
              src={heroImage}
              alt=""
              className="absolute left-0 top-[-6%] h-[112%] w-full object-cover will-change-transform"
              data-tina-field={tinaField(page, "heroImage")}
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,15,25,.88)_0%,rgba(28,15,25,.72)_55%,rgba(28,15,25,.9)_100%)] lg:bg-[linear-gradient(90deg,rgba(28,15,25,.92)_0%,rgba(28,15,25,.7)_38%,rgba(28,15,25,.05)_75%)]" />
          <div className="relative flex h-full flex-col justify-center px-6 pb-8 pt-9 lg:px-20 lg:py-0">
            <div data-reveal="up" {...REVEAL} className="flex items-center gap-2 text-[15px] text-fx-line-strong">
              <a href={localizedPath(import.meta.env.BASE_URL || "/", locale)} className="text-fx-line-strong transition-colors duration-200 hover:text-white">
                {t("breadcrumb.home", locale)}
              </a>
              <span className="text-[#E0479E]">/</span>
              <span className="font-medium text-white" data-tina-field={tinaField(page, "breadcrumb")}>
                {tField(page, "breadcrumb", locale)}
              </span>
            </div>
            <h1
              data-reveal="up"
              {...REVEAL}
              data-reveal-delay="0.08"
              className="mb-0 mt-5 max-w-[620px] text-[30px] font-medium leading-[1.1] tracking-[-.03em] text-white [text-wrap:balance] lg:mt-[26px] lg:text-[64px] lg:leading-[1.05]"
              data-tina-field={tinaField(page, "heading")}
            >
              {tField(page, "heading", locale)}
            </h1>
            <p
              data-reveal="up"
              {...REVEAL}
              data-reveal-delay="0.16"
              className="mb-0 mt-7 hidden max-w-[480px] text-[17px] leading-[1.65] text-[#E6E3E6] [text-wrap:pretty] lg:block"
              data-tina-field={tinaField(page, "intro")}
            >
              {tField(page, "intro", locale)}
            </p>
            <div data-reveal="up" {...REVEAL} data-reveal-delay="0.24" className="mt-7 flex flex-col items-start gap-4 lg:mt-11 lg:gap-5">
              {tField(page, "heroQuestion", locale) && (
                <span className="text-[16px] font-medium text-white lg:text-[18px]" data-tina-field={tinaField(page, "heroQuestion")}>
                  {tField(page, "heroQuestion", locale)}
                </span>
              )}
              <PillLink href="#canales" iconSide="left" size="lg" className="whitespace-nowrap !pr-5 lg:!pr-7" data-tina-field={tinaField(page, "heroCtaLabel")}>
                {tField(page, "heroCtaLabel", locale) || t("soporte.heroCta", locale)}
              </PillLink>
            </div>
          </div>
        </div>
      </section>

      <section id="canales" className="fx-container mt-6 scroll-mt-28">
        <div data-reveal="up" {...REVEAL} className="rounded-[24px] bg-[#F8DCEB] px-4 pb-4 pt-8 lg:rounded-[40px] lg:bg-[#FAF0F6] lg:px-[72px] lg:pb-[72px] lg:pt-[88px]">
          <h2
            className="mx-2 my-0 text-[30px] font-semibold leading-[1.1] tracking-[-.02em] text-fx-purple lg:mx-0 lg:text-[52px] lg:font-medium lg:tracking-[-.025em]"
            data-tina-field={tinaField(page, "sectionTitle")}
          >
            {tField(page, "sectionTitle", locale)}
          </h2>
          <p
            className="mx-2 mb-0 mt-3 max-w-[600px] text-[16px] leading-[1.55] text-fx-purple-hover lg:mx-0 lg:mt-[18px] lg:text-[18px] lg:leading-[1.6] lg:text-fx-purple-deep"
            data-tina-field={tinaField(page, "sectionSubtitle")}
          >
            {linkifyPhone(tField(page, "sectionSubtitle", locale))}
          </p>

          <div className="mt-14 hidden min-h-[600px] overflow-hidden rounded-[32px] bg-white lg:flex">
            {channels.map((channel, i) => {
              const open = i === active;
              const label = tField(channel, "tabLabel", locale) || tField(channel, "title", locale);
              return (
                <div
                  key={i}
                  className={`relative min-w-0 overflow-hidden transition-[flex-grow,background-color] duration-[750ms] ease-[cubic-bezier(.65,0,.35,1)] ${
                    open ? "bg-white" : "bg-[#FDF6FA]"
                  } ${i > 0 ? "border-l border-[#F3E6EE]" : ""}`}
                  style={{ flex: open ? "1 1 0" : "0 0 120px" }}
                >
                  {open ? (
                    <div key={`open-${i}`} className="fx-ch-in w-[880px] max-w-full px-[72px] py-16" data-tina-field={tinaField(channel, "title")}>
                      <h3 className="m-0 text-[36px] font-medium tracking-[-.02em] text-[#2B252C]">{tField(channel, "title", locale)}</h3>
                      <p className="mb-0 mt-3 max-w-[560px] text-[16px] leading-[1.6] text-fx-muted">{tField(channel, "subtitle", locale)}</p>
                      {renderRows(channel, false)}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-label={label}
                      className="group/ch absolute inset-0 flex w-full flex-col items-center justify-between pb-10 pt-16"
                    >
                      <span className="flex flex-1 items-center">
                        <span className="rotate-180 whitespace-nowrap text-[20px] font-semibold text-[#2B252C] [writing-mode:vertical-rl]">{label}</span>
                      </span>
                      <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-fx-purple text-white transition-[transform,background-color] duration-[450ms] ease-fx-spring group-hover/ch:rotate-90 group-hover/ch:bg-fx-purple-hover">
                        <ArrowIcon size={18} />
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-7 flex flex-col gap-3 lg:hidden">
            {channels.map((channel, i) => {
              const open = i === mobileOpen;
              const label = tField(channel, "tabLabel", locale) || tField(channel, "title", locale);
              return (
                  <div key={i} className="overflow-hidden rounded-[20px] bg-white">
                    <button
                      type="button"
                      onClick={() => setMobileOpen(open ? -1 : i)}
                      aria-expanded={open}
                      className="flex min-h-[76px] w-full items-center justify-between gap-4 bg-[#FDF6FA] px-5 py-[18px] text-left"
                    >
                      <span className="text-[16px] font-semibold leading-[1.3] text-[#2B252C]">{label}</span>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fx-purple text-white">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
                          <path d={open ? "M5 12h14" : "M12 5v14M5 12h14"} />
                        </svg>
                      </span>
                    </button>
                    {open && (
                      <div className="fx-ch-in px-5 pb-3 pt-6 [animation-delay:0s]">
                        <h3 className="m-0 text-[20px] font-medium tracking-[-.01em] text-[#2B252C]">{tField(channel, "title", locale)}</h3>
                        <p className="mb-0 mt-2 text-[14px] leading-[1.55] text-fx-muted">{tField(channel, "subtitle", locale)}</p>
                        {renderRows(channel, true)}
                      </div>
                    )}
                  </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
