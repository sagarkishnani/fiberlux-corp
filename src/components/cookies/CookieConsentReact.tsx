import { useState, useEffect, useCallback } from "react";
import { useTina } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import type {
  CookieConsentQuery,
  CookieConsentQueryVariables,
} from "../../../tina/__generated__/types";

interface Props {
  query: string;
  variables: CookieConsentQueryVariables;
  data: CookieConsentQuery;
}

interface Category {
  key?: string | null;
  name?: string | null;
  description?: string | null;
  alwaysActive?: boolean | null;
}

const STORAGE_KEY = "flx-cookie-consent:v1";

function readConsent(): Record<string, boolean> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeConsent(prefs: Record<string, boolean>) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...prefs, ts: Date.now() })
    );
  } catch {
    /* localStorage unavailable — consent just isn't persisted */
  }
}

/* Small on/off switch */
function Toggle({
  on,
  disabled,
  onChange,
  label,
}: {
  on: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-[#96237A]" : "bg-[#d1d5db]"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-[22px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

export default function CookieConsentReact({
  query,
  variables,
  data: initialData,
}: Props) {
  const { data } = useTina<CookieConsentQuery>({
    query,
    variables,
    data: initialData,
  });
  const cc = (data?.cookieConsent as any) || (initialData?.cookieConsent as any);

  const categories: Category[] = (cc?.categories || []).filter(Boolean);
  const title = cc?.title || "Personalizar las preferencias de consentimiento";
  const intro = cc?.intro;
  const showMoreText = cc?.showMoreText || "Mostrar más";
  const showMoreUrl = cc?.showMoreUrl || "#";
  const btnReject = cc?.btnReject || "Rechazar todo";
  const btnSave = cc?.btnSave || "Guardar mis preferencias";
  const btnAccept = cc?.btnAccept || "Aceptar todo";
  const alwaysActiveLabel = cc?.alwaysActiveLabel || "Siempre activa";

  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});

  /* Build the default prefs (alwaysActive forced ON, rest from saved or false) */
  const buildPrefs = useCallback(
    (saved: Record<string, boolean> | null) => {
      const next: Record<string, boolean> = {};
      for (const c of categories) {
        if (!c.key) continue;
        next[c.key] = c.alwaysActive ? true : !!saved?.[c.key];
      }
      return next;
    },
    [categories]
  );

  /* Decide visibility after mount (no localStorage during SSR) */
  useEffect(() => {
    const saved = readConsent();
    setPrefs(buildPrefs(saved));
    if (!saved) setOpen(true);

    const reopen = () => {
      setPrefs(buildPrefs(readConsent()));
      setOpen(true);
    };
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.(
        'a[href="#preferencias-cookies"]'
      );
      if (target) {
        e.preventDefault();
        reopen();
      }
    };
    window.addEventListener("open-cookie-consent", reopen);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("open-cookie-consent", reopen);
      document.removeEventListener("click", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistAndClose = (next: Record<string, boolean>) => {
    writeConsent(next);
    setOpen(false);
  };

  const acceptAll = () => {
    const next: Record<string, boolean> = {};
    categories.forEach((c) => c.key && (next[c.key] = true));
    persistAndClose(next);
  };
  const rejectAll = () => {
    const next: Record<string, boolean> = {};
    categories.forEach((c) => c.key && (next[c.key] = !!c.alwaysActive));
    persistAndClose(next);
  };
  const savePrefs = () => {
    const next: Record<string, boolean> = { ...prefs };
    categories.forEach((c) => c.key && c.alwaysActive && (next[c.key] = true));
    persistAndClose(next);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-[540px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="p-6 md:p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-[#0a0a0a] text-[19px] font-semibold leading-snug">
              {title}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[#717274] hover:bg-[#f2f3f5] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Intro */}
          <div className="prose prose-sm max-w-none prose-p:text-[#3f3f3f] prose-p:text-[13px] prose-p:leading-[20px] mb-1">
            {intro && <TinaMarkdown content={intro} />}
          </div>
          <a
            href={showMoreUrl}
            className="text-[#96237A] text-[13px] font-medium hover:underline"
          >
            {showMoreText}
          </a>

          {/* Categories */}
          <div className="mt-5 divide-y divide-[#eceaec] border-t border-[#eceaec]">
            {categories.map((c, i) => (
              <div key={c.key || i} className="py-4">
                <div className="flex items-center justify-between gap-4 mb-1.5">
                  <span className="text-[#0a0a0a] text-[14px] font-semibold">
                    {c.name}
                  </span>
                  {c.alwaysActive ? (
                    <span className="text-[#96237A] text-[11px] font-semibold uppercase tracking-wider">
                      {alwaysActiveLabel}
                    </span>
                  ) : (
                    <Toggle
                      on={!!(c.key && prefs[c.key])}
                      label={c.name || ""}
                      onChange={(v) =>
                        c.key && setPrefs((p) => ({ ...p, [c.key!]: v }))
                      }
                    />
                  )}
                </div>
                <p className="text-[#717274] text-[12.5px] leading-[19px]">
                  {c.description}
                </p>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={rejectAll}
              className="flex-1 px-4 py-3 rounded-full border border-[#96237A] text-[#96237A] text-[13px] font-semibold hover:bg-[#96237A]/[0.04] transition-colors"
            >
              {btnReject}
            </button>
            <button
              type="button"
              onClick={savePrefs}
              className="flex-1 px-4 py-3 rounded-full border border-[#96237A] text-[#96237A] text-[13px] font-semibold hover:bg-[#96237A]/[0.04] transition-colors"
            >
              {btnSave}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="flex-1 px-4 py-3 rounded-full bg-[#96237A] text-white text-[13px] font-semibold hover:bg-[#650F50] transition-colors"
            >
              {btnAccept}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
