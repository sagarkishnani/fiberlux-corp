import { useTina, tinaField } from "tinacms/dist/react";
import type { ContactQuery, ContactQueryVariables } from "../../../tina/__generated__/types";
import DynamicFormReact from "../dynamic-form/DynamicFormReact";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import { ArrowIcon } from "../shared/fx/FxPrimitives";
import { Breadcrumb } from "../shared/fx/PageHero";
import PageHeroBackdrop from "../shared/fx/PageHeroBackdrop";
import Icon, { pathGlyphs } from "../shared/Icon";

const CARD_ICONS: Record<string, string> = {
  phone:
    "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  email: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  location: "M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
};

const CARD_GLYPHS = pathGlyphs(CARD_ICONS, (d) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
));

const REVEAL = { "data-reveal-distance": "56", "data-reveal-duration": "1.2", "data-reveal-ease": "fx" } as const;

interface FormIsland {
  query: string;
  variables: { relativePath: string };
  data: any;
}

interface ContactProps {
  query: string;
  variables: ContactQueryVariables;
  data: ContactQuery;
  form: FormIsland;
  locale?: Locale;
}

/* Usa el `href` de Tina y, si está vacío, lo deriva del ícono (tel:, mailto: o búsqueda en Google Maps). */
function cardHref(card: any): string | null {
  const explicit = card?.href?.trim();
  if (explicit) return explicit;
  const value = card?.value?.trim();
  if (!value) return null;
  switch (card?.icon) {
    case "phone": {
      const tel = value.replace(/[^\d+]/g, "");
      return tel ? `tel:${tel}` : null;
    }
    case "email":
      return `mailto:${value}`;
    case "location":
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
    default:
      return null;
  }
}

export default function ContactReact({ query, variables, data: initialData, form, locale = "es" }: ContactProps) {
  const { data } = useTina<ContactQuery>({ query, variables, data: initialData });
  const contact = data?.contact;
  if (!contact) return null;

  const cards = (contact.cards || []).filter(Boolean) as any[];

  return (
    <section className="relative overflow-clip pb-[67px] pt-10 lg:pb-40 lg:pt-24">
      <PageHeroBackdrop variant="full" />
      <div className="fx-container relative grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)] lg:gap-20">
        <div className="pt-6">
          <Breadcrumb crumb={tField(contact, "breadcrumb", locale)} locale={locale} />
          <h1
            data-reveal="up"
            {...REVEAL}
            data-reveal-delay="0.08"
            className="mb-0 mt-4 max-w-[560px] text-[33px] font-medium leading-[1.12] tracking-[-.03em] text-fx-ink [text-wrap:balance] lg:text-[48px]"
            data-tina-field={tinaField(contact, "heading")}
          >
            {tField(contact, "heading", locale)}
          </h1>
          <p
            data-reveal="up"
            {...REVEAL}
            data-reveal-delay="0.16"
            className="mb-0 mt-6 max-w-[520px] text-[16px] leading-[1.6] text-fx-body [text-wrap:pretty]"
            data-tina-field={tinaField(contact, "intro")}
          >
            {tField(contact, "intro", locale)}
          </p>
          <div data-reveal="up" {...REVEAL} data-reveal-delay="0.24" className="mt-[29px] flex max-w-[560px] flex-col gap-3 lg:mt-12">
            {cards.map((card, i) => {
              const href = cardHref(card);
              const external = href?.startsWith("http");
              const Tag = href ? "a" : "div";
              return (
                <Tag
                  key={i}
                  {...(href ? { href } : {})}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group/card flex items-center gap-5 rounded-[24px] border border-fx-line bg-white px-6 py-5 text-fx-ink transition-[transform,border-color,box-shadow] duration-[450ms] ease-fx-out hover:-translate-y-1 hover:border-fx-line-strong hover:text-fx-ink hover:shadow-[0_24px_50px_-28px_rgba(150,33,122,.4)]"
                  data-tina-field={tinaField(card, "value")}
                >
                  <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl bg-[#FAF0F6] text-fx-purple transition-colors duration-[400ms] group-hover/card:bg-fx-purple group-hover/card:text-white">
                    <Icon name={card.icon || "phone"} legacy={CARD_GLYPHS} size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[12px] font-medium tracking-[.18em] text-fx-muted">
                      {(tField(card, "label", locale) || "").toUpperCase()}
                    </span>
                    <span className="mt-1 block text-[16px] font-medium text-fx-ink">{card.value}</span>
                  </span>
                  {href && (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#E6E3E6] text-fx-ink transition-all duration-[450ms] ease-fx-spring group-hover/card:-rotate-45 group-hover/card:border-fx-purple group-hover/card:bg-fx-purple group-hover/card:text-white">
                      <ArrowIcon size={16} />
                    </span>
                  )}
                </Tag>
              );
            })}
          </div>
        </div>

        <div
          data-reveal="up"
          {...REVEAL}
          data-reveal-delay="0.12"
          className="relative rounded-[28px] border border-fx-line bg-white p-6 shadow-[0_40px_80px_-48px_rgba(101,13,74,.35)] lg:rounded-[40px] lg:p-12"
        >
          <DynamicFormReact query={form.query} variables={form.variables} data={form.data} locale={locale} />
        </div>
      </div>
    </section>
  );
}
