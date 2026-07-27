/**
 * Búsqueda client-side sobre el índice `/search-index.json` (SPEC 81).
 * Coincidencia simple normalizada (minúsculas + sin tildes), por términos,
 * con un ranking básico (título pesa más que descripción; startsWith y match
 * exacto de término dan boost). Sin dependencias externas.
 */

export type SearchType = "solucion" | "subservicio" | "pagina" | "blog";

export interface SearchEntry {
  title: string;
  description?: string;
  url: string;
  type: SearchType;
  category?: string;
}

/** minúsculas + sin diacríticos (á→a). */
export function normalize(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/**
 * Filtra y ordena entradas por una query. Exige que TODOS los términos de la
 * query aparezcan en el texto buscable (title + category + description).
 * Devuelve las entradas ordenadas por relevancia descendente.
 */
export function searchEntries(
  entries: SearchEntry[],
  query: string
): SearchEntry[] {
  const q = normalize(query);
  if (!q) return [];

  const terms = q.split(/\s+/).filter(Boolean);

  const scored = entries
    .map((entry) => ({ entry, score: scoreEntry(entry, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((r) => r.entry);
}

function scoreEntry(entry: SearchEntry, terms: string[]): number {
  const title = normalize(entry.title);
  const category = normalize(entry.category || "");
  const description = normalize(entry.description || "");

  let score = 0;
  for (const term of terms) {
    const inTitle = title.includes(term);
    const inCategory = category.includes(term);
    const inDescription = description.includes(term);

    // Todos los términos deben aparecer en algún campo; si falta uno, descarta.
    if (!inTitle && !inCategory && !inDescription) return 0;

    if (inTitle) {
      score += 10;
      if (title.startsWith(term)) score += 5;
    }
    if (inCategory) score += 4;
    if (inDescription) score += 2;
  }

  // Boost si el título completo coincide exactamente con la query.
  if (title === terms.join(" ")) score += 20;

  return score;
}
