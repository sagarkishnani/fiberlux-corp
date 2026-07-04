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
const MOBILE_BREAKPOINT = 768;

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

const hasChildren = (item?: NavLink | NavChild | null): boolean =>
  !!item?.children && item.children.filter(Boolean).length > 0;

export default function HeaderReact({
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
  const headerConfig = (tinaGlobal as any)?.header;

  /* ── State ── */
  const [menuOpen, setMenuOpen] = useState(false);
  // Desktop: index of the top-level item revealing its submenu (or null).
  const [desktopActive, setDesktopActive] = useState<number | null>(null);
  // Desktop: index of the level-2 item whose solutions (level-3) are expanded.
  const [desktopSubActive, setDesktopSubActive] = useState<number | null>(null);
  // Mobile: drill path of indices ([] = top level, [i] = children of link i, …).
  const [mobilePath, setMobilePath] = useState<number[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const isMobile = useRef(false);

  /* ── Derived data ── */
  const logoSrc = headerConfig?.logo || DEFAULT_LOGO;

  // Light theme: dark controls, but only while the menu is closed (the open
  // menu overlay is purple, so controls go white in both themes).
  const isLight = theme === "light";
  const controlsDark = isLight && !menuOpen;
  const barColor = controlsDark ? "bg-greyscale-darkest" : "bg-white";
  const controlText = controlsDark ? "text-greyscale-darkest" : "text-white";
  const logoFilter = controlsDark ? "brightness-0" : "brightness-0 invert";

  const mainLinks = ((nav?.links || []).filter(Boolean) as NavLink[]).filter(
    (l) => l.text !== "Inicio"
  );
  const socialLinks = (footer?.social || []).filter(Boolean) as SocialItem[];

  /* ── Mobile drill helpers ── */
  const resetNav = useCallback(() => {
    setDesktopActive(null);
    setDesktopSubActive(null);
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

  /* ── Mobile drill data ── */
  const depth = mobilePath.length;
  const { node: currentNode, children: currentChildren } =
    nodeAtPath(mobilePath);
  // At depth 1 (a top-level parent is open) show the other top-level items.
  const siblingLinks =
    depth === 1 ? mainLinks.filter((_, i) => i !== mobilePath[0]) : [];

  return (
    <>
      {/* ═══ HEADER BAR ═══ */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-[80]
          transition-all duration-300
          ${headerBg}
          ${headerVisible ? "translate-y-0" : "-translate-y-full"}
        `}
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-16 h-16 flex items-center justify-between relative">
          {/* Left: Hamburger / Close */}
          <button
            onClick={toggleMenu}
            className={`flex items-center gap-3 ${controlText} text-sm font-medium z-50`}
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

          {/* Center: Logo */}
          <a
            href="/"
            className="absolute left-1/2 -translate-x-1/2 z-50"
            aria-label="Fiberlux - Inicio"
          >
            <img
              src={logoSrc}
              alt="Fiberlux"
              className={`h-5 w-auto ${logoFilter}`}
            />
          </a>
        </div>
      </header>

      {/* ═══ MENU OVERLAY ═══ */}
      <div
        className={`
          fixed top-0 left-0 right-0 z-[70]
          bg-brand-purple
          h-screen md:h-[calc(100vh-80px)]
          md:rounded-b-[48px]
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
        <div className="h-full overflow-y-auto pt-20 pb-10 flex flex-col">
          <div className="max-w-[1440px] mx-auto px-6 md:px-16 w-full flex-1 flex flex-col">
            {/* ── DESKTOP MENU — two column grid ── */}
            <div className="hidden md:grid md:grid-cols-[1fr_1fr] flex-1 gap-16">
              {/* Left: Main navigation */}
              <nav
                className="flex flex-col justify-start pt-16 gap-1 items-start"
                aria-label="Navegación principal"
              >
                {mainLinks.map((link, i) => {
                  const withChildren = hasChildren(link);
                  const isActive = withChildren && desktopActive === i;

                  return (
                    <a
                      key={i}
                      href={link.url || "#"}
                      onClick={withChildren ? undefined : closeMenu}
                      onMouseEnter={() => {
                        setDesktopActive(withChildren ? i : null);
                        setDesktopSubActive(null);
                      }}
                      className={`
                        inline text-[48px] leading-[64px] font-semibold text-white transition-all
                        nav-link-hover
                        ${isActive ? "nav-link-active" : ""}
                      `}
                      data-tina-field={tinaField(link as any, "text")}
                    >
                      {link.text}
                    </a>
                  );
                })}
              </nav>

              {/* Right: Submenu of the hovered item (level 2) */}
              <div
                className={`
                flex flex-col justify-start pt-16 transition-all duration-300
                ${
                  desktopActive !== null
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-8 pointer-events-none"
                }
              `}
              >
                <nav
                  className="flex flex-col gap-4"
                  aria-label="Submenú"
                  key={desktopActive}
                >
                  {desktopActive !== null &&
                    ((mainLinks[desktopActive]?.children || []).filter(
                      Boolean
                    ) as NavChild[]).map((child, j) => {
                      const grandChildren = (child.children || []).filter(
                        Boolean
                      ) as NavGrandChild[];
                      const hasGrand = grandChildren.length > 0;
                      const subActive = desktopSubActive === j;

                      return (
                        <div
                          key={j}
                          className="animate-fadeIn"
                          onMouseEnter={() =>
                            setDesktopSubActive(hasGrand ? j : null)
                          }
                        >
                          <a
                            href={child.url || "#"}
                            onClick={closeMenu}
                            className="flex items-center justify-between gap-6 text-white text-lg hover:text-white/80 transition-colors group text-left"
                          >
                            <span>{child.text}</span>
                            <ChevronRight className="w-5 h-5 shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </a>
                          {hasGrand && (
                            <div
                              className={`grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                subActive
                                  ? "grid-rows-[1fr] opacity-100"
                                  : "grid-rows-[0fr] opacity-0"
                              }`}
                            >
                              <div className="overflow-hidden">
                                <ul className="mt-3 flex flex-col gap-1 pl-4 border-l border-white/20">
                                  {grandChildren.map((gc, k) => (
                                    <li key={k}>
                                      <a
                                        href={gc.url || "#"}
                                        onClick={closeMenu}
                                        className="block text-white/70 text-[15px] py-1 hover:text-white transition-colors"
                                      >
                                        {gc.text}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </nav>
              </div>
            </div>

            {/* ── MOBILE MENU ── */}
            <div className="flex md:hidden flex-col flex-1">
              {depth === 0 ? (
                <nav
                  className="flex flex-col gap-1 mb-auto pt-4"
                  aria-label="Navegación principal"
                >
                  {mainLinks.map((link, i) =>
                    hasChildren(link) ? (
                      <div key={i} className="flex items-center justify-between">
                        <a
                          href={link.url || "#"}
                          onClick={closeMenu}
                          className="text-white text-[32px] leading-[44px] font-semibold hover:text-white/80 transition-colors"
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
                        className="text-white text-[32px] leading-[44px] font-semibold hover:text-white/80 transition-colors"
                      >
                        {link.text}
                      </a>
                    )
                  )}
                </nav>
              ) : (
                <div className="pt-4 animate-fadeIn mb-auto">
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

                  {/* Sibling top-level items under a divider */}
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
            <div className="flex items-center gap-4 mt-auto pt-4">
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

      {/* ═══ Spacer ═══ */}
      <div className="h-16" />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .nav-link-hover {
          color: white;
          text-decoration: none;
          background-image: linear-gradient(white, white);
          background-size: 0% 2px;
          background-position: left bottom 4px;
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
