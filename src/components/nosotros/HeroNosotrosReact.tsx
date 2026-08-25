import { useTina, tinaField } from "tinacms/dist/react";
import type { AboutQuery, AboutQueryVariables } from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";
import PhotoHero from "../shared/PhotoHero";
import NetworkDepth from "../effects/NetworkDepth";

/**
 * Hero de Nosotros — SPEC 104.
 *
 * Fotografía a sangre (sujeto a la derecha) con velo oscuro hacia el texto y la
 * malla de red en profundidad (variante `malla`) entre la foto y el velo.
 * Reemplaza la escena WebGL de la SPEC 101 (candado orbital + plexus + halo);
 * esos componentes siguen en el repo, sin montar aquí.
 */

interface HeroNosotrosProps {
  query: string;
  variables: AboutQueryVariables;
  data: AboutQuery;
  locale?: Locale;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function HeroNosotrosReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: HeroNosotrosProps) {
  const { data } = useTina<AboutQuery>({ query, variables, data: initialData });

  const about = data?.about || initialData?.about;
  const hero = about?.hero;

  const title = tField(hero as any, "title", locale) || "";
  const subtitle = tField(hero as any, "subtitle", locale) || "";

  return (
    <PhotoHero
      image={hero?.image}
      focus="76% 45%"
      focusMobile="72% 38%"
      overlay={<NetworkDepth variant="malla" opacity={0.6} />}
      breadcrumb={
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <a href={`${BASE}/`} className="text-white/50 transition-colors hover:text-white">
              {locale === "en" ? "Home" : "Inicio"}
            </a>
          </li>
          <li className="text-white/30">/</li>
          <li className="font-medium text-white">{locale === "en" ? "About us" : "Nosotros"}</li>
        </ol>
      }
      title={
        <h1
          className="max-w-[15ch] text-[34px] font-semibold leading-[1.1] text-white md:text-[52px] lg:text-[58px]"
          data-tina-field={hero ? tinaField(hero, "title") : undefined}
        >
          {title}
        </h1>
      }
      subtitle={
        subtitle ? (
          <p
            className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-white/65 md:mt-6 md:text-base"
            data-tina-field={hero ? tinaField(hero, "subtitle") : undefined}
          >
            {subtitle}
          </p>
        ) : undefined
      }
    />
  );
}
