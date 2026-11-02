import { useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { localizeHref, tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import { renderEmphasis } from "../../utils/emphasis";
import { ArrowIcon, Eyebrow } from "../shared/fx/FxPrimitives";

interface Props {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  locale?: Locale;
}

const ICON_PATHS = {
  wifi: "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
  server:
    "M4 3h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM4 13h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2zM6 7h.01M6 17h.01",
  building: "M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
};

const ICON_BY_TAB: Record<string, keyof typeof ICON_PATHS> = {
  rayo: "wifi",
  wifi: "wifi",
  red: "wifi",
  globo: "wifi",
  escudo: "shield",
  nube: "server",
  servidor: "server",
  datos: "server",
  engranaje: "building",
  personas: "building",
  soporte: "building",
  telefonia: "chat",
};

function CategoryIcon({ tab }: { tab?: string | null }) {
  const path = ICON_PATHS[ICON_BY_TAB[tab || ""] || "wifi"];
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function CtaPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="group/cta inline-flex h-12 items-center justify-between gap-3 rounded-full bg-white pl-5 pr-1.5 text-[14px] font-medium text-fx-purple transition-[background,color] duration-300 hover:bg-fx-soft hover:text-fx-purple-hover lg:h-11"
    >
      {label}
      <span className="grid h-9 w-9 place-items-center rounded-full bg-fx-purple text-white transition-[transform,background] duration-[450ms] ease-fx-spring group-hover/cta:-rotate-45 group-hover/cta:bg-fx-purple-deep lg:h-8 lg:w-8">
        <ArrowIcon size={14} />
      </span>
    </a>
  );
}

export default function HomeSolucionesReact({ query, variables, data: initialData, locale = "es" }: Props) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });
  const services = data?.home?.services || initialData?.home?.services;
  const items = ((services?.items || []).filter(Boolean) as any[]);
  const [active, setActive] = useState(0);
  const [openMobile, setOpenMobile] = useState(0);
  if (!services || !items.length) return null;

  const cta = t("sol.cta", locale);
  const tags = (item: any) =>
    ((item.bullets || []).filter(Boolean) as any[]).slice(0, 4).map((b) => tField(b, "label", locale));

  return (
    <section id="soluciones" className="relative mt-[72px] lg:mt-0 lg:py-[140px] lg:pb-[120px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[60px] -ml-[300px] hidden h-[420px] w-[1100px] [mask-image:radial-gradient(closest-side,#000_30%,transparent)] lg:block"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Cpath d='M22 16v12M16 22h12' stroke='%23D8D5D8' stroke-width='1.2'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="fx-container relative">
        <div className="lg:flex lg:items-end lg:justify-between lg:gap-10">
          <div data-reveal="up" data-reveal-distance="56" data-reveal-duration="1.2" data-reveal-ease="fx">
            <Eyebrow>{t("sol.eyebrow", locale)}</Eyebrow>
            <h2
              className="mb-0 mt-3.5 text-[32px] font-normal leading-[1.12] tracking-[-.02em] text-fx-ink lg:mt-[18px] lg:max-w-[420px] lg:text-[48px] lg:leading-[1.1]"
              data-tina-field={tinaField(services as any, "title")}
            >
              {renderEmphasis(tField(services, "title", locale))}
            </h2>
            <p
              className="mb-0 mt-3.5 text-[15px] leading-[1.6] text-fx-body lg:hidden"
              data-tina-field={tinaField(services as any, "subtitle")}
            >
              {tField(services, "subtitle", locale)}
            </p>
          </div>
          <p
            data-reveal="up"
            data-reveal-distance="56"
            data-reveal-duration="1.2"
            data-reveal-ease="fx"
            data-reveal-delay="0.12"
            className="m-0 hidden max-w-[300px] text-[16px] leading-[1.6] text-fx-body lg:block"
            data-tina-field={tinaField(services as any, "subtitle")}
          >
            {tField(services, "subtitle", locale)}
          </p>
        </div>

        <div
          data-reveal="up"
          data-reveal-distance="56"
          data-reveal-duration="1.2"
          data-reveal-ease="fx"
          data-reveal-delay="0.16"
          className="mt-14 hidden h-[520px] gap-4 lg:flex"
        >
          {items.map((item, i) => {
            const on = i === active;
            const href = localizeHref(item.url, locale);
            return (
              <div
                key={i}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="relative min-w-0 cursor-pointer overflow-hidden rounded-[24px] border p-7 transition-[flex-grow,background,border-color,box-shadow] duration-700 ease-[cubic-bezier(.65,0,.35,1)]"
                style={{
                  flex: `${on ? 3.4 : 1} 1 0`,
                  background: on ? "#96217A" : "#FFFFFF",
                  borderColor: on ? "#96217A" : "#ECE9EC",
                  boxShadow: on ? "0 40px 80px -40px rgba(150,33,122,.6)" : "0 1px 2px rgba(17,12,16,.04)",
                }}
                data-tina-field={tinaField(item, "title")}
              >
                <div
                  className="absolute inset-x-2 top-2 h-[210px] overflow-hidden rounded-[18px] bg-fx-purple-hover [mask-image:linear-gradient(180deg,#000_75%,transparent)]"
                  style={{
                    opacity: on ? 1 : 0,
                    transform: `translateY(${on ? 0 : -16}px)`,
                    transition: `opacity .6s ${on ? ".25s" : "0s"}, transform .8s cubic-bezier(.16,1,.3,1)`,
                  }}
                >
                  {item.cover && (
                    <img src={mediaUrl(item.cover)} alt={tField(item, "title", locale)} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                </div>
                <div className="absolute inset-x-7 bottom-7">
                  <div
                    className="grid w-11 place-items-center overflow-hidden rounded-xl border shadow-[0_4px_10px_-4px_rgba(17,12,16,.15)] transition-all duration-500"
                    style={{
                      height: on ? 0 : 44,
                      opacity: on ? 0 : 1,
                      marginBottom: on ? 0 : 18,
                      background: on ? "rgba(255,255,255,.14)" : "#FFFFFF",
                      borderColor: on ? "rgba(255,255,255,.25)" : "#D8D5D8",
                      color: on ? "#FFFFFF" : "#453C46",
                    }}
                  >
                    <CategoryIcon tab={item.tabIcon} />
                  </div>
                  <div
                    className="font-medium leading-[1.25] transition-[color,font-size] duration-500"
                    style={{ fontSize: on ? 28 : 17, color: on ? "#FFFFFF" : "#453C46" }}
                  >
                    {tField(item, "title", locale)}
                  </div>
                  <div
                    className="w-[460px] overflow-hidden"
                    style={{
                      maxHeight: on ? 280 : 0,
                      opacity: on ? 1 : 0,
                      transition: `max-height .7s cubic-bezier(.65,0,.35,1), opacity .5s ${on ? ".25s" : "0s"}`,
                    }}
                    aria-hidden={!on}
                  >
                    <p className="mb-0 mt-3 max-w-[420px] text-[15px] leading-[1.6] text-fx-blush">{tField(item, "description", locale)}</p>
                    <div className="mt-[18px] flex flex-wrap gap-2">
                      {tags(item).map((tag, ti) => (
                        <span key={ti} className="rounded-full border border-white/30 px-3.5 py-[7px] text-[12px] text-white">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-[22px]">
                      <CtaPill href={href} label={cta} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-7 flex flex-col gap-2.5 lg:hidden">
          {items.map((item, i) => {
            const on = i === openMobile;
            return (
              <div
                key={i}
                data-reveal="up"
                data-reveal-distance="40"
                className="overflow-hidden rounded-[22px] border transition-[background,border-color] duration-500"
                style={{ background: on ? "#96217A" : "#FFFFFF", borderColor: on ? "#96217A" : "#ECE9EC" }}
              >
                <button
                  type="button"
                  onClick={() => setOpenMobile(on ? -1 : i)}
                  aria-expanded={on}
                  className="flex min-h-[72px] w-full items-center gap-3.5 px-4 text-left"
                  style={{ paddingTop: on ? 22 : 14, paddingBottom: on ? 22 : 14 }}
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-all duration-500"
                    style={{
                      background: on ? "rgba(255,255,255,.14)" : "#FFFFFF",
                      borderColor: on ? "rgba(255,255,255,.25)" : "#D8D5D8",
                      color: on ? "#FFFFFF" : "#453C46",
                    }}
                  >
                    <CategoryIcon tab={item.tabIcon} />
                  </span>
                  <span className="flex-1 text-[17px] font-medium leading-[1.25] transition-colors duration-500" style={{ color: on ? "#FFFFFF" : "#453C46" }}>
                    {tField(item, "title", locale)}
                  </span>
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition-[transform,background] duration-500 ease-fx-spring"
                    style={{ background: on ? "#FFFFFF" : "#F2F1F2", color: on ? "#96217A" : "#453C46", transform: `rotate(${on ? 45 : 0}deg)` }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                <div className="grid transition-[grid-template-rows] duration-[600ms] ease-[cubic-bezier(.65,0,.35,1)]" style={{ gridTemplateRows: on ? "1fr" : "0fr" }}>
                  <div className="overflow-hidden">
                    <div className="px-2 pb-4 pt-2" style={{ opacity: on ? 1 : 0, transition: `opacity .4s ${on ? ".2s" : "0s"}` }}>
                      <div className="relative h-[168px] overflow-hidden rounded-2xl bg-fx-purple-hover">
                        {item.cover && (
                          <img src={mediaUrl(item.cover)} alt={tField(item, "title", locale)} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="px-2 pb-2 pt-4">
                        <p className="m-0 text-[14px] leading-[1.6] text-fx-blush">{tField(item, "description", locale)}</p>
                        <div className="mt-3.5 flex flex-wrap gap-1.5">
                          {tags(item).map((tag, ti) => (
                            <span key={ti} className="rounded-full border border-white/30 px-3 py-1.5 text-[12px] text-white">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-[18px] [&>a]:flex [&>a]:w-full">
                          <CtaPill href={localizeHref(item.url, locale)} label={cta} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
