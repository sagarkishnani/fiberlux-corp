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
}

interface NavLink {
  text?: string | null;
  url?: string | null;
  children?: (NavChild | null)[] | null;
}

interface NavChild {
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
const MOBILE_BREAKPOINT = 768;

/* ── Service category groups ── */
const categoryGroups = [
  {
    name: "Infraestructura Cloud",
    items: [
      { text: "Hosting", url: "/servicios/hosting" },
      { text: "Housing", url: "/servicios/housing" },
      { text: "SaaS", url: "/servicios/saas" },
      {
        text: "Continuidad de negocio",
        url: "/servicios/continuidad-de-negocio",
      },
    ],
  },
  {
    name: "Conectividad",
    items: [
      { text: "Internet Dedicado", url: "/servicios/internet-dedicado" },
      { text: "Fibra Oscura", url: "/servicios/fibra-oscura" },
      { text: "Wi-Fi Gestionado", url: "/servicios/wifi-gestionado" },
      { text: "Transmisión de Datos", url: "/servicios/transmision-de-datos" },
    ],
  },
  {
    name: "Seguridad",
    items: [
      {
        text: "Ciberseguridad Endpoints",
        url: "/servicios/ciberseguridad-endpoints",
      },
      {
        text: "Ciberseguridad Perímetro",
        url: "/servicios/ciberseguridad-perimetro",
      },
      { text: "Video Vigilancia", url: "/servicios/vsaas" },
    ],
  },
  {
    name: "Comunicaciones",
    items: [
      { text: "Telefonía IP", url: "/servicios/telefonia-ip" },
      { text: "Housing", url: "/servicios/housing" },
      { text: "SaaS", url: "/servicios/saas" },
    ],
  },
];

export default function HeaderReact({
  query,
  variables,
  data: initialData,
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
  const [showServices, setShowServices] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const isMobile = useRef(false);

  /* ── Derived data ── */
  const logoSrc = headerConfig?.logo || DEFAULT_LOGO;
  const ctaText = headerConfig?.ctaText || "Paga tu recibo";
  const ctaUrl = headerConfig?.ctaUrl || "#";

  const allLinks = (nav?.links || []).filter(Boolean) as NavLink[];
  const mainLinks = allLinks.filter((l) => l.text !== "Inicio");
  const socialLinks = (footer?.social || []).filter(Boolean) as SocialItem[];

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
    isMobile.current = window.innerWidth < MOBILE_BREAKPOINT;
  }, []);

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
      setShowServices(false);
      setActiveCategory(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /* ── Handlers ── */
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => {
    setMenuOpen(false);
    setShowServices(false);
    setActiveCategory(null);
  };

  const handleLinkClick = (link: NavLink) => {
    if (link.children && link.children.length > 0) {
      setShowServices((prev) => !prev);
      setActiveCategory(null);
      return;
    }
    closeMenu();
  };

  const openCategory = (name: string) => setActiveCategory(name);
  const goBack = () => setActiveCategory(null);

  const activeCategoryData = activeCategory
    ? categoryGroups.find((g) => g.name === activeCategory)
    : null;

  /* ── Header background logic ── */
  const headerBg = menuOpen
    ? "bg-brand-purple"
    : scrolled
    ? "bg-greyscale-darkest/80 backdrop-blur-md"
    : "bg-transparent";

  return (
    <>
      {/* ═══ HEADER BAR ═══ */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-300
          ${headerBg}
          ${headerVisible ? "translate-y-0" : "-translate-y-full"}
        `}
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-16 h-16 flex items-center justify-between relative">
          {/* Left: Hamburger / Close */}
          <button
            onClick={toggleMenu}
            className="flex items-center gap-3 text-white text-sm font-medium z-50"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            <div className="w-7 h-3.5 relative flex flex-col justify-between">
              <span
                className={`
                block h-[2px] bg-white rounded-full transition-all duration-300 origin-center
                ${menuOpen ? "rotate-0 translate-y-[5.5px] w-7 opacity-100" : "w-7"}
              `}
              />
              <span
                className={`
                block h-[2px] bg-white rounded-full transition-all duration-300
                ${menuOpen ? "opacity-0 w-0" : "w-7 opacity-100"}
              `}
              />
              <span
                className={`
                block h-[2px] bg-white rounded-full transition-all duration-300 origin-center
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
              className="h-5 w-auto brightness-0 invert"
            />
          </a>

          {/* Right: CTA (desktop) */}
          {/* <a
            href={ctaUrl}
            className="hidden md:flex items-center gap-1.5 text-white text-sm font-medium hover:text-brand-purple-light transition-colors z-50"
            target="_blank"
            rel="noopener noreferrer"
          >
            {ctaText}
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 17L17 7M17 7H7M17 7v10"
              />
            </svg>
          </a> */}
        </div>
      </header>

      {/* ═══ MENU OVERLAY ═══ */}
      <div
        className={`
          fixed top-0 left-0 right-0 z-40
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
              {/* Left: Main navigation — aligned top */}
              <nav
                className="flex flex-col justify-start pt-16 gap-1 items-start"
                aria-label="Navegación principal"
              >
                {mainLinks.map((link, i) => {
                  const hasChildren =
                    link.children && link.children.length > 0;
                  const isActive = hasChildren && showServices;

                  if (hasChildren) {
                    return (
                      <div
                        key={i}
                        onMouseEnter={() => {
                          setShowServices(true);
                          setActiveCategory(null);
                        }}
                        className="inline-block"
                      >
                        <a
                          href={link.url || "#"}
                          onClick={(e) => {
                            e.preventDefault();
                            handleLinkClick(link);
                          }}
                          className={`
                            inline text-[48px] leading-[64px] font-semibold transition-all
                            nav-link-hover
                            ${isActive ? "nav-link-active" : ""}
                          `}
                          data-tina-field={tinaField(link as any, "text")}
                        >
                          {link.text}
                        </a>
                      </div>
                    );
                  }

                  return (
                    <a
                      key={i}
                      href={link.url || "#"}
                      onClick={closeMenu}
                      onMouseEnter={() => {
                        setShowServices(false);
                        setActiveCategory(null);
                      }}
                      className="inline text-[48px] leading-[64px] font-semibold text-white transition-all nav-link-hover"
                      data-tina-field={tinaField(link as any, "text")}
                    >
                      {link.text}
                    </a>
                  );
                })}
              </nav>

              {/* Right: Service categories — aligned top with nav */}
              <div
                className={`
                flex flex-col justify-start pt-16 transition-all duration-300
                ${
                  showServices
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-8 pointer-events-none"
                }
              `}
              >
                {!activeCategory ? (
                  <nav
                    className="flex flex-col gap-4"
                    aria-label="Categorías de servicios"
                  >
                    {categoryGroups.map((cat, i) => (
                      <button
                        key={i}
                        onClick={() => openCategory(cat.name)}
                        className="flex items-center justify-between text-white text-base hover:text-white/80 transition-colors group text-left"
                      >
                        <span>{cat.name}</span>
                        <svg
                          className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    ))}
                  </nav>
                ) : (
                  <div className="animate-fadeIn">
                    <button
                      onClick={goBack}
                      className="flex items-center gap-2 text-white/60 text-sm mb-4 hover:text-white transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Atrás
                    </button>
                    <h3 className="text-white text-2xl font-bold mb-6">
                      {activeCategory}
                    </h3>
                    <nav
                      className="flex flex-col gap-3"
                      aria-label={`Servicios de ${activeCategory}`}
                    >
                      {activeCategoryData?.items.map((item, j) => (
                        <a
                          key={j}
                          href={item.url}
                          onClick={closeMenu}
                          className="text-white/80 text-base hover:text-white transition-colors"
                        >
                          {item.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                )}
              </div>
            </div>

            {/* ── MOBILE MENU ── */}
            <div className="flex md:hidden flex-col flex-1">
              {!showServices && !activeCategory ? (
                <>
                  <nav
                    className="flex flex-col gap-1 mb-auto pt-4"
                    aria-label="Navegación principal"
                  >
                    {mainLinks.map((link, i) => {
                      const hasChildren =
                        link.children && link.children.length > 0;
                      return hasChildren ? (
                        <button
                          key={i}
                          onClick={() => setShowServices(true)}
                          className="text-left text-white text-[32px] leading-[44px] font-semibold hover:text-white/80 transition-colors"
                        >
                          {link.text}
                        </button>
                      ) : (
                        <a
                          key={i}
                          href={link.url || "#"}
                          onClick={closeMenu}
                          className="text-white text-[32px] leading-[44px] font-semibold hover:text-white/80 transition-colors"
                        >
                          {link.text}
                        </a>
                      );
                    })}
                  </nav>

                  <a
                    href={ctaUrl}
                    className="mt-6 inline-flex items-center justify-center border border-white text-white rounded-full px-6 py-2.5 text-sm font-medium self-start hover:bg-white hover:text-brand-purple transition-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {ctaText}
                  </a>
                </>
              ) : !activeCategory ? (
                <div className="pt-4 animate-fadeIn">
                  <button
                    onClick={() => setShowServices(false)}
                    className="flex items-center gap-2 text-white/60 text-sm mb-6 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Atrás
                  </button>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-4">
                    Servicios
                  </p>
                  <nav className="flex flex-col gap-1">
                    {categoryGroups.map((cat, i) => (
                      <button
                        key={i}
                        onClick={() => openCategory(cat.name)}
                        className="flex items-center justify-between text-white text-lg py-2.5 hover:text-white/80 transition-colors text-left"
                      >
                        <span>{cat.name}</span>
                        <svg
                          className="w-4 h-4 opacity-60"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    ))}
                  </nav>
                </div>
              ) : (
                <div className="pt-4 animate-fadeIn">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-2 text-white/60 text-sm mb-4 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Atrás
                  </button>
                  <h3 className="text-white text-xl font-bold mb-6">
                    {activeCategory}
                  </h3>
                  <nav className="flex flex-col gap-1">
                    {activeCategoryData?.items.map((item, j) => (
                      <a
                        key={j}
                        href={item.url}
                        onClick={closeMenu}
                        className="text-white/80 text-base py-2 hover:text-white transition-colors"
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
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