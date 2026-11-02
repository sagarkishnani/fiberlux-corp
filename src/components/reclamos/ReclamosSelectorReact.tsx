import type { Locale } from "../../i18n/config";
import { localizeHref } from "../../utils/i18n";
import { ArrowIcon } from "../shared/fx/FxPrimitives";
import PageHero from "../shared/fx/PageHero";

const REVEAL = { "data-reveal-distance": "56", "data-reveal-duration": "1.2", "data-reveal-ease": "fx" } as const;

const cards = [
  {
    title: "Formulario de Reclamo",
    description: "Registre su reclamo sobre nuestros servicios de telecomunicaciones.",
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
    href: "/reclamos/reclamo",
  },
  {
    title: "Formulario de Apelación",
    description: "Presente un recurso de apelación contra una resolución emitida.",
    icon: "M12 3v18M3 7h18M6 7l-3 9h6L6 7zM18 7l-3 9h6l-3-9z",
    href: "/reclamos/apelacion",
  },
  {
    title: "Formulario de Queja",
    description: "Interponga una queja por transgresión de normas de procedimiento.",
    icon: "M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
    href: "/reclamos/queja",
  },
];

export default function ReclamosSelectorReact({ locale = "es" }: { locale?: Locale }) {
  return (
    <>
      <PageHero
        crumb="Reclamos"
        title="Selecciona una opción"
        subtitle="Elige el tipo de formulario que deseas completar según tu necesidad."
        locale={locale}
        variant="soft"
      />
      <section className="fx-container mt-10 pb-[67px] lg:mt-16 lg:pb-40">
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          {cards.map((card, i) => (
            <a
              key={card.href}
              href={localizeHref(card.href, locale)}
              data-reveal="up"
              {...REVEAL}
              data-reveal-delay={String(i * 0.08)}
              className="group/card flex flex-col gap-10 rounded-[28px] border border-fx-line bg-white p-6 text-fx-ink transition-[transform,border-color,box-shadow] duration-500 ease-fx-spring hover:-translate-y-1.5 hover:border-fx-lilac-strong hover:text-fx-ink hover:shadow-[0_30px_60px_-30px_rgba(150,33,122,.4)] lg:min-h-[260px] lg:p-9"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FAF0F6] text-fx-purple transition-colors duration-[400ms] group-hover/card:bg-fx-purple group-hover/card:text-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={card.icon} />
                  </svg>
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-full border border-[#E6E3E6] transition-all duration-[450ms] ease-fx-spring group-hover/card:-rotate-45 group-hover/card:border-fx-purple group-hover/card:bg-fx-purple group-hover/card:text-white">
                  <ArrowIcon size={16} />
                </span>
              </div>
              <div className="mt-auto">
                <h2 className="m-0 text-[20px] font-medium leading-[1.3] text-fx-ink lg:text-[22px]">{card.title}</h2>
                <p className="mb-0 mt-2.5 text-[15px] leading-[1.6] text-fx-body">{card.description}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
