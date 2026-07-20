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
  /** Solo la home activa el logo grande animado del hero (SPEC 39). */
  heroLogo?: boolean;
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

interface SecondaryNavItem {
  text?: string | null;
  url?: string | null;
  external?: boolean | null;
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

/* Logo animado del hero (SPEC 39) — solo en la home y en desktop. El logo del
   header arranca grande y desplazado hacia abajo (sobre el texto del hero) y,
   con el scroll, vuelve de forma continua a su tamaño/posición nativos.
   Para no perder nitidez se anima el `height` del SVG (se re-rasteriza nítido a
   cada tamaño) en vez de estirar con scale una textura pequeña; el transform
   solo desplaza en Y. Valores afinados visualmente. */
const LOGO_TRAVEL_DISTANCE = 320; // px de scroll para ir de grande → normal
const LOGO_HEADER_H = 20; // altura en reposo del logo (= h-5 del header)
const LOGO_HERO_H = 64; // altura del logo grande sobre el hero
const LOGO_START_OFFSET_Y = 195; // px que el logo baja hacia el hero al tope
// El slot del logo está corrido por el hamburguesa (w-7 = 28px + gap md:gap-6 =
// 24px). El logo grande compensa este offset en X para alinearse con el h1.
const LOGO_SLOT_INDENT = 52;

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
  heroLogo = false,
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
  // Logo animado del hero (SPEC 39).
  const logoRef = useRef<HTMLImageElement>(null);
  const logoRaf = useRef<number | null>(null);
  const prefersReducedMotion = useRef(false);

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
  // Menú secundario (hamburguesa): drawer en desktop, grupo al pie en mobile.
  const secondaryNav = (headerConfig?.secondaryNav || []).filter(
    Boolean
  ) as SecondaryNavItem[];
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

  /* ── Logo animado del hero (SPEC 39) ── */
  // Interpola el tamaño/posición del logo del header según el scroll. Se aplica
  // directo al DOM (ref) para no re-renderizar React en cada frame de scroll.
  // Activo solo en home + desktop + sin reduced-motion; en el resto limpia el
  // transform y deja el logo en su estado nativo.
  const applyLogoTransform = useCallback(
    (currentY: number) => {
      const img = logoRef.current;
      if (!img) return;
      const active =
        heroLogo && !isMobile.current && !prefersReducedMotion.current;
      if (!active) {
        // Estado nativo del header (también lo que se ve en SSR / sin JS).
        img.style.height = `${LOGO_HEADER_H}px`;
        img.style.transform = "translateY(-50%)";
        return;
      }
      const progress = Math.min(
        Math.max(currentY / LOGO_TRAVEL_DISTANCE, 0),
        1
      );
      const inv = 1 - progress;
      const height = LOGO_HEADER_H + (LOGO_HERO_H - LOGO_HEADER_H) * inv;
      const offset = LOGO_START_OFFSET_Y * inv;
      // Se anima `height` (SVG nítido a cada tamaño); el transform baja en Y y,
      // sólo mientras está grande, corrige en X para alinear con el h1 (el slot
      // del logo está corrido por el hamburguesa — LOGO_SLOT_INDENT).
      img.style.height = `${height}px`;
      img.style.transform = `translateX(${-LOGO_SLOT_INDENT * inv}px) translateY(calc(-50% + ${offset}px))`;
    },
    [heroLogo]
  );

  // Programa una aplicación del transform del logo en el próximo frame.
  const scheduleLogoTransform = useCallback(() => {
    if (logoRaf.current != null) return;
    logoRaf.current = requestAnimationFrame(() => {
      logoRaf.current = null;
      applyLogoTransform(window.scrollY);
    });
  }, [applyLogoTransform]);

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
    scheduleLogoTransform();
  }, [menuOpen, scheduleLogoTransform]);

  const handleResize = useCallback(() => {
    const nowMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (nowMobile !== isMobile.current) {
      // Crossed the breakpoint — reset navigation state to avoid residue.
      resetNav();
    }
    isMobile.current = nowMobile;
    // Recalcula el logo: al cruzar a mobile se limpia el transform, al volver a
    // desktop se restablece según el scroll actual.
    applyLogoTransform(window.scrollY);
  }, [resetNav, applyLogoTransform]);

  useEffect(() => {
    handleResize();
    // Initialize scroll state on mount so a reload mid-page shows the correct
    // header background immediately.
    handleScroll();
    // El h1 del hero reflowa cuando carga el web font; si el logo se posicionó
    // antes, queda desalineado/encima un instante. Reaplicar al terminar las
    // fuentes (y en el siguiente frame) evita ese flash en la primera carga.
    requestAnimationFrame(() => scheduleLogoTransform());
    document.fonts?.ready
      ?.then(() => scheduleLogoTransform())
      .catch(() => {});
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (logoRaf.current != null) cancelAnimationFrame(logoRaf.current);
    };
  }, [handleScroll, handleResize, scheduleLogoTransform]);

  // Detecta prefers-reduced-motion: si está activo, el logo se queda en su
  // estado nativo (sin animación de vuelo).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion.current = mq.matches;
    const onChange = () => {
      prefersReducedMotion.current = mq.matches;
      applyLogoTransform(window.scrollY);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [applyLogoTransform]);

  // Reaplica el transform cuando el logo se (re)monta o cambian sus condiciones
  // (el logo se desmonta con el menú abierto; heroLogo depende de la página).
  useEffect(() => {
    applyLogoTransform(window.scrollY);
  }, [applyLogoTransform, menuOpen]);

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
  // Con el menú abierto el fondo va morado en mobile (overlay full-screen); en
  // desktop el menú es un drawer lateral, así que la barra queda transparente
  // (sólo el drawer es morado) para no ensuciar con un morado full-width.
  const headerBg = menuOpen
    ? "bg-brand-purple lg:bg-transparent"
    : scrolled
    ? isLight
      ? "bg-white/80 backdrop-blur-md border-b border-black/5"
      : "bg-greyscale-darkest/80 backdrop-blur-md"
    : "bg-transparent";

  // Top bar has a SOLID background so it stays readable over hero pages, where
  // the main bar is transparent to overlap the hero but the top bar sits above
  // the overlap zone. Slightly lighter than the main bar for a two-tone look.
  // When the menu is open it goes transparent so the purple overlay shows.
  // Al abrir: transparente en mobile (el overlay morado lo cubre). En desktop el
  // menú es un drawer lateral, así que la topbar mantiene su fondo oscuro — si
  // fuera transparente, en la franja superior (donde aún no hay hero detrás)
  // asomaría el blanco del body.
  const topBarBg = menuOpen
    ? "bg-transparent lg:bg-[#171717]"
    : controlsDark
    ? "bg-neutral-100 border-b border-black/5"
    : "bg-[#171717]";

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

            {/* Logo — hidden while the menu is open (reads poorly next to "Cerrar").
                En home desktop arranca grande sobre el hero y vuelve a este slot
                con el scroll (SPEC 39); el transform se aplica vía logoRef. */}
            {!menuOpen && (
              <a
                href="/"
                className="relative z-50 inline-block h-5 w-[140px]"
                aria-label="Fiberlux - Inicio"
              >
                <img
                  ref={logoRef}
                  src={logoSrc}
                  alt="Fiberlux"
                  className={`absolute left-0 top-1/2 w-auto max-w-none will-change-transform ${logoFilter}`}
                  style={{
                    height: `${LOGO_HEADER_H}px`,
                    transform: "translateY(-50%)",
                  }}
                />
              </a>
            )}
          </div>

          {/* Right: Desktop inline navbar (hover reveal). En desktop el menú es
              un drawer lateral angosto, así que el navbar sigue visible al
              abrirlo; en mobile (overlay full-screen) sí se desvanece. */}
          <nav
            className={`hidden lg:flex items-center gap-7 transition-opacity duration-200 ${
              menuOpen
                ? "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"
                : "opacity-100"
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
          fixed top-0 left-0 right-0 z-[70] lg:z-[100]
          bg-brand-purple
          h-screen
          lg:right-auto lg:left-0 lg:w-[440px] lg:max-w-[92vw]
          lg:rounded-r-[40px] lg:shadow-2xl
          transition-all duration-500
          ${
            menuOpen
              ? "translate-y-0 lg:translate-x-0 opacity-100 visible ease-[cubic-bezier(0.16,1,0.3,1)]"
              : "-translate-y-full lg:translate-y-0 lg:-translate-x-full opacity-0 invisible ease-[cubic-bezier(0.7,0,0.84,0)]"
          }
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="h-full overflow-y-auto pt-[136px] lg:pt-10 pb-10 flex flex-col">
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
                        <button
                          key={i}
                          onClick={() => drillInto(i)}
                          className="flex items-center justify-between w-full text-left text-white text-[29px] leading-[40px] font-semibold hover:text-white/80 transition-colors"
                          aria-label={`Ver opciones de ${link.text}`}
                        >
                          <span>{link.text}</span>
                          <span className="p-2 -mr-2 text-white/70">
                            <ChevronRight className="w-6 h-6" />
                          </span>
                        </button>
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

                  {/* Menú secundario (Formas de pago, Fiberlux App, …) bajo un
                      divisor, separado del nav principal. */}
                  {secondaryNav.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/20">
                      <nav
                        className="flex flex-col gap-1"
                        aria-label="Menú secundario"
                      >
                        {secondaryNav.map((item, i) => (
                          <a
                            key={i}
                            href={item.url || "#"}
                            onClick={closeMenu}
                            {...(item.external
                              ? { target: "_blank", rel: "noopener noreferrer" }
                              : {})}
                            className="text-white text-lg py-2.5 hover:text-white/80 transition-colors"
                          >
                            {item.text}
                          </a>
                        ))}
                      </nav>
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

                  {currentNode?.url ? (
                    <a
                      href={currentNode.url}
                      onClick={closeMenu}
                      className="inline-flex items-center gap-2 text-white text-2xl font-semibold mb-5 hover:text-white/80 transition-colors"
                    >
                      {currentNode.text}
                      <ChevronRight className="w-4 h-4 text-white/60" />
                    </a>
                  ) : (
                    <p className="text-white text-2xl font-semibold mb-5">
                      {currentNode?.text}
                    </p>
                  )}

                  {/* Ítems de la categoría: indentados + guía vertical a la
                      izquierda para que se lea que están dentro del padre. */}
                  <nav className="flex flex-col gap-1 pl-4 ml-1 border-l-2 border-white/15">
                    {currentChildren.map((child, j) => {
                      const childWithChildren = hasChildren(child as NavChild);
                      return childWithChildren ? (
                        <button
                          key={j}
                          onClick={() => drillInto(j)}
                          className="flex items-center justify-between w-full text-left text-white text-lg py-2.5 hover:text-white/80 transition-colors"
                          aria-label={`Ver opciones de ${child.text}`}
                        >
                          <span>{child.text}</span>
                          <span className="p-2 -mr-2 text-white/70">
                            <ChevronRight className="w-5 h-5" />
                          </span>
                        </button>
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

            {/* ── DESKTOP DRAWER — menú secundario (hamburguesa) ──
                Autocontenido: logo + cerrar + ítems, todo alineado a la
                izquierda con el mismo contenedor. El drawer cubre el header
                (z-100) en desktop, así que trae su propio cerrar y logo. */}
            <div className="hidden lg:flex flex-col flex-1">
              {/* Cerrar (alineado con los ítems) */}
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Cerrar menú"
                className="flex items-center gap-3 text-white text-sm font-medium mb-8 self-start"
              >
                <span className="block w-7 h-[2px] bg-white rounded-full" />
                Cerrar
              </button>

              {/* Logo dentro del menú */}
              <a
                href="/"
                onClick={closeMenu}
                aria-label="Fiberlux - Inicio"
                className="self-start mb-12"
              >
                <img
                  src={logoSrc}
                  alt="Fiberlux"
                  className="h-6 w-auto brightness-0 invert"
                />
              </a>

              <nav
                className="flex flex-col gap-2"
                aria-label="Menú secundario"
              >
                {secondaryNav.map((item, i) => (
                  <a
                    key={i}
                    href={item.url || "#"}
                    onClick={closeMenu}
                    {...(item.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="text-white text-[34px] leading-[52px] font-semibold hover:text-white/80 transition-colors"
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
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
