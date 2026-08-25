import type { ReactNode } from "react";

/**
 * Hero de foto a sangre — SPEC 104.
 *
 * Layout compartido por los heroes de Nosotros y Soporte técnico: fotografía a
 * sangre con el sujeto a la derecha, velo oscuro que baja hacia la izquierda
 * (desktop) o hacia abajo (mobile) para dar contraste al texto, y una capa
 * opcional (`overlay`) donde vive la animación SVG de cada página.
 *
 * El `-mt-16` compensa el header fijo transparente, igual que los heroes previos.
 */

interface PhotoHeroProps {
  image?: string | null;
  /** Posición del encuadre en desktop / mobile (object-position). */
  focus?: string;
  focusMobile?: string;
  /** Capa de animación que se pinta entre la foto y el velo. */
  overlay?: ReactNode;
  breadcrumb: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Contenido extra bajo el subtítulo (CTAs, etc.). */
  children?: ReactNode;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function withBase(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function PhotoHero({
  image,
  focus = "72% 50%",
  focusMobile = "68% 40%",
  overlay,
  breadcrumb,
  title,
  subtitle,
  children,
}: PhotoHeroProps) {
  return (
    <section className="photo-hero relative -mt-16 overflow-hidden bg-greyscale-darkest">
      {/* Foto a sangre. */}
      {image && (
        <img
          src={withBase(image)}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="photo-hero__img absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Capa de animación (SVG) de la página. */}
      {overlay && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
          {overlay}
        </div>
      )}

      {/* Velo: horizontal en desktop, vertical en mobile. */}
      <div aria-hidden="true" className="photo-hero__veil pointer-events-none absolute inset-0 z-[2]" />

      {/* Contenido. */}
      <div className="photo-hero__inner relative z-10 site-container flex items-end pb-14 pt-32 md:items-center md:pb-20 md:pt-36 lg:pb-24">
        <div className="w-full max-w-[640px]" data-reveal="up">
          <nav aria-label="Breadcrumb" className="mb-5 md:mb-7">
            {breadcrumb}
          </nav>
          {title}
          {subtitle}
          {children}
        </div>
      </div>

      <style>{`
        .photo-hero {
          min-height: 640px;
          height: 78svh;
          max-height: 860px;
        }
        .photo-hero__inner {
          min-height: inherit;
          height: 100%;
        }
        .photo-hero__img {
          object-position: ${focusMobile};
        }
        /* Mobile: la foto se lee arriba y el texto se apoya en la base. */
        .photo-hero__veil {
          background:
            linear-gradient(
              to top,
              rgba(10, 10, 10, 0.97) 0%,
              rgba(10, 10, 10, 0.92) 26%,
              rgba(10, 10, 10, 0.62) 48%,
              rgba(10, 10, 10, 0.28) 68%,
              rgba(10, 10, 10, 0.08) 86%,
              rgba(10, 10, 10, 0) 100%
            ),
            linear-gradient(to bottom, rgba(10, 10, 10, 0.55) 0%, rgba(10, 10, 10, 0) 30%);
        }
        @media (min-width: 768px) {
          .photo-hero {
            min-height: 560px;
            height: 88svh;
          }
          .photo-hero__img {
            object-position: ${focus};
          }
          .photo-hero__veil {
            background:
              linear-gradient(
                90deg,
                rgba(10, 10, 10, 0.97) 0%,
                rgba(10, 10, 10, 0.92) 26%,
                rgba(10, 10, 10, 0.72) 44%,
                rgba(10, 10, 10, 0.38) 62%,
                rgba(10, 10, 10, 0.12) 80%,
                rgba(10, 10, 10, 0) 100%
              ),
              linear-gradient(to bottom, rgba(10, 10, 10, 0.5) 0%, rgba(10, 10, 10, 0) 22%),
              linear-gradient(to top, rgba(10, 10, 10, 0.75) 0%, rgba(10, 10, 10, 0) 30%);
          }
        }
      `}</style>
    </section>
  );
}
