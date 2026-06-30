import { useTina, tinaField } from "tinacms/dist/react";
import { FaPhone, FaEnvelope, FaLocationDot } from "react-icons/fa6";
import type { IconType } from "react-icons";
import type { ContactQuery, ContactQueryVariables } from "../../../tina/__generated__/types";
import DynamicFormReact from "../dynamic-form/DynamicFormReact";

/* Map the CMS icon identifier → a concrete react-icons component */
const ICONS: Record<string, IconType> = {
  phone: FaPhone,
  email: FaEnvelope,
  location: FaLocationDot,
};

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
}

export default function ContactReact({
  query,
  variables,
  data: initialData,
  form,
}: ContactProps) {
  const { data } = useTina<ContactQuery>({ query, variables, data: initialData });

  const contact = data?.contact;
  if (!contact) return null;

  const cards = (contact.cards || []).filter(Boolean);
  const base = import.meta.env.BASE_URL || "/";

  return (
    <section className="relative overflow-hidden bg-greyscale-darkest bg-gradient-hero">
      <div className="container-xl py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* ════ LEFT — informational chrome ════ */}
          <div className="max-w-[560px]">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-caption-sm text-greyscale-medium mb-6">
              <a href={base} className="hover:text-greyscale-white transition-colors">
                Inicio
              </a>
              <span>/</span>
              <span
                className="text-greyscale-white"
                data-tina-field={tinaField(contact, "breadcrumb")}
              >
                {contact.breadcrumb}
              </span>
            </nav>

            {/* Heading */}
            <h1
              className="text-[36px] md:text-[44px] leading-[1.15] font-semibold text-greyscale-white mb-6"
              data-tina-field={tinaField(contact, "heading")}
            >
              {contact.heading}
            </h1>

            {/* Intro */}
            <p
              className="text-body-md text-greyscale-light max-w-[440px] mb-10"
              data-tina-field={tinaField(contact, "intro")}
            >
              {contact.intro}
            </p>

            {/* Contact cards */}
            <div className="flex flex-col gap-4">
              {cards.map((card, i) => {
                const Icon = ICONS[card?.icon || ""] || FaPhone;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
                    data-tina-field={tinaField(card, "value")}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-purple/20 text-[#D26AB6]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-caption-sm uppercase tracking-wider text-greyscale-medium">
                        {card?.label}
                      </span>
                      <span className="text-body-md text-greyscale-white">
                        {card?.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ════ RIGHT — dynamic form ════ */}
          <div className="w-full lg:max-w-[500px] lg:justify-self-end">
            <DynamicFormReact
              query={form.query}
              variables={form.variables}
              data={form.data}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
