import { Fragment, type ReactNode } from "react";

export function stripEmphasis(text: string | null | undefined): string {
  return (text || "").replace(/\*/g, "");
}

export function renderEmphasis(text: string | null | undefined, emphasisClass = "font-semibold text-fx-purple"): ReactNode {
  const parts = (text || "").split("*");
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className={emphasisClass}>
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}
