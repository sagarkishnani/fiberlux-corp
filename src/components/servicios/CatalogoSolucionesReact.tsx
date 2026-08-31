import { useEffect, useRef } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import { useSlider, type SliderEffect } from "../../hooks/useSlider";
import type { IconType } from "react-icons";
import {
  FaGlobe,
  FaServer,
  FaSatelliteDish,
  FaTowerBroadcast,
  FaNetworkWired,
  FaWaveSquare,
  FaCircleNodes,
  FaScaleBalanced,
  FaFireFlameCurved,
  FaLock,
  FaShieldVirus,
  FaEnvelopeOpenText,
  FaFingerprint,
  FaUserShield,
  FaShieldHalved,
  FaBoltLightning,
  FaEye,
  FaBug,
  FaCloud,
  FaDatabase,
  FaHardDrive,
  FaHeadset,
  FaWifi,
  FaVideo,
  FaPhoneVolume,
  FaUsers,
  FaEthernet,
  FaLaptop,
  FaSitemap,
  FaDisplay,
  FaWarehouse,
  FaBoxesStacked,
  FaShuffle,
  FaMicrochip,
  FaPlugCircleBolt,
  FaPhoneFlip,
  FaTv,
  FaHeadphones,
  FaLayerGroup,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa6";
import type {
  ServiceQuery,
  ServiceQueryVariables,
} from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";

interface CatalogoProps {
  query: string;
  variables: ServiceQueryVariables;
  data: ServiceQuery;
  autoplay?: boolean;
  intervalMs?: number;
  effect?: SliderEffect;
  locale?: Locale;
}

interface Item {
  icon?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
}

const ICONS: Record<string, IconType> = {
  internet: FaGlobe,
  disponibilidad: FaServer,
  satelital: FaSatelliteDish,
  radioenlace: FaTowerBroadcast,
  transmision: FaNetworkWired,
  "fibra-oscura": FaWaveSquare,
  "sd-wan": FaCircleNodes,
  balanceo: FaScaleBalanced,
  firewall: FaFireFlameCurved,
  vpn: FaLock,
  edr: FaShieldVirus,
  correo: FaEnvelopeOpenText,
  mfa: FaFingerprint,
  ztna: FaUserShield,
  waf: FaShieldHalved,
  ddos: FaBoltLightning,
  soc: FaEye,
  pentesting: FaBug,
  cloud: FaCloud,
  backup: FaDatabase,
  storage: FaHardDrive,
  "mesa-ayuda": FaHeadset,
  wifi: FaWifi,
  videovigilancia: FaVideo,
  comunicaciones: FaPhoneVolume,
  colaboracion: FaUsers,
  "redes-lan": FaEthernet,
  endpoints: FaLaptop,
  /* SPEC 109: íconos del portafolio nuevo. */
  segmentacion: FaSitemap,
  "escritorio-virtual": FaDisplay,
  autocontenido: FaWarehouse,
  nas: FaBoxesStacked,
  switch: FaShuffle,
  servidor: FaMicrochip,
  energia: FaPlugCircleBolt,
  pbx: FaPhoneFlip,
  pantalla: FaTv,
  "contact-center": FaHeadphones,
  generico: FaLayerGroup,
};

const PER_PAGE = 4;

/**
 * Ícono de la tarjeta. Son DOS copias apiladas dentro de una caja con
 * `overflow: hidden`: al hacer hover la pila sube exactamente el alto de una
 * casilla, así el ícono sale por arriba mientras su gemelo entra por abajo.
 * Es un relevo, no un parpadeo — de ahí que se lea limpio.
 */
function ItemIcon({ name }: { name?: string | null }) {
  const Icon = (name && ICONS[name]) || FaLayerGroup;
  const slot = (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center">
      <Icon size={20} />
    </span>
  );
  return (
    <span
      aria-hidden="true"
      className="catalog-icon relative z-10 inline-flex h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#96237A]/15 text-[#c65fac]"
    >
      <span className="catalog-icon__stack flex flex-col">
        {slot}
        {slot}
      </span>
    </span>
  );
}

export default function CatalogoSolucionesReact({
  query,
  variables,
  data: initialData,
  autoplay = true,
  intervalMs = 6000,
  effect = "none",
  locale = "es",
}: CatalogoProps) {
  const { data } = useTina<ServiceQuery>({ query, variables, data: initialData });

  const catalogo = data?.service?.catalogo;
  const items = (catalogo?.items || []).filter(Boolean) as Item[];
  const pageCount = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const enough = pageCount > 1;

  // Mobile: páginas de 4 en un carrusel Embla arrastrable con autoplay.
  // Hooks antes de cualquier return condicional.
  const slider = useSlider({
    align: "start",
    loop: false,
    autoplay: autoplay && enough,
    intervalMs,
    effect,
  });

  /* ── Luz que sigue al mouse ──
     Un solo listener delegado en la grilla en vez de uno por tarjeta, y las
     coordenadas se escriben como custom properties dentro de un rAF: el
     degradado es puro CSS, aquí no hay estado de React ni un render por
     movimiento del puntero. */
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || typeof window === "undefined" || !window.matchMedia) return;
    // Sin puntero fino no hay hover: en táctil la luz se quedaría pegada.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;

    const flush = () => {
      raf = 0;
      if (!pending) return;
      pending.el.style.setProperty("--mx", `${pending.x}px`);
      pending.el.style.setProperty("--my", `${pending.y}px`);
    };

    const onMove = (e: PointerEvent) => {
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>(".catalog-card");
      if (!card) return;
      const r = card.getBoundingClientRect();
      pending = { el: card, x: e.clientX - r.left, y: e.clientY - r.top };
      if (!raf) raf = requestAnimationFrame(flush);
    };

    grid.addEventListener("pointermove", onMove);
    return () => {
      grid.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (!catalogo || items.length === 0) return null;

  return (
    /* El padding inferior es generoso a propósito: esta sección se queda fija
       mientras el panel de testimonios sube y la tapa (SPEC 109), así que ese
       aire es lo único que separa la última fila de tarjetas del borde de la
       pantalla mientras está pinneada. */
    <section
      id="catalogo"
      className="bg-greyscale-darkest pt-16 pb-36 md:pt-24 md:pb-40 scroll-mt-24 mb-4"
    >
      <div className="site-container">
        {tField(catalogo as any, "title", locale) && (
          <h2
            className="text-[28px] md:text-[40px] leading-[1.2] font-medium text-greyscale-white text-center mb-10 md:mb-14"
            data-tina-field={tinaField(catalogo, "title")}
          >
            {tField(catalogo as any, "title", locale)}
          </h2>
        )}

        {/* ════ DESKTOP — grilla uniforme ════
            Todas las tarjetas miden lo mismo: `auto-rows-fr` iguala la altura
            de cada fila y `h-full` estira la tarjeta dentro de su celda. Ya no
            hay tarjeta destacada ni ancho configurable por item. */}
        <div
          ref={gridRef}
          className="hidden md:grid grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-4 lg:gap-5"
          data-reveal="up"
          data-reveal-stagger="0.06"
        >
          {items.map((item, i) => {
            const CardTag = item.url ? "a" : "div";
            const iTitle = tField(item as any, "title", locale);
            const iDesc = tField(item as any, "description", locale);

            return (
              <CardTag
                key={i}
                {...(item.url ? { href: item.url } : {})}
                className="catalog-card group relative flex h-full min-h-[268px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors duration-300 hover:border-[#96237A]/60 hover:bg-white/[0.05] lg:min-h-[300px] lg:p-8"
              >
                {/* Luz que sigue al cursor; su posición llega por --mx/--my. */}
                <span aria-hidden="true" className="catalog-spot" />

                {/* Cabecera: título a la izquierda, ícono a la derecha.
                    El título se topa en ~16ch para que los nombres largos
                    quiebren solos y no lleguen a rozar el ícono. */}
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <h3
                    className="max-w-[15ch] text-[18px] font-medium leading-snug text-greyscale-white lg:max-w-[17ch] lg:text-[20px]"
                    data-tina-field={tinaField(item as any, "title")}
                  >
                    {iTitle}
                  </h3>
                  <ItemIcon name={item.icon} />
                </div>

                {/* La descripción va anclada abajo (`mt-auto`): con títulos de
                    una o tres líneas, todas las descripciones siguen alineadas
                    entre sí a lo largo de la fila. */}
                {iDesc && (
                  <p
                    className="relative z-10 mt-auto pt-8 text-[15px] leading-[1.6] text-white/55"
                    data-tina-field={tinaField(item as any, "description")}
                  >
                    {iDesc}
                  </p>
                )}
              </CardTag>
            );
          })}
        </div>

        {/* ════ MOBILE — mismo chrome, en páginas de 4 arrastrables ════
            Aquí no hay hover (ni luz ni relevo de ícono) y en dos columnas la
            descripción quedaría cortada a media frase, así que la tarjeta se
            queda en ícono + título. */}
        <div className="md:hidden">
          <div
            ref={slider.viewportRef}
            className="catalogo-scroll overflow-hidden select-none"
            style={{ cursor: pageCount > 1 ? "grab" : "default" }}
          >
            <div className="flex gap-6">
              {Array.from({ length: pageCount }).map((_, pi) => {
                const pageItems = items.slice(pi * PER_PAGE, pi * PER_PAGE + PER_PAGE);
                return (
                  <div
                    key={pi}
                    /* `auto-rows-min` + `content-start`, NO `auto-rows-fr`: las
                       páginas del carrusel son ítems flex y todas miden lo que
                       la más alta, así que con filas `fr` la última página —la
                       que suele traer 2 tarjetas en vez de 4— repartía ese alto
                       entre una sola fila y las tarjetas salían estiradas (obs.
                       cliente). Ahora cada fila mide su contenido y `h-full`
                       sigue igualando las dos tarjetas de una misma fila; el
                       `minmax` le pone un piso común a todas las filas para que
                       una de títulos de una línea no se lea más baja que la de
                       al lado. */
                    className="catalogo-page shrink-0 w-full grid grid-cols-2 [grid-auto-rows:minmax(164px,auto)] content-start gap-3"
                  >
                    {pageItems.map((item, i) => {
                      const CardTag = item.url ? "a" : "div";
                      return (
                        <CardTag
                          key={i}
                          {...(item.url ? { href: item.url } : {})}
                          className="catalog-card flex h-full min-h-[150px] flex-col items-start rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                          draggable={false}
                        >
                          <ItemIcon name={item.icon} />
                          <h3 className="relative z-10 mt-4 text-[15px] font-medium leading-snug text-greyscale-white">
                            {tField(item as any, "title", locale)}
                          </h3>
                        </CardTag>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                aria-label="Anteriores"
                disabled={!slider.canPrev}
                onClick={slider.prev}
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  slider.canPrev
                    ? "bg-[#96237A] text-white hover:bg-[#650F50]"
                    : "bg-[#3B0E30] text-white/30 cursor-default"
                }`}
              >
                <FaChevronLeft size={14} />
              </button>
              <span className="text-caption-sm text-greyscale-light tabular-nums">
                {slider.activeIndex + 1} / {pageCount}
              </span>
              <button
                type="button"
                aria-label="Siguientes"
                disabled={!slider.canNext}
                onClick={slider.next}
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  slider.canNext
                    ? "bg-[#96237A] text-white hover:bg-[#650F50]"
                    : "bg-[#3B0E30] text-white/30 cursor-default"
                }`}
              >
                <FaChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .catalogo-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }
        .catalogo-scroll::-webkit-scrollbar { display: none; }
        /* Luz que sigue al cursor dentro de la tarjeta. El degradado se
           recoloca solo: --mx/--my las escribe el listener de la grilla, y el
           50% por defecto deja la luz centrada antes del primer movimiento. */
        .catalog-spot {
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: 0;
          transition: opacity .4s ease-out;
          background: radial-gradient(
            340px circle at var(--mx, 50%) var(--my, 50%),
            rgba(210, 70, 172, 0.50) 0%,
            rgba(160, 40, 130, 0.26) 32%,
            rgba(150, 35, 122, 0.08) 55%,
            rgba(150, 35, 122, 0) 75%
          );
        }
        .catalog-card:hover .catalog-spot,
        .catalog-card:focus-visible .catalog-spot { opacity: 1; }

        /* Relevo del ícono: la pila sube el alto exacto de una casilla (44px),
           así el segundo ícono queda encuadrado igual que el primero. */
        .catalog-icon__stack {
          transition: transform .5s cubic-bezier(.22, .61, .36, 1);
        }
        .catalog-card:hover .catalog-icon__stack,
        .catalog-card:focus-visible .catalog-icon__stack {
          transform: translateY(-44px);
        }
        .catalog-icon {
          transition: background-color .4s ease-out, color .4s ease-out;
        }
        .catalog-card:hover .catalog-icon {
          background-color: rgba(150, 35, 122, 0.28);
          color: #e78fd0;
        }

        @media (prefers-reduced-motion: reduce) {
          .catalog-card,
          .catalog-spot,
          .catalog-icon,
          .catalog-icon__stack { transition-duration: 0.01ms !important; }
          .catalog-card:hover .catalog-icon__stack { transform: none; }
          .catalog-spot { display: none; }
        }
      `}</style>
    </section>
  );
}
