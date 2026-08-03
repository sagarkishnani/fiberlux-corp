import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Button — fuente única de botón CTA del sitio (SPEC 88).
 *
 * Formato fijo (del Figma del cliente): radio 8px, alto 48px, sin sombra/glow.
 * Dos variantes:
 *   - primary   → relleno magenta de marca (#96237A, hover #650F50), texto blanco.
 *   - secondary → borde blanco, fondo transparente, texto blanco.
 *
 * Renderiza <a> si recibe `href`, si no <button>. Para plantillas .astro usar
 * el helper `buttonClass(variant)` sobre un <a>/<button> nativo.
 *
 * El radio va como valor explícito `rounded-[8px]` (no `rounded-lg`) porque el
 * proyecto tiene `borderRadius` custom en tailwind.config.mjs.
 */

export type ButtonVariant = "primary" | "secondary";

const BASE =
  "group inline-flex items-center justify-center h-12 px-7 rounded-[8px] font-medium text-base leading-none transition-all duration-300 whitespace-nowrap";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-[#96237A] hover:bg-[#650F50] text-white",
  secondary:
    "border border-white/80 hover:border-white bg-transparent hover:bg-white/5 text-white",
};

/** Devuelve el string de clases del botón (para usar en .astro o componer). */
export function buttonClass(
  variant: ButtonVariant = "primary",
  extra = ""
): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`.trim();
}

type CommonProps = {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

type AnchorProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
  };

type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

export type ButtonProps = AnchorProps | NativeButtonProps;

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const cls = buttonClass(variant, className);

  if ("href" in rest && rest.href !== undefined) {
    return (
      <a className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  const { type = "button", ...btnRest } =
    rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={cls} type={type} {...btnRest}>
      {children}
    </button>
  );
}
