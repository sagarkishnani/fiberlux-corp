import client from "../../tina/__generated__/client";
import { byDateDesc, toPostSummary, type PostSummary } from "./postMeta";

export async function loadRelatedPosts(tags: (string | null)[] | null | undefined, limit = 3): Promise<PostSummary[]> {
  try {
    const result = await client.queries.postConnection({ first: 50, sort: "date" });
    const all = ((result.data?.postConnection?.edges || []) as any[])
      .map((e) => e?.node)
      .filter(Boolean)
      .map(toPostSummary)
      .sort(byDateDesc);
    const wanted = (tags || []).filter(Boolean) as string[];
    const matching = wanted.length ? all.filter((p) => (p.tags || []).some((tag) => tag && wanted.includes(tag))) : [];
    return (matching.length ? matching : all).slice(0, limit);
  } catch {
    return [];
  }
}

export async function loadServiciosForm() {
  const formQuery = await client.queries.dynamicForms({ relativePath: "servicios.json" });
  return { query: formQuery.query, variables: formQuery.variables, data: formQuery.data };
}
