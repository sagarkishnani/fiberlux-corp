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

  /* Cards are rendered in two spots (desktop left column / mobile below form),
     so build them through a helper to avoid duplicating the markup. */
  const renderCards = () =>
    cards.map((card, i) => {
      const Icon = ICONS[card?.icon || ""] || FaPhone;
      return (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
          data-tina-field={tinaField(card, "value")}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-purple/20 text-[#D26AB6]">
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-caption-sm uppercase tracking-wider text-greyscale">
              {card?.label}
            </span>
            <span className="text-body-md text-greyscale-white">
              {card?.value}
            </span>
          </div>
        </div>
      );
    });

  return (
    <section
      className="relative overflow-hidden -mt-16"
      style={{ background: "#0a0a0a" }}
    >
      {/* Background gradient image + scrim that softens the top-left hot spot */}
      <div className="absolute inset-0 z-0 contact-hero-bg" />
      <div className="absolute inset-0 z-0 contact-hero-scrim" />

      <div className="relative z-10 site-container pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* ════ LEFT — informational chrome ════ */}
          <div className="max-w-[560px]">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-caption-sm text-greyscale mb-6">
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

            {/* Heading — hidden on mobile per the Figma (form leads on small screens) */}
            <h1
              className="hidden lg:block text-[32px] md:text-[40px] leading-[1.2] md:leading-[48px] font-semibold text-greyscale-white mb-6"
              data-tina-field={tinaField(contact, "heading")}
            >
              {contact.heading}
            </h1>

            {/* Intro — hidden on mobile per the Figma */}
            <p
              className="hidden lg:block text-body-md text-greyscale-light max-w-[440px] mb-10"
              data-tina-field={tinaField(contact, "intro")}
            >
              {contact.intro}
            </p>

            {/* Contact cards — desktop only (mobile renders them below the form) */}
            <div className="hidden lg:flex flex-col gap-4">{renderCards()}</div>
          </div>

          {/* ════ RIGHT — dynamic form ════ */}
          <div className="w-full lg:max-w-[500px] lg:justify-self-end">
            <DynamicFormReact
              query={form.query}
              variables={form.variables}
              data={form.data}
            />
          </div>

          {/* ════ Contact cards — mobile only, after the form ════ */}
          <div className="flex lg:hidden flex-col gap-4">{renderCards()}</div>
        </div>
      </div>

      <style>{`
        .contact-hero-bg {
          background-image: url(/images/nosotros/circular-gradient-bg.avif);
          background-size: cover;
          background-repeat: no-repeat;
          background-position: left -60px top -60px;
          opacity: 0.7;
        }
        .contact-hero-scrim {
          background: radial-gradient(70% 60% at 0% 0%, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0) 60%);
        }
        @media (max-width: 1023px) {
          /* On the tall mobile layout, "cover" blows the glow up over the whole
             page — anchor it to the top at a bounded size and fade it to dark. */
          .contact-hero-bg {
            opacity: 0.7;
            background-size: 170% auto;
            background-position: center top;
          }
          .contact-hero-scrim {
            background: linear-gradient(
              to bottom,
              rgba(10, 10, 10, 0) 0%,
              rgba(10, 10, 10, 0.4) 50%,
              rgba(10, 10, 10, 1) 82%
            );
          }
        }
      `}</style>
    </section>
  );
}
