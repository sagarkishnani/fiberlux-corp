import type { PopupQuery, PopupQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";

interface Props {
  query: string;
  variables: PopupQueryVariables;
  data: PopupQuery;
  locale: Locale;
}

/**
 * Pop-up promocional (SPEC 111). Esqueleto: por ahora sólo pinta el titular
 * para verificar que la isla monta en las páginas en alcance.
 */
export default function PopupReact({ data }: Props) {
  const popup = data?.popup;
  if (!popup) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[90] rounded-2xl bg-greyscale-darkest p-6 text-white shadow-2xl lg:inset-x-auto lg:right-8 lg:max-w-md">
      <p className="text-lg font-semibold">{popup.heading}</p>
    </div>
  );
}
