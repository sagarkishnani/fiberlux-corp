import { mediaUrl } from "../../utils/mediaUrl";

/**
 * Tarjeta compacta de testimonio del bloque unificado del home.
 *
 * A diferencia de `shared/TestimonialCard` (tarjeta ancha con el borde notched
 * en SVG, una por vista), esta es un rectángulo simple pensado para verse de a
 * tres en desktop.
 *
 * Todas las tarjetas son iguales (blancas sobre el panel lila): la referencia
 * del cliente descartó la variante destacada en degradé magenta que llevaba la
 * central, para que la fila se lea como un bloque continuo.
 */

interface TestimonialMiniCardProps {
  quote: string;
  description?: string | null;
  name: string;
  role: string;
  company: string;
  logo?: string | null;
}

export default function TestimonialMiniCard({
  quote,
  description,
  name,
  role,
  company,
  logo,
}: TestimonialMiniCardProps) {
  const logoSrc = mediaUrl(logo);

  return (
    <article className="flex h-full min-h-[360px] flex-col rounded-2xl bg-white p-6 text-greyscale-darkest shadow-[0_18px_44px_-18px_rgba(59,14,48,0.4)] lg:min-h-[420px] lg:p-8">
      {/* Logo de la empresa. Fallback: nombre como texto. */}
      <div className="mb-6">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={company}
            className="h-7 w-auto max-w-[160px] object-contain"
            draggable={false}
          />
        ) : (
          <span className="text-body-sm font-semibold text-brand-purple">{company}</span>
        )}
      </div>

      <h3 className="text-subtitle-sm font-medium leading-snug">{quote}</h3>

      {description && (
        <p className="mt-3 text-body-sm leading-relaxed text-brand-gray-dark">{description}</p>
      )}

      {/* Autor al pie, sin separador (referencia del cliente). El `pt-7`
          garantiza aire cuando el testimonio llena la tarjeta y `mt-auto` no
          deja separación. */}
      <div className="mt-auto pt-7">
        <p className="text-body-md font-medium">{name}</p>
        <p className="text-body-sm text-brand-gray-dark">{role}</p>
      </div>
    </article>
  );
}
