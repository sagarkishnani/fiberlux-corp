import { useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import { buttonClass } from "../shared/Button";
import type {
  ServiciosQuery,
  ServiciosQueryVariables,
} from "../../../tina/__generated__/types";
import CinematicRays from "../effects/CinematicRays";
import NodeField from "../effects/NodeField";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";

/** Categoría (SPEC 98), derivada de `home.services.items`. */
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

/* Claves de icono (mapeadas en CinematicRays) de las 4 categorías de solución.
   El efecto las mezcla con iconos extra para dar variedad a los tiles. */
const ICON_KEYS = ["conectividad", "ciberseguridad", "datacenter", "gestionados"];

export default function HeroServiciosReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: HeroServiciosProps) {
  const { data } = useTina<ServiciosQuery>({ query, variables, data: initialData });
  const [webglOk, setWebglOk] = useState(true);

  const page = data?.servicios;
  if (!page) return null;

  const base = import.meta.env.BASE_URL || "/";

  return (
    <section
      className="relative flex min-h-[100svh] items-center overflow-hidden -mt-16"
      style={{ background: "#0a0a0a" }}
    >
      {/* Fondo cinematic: god-rays + iconos de categoría flotando + polvo de luz
          (recuperado del hero home pre-planeta). Fallback a un plexus ligero si
          WebGL no está disponible. */}
      <div className="absolute inset-0 z-0">
        {webglOk ? (
          <CinematicRays
            className="h-full w-full"
            iconKeys={ICON_KEYS}
            signalReady
            onUnsupported={() => setWebglOk(false)}
          />
        ) : (
          <NodeField className="h-full w-full" signalReady lines />
        )}
      </div>

      {/* Velo sutil para legibilidad del titular sobre el fondo animado. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 46%, rgba(10,10,10,0.66) 0%, rgba(10,10,10,0) 72%)",
        }}
      />

      <div className="relative z-10 w-full site-container py-24 text-center">
        <div
          className="mx-auto max-w-[760px]"
          data-reveal="up"
          data-reveal-stagger="0.12"
        >
          {/* Breadcrumb (mismo tamaño que Nosotros: text-sm) */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center justify-center gap-2 text-sm">
              <li>
                <a
                  href={base}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  {locale === "en" ? "Home" : "Inicio"}
                </a>
              </li>
              <li className="text-white/30">/</li>
              <li
                className="text-white font-medium"
                data-tina-field={tinaField(page, "breadcrumb")}
              >
                {tField(page as any, "breadcrumb", locale)}
              </li>
            </ol>
          </nav>

          <h1
            className="mx-auto mb-6 max-w-[16ch] text-[34px] font-semibold leading-[1.12] text-greyscale-white md:text-[52px]"
            style={{ textShadow: "0 0 28px rgba(150,35,122,0.5)" }}
            data-tina-field={tinaField(page, "heading")}
          >
            {tField(page as any, "heading", locale)}
          </h1>

          <p
            className="mx-auto mb-9 max-w-[54ch] text-body-lg text-greyscale-light"
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
      </div>
    </section>
  );
}
