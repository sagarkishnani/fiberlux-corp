import { useTina, tinaField } from "tinacms/dist/react";
import { buttonClass } from "../shared/Button";
import type {
  ServiciosQuery,
  ServiciosQueryVariables,
} from "../../../tina/__generated__/types";
import NodeField from "../effects/NodeField";
import SolucionesNodeGraph from "./SolucionesNodeGraph";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";

/** Categoría del grafo (SPEC 98), derivada de `home.services.items`. */
export interface GraphCategory {
  title: string;
  title_en?: string;
  icon: string;
}

interface HeroServiciosProps {
  query: string;
  variables: ServiciosQueryVariables;
  data: ServiciosQuery;
  categories?: GraphCategory[];
  locale?: Locale;
}

export default function HeroServiciosReact({
  query,
  variables,
  data: initialData,
  categories = [],
  locale = "es",
}: HeroServiciosProps) {
  const { data } = useTina<ServiciosQuery>({ query, variables, data: initialData });

  const page = data?.servicios;
  if (!page) return null;

  const base = import.meta.env.BASE_URL || "/";

  /* Click en un satélite → baja a esa categoría en SolucionesScroll.
     Se deja el índice pendiente en un global (por si el bloque aún no hidrató:
     `client:visible`) y se despacha el evento (caso ya hidratado). El
     scrollIntoView acerca la sección —y de paso dispara su hidratación—; la
     posición exacta la remata el listener de SolucionesScroll. */
  const handleSelect = (index: number) => {
    (window as any).__gotoSolucion = index;
    window.dispatchEvent(
      new CustomEvent("fbx:goto-solucion", { detail: { index } })
    );
    const el = document.getElementById("soluciones-scroll");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      className="relative overflow-hidden -mt-16"
      style={{ background: "#0a0a0a" }}
    >
      {/* Fondo: red de partículas plexus (SPEC 92), morado sobre el negro base. */}
      <div className="absolute inset-0 z-0">
        <NodeField className="h-full w-full" signalReady lines />
      </div>

      {/* Glow magenta radial de ambiente (estilo hero home). */}
      <div aria-hidden="true" className="absolute inset-0 z-0 servicios-hero-glow" />

      <div className="relative z-10 site-container pt-28 pb-16 lg:pt-32 lg:pb-20">
        {/* ── Titular / intro / CTA — superpuestos, centrados ── */}
        <div className="relative mx-auto max-w-[720px] text-center" data-reveal="up">
          {/* Scrim suave para legibilidad sobre el fondo animado. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 45%, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0) 70%)",
            }}
          />

          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center justify-center gap-2 text-caption-sm text-greyscale">
            <a href={base} className="hover:text-greyscale-white transition-colors">
              {locale === "en" ? "Home" : "Inicio"}
            </a>
            <span>/</span>
            <span
              className="text-greyscale-white"
              data-tina-field={tinaField(page, "breadcrumb")}
            >
              {tField(page as any, "breadcrumb", locale)}
            </span>
          </nav>

          <h1
            className="mx-auto mb-6 max-w-[15ch] text-[32px] font-semibold leading-[1.15] text-greyscale-white md:text-[46px]"
            data-tina-field={tinaField(page, "heading")}
          >
            {tField(page as any, "heading", locale)}
          </h1>

          <p
            className="mx-auto mb-8 max-w-[52ch] text-body-lg text-greyscale-light"
            data-tina-field={tinaField(page, "intro")}
          >
            {tField(page as any, "intro", locale)}
          </p>

          {page.ctaLabel && (
            <a
              href="#soluciones-scroll"
              className={buttonClass("primary")}
              data-tina-field={tinaField(page, "ctaLabel")}
            >
              {tField(page as any, "ctaLabel", locale)}
            </a>
          )}
        </div>

        {/* ── Grafo de nodos: hub Fiberlux + 4 categorías ── */}
        <div className="mt-8 lg:mt-2">
          <SolucionesNodeGraph
            categories={categories}
            locale={locale}
            onSelect={handleSelect}
          />
        </div>
      </div>

      <style>{`
        .servicios-hero-glow {
          background:
            radial-gradient(50% 55% at 50% 62%, rgba(150,35,122,0.30) 0%, rgba(150,35,122,0) 62%),
            radial-gradient(70% 60% at 82% 20%, rgba(150,35,122,0.16) 0%, rgba(150,35,122,0) 60%);
        }
        @media (max-width: 767px) {
          .servicios-hero-glow {
            background: radial-gradient(80% 45% at 50% 30%, rgba(150,35,122,0.22) 0%, rgba(150,35,122,0) 62%);
          }
        }
      `}</style>
    </section>
  );
}
