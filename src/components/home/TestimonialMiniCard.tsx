import { mediaUrl } from "../../utils/mediaUrl";

/**
 * Tarjeta compacta de testimonio del bloque unificado del home.
 *
 * A diferencia de `shared/TestimonialCard` (tarjeta ancha con el borde notched
 * en SVG, una por vista), esta es un rectángulo simple pensado para verse de a
 * tres en desktop. La del centro va `active`: degradé de marca y texto blanco.
 *
 * El logo va siempre dentro de un chip blanco porque los logos de clientes
 * traen colores propios (azules, negros) que no se leen sobre el degradé.
 */

/**
 * Degradé de la tarjeta destacada, tomado del Figma del cliente: magenta de
 * marca arriba-izquierda cayendo a berenjena casi negra abajo-derecha.
 * Stops: #96237A 0% → #650F50 46% → #2A0821 100%, eje ~165°.
 */
const ACTIVE_GRADIENT =
  "linear-gradient(165deg, #96237A 0%, #650F50 46%, #2A0821 100%)";

interface TestimonialMiniCardProps {
  quote: string;
  description?: string | null;
  name: string;
  role: string;
  company: string;
  logo?: string | null;
  active?: boolean;
}

export default function TestimonialMiniCard({
  quote,
  description,
  name,
  role,
  company,
  logo,
  active = false,
}: TestimonialMiniCardProps) {
  const logoSrc = mediaUrl(logo);

  return (
    <article
      className={[
        "flex h-full min-h-[380px] flex-col rounded-2xl p-6 transition-colors duration-300 lg:min-h-[470px] lg:p-8",
        active
          ? "text-white shadow-[0_22px_50px_-18px_rgba(59,14,48,0.6)]"
          : "bg-white text-greyscale-darkest shadow-[0_18px_44px_-18px_rgba(59,14,48,0.4)]",
      ].join(" ")}
      style={active ? { backgroundImage: ACTIVE_GRADIENT } : undefined}
    >
      {/* Logo de la empresa (chip blanco). Fallback: nombre como texto. */}
      <div className="mb-6">
        {logoSrc ? (
          <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5">
            <img
              src={logoSrc}
              alt={company}
              className="h-6 w-auto max-w-[150px] object-contain"
              draggable={false}
            />
          </span>
        ) : (
          <span
            className={`text-body-sm font-semibold ${active ? "text-white" : "text-brand-purple"}`}
          >
            {company}
          </span>
        )}
      </div>

      <h3 className="text-subtitle-sm font-medium leading-snug">{quote}</h3>

      {description && (
        <p
          className={`mt-3 text-body-sm leading-relaxed ${
            active ? "text-white/80" : "text-brand-gray-dark"
          }`}
        >
          {description}
        </p>
      )}

      {/* Autor al pie, separado por una línea fina (mockup del cliente).
          El `pt-7` garantiza aire entre el texto y la línea: cuando el
          testimonio llena la tarjeta, `mt-auto` no deja separación y la línea
          quedaba pegada al último renglón. */}
      <div className="mt-auto pt-7">
        <div
          className={`border-t pt-4 ${active ? "border-white/25" : "border-brand-gray-light"}`}
        >
          <p className="text-body-md font-medium">{name}</p>
          <p className={`text-body-sm ${active ? "text-white/70" : "text-brand-gray-dark"}`}>
            {role}
          </p>
        </div>
      </div>
    </article>
  );
}
