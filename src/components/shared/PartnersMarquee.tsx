import { tinaField } from "tinacms/dist/react";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";

export interface PartnerLogo {
  image?: string | null;
  alt?: string | null;
  url?: string | null;
}

export interface PartnersData {
  eyebrow?: string | null;
  eyebrow_en?: string | null;
  title?: string | null;
  title_en?: string | null;
  logos?: (PartnerLogo | null)[] | null;
}

/**
 * PartnersMarquee — presentational full-width infinite marquee of partner logos.
 * Receives a `partners` object coming straight from a `useTina()` result so the
 * `tinaField()` bindings keep live visual editing working for whichever
 * collection (global or service) supplied the data.
 */
export default function PartnersMarquee({
  partners,
  durationSeconds,
  locale = "es",
}: {
  partners?: PartnersData | null;
  /**
   * Duración del ciclo del marquee en segundos. Opcional: si se omite se usa
   * la duración fija del CSS (110s), pensada para las franjas per-solución con
   * pocos logos. El home pasa una duración proporcional a la cantidad de logos
   * para mantener una velocidad constante aunque haya muchos (SPEC 43).
   */
  durationSeconds?: number;
  locale?: Locale;
}) {
  if (!partners) return null;

  const eyebrow = tField(partners as any, "eyebrow", locale);
  const title = tField(partners as any, "title", locale);

  const logos = (partners.logos || []).filter(Boolean) as PartnerLogo[];
  if (logos.length === 0) return null;

  // Dos filas en direcciones opuestas: la mitad de los logos arriba (→) y la
  // otra mitad abajo (←). Con un solo logo no se parte (queda una sola fila).
  const half = Math.ceil(logos.length / 2);
  const rowLogos = logos.length > 1 ? [logos.slice(0, half), logos.slice(half)] : [logos];

  // Velocidad por logo constante: si el consumidor pasa una duración total
  // (proporcional al nº de logos), se deriva su ritmo; si no, un fallback fijo.
  const secondsPerLogo = durationSeconds ? durationSeconds / logos.length : 4.5;

  const renderLogo = (logo: PartnerLogo, i: number) => {
    const img = (
      <img
        src={logo.image || ""}
        alt={logo.alt || "Partner"}
        loading="eager"
        decoding="async"
        draggable={false}
        className="partner-logo h-10 w-[128px] md:h-14 md:w-[168px] object-contain"
      />
    );
    return (
      <span key={i} className="partner-slot shrink-0 flex items-center justify-center px-8 md:px-12" data-tina-field={tinaField(logo as any, "image")}>
        {logo.url ? (
          <a href={logo.url} target="_blank" rel="noopener noreferrer">
            {img}
          </a>
        ) : (
          img
        )}
      </span>
    );
  };

  return (
    <section
      className="bg-greyscale-darkest py-24 md:py-32 overflow-hidden"
    >
      <div className="site-container text-center mb-14 md:mb-20">
        {eyebrow && (
          <p
            className="font-mono text-xs md:text-sm tracking-[0.2em] text-white/50 uppercase mb-4"
            data-tina-field={tinaField(partners as any, "eyebrow")}
          >
            {eyebrow}
          </p>
        )}
        {title && (
          <h2
            className="text-subtitle-md md:text-subtitle-lg text-white"
            data-tina-field={tinaField(partners as any, "title")}
          >
            {title}
          </h2>
        )}
      </div>

      {/* Dos filas full-width en direcciones opuestas */}
      <div className="flex flex-col gap-10 md:gap-14">
        {rowLogos.map((row, rowIndex) => {
          // Copias suficientes para desbordar la pantalla, luego duplicadas para
          // que el bucle -50% → 0 sea continuo. El nº se adapta a la cantidad de
          // logos de la fila (evita cientos de <img> que causan jank en mobile).
          const copies = Math.max(1, Math.ceil(20 / row.length));
          const run = Array.from({ length: copies }, () => row).flat();
          const track = [...run, ...run];
          const rowDuration = Math.max(run.length * secondsPerLogo, 20);
          return (
            <div key={rowIndex} className="partners-marquee w-full overflow-hidden">
              <div
                className={`partners-track ${rowIndex % 2 === 1 ? "partners-track--reverse" : ""} flex w-max items-center`}
                aria-hidden="false"
                style={{ animationDuration: `${rowDuration}s` }}
              >
                {track.map(renderLogo)}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        /* Logos siempre en blanco y a opacidad plena (SPEC 99 obs9: sin sombreado/hover).
           Footprint homogéneo: cada logo se ajusta (object-contain) a una caja de igual
           alto y ancho (clases h-10 w-[128px] / md:h-14 w-[168px] en el <img>). */
        .partner-logo { opacity: 1; filter: brightness(0) invert(1); }

        .partners-marquee {
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%);
        }
        .partners-track {
          animation: partners-marquee 90s linear infinite;
          will-change: transform;
        }
        /* Fila superior: izquierda → derecha. Las dos mitades del track son
           idénticas, así el reinicio es imperceptible. */
        @keyframes partners-marquee {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        /* Fila inferior: derecha → izquierda (sentido opuesto). */
        .partners-track--reverse {
          animation-name: partners-marquee-reverse;
        }
        @keyframes partners-marquee-reverse {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .partners-track { animation: none; transform: translateX(0); }
          .partner-logo { transition: none; }
        }
      `}</style>
    </section>
  );
}
