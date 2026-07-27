import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaMagnifyingGlass, FaXmark, FaArrowRight } from "react-icons/fa6";
import { searchEntries, type SearchEntry } from "../../utils/search";

/* Índice cacheado en memoria: se baja una sola vez por sesión. */
let cachedIndex: SearchEntry[] | null = null;

const TYPE_LABEL: Record<SearchEntry["type"], string> = {
  solucion: "Solución",
  subservicio: "Servicio",
  pagina: "Página",
  blog: "Blog",
};

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
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

  const categories = useMemo(
    () => entries.filter((e) => e.type === "solucion"),
    [entries]
  );
  const results = useMemo(
    () => (query.trim() ? searchEntries(entries, query) : []),
    [entries, query]
  );

  if (!open || typeof document === "undefined") return null;

  const overlay = (
    <div
      className="fixed inset-0 z-[55] flex items-start justify-center px-4 pt-24 md:pt-28"
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda del sitio"
    >
      {/* Fondo difuminado — click cierra */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative flex w-full max-w-[720px] max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-greyscale-darkest/95 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <p className="text-[15px] font-medium text-white">
            Busca información o soluciones
          </p>
          <button
            type="button"
            aria-label="Cerrar búsqueda"
            onClick={onClose}
            className="text-white/60 transition-colors hover:text-white"
          >
            <FaXmark className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors focus-within:border-[#96237A]">
            <FaMagnifyingGlass className="h-4 w-4 shrink-0 text-white/40" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ejem. Soluciones de conectividad"
              className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/40"
              aria-label="Buscar en el sitio"
            />
          </div>
        </div>

        <div className="mt-4 overflow-y-auto px-3 pb-4">
          {query.trim() === "" ? (
            <ul>
              {categories.map((c, i) => (
                <li key={i}>
                  <a
                    href={c.url}
                    className="block rounded-lg px-3 py-3 text-white/85 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {c.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-sm text-white/50">
              Sin resultados para “{query.trim()}”.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {results.map((r, i) => (
                <li key={i}>
                  <a
                    href={r.url}
                    className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:border-[#96237A]/60 hover:bg-white/[0.06]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-medium text-white">
                          {r.title}
                        </span>
                        <span className="shrink-0 rounded-full bg-[#96237A]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c65fac]">
                          {TYPE_LABEL[r.type]}
                        </span>
                      </div>
                      {r.category && (
                        <p className="mt-0.5 text-xs text-white/40">{r.category}</p>
                      )}
                      {r.description && (
                        <p className="mt-1 line-clamp-2 text-[13px] text-white/55">
                          {r.description}
                        </p>
                      )}
                    </div>
                    <FaArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-white/30 transition-colors group-hover:text-[#c65fac]" />
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
