import type { ReactNode } from "react";

export function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 12, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
    </svg>
  );
}

type PillVariant = "purple" | "dark" | "lilac" | "white";

const PILL_VARIANT: Record<PillVariant, { pill: string; circle: string }> = {
  purple: {
    pill: "bg-fx-purple text-white hover:bg-fx-purple-hover hover:text-white",
    circle: "bg-white text-fx-purple",
  },
  dark: {
    pill: "bg-fx-ink text-white hover:bg-fx-ink-dark hover:text-white",
    circle: "bg-white text-fx-ink",
  },
  lilac: {
    pill: "bg-fx-lilac text-fx-ink hover:bg-fx-line-strong hover:text-fx-ink",
    circle: "bg-white text-fx-purple",
  },
  white: {
    pill: "bg-white text-fx-purple hover:bg-fx-soft hover:text-fx-purple-hover",
    circle: "bg-fx-purple text-white group-hover/pill:bg-fx-purple-deep",
  },
};

const PILL_SIZE = {
  md: { left: "h-12 gap-3 pl-1.5 pr-[22px] text-[14px]", right: "h-12 gap-3 pl-[22px] pr-1.5 text-[14px]", circle: "h-9 w-9", icon: 15 },
  lg: { left: "h-14 gap-3.5 pl-2 pr-7 text-[15px]", right: "h-14 gap-3.5 pl-6 pr-2 text-[15px]", circle: "h-10 w-10", icon: 16 },
};

export function PillLink({
  href,
  children,
  variant = "purple",
  iconSide = "right",
  size = "md",
  className = "",
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: PillVariant;
  iconSide?: "left" | "right";
  size?: "md" | "lg";
  className?: string;
  [attr: string]: unknown;
}) {
  const v = PILL_VARIANT[variant];
  const s = PILL_SIZE[size];
  const circle = (
    <span
      className={`grid shrink-0 place-items-center rounded-full transition-transform duration-[450ms] ease-fx-spring group-hover/pill:-rotate-45 ${s.circle} ${v.circle}`}
    >
      <ArrowIcon size={s.icon} />
    </span>
  );
  return (
    <a
      href={href}
      className={`group/pill inline-flex items-center rounded-full font-medium transition-[background,box-shadow,color] duration-300 ${
        iconSide === "left" ? s.left : s.right
      } ${v.pill} ${className}`}
      {...rest}
    >
      {iconSide === "left" && circle}
      {children}
      {iconSide === "right" && circle}
    </a>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`font-mono text-[12px] font-medium tracking-[.2em] text-fx-muted lg:text-[13px] ${className}`}>
      {children}
    </div>
  );
}

const SOCIAL_ICON: Record<string, string> = {
  facebook: "fb.svg",
  linkedin: "in.svg",
  instagram: "ig.svg",
  whatsapp: "wa.svg",
  youtube: "yt.svg",
};

export function socialIconSrc(platform?: string | null): string {
  const file = SOCIAL_ICON[(platform || "").toLowerCase()];
  return file ? `${import.meta.env.BASE_URL.replace(/\/$/, "")}/images/rediseno/${file}` : "";
}

export function fxAsset(file: string): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, "")}/images/rediseno/${file}`;
}
