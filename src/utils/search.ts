/**
 * Búsqueda client-side sobre el índice `/search-index.json` (SPEC 81).
 * Coincidencia simple normalizada (minúsculas + sin tildes), por términos,
 * con un ranking básico (título pesa más que descripción; startsWith y match
 * exacto de término dan boost). Sin dependencias externas.
 *
 * SPEC 129: una entrada puede traer `fragments` (textos internos de la página,
 * p. ej. filas de la matriz Cyberguard) y `keywords` (siglas sin texto visible).
 * Ambos cuentan para el match; el fragmento que coincide se muestra como extracto.
 */

export type SearchType = "solucion" | "subservicio" | "pagina" | "blog";

export interface SearchFragment {
  text: string;
  text_en?: string;
}

export interface SearchEntry {
  title: string;
  title_en?: string;
  description?: string;
  description_en?: string;
  url: string;
  type: SearchType;
  category?: string;
  category_en?: string;
  fragments?: SearchFragment[];
  keywords?: string[];
}

export interface SearchHit {
  entry: SearchEntry;
  excerpt?: string;
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
 * query aparezcan en el texto buscable (title + category + description +
 * fragments + keywords). Devuelve los hits ordenados por relevancia descendente.
 */
export function searchEntries(
  entries: SearchEntry[],
  query: string
): SearchHit[] {
  const q = normalize(query);
  if (!q) return [];

  const terms = q.split(/\s+/).filter(Boolean);

  return entries
    .map((entry) => scoreEntry(entry, terms))
    .filter((r): r is ScoredHit => r !== null)
    .sort((a, b) => b.score - a.score)
    .map(({ entry, excerpt }) => ({ entry, excerpt }));
}

interface ScoredHit extends SearchHit {
  score: number;
}

function scoreEntry(entry: SearchEntry, terms: string[]): ScoredHit | null {
  const title = normalize(entry.title);
  const category = normalize(entry.category || "");
  const description = normalize(entry.description || "");
  const fragments = (entry.fragments || []).map((f) => ({ raw: f.text, norm: normalize(f.text) }));
  const keywords = (entry.keywords || []).map(normalize);

  let score = 0;
  const missingFromVisible: string[] = [];
  for (const term of terms) {
    const inTitle = title.includes(term);
    const inCategory = category.includes(term);
    const inDescription = description.includes(term);
    const inFragments = fragments.some((f) => f.norm.includes(term));
    const inKeywords = keywords.some((k) => k.includes(term));

    // Todos los términos deben aparecer en algún campo; si falta uno, descarta.
    if (!inTitle && !inCategory && !inDescription && !inFragments && !inKeywords) return null;

    if (inTitle) {
      score += 10;
      if (title.startsWith(term)) score += 5;
    }
    if (inCategory) score += 4;
    if (inDescription) score += 2;
    if (!inTitle && !inCategory && !inDescription) {
      score += 1;
      missingFromVisible.push(term);
    }
  }

  // Boost si el título completo coincide exactamente con la query.
  if (title === terms.join(" ")) score += 20;

  return { entry, score, excerpt: bestFragment(fragments, missingFromVisible) };
}

/** Primer fragmento que contiene más términos de los que no se vieron en título/categoría/descripción. */
function bestFragment(fragments: Array<{ raw: string; norm: string }>, terms: string[]) {
  if (!terms.length) return undefined;
  let best: string | undefined;
  let bestCount = 0;
  for (const f of fragments) {
    const count = terms.filter((t) => f.norm.includes(t)).length;
    if (count > bestCount) {
      best = f.raw;
      bestCount = count;
    }
  }
  return best;
}
