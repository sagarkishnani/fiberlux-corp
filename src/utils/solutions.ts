/**
 * Fuente de verdad de las 4 soluciones (categorías) del sitio.
 * El `slug` coincide con el filename de `src/content/services/<slug>.json`
 * y con la ruta `/soluciones/<slug>`. Los tags del blog guardan estos slugs;
 * el `label` es el nombre legible que se muestra en las pills.
 */
export const SOLUTIONS = [
  { slug: "conectividad-empresarial", label: "Conectividad Empresarial" },
  { slug: "ciberseguridad-gestionada", label: "Ciberseguridad Gestionada" },
  { slug: "data-center-cloud", label: "Data Center, Cloud y Continuidad de Negocio" },
  { slug: "servicios-gestionados", label: "Servicios Gestionados" },
] as const;

export type SolutionSlug = (typeof SOLUTIONS)[number]["slug"];

const LABEL_BY_SLUG: Record<string, string> = Object.fromEntries(
  SOLUTIONS.map((s) => [s.slug, s.label]),
);

/** slug de solución → nombre legible. Si no es un slug conocido, devuelve el valor tal cual. */
export function solutionLabel(slug: string): string {
  return LABEL_BY_SLUG[slug] || slug;
}
