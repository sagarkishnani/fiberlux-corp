import { useId, useState } from "react";
import { tinaField } from "tinacms/dist/react";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { tField } from "../../utils/i18n";
import { CyberguardIcon } from "./cyberguardIcons";

const PLAN_KEYS = ["start", "pro", "max"] as const;
const GRID = "grid grid-cols-[minmax(0,1fr)_56px_56px_56px] lg:grid-cols-[minmax(0,1fr)_168px_168px_168px]";

function planShortName(name: string | null | undefined, fallback: string) {
  return (name || fallback).replace(/^cyberguard\s+/i, "");
}

function MatrixCell({ value, locale }: { value: string | null | undefined; locale: Locale }) {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "si" || normalized === "sí") {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full bg-fx-purple text-white" role="img" aria-label={t("matrix.included", locale)}>
        <CyberguardIcon name="check" size={14} />
      </span>
    );
  }
  if (!normalized || normalized === "no") {
    return <span className="block h-0.5 w-3.5 rounded-full bg-fx-line-strong" role="img" aria-label={t("matrix.notIncluded", locale)} />;
  }
  return <span className="text-center text-[10px] font-medium leading-[1.25] tracking-[-.01em] text-fx-ink [overflow-wrap:anywhere] lg:text-[14px]">{value}</span>;
}

export default function CyberMatrix({ matriz, plans, locale }: { matriz: any; plans: any[]; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [openLayers, setOpenLayers] = useState<Set<number>>(() => new Set([0]));
  const panelId = useId();
  const capas = ((matriz?.capas || []).filter(Boolean) as any[]);
  if (!matriz?.visible || capas.length === 0) return null;

  const highlightedIndex = plans.findIndex((plan) => plan?.highlighted);
  const columnTint = (i: number) => (i === highlightedIndex ? "bg-[#FAF0F6]" : "");

  const toggleLayer = (index: number) =>
    setOpenLayers((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const toggleButton = (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-expanded={open}
      aria-controls={panelId}
      className="group/vm inline-flex items-center gap-2 text-[15px] font-semibold text-fx-purple transition-colors duration-300 hover:text-fx-purple-deep"
      data-tina-field={tinaField(matriz, open ? "closeLabel" : "buttonLabel")}
    >
      {open ? tField(matriz, "closeLabel", locale) || t("matrix.close", locale) : tField(matriz, "buttonLabel", locale) || t("matrix.open", locale)}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`transition-transform duration-300 ease-fx-spring ${open ? "rotate-180" : "group-hover/vm:translate-y-0.5"}`}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );

  return (
    <div className="mt-8 lg:mt-10">
      <div className="flex justify-center">{toggleButton}</div>
      {open && (
        <div id={panelId} className="mt-8 rounded-[28px] border border-fx-line bg-white lg:mt-10 lg:rounded-[32px]">
          {tField(matriz, "title", locale) && (
            <h3
              className="m-0 px-4 pt-7 text-center text-[24px] font-medium tracking-[-.02em] text-fx-ink lg:px-10 lg:pt-10 lg:text-[32px]"
              data-tina-field={tinaField(matriz, "title")}
            >
              {tField(matriz, "title", locale)}
            </h3>
          )}
          <div className={`${GRID} sticky top-0 z-10 mt-6 rounded-t-[20px] border-b border-fx-line bg-white/95 backdrop-blur-[12px] lg:mt-8`}>
            <div className="px-4 py-4 text-[11px] font-semibold tracking-[.12em] text-fx-muted lg:px-10 lg:text-[12px]">{t("matrix.feature", locale)}</div>
            {PLAN_KEYS.map((key, i) => (
              <div
                key={key}
                className={`grid place-items-center py-4 text-[13px] font-semibold lg:text-[17px] ${
                  i === highlightedIndex ? "rounded-t-[14px] bg-[#FAF0F6] text-fx-purple" : "text-fx-ink"
                }`}
              >
                {planShortName(plans[i]?.name, key)}
              </div>
            ))}
          </div>
          {capas.map((capa, index) => {
            const rows = ((capa.rows || []).filter(Boolean) as any[]);
            const expanded = openLayers.has(index);
            const layerPanelId = `${panelId}-capa-${index}`;
            return (
              <div key={index} className={index ? "border-t border-fx-line" : ""}>
                <button
                  type="button"
                  onClick={() => toggleLayer(index)}
                  aria-expanded={expanded}
                  aria-controls={layerPanelId}
                  className="group/capa flex w-full items-center gap-3 bg-fx-bg px-4 py-4 text-left transition-colors duration-300 hover:bg-[#FAF0F6] lg:gap-4 lg:px-10 lg:py-5"
                  data-tina-field={tinaField(capa, "name")}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className={`shrink-0 text-fx-muted transition-[transform,color] duration-300 ease-fx-spring group-hover/capa:text-fx-purple ${
                      expanded ? "rotate-90 text-fx-purple" : ""
                    }`}
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[17px] font-medium text-fx-ink lg:text-[20px]">{tField(capa, "name", locale)}</span>
                    {matriz.showVendors && capa.vendor && (
                      <span className="font-mono text-[12px] tracking-[.08em] text-fx-muted" data-tina-field={tinaField(capa, "vendor")}>
                        {capa.vendor}
                      </span>
                    )}
                    <span className="text-[13px] text-fx-muted">({rows.length})</span>
                  </span>
                </button>
                {expanded && (
                  <div id={layerPanelId} role="table" aria-label={tField(capa, "name", locale)} className="pb-3">
                    {rows.map((row, r) => (
                      <div key={r} role="row" className={`${GRID} border-t border-fx-soft`} data-tina-field={tinaField(row, "feature")}>
                        <div role="rowheader" className="px-4 py-3.5 text-[13px] leading-[1.4] text-fx-body lg:px-10 lg:text-[15px]">
                          {tField(row, "feature", locale)}
                        </div>
                        {PLAN_KEYS.map((key, i) => (
                          <div key={key} role="cell" className={`grid place-items-center px-0.5 py-3.5 lg:px-2 ${columnTint(i)}`}>
                            <MatrixCell value={row[key]} locale={locale} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="flex justify-center border-t border-fx-line px-4 py-6">{toggleButton}</div>
        </div>
      )}
    </div>
  );
}
