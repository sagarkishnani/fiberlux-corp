import { useEffect, useRef, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type {
  SubservicioQuery,
  SubservicioQueryVariables,
} from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import type { Locale } from "../../i18n/config";
import IlustracionBeneficio from "./beneficios/IlustracionBeneficio";
import { CSS_BENEFICIOS } from "./beneficios/base";

interface BeneficiosProps {
  query: string;
  variables: SubservicioQueryVariables;
  data: SubservicioQuery;
  locale?: Locale;
}

interface Item {
  title?: string | null;
  text?: string | null;
  plantilla?: string | null;
  datos?: any;
  image?: string | null;
}

/**
 * Enciende una sola vez, cuando la sección entra en viewport (SPEC 105).
 *
 * Una sola vez a propósito: si se apagara al salir, pasar el cursor arriba y
 * abajo por una fila de tres cards convertiría el ratón en un interruptor de
 * ruido. Sin `IntersectionObserver` arranca encendido, que es el estado
 * correcto cuando no hay forma de saber si se ve.
 */
function useEnVista<T extends HTMLElement>(umbral = 0.2): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [enVista, setEnVista] = useState(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || typeof IntersectionObserver === "undefined") {
      setEnVista(true);
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setEnVista(true);
          observador.disconnect();
        }
      },
      { threshold: umbral }
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [umbral]);

  return [ref, enVista];
}

export default function BeneficiosReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: BeneficiosProps) {
  const { data } = useTina<SubservicioQuery>({
    query,
    variables,
    data: initialData,
  });

  const beneficios = data?.subservicio?.beneficios;
  const [ref, enVista] = useEnVista<HTMLDivElement>(0.2);

  if (!beneficios) return null;

  const items = (beneficios.items || []).filter(Boolean) as Item[];
  if (items.length === 0) return null;

  /* Columna de arranque de la card que abre la última fila, para que esa fila
     quede centrada cuando no llega a tres. Con cuatro cards la suelta arranca
     en la columna 3 (queda al medio); con cinco, las dos sueltas arrancan en la
     2 y ocupan de la 2 a la 5. Cualquier otro total no necesita corrección. */
  const arranque = (i: number) => {
    if (i !== 3) return "";
    if (items.length === 4) return "md:col-start-3";
    if (items.length === 5) return "md:col-start-2";
    return "";
  };

  return (
    <section id="beneficios" className="bg-greyscale-darkest py-16 md:py-24 scroll-mt-24">
      <div className="max-w-[1264px] mx-auto px-6 md:px-16">
        {beneficios.title && (
          <h2
            className="text-[28px] md:text-[44px] leading-[1.15] font-semibold text-greyscale-white text-center mb-10 md:mb-14"
            data-tina-field={tinaField(beneficios, "title")}
          >
            {tField(beneficios as any, "title", locale)}
          </h2>
        )}

        {/* Seis columnas y cada card ocupando dos: siguen entrando tres por
            fila, pero la rejilla tiene la mitad de paso, que es lo que permite
            centrar una fila incompleta. Con tres columnas la cuarta card sólo
            podía quedar pegada a la izquierda.

            `auto-rows-fr` iguala las filas entre sí: el grid ya estiraba las
            cards de una misma fila, pero con cuatro la fila suelta se quedaba
            con la altura de su propio texto y las cards se veían de dos
            tamaños. Sólo desde `md`: en móvil, con una card por fila, igualarlas
            es abrirle a todas el hueco de la más larga. */}
        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-6 md:auto-rows-fr gap-4 lg:gap-5"
          data-reveal="up"
          data-reveal-stagger="0.06"
        >
          {items.map((item, i) => {
            const imagen = mediaUrl(item.image);
            return (
              <div
                key={i}
                className={`beneficio-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#96237A]/60 hover:bg-white/[0.06] hover:shadow-[0_18px_40px_-20px_rgba(150,35,122,0.7)] md:col-span-2 ${arranque(i)}`}
              >
                {/* Circular gradient glow — reveals on hover */}
                <span
                  aria-hidden="true"
                  className="beneficio-glow pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                />

                {item.title && (
                  <h3
                    className="relative z-10 text-[18px] lg:text-[20px] font-semibold text-greyscale-white"
                    data-tina-field={tinaField(item as any, "title")}
                  >
                    {tField(item as any, "title", locale)}
                  </h3>
                )}
                {item.text && (
                  <p
                    className="relative z-10 mt-3 text-body-sm text-greyscale-light"
                    data-tina-field={tinaField(item as any, "text")}
                  >
                    {tField(item as any, "text", locale)}
                  </p>
                )}

                {/* El pie empuja la ilustración al fondo para que las cards de
                    una fila la alineen aunque sus textos midan distinto. */}
                <div className="relative z-10 mt-auto">
                  {imagen ? (
                    /* Una imagen subida manda sobre la plantilla: es la válvula
                       de escape para lo que ninguna de las catorce cubra. */
                    <img src={imagen} alt="" className="mt-6 w-full rounded-xl object-cover" />
                  ) : (
                    <IlustracionBeneficio
                      plantilla={item.plantilla}
                      datos={item.datos}
                      activo={enVista}
                      locale={locale}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .beneficio-glow {
          background: radial-gradient(
            circle at 30% 20%,
            rgba(150, 35, 122, 0.45) 0%,
            rgba(150, 35, 122, 0.14) 34%,
            rgba(150, 35, 122, 0) 64%
          );
          filter: blur(26px);
        }
        @media (prefers-reduced-motion: reduce) {
          .beneficio-card, .beneficio-glow {
            transition-duration: 0.01ms !important;
          }
          .beneficio-card:hover { transform: none !important; }
        }
        ${CSS_BENEFICIOS}
      `}</style>
    </section>
  );
}
