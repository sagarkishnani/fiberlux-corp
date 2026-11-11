import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaMagnifyingGlass, FaXmark, FaArrowRight } from "react-icons/fa6";
import { searchEntries, type SearchEntry } from "../../utils/search";
import { localizeHref } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";

/* Índice cacheado en memoria: se baja una sola vez por sesión. */
let cachedIndex: SearchEntry[] | null = null;

const TYPE_LABEL: Record<Locale, Record<SearchEntry["type"], string>> = {
  es: { solucion: "Solución", subservicio: "Servicio", pagina: "Página", blog: "Blog" },
  en: { solucion: "Solution", subservicio: "Service", pagina: "Page", blog: "Blog" },
};

const UI = {
  es: {
    title: "Busca información o soluciones",
    placeholder: "Ejem. Soluciones de conectividad",
    aria: "Buscar en el sitio",
    close: "Cerrar búsqueda",
    noResults: (q: string) => `Sin resultados para “${q}”.`,
  },
  en: {
    title: "Search information or solutions",
    placeholder: "e.g. Connectivity solutions",
    aria: "Search the site",
    close: "Close search",
    noResults: (q: string) => `No results for “${q}”.`,
  },
} as const;

/* Devuelve la entrada con título/descripción/categoría en el idioma activo. */
function localize(e: SearchEntry, locale: Locale): SearchEntry {
  if (locale !== "en") return e;
  return {
    ...e,
    title: e.title_en || e.title,
    description: e.description_en || e.description,
    category: e.category_en || e.category,
    url: localizeHref(e.url, "en"),
    fragments: e.fragments?.map((f) => ({ text: f.text_en || f.text })),
  };
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  locale?: Locale;
}

export default function SearchOverlay({ open, onClose, locale = "es" }: SearchOverlayProps) {
  const [entries, setEntries] = useState<SearchEntry[]>(cachedIndex || []);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const base = import.meta.env.BASE_URL || "/";
  const indexUrl = `${base}/search-index.json`.replace(/\/{2,}/g, "/");

  /* Baja el índice la primera vez que se abre. */
  useEffect(() => {
    if (!open || cachedIndex) return;
    fetch(indexUrl)
      .then((r) => r.json())
      .then((data: SearchEntry[]) => {
        cachedIndex = data;
        setEntries(data);
      })
      .catch(() => {
        /* sin índice: el overlay abre igual (solo sin resultados) */
      });
  }, [open, indexUrl]);

  /* Al abrir: foco en el input, bloquear scroll (Lenis + body) y Esc para cerrar. */
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (window as any).__lenis?.stop?.();

    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      (window as any).__lenis?.start?.();
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  /* Limpia la query al cerrar. */
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Entradas con título/descripción/categoría en el idioma activo.
  const localized = useMemo(
    () => entries.map((e) => localize(e, locale)),
    [entries, locale]
  );
  const categories = useMemo(
    () => localized.filter((e) => e.type === "solucion"),
    [localized]
  );
  const results = useMemo(
    () => (query.trim() ? searchEntries(localized, query) : []),
    [localized, query]
  );
  const ui = UI[locale];
  const typeLabel = TYPE_LABEL[locale];

  if (!open || typeof document === "undefined") return null;

  const overlay = (
    <div
      className="fixed inset-0 z-[85] flex items-start justify-center px-4 pt-[144px] md:pt-[152px]"
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda del sitio"
    >
      {/* Fondo difuminado — click cierra */}
      <div
        className="absolute inset-0 bg-[rgba(20,8,17,.45)] backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative flex w-full max-w-[720px] max-h-[75vh] flex-col overflow-hidden rounded-[28px] border border-fx-line bg-white shadow-[0_40px_80px_-40px_rgba(101,13,74,.45)]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <p className="text-[15px] font-medium text-fx-ink">
            {ui.title}
          </p>
          <button
            type="button"
            aria-label={ui.close}
            onClick={onClose}
            className="text-fx-muted transition-colors hover:text-fx-ink"
          >
            <FaXmark className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6">
          <div className="flex items-center gap-3 h-14 rounded-2xl border border-[#E6E3E6] bg-fx-bg px-5 transition-[border-color,background-color,box-shadow] focus-within:border-fx-purple focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(150,33,122,.12)]">
            <FaMagnifyingGlass className="h-4 w-4 shrink-0 text-fx-purple" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ui.placeholder}
              className="w-full bg-transparent text-[15px] text-fx-ink outline-none placeholder:text-fx-muted"
              aria-label={ui.aria}
            />
          </div>
        </div>

        <div
          className="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-4"
          data-lenis-prevent
        >
          {query.trim() === "" ? (
            <ul>
              {categories.map((c, i) => (
                <li key={i}>
                  <a
                    href={c.url}
                    className="block rounded-xl px-3 py-3 text-fx-ink transition-colors hover:bg-[#FAF0F6] hover:text-fx-purple"
                  >
                    {c.category || c.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-[14px] text-fx-muted">
              {ui.noResults(query.trim())}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {results.map(({ entry: r, excerpt }, i) => (
                <li key={i}>
                  <a
                    href={r.url}
                    className="group flex items-start gap-3 rounded-2xl border border-fx-line bg-white px-4 py-3 transition-colors hover:border-fx-lilac-strong hover:bg-[#FCF8FB]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-medium text-fx-ink">
                          {r.title}
                        </span>
                        <span className="shrink-0 rounded-full bg-[#FAF0F6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-fx-purple">
                          {typeLabel[r.type]}
                        </span>
                      </div>
                      {r.category && (
                        <p className="mt-0.5 text-[12px] text-fx-muted">{r.category}</p>
                      )}
                      {(excerpt || r.description) && (
                        <p className="mt-1 line-clamp-2 text-[13px] text-fx-body">
                          {excerpt || r.description}
                        </p>
                      )}
                    </div>
                    <FaArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-fx-muted transition-colors group-hover:text-fx-purple" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
