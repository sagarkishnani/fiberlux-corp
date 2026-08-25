import { useTina, tinaField } from "tinacms/dist/react";
import type {
  SoporteTecnicoQuery,
  SoporteTecnicoQueryVariables,
} from "../../../tina/__generated__/types";
import { tField } from "../../utils/i18n";
import { t } from "../../i18n/ui";
import type { Locale } from "../../i18n/config";
import PhotoHero from "../shared/PhotoHero";
import NetworkDepth from "../effects/NetworkDepth";

/**
 * Hero de Soporte técnico — SPEC 104.
 *
 * Fotografía a sangre (ingeniero en data center, a la derecha) con la malla de red
 * (variante `constelacion`, la de la referencia del cliente) entre la foto y el velo, y velo oscuro
 * hacia el texto. Reemplaza el hub de nodos de la SPEC 102 (`SupportHub`), que
 * sigue en el repo sin montar aquí.
 */

interface HeroSoporteProps {
  query: string;
  variables: SoporteTecnicoQueryVariables;
  data: SoporteTecnicoQuery;
  locale?: Locale;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function HeroSoporteReact({
  query,
  variables,
  data: initialData,
  locale = "es",
}: HeroSoporteProps) {
  const { data } = useTina<SoporteTecnicoQuery>({ query, variables, data: initialData });

  const page = data?.soporteTecnico || initialData?.soporteTecnico;
  if (!page) return null;

  return (
    <PhotoHero
      image={page.heroImage}
      focus="78% 42%"
      focusMobile="74% 32%"
      overlay={<NetworkDepth variant="constelacion" opacity={0.9} />}
      breadcrumb={
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <a href={`${BASE}/`} className="text-white/50 transition-colors hover:text-white">
              {t("breadcrumb.home", locale)}
            </a>
          </li>
          <li className="text-white/30">/</li>
          <li
            className="font-medium text-white"
            data-tina-field={tinaField(page, "breadcrumb")}
          >
            {tField(page, "breadcrumb", locale)}
          </li>
        </ol>
      }
      title={
        <h1
          className="max-w-[16ch] text-[34px] font-semibold leading-[1.1] text-white md:text-[52px] lg:text-[58px]"
          data-tina-field={tinaField(page, "heading")}
        >
          {tField(page, "heading", locale)}
        </h1>
      }
      subtitle={
        <p
          className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-white/65 md:mt-6 md:text-base"
          data-tina-field={tinaField(page, "intro")}
        >
          {tField(page, "intro", locale)}
        </p>
      }
    />
  );
}
