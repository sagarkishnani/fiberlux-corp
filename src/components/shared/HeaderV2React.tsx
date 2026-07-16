import { useState, useEffect, useRef, useCallback } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type {
  GlobalQuery,
  GlobalQueryVariables,
} from "../../../tina/__generated__/types";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaInstagram,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
  FaTiktok,
  FaGithub,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

/* ── Types ── */
interface HeaderProps {
  query: string;
  variables: GlobalQueryVariables;
  data: GlobalQuery;
  theme?: "light" | "dark";
}

interface NavGrandChild {
  text?: string | null;
  url?: string | null;
}

interface NavChild {
  text?: string | null;
  url?: string | null;
  children?: (NavGrandChild | null)[] | null;
}

interface NavLink {
  text?: string | null;
  url?: string | null;
  children?: (NavChild | null)[] | null;
}

interface DesktopNavItem {
  text?: string | null;
  url?: string | null;
}

interface LegalLink {
  text?: string | null;
  url?: string | null;
}

interface SocialItem {
  platform?: string | null;
  url?: string | null;
}

/* ── Icon map ── */
const iconMap: Record<string, IconType> = {
  Facebook: FaFacebookF,
  LinkedIn: FaLinkedinIn,
  Instagram: FaInstagram,
  WhatsApp: FaWhatsapp,
  X: FaXTwitter,
  YouTube: FaYoutube,
  TikTok: FaTiktok,
  GitHub: FaGithub,
};

/* ── Constants ── */
const DEFAULT_LOGO = "/images/logo/fiberlux.svg";
const SCROLL_THRESHOLD = 50;
const MOBILE_BREAKPOINT = 1024;
const LEGALES_TITLE = "legales";

/* ── Icons ── */
const ChevronRight = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronLeft = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronDown = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
  </svg>
);

/* ── Helpers ── */
const hasChildren = (item?: NavLink | NavChild | null): boolean =>
  !!item?.children && item.children.filter(Boolean).length > 0;

// Normalize URLs for matching desktopNav items against nav.links (ignore
// trailing slashes / casing so "/nosotros" === "/nosotros/").
const normalizeUrl = (u?: string | null): string =>
  (u || "").trim().replace(/\/+$/, "").toLowerCase() || "/";

export default function HeaderV2React({
  query,
  variables,
  data: initialData,
  theme = "dark",
}: HeaderProps) {
  const { data } = useTina<GlobalQuery>({
    query,
    variables,
    data: initialData,
  });

  const tinaGlobal = data?.global || initialData?.global;
  const nav = tinaGlobal?.nav;
  const footer = tinaGlobal?.footer;
  const headerConfig = tinaGlobal?.header;
  const topBar = headerConfig?.topBar;

  /* ── State ── */
  const [menuOpen, setMenuOpen] = useState(false);
  // Desktop navbar: index of the item revealing its hover dropdown (or null).
  const [navHover, setNavHover] = useState<number | null>(null);
  // Desktop navbar: index of the level-2 item (inside the open dropdown) whose
  // sub-items flyout is revealed (or null).
  const [navSubHover, setNavSubHover] = useState<number | null>(null);
  // Mobile: drill path of indices ([] = top level, [i] = children of link i, …).
  const [mobilePath, setMobilePath] = useState<number[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const isMobile = useRef(false);

  /* ── Derived data ── */
  const logoSrc = headerConfig?.logo || DEFAULT_LOGO;

  const isLight = theme === "light";
  const controlsDark = isLight && !menuOpen;
  const barColor = controlsDark ? "bg-greyscale-darkest" : "bg-white";
  const controlText = controlsDark ? "text-greyscale-darkest" : "text-white";
  const logoFilter = controlsDark ? "brightness-0" : "brightness-0 invert";

  // Full nav (multilevel) — drives the mobile drill and the desktop hover
  // dropdowns. "Inicio" is filtered out (the logo already links home).
  const mainLinks = ((nav?.links || []).filter(Boolean) as NavLink[]).filter(
    (l) => l.text !== "Inicio"
  );
  // Desktop inline navbar order/labels (CMS: header.desktopNav).
  const desktopNav = (headerConfig?.desktopNav || []).filter(
    Boolean
  ) as DesktopNavItem[];
  // Legales list — single-sourced from the footer column titled "Legales".
  const legalesColumn = (footer?.columns || [])
    .filter(Boolean)
    .find((c) => (c?.title || "").trim().toLowerCase() === LEGALES_TITLE);
  const legalesLinks = (legalesColumn?.links || []).filter(
    Boolean
  ) as LegalLink[];
  const socialLinks = (footer?.social || []).filter(Boolean) as SocialItem[];

  // Resolve a desktopNav item's hover children by matching its URL against
  // nav.links (single-source of submenu content).
  const childrenForUrl = (url?: string | null): NavChild[] => {
    const match = mainLinks.find((l) => normalizeUrl(l.url) === normalizeUrl(url));
    return (match?.children || []).filter(Boolean) as NavChild[];
  };

  /* ── Nav reset helper ── */
  const resetNav = useCallback(() => {
    setNavHover(null);
    setNavSubHover(null);
    setMobilePath([]);
  }, []);

  // Resolve the node + its children for the current mobile drill path.
  const nodeAtPath = (path: number[]) => {
    let children: (NavChild | NavGrandChild | null)[] = mainLinks;
    let node: NavLink | NavChild | null = null;
    for (const idx of path) {
      node = (children[idx] as NavChild) || null;
      children = (node?.children || []).filter(Boolean);
    }
    return {
      node,
      children: children.filter(Boolean) as (NavChild | NavGrandChild)[],
    };
  };

  /* ── Scroll handler ── */
  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    setScrolled(currentY > SCROLL_THRESHOLD);

    if (isMobile.current && !menuOpen) {
      if (currentY > lastScrollY.current && currentY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
    }
    lastScrollY.current = currentY;
  }, [menuOpen]);

  const handleResize = useCallback(() => {
    const nowMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (nowMobile !== isMobile.current) {
      // Crossed the breakpoint — reset navigation state to avoid residue.
      resetNav();
    }
    isMobile.current = nowMobile;
  }, [resetNav]);

  useEffect(() => {
    handleResize();
    // Initialize scroll state on mount so a reload mid-page shows the correct
    // header background immediately.
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleScroll, handleResize]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      setHeaderVisible(true);
    } else {
      document.body.style.overflow = "";
      resetNav();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, resetNav]);

  // Desktop: close the menu when clicking outside its interactive content.
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (isMobile.current) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest("a, button")) return;
      setMenuOpen(false);
      resetNav();
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpen, resetNav]);

  /* ── Handlers ── */
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => {
    setMenuOpen(false);
    resetNav();
  };
  const drillInto = (index: number) =>
    setMobilePath((prev) => [...prev, index]);
  const goBack = () => setMobilePath((prev) => prev.slice(0, -1));

  /* ── Header background logic ── */
  const headerBg = menuOpen
    ? "bg-brand-purple"
    : scrolled
    ? isLight
      ? "bg-white/80 backdrop-blur-md border-b border-black/5"
      : "bg-greyscale-darkest/80 backdrop-blur-md"
    : "bg-transparent";

  // Top bar has a SOLID background so it stays readable over hero pages, where
  // the main bar is transparent to overlap the hero but the top bar sits above
  // the overlap zone. Slightly lighter than the main bar for a two-tone look.
  // When the menu is open it goes transparent so the purple overlay shows.
  const topBarBg = menuOpen
    ? "bg-transparent"
    : controlsDark
    ? "bg-neutral-100 border-b border-black/5"
    : "bg-[#171717]";

  /* ── Legales block (shared markup) ── */
  const LegalesList = ({
    columns = false,
  }: {
    columns?: boolean;
  }) =>
    legalesLinks.length > 0 ? (
      <ul
        className={
          columns
            ? "grid grid-cols-2 gap-x-10 gap-y-2 max-w-3xl"
            : "flex flex-col gap-1"
        }
      >
        {legalesLinks.map((l, i) => (
          <li key={i}>
            <a
              href={l.url || "#"}
              onClick={closeMenu}
              className="block text-white/75 hover:text-white transition-colors text-[15px] py-1"
            >
              {l.text}
            </a>
          </li>
        ))}
      </ul>
    ) : null;

  /* ── Mobile drill data ── */
  const depth = mobilePath.length;
  const { node: currentNode, children: currentChildren } =
    nodeAtPath(mobilePath);
  const siblingLinks =
    depth === 1 ? mainLinks.filter((_, i) => i !== mobilePath[0]) : [];

  return (
    <>
      {/* ═══ HEADER (top bar + main bar) ═══ */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-[80]
          transition-all duration-300
          ${headerBg}
          ${headerVisible ? "translate-y-0" : "-translate-y-full"}
        `}
      >
        {/* ── TOP BAR ── */}
        <div className={`${topBarBg} transition-colors duration-300`}>
          <div className="site-container h-14 flex items-center justify-between">
            {/* Left: Empresas (active) / Negocios */}
            <div className="flex items-center gap-6">
              {topBar?.empresasLabel && (
                <a
                  href={topBar.empresasUrl || "/"}
                  className={`relative text-[13px] font-medium ${controlText} transition-colors after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:bg-brand-purple after:content-['']`}
                  data-tina-field={tinaField(topBar as any, "empresasLabel")}
                >
                  {topBar.empresasLabel}
                </a>
              )}
              {topBar?.negociosLabel && (
                <a
                  href={topBar.negociosUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-[13px] font-medium ${controlText} opacity-80 hover:opacity-100 transition-opacity`}
                  data-tina-field={tinaField(topBar as any, "negociosLabel")}
                >
                  {topBar.negociosLabel}
                </a>
              )}
            </div>

            {/* Right: Información a abonados (desktop only) */}
            {topBar?.abonadosLabel && (
              <a
                href={topBar.abonadosUrl || "#"}
                className={`hidden lg:block text-[13px] font-medium ${controlText} opacity-80 hover:opacity-100 transition-opacity`}
                data-tina-field={tinaField(topBar as any, "abonadosLabel")}
              >
                {topBar.abonadosLabel}
              </a>
            )}
          </div>
        </div>

        {/* ── MAIN BAR ── */}
        <div className="site-container h-16 flex items-center justify-between gap-6">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={toggleMenu}
              className={`lg:hidden flex items-center gap-3 ${controlText} text-sm font-medium z-50`}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
            >
              <div className="w-7 h-3.5 relative flex flex-col justify-between">
                <span
                  className={`
                  block h-[2px] ${barColor} rounded-full transition-all duration-300 origin-center
                  ${menuOpen ? "rotate-0 translate-y-[5.5px] w-7 opacity-100" : "w-7"}
                `}
                />
                <span
                  className={`
                  block h-[2px] ${barColor} rounded-full transition-all duration-300
                  ${menuOpen ? "opacity-0 w-0" : "w-7 opacity-100"}
                `}
                />
                <span
                  className={`
                  block h-[2px] ${barColor} rounded-full transition-all duration-300 origin-center
                  ${menuOpen ? "rotate-0 -translate-y-[5.5px] w-0 opacity-0" : "w-7"}
                `}
                />
              </div>
              <span
                className={`
                transition-all duration-300
                ${menuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 absolute pointer-events-none"}
              `}
              >
                Cerrar
              </span>
            </button>

            {/* Logo — hidden while the menu is open (reads poorly next to "Cerrar"). */}
            {!menuOpen && (
              <a href="/" className="z-50" aria-label="Fiberlux - Inicio">
                <img
                  src={logoSrc}
                  alt="Fiberlux"
                  className={`h-5 w-auto ${logoFilter}`}
                />
              </a>
            )}
          </div>

          {/* Right: Desktop inline navbar (hover reveal) */}
          <nav
            className={`hidden lg:flex items-center gap-7 transition-opacity duration-200 ${
              menuOpen ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            aria-label="Navegación principal"
          >
            {desktopNav.map((item, i) => {
              const children = childrenForUrl(item.url);
              const withChildren = children.length > 0;
              const open = withChildren && navHover === i;

              return (
                <div
                  key={i}
                  className="relative"
                  onMouseEnter={() => {
                    setNavHover(withChildren ? i : null);
                    setNavSubHover(null);
                  }}
                  onMouseLeave={() => {
                    setNavHover(null);
                    setNavSubHover(null);
                  }}
                >
                  <a
                    href={item.url || "#"}
                    className={`flex items-center gap-1.5 text-[15px] font-medium ${controlText} transition-opacity ${
                      open ? "opacity-100" : "opacity-90 hover:opacity-100"
                    } nav-link-hover ${open ? "nav-link-active" : ""}`}
                    data-tina-field={tinaField(item as any, "text")}
                  >
                    {item.text}
                    {withChildren && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </a>

                  {withChildren && (
                    <div
                      className={`absolute left-0 top-full pt-4 transition-all duration-200 ${
                        open
                          ? "opacity-100 visible translate-y-0"
                          : "opacity-0 invisible -translate-y-1 pointer-events-none"
                      }`}
                    >
                      <div className="min-w-[280px] rounded-2xl bg-greyscale-darkest/95 backdrop-blur-md border border-white/10 p-2 shadow-2xl">
                        {children.map((child, j) => {
                          const grand = (child.children || []).filter(
                            Boolean
                          ) as NavGrandChild[];
                          const hasGrand = grand.length > 0;
                          const subOpen = navSubHover === j;

                          return (
                            <div
                              key={j}
                              className="relative"
                              onMouseEnter={() =>
                                setNavSubHover(hasGrand ? j : null)
                              }
                            >
                              <a
                                href={child.url || "#"}
                                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-[15px] transition-colors ${
                                  subOpen
                                    ? "text-white bg-white/5"
                                    : "text-white/80 hover:text-white hover:bg-white/5"
                                }`}
                              >
                                <span>{child.text}</span>
                                {hasGrand && (
                                  <ChevronRight className="w-4 h-4 shrink-0 opacity-60" />
                                )}
                              </a>

                              {hasGrand && (
                                <div
                                  className={`absolute left-full top-0 pl-2 transition-all duration-200 ${
                                    subOpen
                                      ? "opacity-100 visible translate-x-0"
                                      : "opacity-0 invisible -translate-x-1 pointer-events-none"
                                  }`}
                                >
                                  <div className="min-w-[280px] max-h-[70vh] overflow-y-auto rounded-2xl bg-greyscale-darkest/95 backdrop-blur-md border border-white/10 p-2 shadow-2xl">
                                    {grand.map((gc, k) => (
                                      <a
                                        key={k}
                                        href={gc.url || "#"}
                                        className="block rounded-xl px-4 py-2 text-[14px] text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                                      >
                                        {gc.text}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ═══ MENU OVERLAY (hamburger) ═══ */}
      <div
        className={`
          fixed top-0 left-0 right-0 z-[70]
          bg-brand-purple
          h-screen lg:h-[calc(100vh-80px)]
          lg:rounded-b-[48px]
          transition-all duration-500
          ${
            menuOpen
              ? "translate-y-0 opacity-100 visible ease-[cubic-bezier(0.16,1,0.3,1)]"
              : "-translate-y-full opacity-0 invisible ease-[cubic-bezier(0.7,0,0.84,0)]"
          }
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="h-full overflow-y-auto pt-[136px] pb-10 flex flex-col">
          <div className="site-container flex-1 flex flex-col">
            {/* ── MOBILE OVERLAY — multilevel nav ── */}
            <div className="flex lg:hidden flex-col flex-1">
              {depth === 0 ? (
                <>
                  <nav
                    className="flex flex-col gap-1 pt-4"
                    aria-label="Navegación principal"
                  >
                    {mainLinks.map((link, i) =>
                      hasChildren(link) ? (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <a
                            href={link.url || "#"}
                            onClick={closeMenu}
                            className="text-white text-[29px] leading-[40px] font-semibold hover:text-white/80 transition-colors"
                          >
                            {link.text}
                          </a>
                          <button
                            onClick={() => drillInto(i)}
                            className="p-2 -mr-2 text-white/70 hover:text-white transition-colors"
                            aria-label={`Ver opciones de ${link.text}`}
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </div>
                      ) : (
                        <a
                          key={i}
                          href={link.url || "#"}
                          onClick={closeMenu}
                          className="text-white text-[29px] leading-[40px] font-semibold hover:text-white/80 transition-colors"
                        >
                          {link.text}
                        </a>
                      )
                    )}
                  </nav>

                  {/* Legales bajo un divisor al final */}
                  {legalesLinks.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/20">
                      <p className="text-white/50 text-xs uppercase tracking-[0.15em] mb-3">
                        Legales
                      </p>
                      <LegalesList />
                    </div>
                  )}
                </>
              ) : (
                <div className="pt-4 animate-fadeIn">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-2 text-white/60 text-sm mb-6 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Atrás
                  </button>

                  <p className="text-white text-2xl font-semibold mb-5">
                    {currentNode?.text}
                  </p>

                  <nav className="flex flex-col gap-1">
                    {currentChildren.map((child, j) => {
                      const childWithChildren = hasChildren(child as NavChild);
                      return childWithChildren ? (
                        <div
                          key={j}
                          className="flex items-center justify-between"
                        >
                          <a
                            href={child.url || "#"}
                            onClick={closeMenu}
                            className="text-white text-lg py-2.5 hover:text-white/80 transition-colors"
                          >
                            {child.text}
                          </a>
                          <button
                            onClick={() => drillInto(j)}
                            className="p-2 -mr-2 text-white/70 hover:text-white transition-colors"
                            aria-label={`Ver opciones de ${child.text}`}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <a
                          key={j}
                          href={child.url || "#"}
                          onClick={closeMenu}
                          className="text-white text-lg py-2.5 hover:text-white/80 transition-colors"
                        >
                          {child.text}
                        </a>
                      );
                    })}
                  </nav>

                  {siblingLinks.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <nav className="flex flex-col gap-1">
                        {siblingLinks.map((link, i) => (
                          <a
                            key={i}
                            href={link.url || "#"}
                            onClick={closeMenu}
                            className="text-white text-lg py-2.5 hover:text-white/80 transition-colors"
                          >
                            {link.text}
                          </a>
                        ))}
                      </nav>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Social links ── */}
            <div className="flex items-center gap-4 mt-auto pt-8">
              <p className="text-white/50 text-xs">Síguenos</p>
              {socialLinks.map((item, i) => {
                const Icon = iconMap[item.platform || ""];
                if (!Icon) return null;
                return (
                  <a
                    key={i}
                    href={item.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.platform || ""}
                    className="text-white hover:text-white/70 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Spacer (top bar h-14 56px + main bar h-16 64px) ═══ */}
      <div className="h-[120px]" />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .nav-link-hover {
          text-decoration: none;
          background-image: linear-gradient(currentColor, currentColor);
          background-size: 0% 2px;
          background-position: left bottom 2px;
          background-repeat: no-repeat;
          transition: background-size 0.3s ease;
        }
        .nav-link-hover:hover,
        .nav-link-active {
          background-size: 100% 2px;
        }
      `}</style>
    </>
  );
}
