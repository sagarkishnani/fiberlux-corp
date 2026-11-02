import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { localizeHref } from "../../utils/i18n";

export default function SolutionsBreadcrumb({
  locale,
  trail,
}: {
  locale: Locale;
  trail: { label: string; href?: string }[];
}) {
  const items = [{ label: t("crumb.soluciones", locale), href: "/soluciones" }, ...trail];
  return (
    <div
      data-reveal="up"
      data-reveal-distance="56"
      data-reveal-duration="1.2"
      data-reveal-ease="fx"
      className="flex flex-wrap items-center gap-2 text-[15px] text-fx-muted"
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-fx-purple">/</span>}
            {last || !item.href ? (
              <span className={last ? "font-medium text-fx-purple" : ""}>{item.label}</span>
            ) : (
              <a href={localizeHref(item.href, locale)} className="text-fx-muted transition-colors duration-200 hover:text-fx-ink">
                {item.label}
              </a>
            )}
          </span>
        );
      })}
    </div>
  );
}
