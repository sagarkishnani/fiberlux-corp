import { isValidElement, useEffect, useState, type ComponentType, type ReactNode } from "react";
import type { IconType } from "react-icons";
import { LuCircle } from "react-icons/lu";
import { USED_ICONS } from "../../icons/used-icons.generated";

type LegacyGlyph = ComponentType<{ size?: number | string; className?: string }> | ReactNode;

interface IconProps {
  name?: string | null;
  legacy?: Record<string, LegacyGlyph>;
  size?: number | string;
  strokeWidth?: number;
  className?: string;
}

export function toLucideExport(name: string) {
  return "Lu" + name.split("-").filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join("");
}

function isTinaEditor() {
  return typeof window !== "undefined" && window.self !== window.top;
}

// El catálogo completo de Lucide pesa ~80 KB gzip: solo se descarga dentro del editor de Tina,
// para ver al instante un ícono recién elegido. En el sitio público solo existen los íconos del
// mapa generado en el build.
let lucideCatalog: Promise<Record<string, IconType>> | null = null;
function loadLucideCatalog() {
  lucideCatalog ??= import("../../icons/lucide-catalog.generated.mjs") as unknown as Promise<Record<string, IconType>>;
  return lucideCatalog;
}

function useEditorLucideIcon(name: string, skip: boolean) {
  const [resolved, setResolved] = useState<{ name: string; icon: IconType | null } | null>(null);
  useEffect(() => {
    if (skip || !name || !isTinaEditor()) return;
    let cancelled = false;
    loadLucideCatalog().then((pkg) => {
      if (!cancelled) setResolved({ name, icon: pkg[toLucideExport(name)] ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, [name, skip]);
  return resolved?.name === name ? resolved.icon : undefined;
}

export default function Icon({ name, legacy, size = "1em", strokeWidth = 1.75, className }: IconProps) {
  const key = (name || "").trim();
  const legacyGlyph = key && legacy ? legacy[key] : undefined;
  const usedIcon = key ? USED_ICONS[key] : undefined;
  const editorIcon = useEditorLucideIcon(key, legacyGlyph !== undefined || Boolean(usedIcon));

  if (legacyGlyph !== undefined) {
    if (isValidElement(legacyGlyph) || typeof legacyGlyph !== "function") return <>{legacyGlyph}</>;
    const Glyph = legacyGlyph as ComponentType<{ size?: number | string; className?: string }>;
    return <Glyph size={size} className={className} />;
  }

  const LucideIcon = usedIcon ?? editorIcon;
  if (LucideIcon) return <LucideIcon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;

  if (key && import.meta.env.DEV && (!isTinaEditor() || editorIcon === null)) console.warn(`[Icon] "${key}" no existe en Lucide.`);
  return <LuCircle size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}
