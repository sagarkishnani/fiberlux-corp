import { useEffect, useRef, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { GlobalQuery, GlobalQueryVariables } from "../../../tina/__generated__/types";
import SearchOverlay from "./SearchOverlay";
import { LOCALES, type Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { localizedPath, localizeHref, tField } from "../../utils/i18n";
import {
  ArrowIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PillLink,
  SearchIcon,
  fxAsset,
  socialIconSrc,
} from "./fx/FxPrimitives";

interface HeaderV3Props {
  query: string;
  variables: GlobalQueryVariables;
  data: GlobalQuery;
  locale?: Locale;
  currentPath?: string;
}

type NavNode = {
  text?: string | null;
  text_en?: string | null;
  url?: string | null;
  external?: boolean | null;
  children?: (NavNode | null)[] | null;
};

const normalizeUrl = (u?: string | null) => (u || "").trim().replace(/\/+$/, "").toLowerCase() || "/";
const SOLUTIONS_URL = "/soluciones";
const CONTACT_URL = "/contacto";

function LangSwitcher({ locale, currentPath, tone }: { locale: Locale; currentPath: string; tone: "ink" | "white" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("lang.switch.aria", locale)}
        className={`flex h-11 items-center gap-1.5 text-[13px] font-semibold ${tone === "ink" ? "text-fx-ink" : "text-white"}`}
      >
        {locale.toUpperCase()}
        <ChevronDownIcon className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-[90] min-w-[140px] overflow-hidden rounded-2xl border border-fx-line bg-white py-1 shadow-[0_20px_40px_-20px_rgba(17,12,16,.3)]"
        >
          {LOCALES.map((loc) => (
            <li key={loc}>
              <a
                href={localizedPath(currentPath, loc)}
                lang={loc}
                aria-current={loc === locale ? "true" : undefined}
                className={`block px-4 py-2.5 text-[13px] text-fx-ink transition-colors hover:bg-fx-bg hover:text-fx-purple ${
                  loc === locale ? "font-semibold" : ""
                }`}
              >
                {loc === "es" ? "Español (ES)" : "English (EN)"}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function HeaderV3React({ query, variables, data: initialData, locale = "es", currentPath = "/" }: HeaderV3Props) {
  const { data } = useTina<GlobalQuery>({ query, variables, data: initialData });
  const global = data?.global || initialData?.global;
  const headerConfig = global?.header;
  const topBar = headerConfig?.topBar;
  const footer = global?.footer;

  const tx = (o: any) => tField(o, "text", locale);
  const hx = (url?: string | null, external?: boolean | null) => localizeHref(url, locale, external);

  const desktopNav = ((headerConfig?.desktopNav || []).filter(Boolean) as NavNode[]);
  const navItems = desktopNav.filter((item) => normalizeUrl(item.url) !== CONTACT_URL);
  const contactItem = desktopNav.find((item) => normalizeUrl(item.url) === CONTACT_URL);
  const secondaryNav = ((headerConfig?.secondaryNav || []).filter(Boolean) as NavNode[]);
  const solutionsNode = ((global?.nav?.links || []).filter(Boolean) as NavNode[]).find(
    (l) => normalizeUrl(l.url) === SOLUTIONS_URL
  );
  const categories = ((solutionsNode?.children || []).filter(Boolean) as NavNode[]);
  const socials = ((footer?.social || []).filter(Boolean) as { platform?: string | null; url?: string | null }[]).filter(
    (s) => socialIconSrc(s.platform)
  );

  const [megaOpen, setMegaOpen] = useState(false);
  const [megaIndex, setMegaIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSub, setDrawerSub] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState(-1);
  const [searchOpen, setSearchOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const lastY = useRef(0);
  const searchBtnRef = useRef<HTMLButtonElement>(null);

  const overlayOpen = drawerOpen || searchOpen;

  useEffect(() => {
    const onScroll = () => {
      const nav = navRef.current;
      if (!nav) return;
      const y = window.scrollY;
      const desktop = window.innerWidth >= 1024;
      const hideAfter = desktop ? 400 : 300;
      const solidAfter = desktop ? 40 : 30;
      const hide = y > hideAfter && y > lastY.current + 2 && !megaOpen && !overlayOpen;
      if (hide) nav.style.transform = "translateY(-110%)";
      else if (y < lastY.current - 2 || y <= hideAfter) nav.style.transform = "translateY(0)";
      nav.dataset.solid = y > solidAfter ? "true" : "false";
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [megaOpen, overlayOpen]);

  useEffect(() => {
    const lenis = (window as any).__lenis;
    if (drawerOpen) lenis?.stop?.();
    else if (!searchOpen) lenis?.start?.();
    if (!drawerOpen) {
      setDrawerSub(false);
      setDrawerCategory(-1);
    }
  }, [drawerOpen, searchOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const activeCategory = categories[megaIndex] || categories[0];
  const activeSolutions = ((activeCategory?.children || []).filter(Boolean) as NavNode[]);
  const logoSrc = fxAsset("logo.svg");
  const homeHref = localizedPath(import.meta.env.BASE_URL || "/", locale);

  const openSearch = () => {
    setMegaOpen(false);
    setDrawerOpen(false);
    setSearchOpen(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    searchBtnRef.current?.focus();
  };

  return (
    <>
      <div className="relative z-[65] border-b border-fx-line bg-white" data-site-topbar>
        <div className="fx-container flex h-11 items-center justify-between text-[13px]">
          <div className="flex h-full gap-6 lg:gap-7">
            <a
              href={hx(topBar?.empresasUrl || "/")}
              className="flex h-full items-center border-b-2 border-fx-purple pt-0.5 font-semibold text-fx-ink hover:text-fx-ink"
              data-tina-field={tinaField(topBar as any, "empresasLabel")}
            >
              {tField(topBar, "empresasLabel", locale) || t("nav.audience.empresas", locale)}
            </a>
            <a
              href={topBar?.negociosUrl || "https://negocios.fiberlux.pe/"}
              className="flex h-full items-center border-b-2 border-transparent pt-0.5 text-fx-muted transition-colors duration-200 hover:text-fx-purple"
              data-tina-field={tinaField(topBar as any, "negociosLabel")}
            >
              {tField(topBar, "negociosLabel", locale) || t("nav.audience.negocios", locale)}
            </a>
          </div>
          <div className="flex items-center gap-7">
            <a
              href={hx(topBar?.abonadosUrl || "/informacion-abonados")}
              className="hidden text-fx-subtle transition-colors duration-200 hover:text-fx-purple lg:inline"
              data-tina-field={tinaField(topBar as any, "abonadosLabel")}
            >
              {tField(topBar, "abonadosLabel", locale) || t("topbar.abonados", locale)}
            </a>
            <LangSwitcher locale={locale} currentPath={currentPath} tone="ink" />
          </div>
        </div>
      </div>

      <header
        ref={navRef}
        data-site-header
        data-solid="false"
        className="sticky top-0 z-[60] transition-[transform,background,box-shadow] duration-500 ease-fx-spring data-[solid=true]:bg-[rgba(247,247,247,.82)] data-[solid=true]:shadow-[0_1px_0_#E6E3E6] data-[solid=true]:backdrop-blur-[18px] data-[solid=true]:backdrop-saturate-[1.4]"
      >
        <div className="fx-container flex h-[68px] items-center justify-between lg:grid lg:h-[84px] lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-3.5 lg:gap-5">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("menu.open.aria", locale)}
              aria-expanded={drawerOpen}
              className="group/burger flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-full border border-fx-line-strong bg-white transition-[border-color,background,transform] duration-300 active:scale-[.94] lg:h-12 lg:w-12 lg:gap-[5px] lg:hover:border-fx-ink lg:hover:bg-fx-soft"
            >
              <span className="block h-0.5 w-[18px] rounded-sm bg-fx-ink transition-[width] duration-300 lg:group-hover/burger:w-5" />
              <span className="-ml-1.5 block h-0.5 w-3 rounded-sm bg-fx-ink transition-[width] delay-[50ms] duration-300 lg:ml-0 lg:w-[18px] lg:group-hover/burger:w-3" />
              <span className="block h-0.5 w-[18px] rounded-sm bg-fx-ink transition-[width] delay-100 duration-300 lg:group-hover/burger:w-5" />
            </button>
            <a href={homeHref} aria-label="Fiberlux">
              <img src={logoSrc} alt="Fiberlux" className="block h-auto w-[124px] lg:w-[150px]" />
            </a>
          </div>

          <nav className="hidden items-center gap-0.5 rounded-full bg-fx-ink p-1.5 shadow-[0_10px_30px_-12px_rgba(69,60,70,.45)] lg:flex">
            {navItems.map((item, i) => {
              const isSolutions = normalizeUrl(item.url) === SOLUTIONS_URL && categories.length > 0;
              if (!isSolutions) {
                return (
                  <a
                    key={i}
                    href={hx(item.url, item.external)}
                    className="rounded-full px-[18px] py-2.5 text-[14px] text-white transition-colors duration-200 hover:bg-white/10 hover:text-white"
                    data-tina-field={tinaField(item as any, "text")}
                  >
                    {tx(item)}
                  </a>
                );
              }
              return (
                <div
                  key={i}
                  className="relative"
                  onMouseEnter={() => setMegaOpen(true)}
                  onMouseLeave={() => setMegaOpen(false)}
                >
                  <a
                    href={hx(item.url)}
                    aria-expanded={megaOpen}
                    onFocus={() => setMegaOpen(true)}
                    className="flex items-center gap-1.5 rounded-full py-2.5 pl-[18px] pr-4 text-[14px] text-white transition-colors duration-200 hover:bg-white/10 hover:text-white"
                    data-tina-field={tinaField(item as any, "text")}
                  >
                    {tx(item)}
                    <ChevronDownIcon className={`transition-transform duration-300 ${megaOpen ? "rotate-180" : ""}`} />
                  </a>
                  <div
                    className={`absolute left-1/2 top-full -ml-[380px] w-[760px] pt-3.5 transition-[opacity,transform] duration-[400ms] ease-fx-spring ${
                      megaOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
                    }`}
                  >
                    <div className="grid grid-cols-[290px_minmax(0,1fr)] gap-2 rounded-[28px] border border-fx-line bg-white p-2 shadow-[0_30px_70px_-24px_rgba(17,12,16,.28)]">
                      <div className="flex flex-col gap-0.5 p-1">
                        {categories.map((cat, ci) => {
                          const on = ci === megaIndex;
                          return (
                            <a
                              key={ci}
                              href={hx(cat.url)}
                              onMouseEnter={() => setMegaIndex(ci)}
                              onFocus={() => setMegaIndex(ci)}
                              className={`flex items-center justify-between gap-3 rounded-[18px] px-[18px] py-4 text-[15px] font-medium transition-colors duration-300 ${
                                on ? "bg-fx-bg text-fx-purple hover:text-fx-purple" : "text-fx-ink hover:text-fx-ink"
                              }`}
                            >
                              {tx(cat)}
                              <ChevronRightIcon
                                className={`shrink-0 transition-[opacity,transform] duration-300 ${on ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-30"}`}
                              />
                            </a>
                          );
                        })}
                      </div>
                      <div className="flex min-h-[340px] flex-col rounded-[22px] bg-fx-bg px-3 pb-3 pt-5">
                        <div className="px-3.5 pb-2.5 font-mono text-[12px] font-medium tracking-[.18em] text-fx-muted">
                          {t("mega.label", locale)}
                        </div>
                        {activeSolutions.map((sol, si) => (
                          <a
                            key={si}
                            href={hx(sol.url)}
                            className="group/sol flex items-center justify-between gap-3 rounded-[14px] px-3.5 py-[11px] text-[14px] text-fx-ink transition-colors duration-200 hover:bg-white hover:text-fx-purple"
                          >
                            {tx(sol)}
                            <span className="flex -translate-x-1.5 text-fx-purple opacity-0 transition-all duration-300 group-hover/sol:translate-x-0 group-hover/sol:opacity-100">
                              <ArrowIcon size={14} />
                            </span>
                          </a>
                        ))}
                        {activeCategory && (
                          <a
                            href={hx(activeCategory.url)}
                            className="group/all mt-auto inline-flex items-center gap-2.5 px-3.5 pb-1.5 pt-4 text-[14px] font-medium text-fx-purple hover:text-fx-purple-deep"
                          >
                            {t("mega.viewAll", locale)} {tx(activeCategory)}
                            <span className="flex transition-transform duration-300 group-hover/all:translate-x-1">
                              <ArrowIcon size={14} />
                            </span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              ref={searchBtnRef}
              type="button"
              onClick={openSearch}
              aria-label={t("search.aria", locale)}
              className="ml-1 grid h-[38px] w-[38px] place-items-center rounded-full bg-white text-fx-ink transition-[background,color,transform] duration-300 hover:scale-[1.06] hover:bg-fx-purple-hover hover:text-white"
            >
              <SearchIcon />
            </button>
          </nav>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={openSearch}
              aria-label={t("search.aria", locale)}
              className="grid h-11 w-11 place-items-center rounded-full bg-fx-ink text-white transition-[transform,background] duration-200 active:scale-[.94] active:bg-fx-purple lg:hidden"
            >
              <SearchIcon size={18} />
            </button>
            {contactItem && (
              <PillLink
                href={hx(contactItem.url)}
                className="hidden lg:inline-flex"
                data-tina-field={tinaField(contactItem as any, "text")}
              >
                {tx(contactItem)}
              </PillLink>
            )}
          </div>
        </div>
      </header>

      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-[90] hidden bg-[rgba(17,12,16,.45)] backdrop-blur-[4px] transition-opacity duration-500 lg:block ${
          drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-hidden={!drawerOpen}
        inert={!drawerOpen ? true : undefined}
        className={`fixed bottom-0 left-0 top-0 z-[100] hidden w-[560px] flex-col rounded-r-[32px] bg-fx-purple px-[72px] py-12 text-white transition-transform duration-[800ms] ease-fx-drawer lg:flex ${
          drawerOpen ? "translate-x-0" : "-translate-x-[105%]"
        }`}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="group/close flex items-center gap-3.5 self-start text-[16px] font-medium text-white"
        >
          <span className="block h-0.5 w-10 bg-white transition-[width] duration-300 group-hover/close:w-6" />
          {t("menu.close", locale)}
        </button>
        <img src={fxAsset("logo-white.svg")} alt="Fiberlux" className="mt-9 h-auto w-[200px]" />
        <nav className="mt-[72px] flex flex-col gap-2">
          {secondaryNav.map((item, i) => (
            <a
              key={i}
              href={hx(item.url, item.external)}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="group/dl flex items-center gap-4 text-[44px] font-semibold leading-[1.3] tracking-[-.02em] text-white hover:text-white"
              style={{
                opacity: drawerOpen ? 1 : 0,
                transform: drawerOpen ? "translateX(0)" : "translateX(-40px)",
                transition: `opacity .6s ${drawerOpen ? 0.3 + i * 0.08 : 0}s, transform .8s cubic-bezier(.16,1,.3,1) ${drawerOpen ? 0.3 + i * 0.08 : 0}s`,
              }}
              data-tina-field={tinaField(item as any, "text")}
            >
              <span className="transition-transform duration-[450ms] ease-fx-spring group-hover/dl:translate-x-3.5">{tx(item)}</span>
              <span className="flex -translate-x-2.5 opacity-0 transition-all duration-[450ms] ease-fx-spring group-hover/dl:translate-x-3.5 group-hover/dl:-rotate-45 group-hover/dl:opacity-100">
                <ArrowIcon size={32} />
              </span>
            </a>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-[18px]">
          <span className="text-[15px] text-fx-blush">{t("social.follow", locale)}</span>
          {socials.map((s, i) => (
            <a
              key={i}
              href={s.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.platform || ""}
              className="block h-10 w-10 transition-[transform,filter] duration-300 ease-fx-spring hover:-translate-y-[3px] hover:brightness-[.8]"
            >
              <img src={socialIconSrc(s.platform)} alt={s.platform || ""} className="block h-10 w-10" />
            </a>
          ))}
        </div>
      </aside>

      <aside
        aria-hidden={!drawerOpen}
        inert={!drawerOpen ? true : undefined}
        className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-fx-purple text-white transition-[clip-path] duration-700 ease-fx-drawer lg:hidden"
        style={{
          clipPath: drawerOpen ? "inset(0 0 0 0 round 0px)" : "inset(0 0 100% 0 round 0 0 40px 40px)",
          pointerEvents: drawerOpen ? "auto" : "none",
        }}
      >
        <div className="fx-container flex h-14 shrink-0 items-center justify-between text-[14px]">
          <div className="flex gap-6">
            <span className="font-semibold text-white">{tField(topBar, "empresasLabel", locale) || t("nav.audience.empresas", locale)}</span>
            <a href={topBar?.negociosUrl || "https://negocios.fiberlux.pe/"} className="font-medium text-fx-blush">
              {tField(topBar, "negociosLabel", locale) || t("nav.audience.negocios", locale)}
            </a>
          </div>
          <LangSwitcher locale={locale} currentPath={currentPath} tone="white" />
        </div>
        <div className="fx-container flex h-16 shrink-0 items-center">
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="flex h-11 items-center gap-3.5 text-[17px] font-semibold text-white"
          >
            <span className="block h-0.5 w-7 bg-white" />
            {t("menu.close", locale)}
          </button>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div
            data-lenis-prevent
            className="absolute inset-0 overflow-y-auto overscroll-contain transition-[transform,opacity] duration-[550ms] ease-[cubic-bezier(.65,0,.35,1)]"
            style={{ transform: drawerSub ? "translateX(-30%)" : "translateX(0)", opacity: drawerSub ? 0 : 1 }}
          >
            <div className="fx-container pb-[140px] pt-10">
              <nav className="flex flex-col">
                {[...navItems, ...(contactItem ? [contactItem] : [])].map((item, i) => {
                  const isSolutions = normalizeUrl(item.url) === SOLUTIONS_URL && categories.length > 0;
                  const delay = drawerOpen ? 0.25 + i * 0.05 : 0;
                  return (
                    <a
                      key={i}
                      href={hx(item.url, item.external)}
                      onClick={(e) => {
                        if (isSolutions) {
                          e.preventDefault();
                          setDrawerSub(true);
                        } else setDrawerOpen(false);
                      }}
                      className="flex min-h-[46px] items-center justify-between text-[31px] font-bold leading-[1.15] tracking-[-.01em] text-white hover:text-white active:text-fx-blush"
                      style={{
                        opacity: drawerOpen ? 1 : 0,
                        transform: drawerOpen ? "translateY(0)" : "translateY(24px)",
                        transition: `opacity .5s ${delay}s, transform .7s cubic-bezier(.16,1,.3,1) ${delay}s`,
                      }}
                    >
                      {tx(item)}
                      {isSolutions && (
                        <span className="flex text-[#E9C7DD]">
                          <ChevronRightIcon size={20} />
                        </span>
                      )}
                    </a>
                  );
                })}
              </nav>
              <div className="mb-5 mt-9 h-px bg-white/25" />
              {[
                ...secondaryNav.map((item) => ({ label: tx(item), href: hx(item.url, item.external), external: !!item.external })),
                {
                  label: tField(topBar, "abonadosLabel", locale) || t("topbar.abonados", locale),
                  href: hx(topBar?.abonadosUrl || "/informacion-abonados"),
                  external: false,
                },
              ].map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="flex min-h-12 items-center py-1 text-[17px] leading-[1.4] text-white hover:text-white active:text-fx-blush"
                  style={{ opacity: drawerOpen ? 1 : 0, transition: `opacity .5s ${drawerOpen ? 0.5 + i * 0.05 : 0}s` }}
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-9 flex items-center gap-3.5">
                <span className="text-[15px] text-[#E9C7DD]">{t("social.follow", locale)}</span>
                <div className="flex gap-1">
                  {socials.map((s, i) => (
                    <a key={i} href={s.url || "#"} target="_blank" rel="noopener noreferrer" aria-label={s.platform || ""} className="block h-11 w-11">
                      <img src={socialIconSrc(s.platform)} alt={s.platform || ""} className="block h-11 w-11" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div
            data-lenis-prevent
            className="absolute inset-0 overflow-y-auto overscroll-contain transition-[transform,opacity] duration-[550ms] ease-[cubic-bezier(.65,0,.35,1)]"
            style={{ transform: drawerSub ? "translateX(0)" : "translateX(100%)", opacity: drawerSub ? 1 : 0 }}
          >
            <div className="fx-container pb-[140px] pt-10">
              <button
                type="button"
                onClick={() => setDrawerSub(false)}
                className="flex h-11 items-center gap-2.5 text-[19px] font-medium text-[#E9C7DD]"
              >
                <ChevronRightIcon size={18} className="rotate-180" />
                {t("menu.back", locale)}
              </button>
              <div className="mt-5 flex flex-col">
                {categories.map((cat, ci) => {
                  const on = ci === drawerCategory;
                  const sols = ((cat.children || []).filter(Boolean) as NavNode[]);
                  return (
                    <div key={ci}>
                      <div className="flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => setDrawerCategory(on ? -1 : ci)}
                          aria-expanded={on}
                          className="flex min-h-[52px] items-center gap-3 text-left text-[20px] font-bold text-white"
                        >
                          {tx(cat)}
                          <span className={`flex text-[#E9C7DD] transition-transform duration-[400ms] ${on ? "rotate-90" : ""}`}>
                            <ChevronRightIcon size={20} />
                          </span>
                        </button>
                        {cat.url && (
                          <a
                            href={hx(cat.url)}
                            className="flex min-h-11 shrink-0 items-center whitespace-nowrap text-[14px] font-semibold text-[#E9C7DD] underline-offset-4 hover:text-white hover:underline"
                          >
                            {t("drawer.more", locale)}
                          </a>
                        )}
                      </div>
                      <div
                        className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.65,0,.35,1)]"
                        style={{ gridTemplateRows: on ? "1fr" : "0fr" }}
                      >
                        <div className="overflow-hidden">
                          <div className="mb-4 ml-1 mt-1.5 flex flex-col border-l-2 border-white/20 pl-5">
                            {sols.map((sol, si) => (
                              <a key={si} href={hx(sol.url)} className="flex min-h-12 items-center text-[17px] text-white hover:text-white active:text-fx-blush">
                                {tx(sol)}
                              </a>
                            ))}
                            <a href={hx(cat.url)} className="flex min-h-12 items-center text-[15px] font-semibold text-[#E9C7DD] hover:text-white">
                              {t("mega.viewAll", locale)} {tx(cat)}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <SearchOverlay open={searchOpen} onClose={closeSearch} locale={locale} />
    </>
  );
}
