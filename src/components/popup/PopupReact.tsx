import { useState } from "react";
import { useTina } from "tinacms/dist/react";
import { FaXmark } from "react-icons/fa6";
import type { PopupQuery, PopupQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";

interface Props {
  query: string;
  variables: PopupQueryVariables;
  data: PopupQuery;
  locale: Locale;
}

/**
 * Pop-up promocional (SPEC 111).
 *
 * Capas del sitio: header z-[80], buscador z-[85], pop-up z-[90], modal de
 * cookies z-[100]. El de cookies va encima a propósito: tiene prioridad legal
 * y el pop-up espera a que se resuelva.
 */
export default function PopupReact({ query, variables, data: initialData }: Props) {
  const { data } = useTina({ query, variables, data: initialData });
  const popup = data?.popup;

  const [open, setOpen] = useState(true);

  if (!popup || !open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center lg:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-[1000px] overflow-hidden rounded-t-3xl bg-greyscale-darkest text-white shadow-2xl lg:rounded-3xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <FaXmark aria-hidden="true" />
        </button>
        <div className="p-8">
          <p className="text-2xl font-semibold">{popup.heading}</p>
        </div>
      </div>
    </div>
  );
}
