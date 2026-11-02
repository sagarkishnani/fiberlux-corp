import type { Locale } from "../i18n/config";

const MONTHS_ES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const MONTHS_EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export interface PostSummary {
  title?: string | null;
  title_en?: string | null;
  coverImage?: string | null;
  tags?: (string | null)[] | null;
  readTime?: string | null;
  date?: string | null;
  slug: string;
}

export function postMeta(post: { date?: string | null; readTime?: string | null }, locale: Locale): string {
  const parts: string[] = [];
  if (post.date) {
    const d = new Date(post.date);
    if (!isNaN(d.getTime())) {
      const month = (locale === "en" ? MONTHS_EN : MONTHS_ES)[d.getUTCMonth()];
      parts.push(`${String(d.getUTCDate()).padStart(2, "0")} ${month} ${d.getUTCFullYear()}`);
    }
  }
  if (post.readTime) parts.push(post.readTime.toUpperCase());
  return parts.join(" · ");
}

export function firstTag(post: { tags?: (string | null)[] | null }): string {
  return (post.tags || []).find(Boolean) || "";
}

export function toPostSummary(node: any): PostSummary {
  return {
    title: node.title ?? null,
    title_en: node.title_en ?? null,
    coverImage: node.coverImage ?? null,
    tags: node.tags ?? null,
    readTime: node.readTime ?? null,
    date: node.date ?? null,
    slug: node._sys.filename,
  };
}

export function byDateDesc(a: { date?: string | null }, b: { date?: string | null }): number {
  return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
}
