/**
 * Índice de búsqueda generado en build (SPEC 81).
 *
 * Emite `/search-index.json` con una entrada por destino buscable del sitio:
 * categorías de soluciones, subservicios, posts del blog y páginas principales.
 * El overlay de búsqueda (SearchOverlay.tsx) lo baja una vez y filtra en cliente.
 *
 * Soluciones/subservicios se leen con import.meta.glob (JSON nativo de Vite);
 * el blog (MDX) se lee con el client de Tina (no hay integración MDX de Astro).
 */

import { client } from "../../tina/__generated__/client";

import type { SearchEntry, SearchFragment } from "../utils/search";

const PLAN_KEYS = [
  ["start", "Start"],
  ["pro", "Pro"],
  ["max", "Max"],
] as const;

const INCLUDED_IN = { es: "incluido en", en: "included in" };

function plansIncluding(row: any) {
  return PLAN_KEYS.flatMap(([key, label]) => {
    const value = String(row?.[key] ?? "").trim();
    if (!value || value.toLowerCase() === "no") return [];
    return value.toLowerCase() === "si" ? [label] : [`${label} (${value})`];
  });
}

function fragment(es: string | undefined, en?: string): SearchFragment | null {
  const text = (es || "").trim();
  if (!text) return null;
  return { text, text_en: (en || "").trim() || undefined };
}

function cyberguardFragments(cyberguard: any): SearchFragment[] {
  const fragments: Array<SearchFragment | null> = [];

  for (const plan of cyberguard.planes?.items || []) {
    if (!plan) continue;
    fragments.push(fragment(plan.subtitle ? `${plan.name} · ${plan.subtitle}` : plan.name, plan.subtitle_en && `${plan.name} · ${plan.subtitle_en}`));
    fragments.push(fragment(plan.idealFor && `${plan.name} · ${plan.idealFor}`, plan.idealFor_en && `${plan.name} · ${plan.idealFor_en}`));
    for (const feature of plan.features || []) {
      fragments.push(fragment(feature?.text && `${plan.name} · ${feature.text}`, feature?.text_en && `${plan.name} · ${feature.text_en}`));
    }
  }

  for (const front of cyberguard.frentes?.items || []) {
    fragments.push(fragment(front?.title && `${front.title} · ${front.text || ""}`, front?.title_en && `${front.title_en} · ${front.text_en || ""}`));
  }

  for (const item of cyberguard.faq?.items || []) {
    fragments.push(fragment(item?.question, item?.question_en));
  }

  for (const layer of cyberguard.matriz?.capas || []) {
    if (!layer) continue;
    const layerEn = layer.name_en || layer.name;
    if (layer.vendor) {
      fragments.push(fragment(`${layer.name} (${layer.vendor})`, `${layerEn} (${layer.vendor})`));
    }
    for (const row of layer.rows || []) {
      if (!row?.feature) continue;
      const plans = plansIncluding(row).join(", ");
      const featureEn = row.feature_en || row.feature;
      fragments.push(
        fragment(
          plans ? `${layer.name} · ${row.feature} — ${INCLUDED_IN.es} ${plans}` : `${layer.name} · ${row.feature}`,
          plans ? `${layerEn} · ${featureEn} — ${INCLUDED_IN.en} ${plans}` : `${layerEn} · ${featureEn}`
        )
      );
    }
  }

  return fragments.filter((f): f is SearchFragment => f !== null);
}

/* URLs BASE_URL-aware (el sitio puede desplegarse bajo /staging). */
const base = import.meta.env.BASE_URL || "/";
const withBase = (path: string) => `${base}/${path}`.replace(/\/{2,}/g, "/");

/* Nombre de archivo (sin extensión) a partir de la ruta del glob. */
const fileSlug = (key: string) =>
  key.split("/").pop()!.replace(/\.(json|mdx)$/, "");

export async function getStaticPaths() {
  return [{ params: {} }];
}

export async function GET() {
  const entries: SearchEntry[] = [];

  // ── Categorías de soluciones (colección service) ──
  const services = import.meta.glob("/src/content/services/*.json", {
    eager: true,
  });
  for (const [key, mod] of Object.entries(services)) {
    const doc: any = (mod as any).default ?? mod;
    const slug = doc.slug || fileSlug(key);
    const entry: SearchEntry = {
      title: doc.title || slug,
      title_en: doc.title_en || "",
      description: doc.hero?.intro || doc.hero?.heading || "",
      description_en: doc.hero?.intro_en || "",
      url: withBase(`soluciones/${slug}`),
      type: "solucion",
    };
    if (doc.cyberguard?.hero?.title) {
      entry.title = "Cyberguard";
      entry.title_en = "Cyberguard";
      entry.category = doc.title || slug;
      entry.category_en = doc.title_en || "";
      entry.fragments = cyberguardFragments(doc.cyberguard);
      entry.keywords = (doc.cyberguard.searchKeywords || []).filter(Boolean);
    }
    entries.push(entry);
  }

  // ── Subservicios (colección subservicio) ──
  const subs = import.meta.glob("/src/content/subservicios/*.json", {
    eager: true,
  });
  for (const [key, mod] of Object.entries(subs)) {
    const doc: any = (mod as any).default ?? mod;
    const slug = doc.slug || fileSlug(key);
    if (!doc.solucionSlug) continue;
    entries.push({
      title: doc.title || slug,
      title_en: doc.title_en || "",
      description: doc.hero?.intro || doc.hero?.note || "",
      description_en: doc.hero?.intro_en || "",
      url: withBase(`soluciones/${doc.solucionSlug}/${slug}`),
      type: "subservicio",
      category: doc.solucionTitle || "",
      category_en: doc.solucionTitle_en || "",
    });
  }

  // ── Posts del blog (colección post / MDX, vía Tina) ──
  try {
    const postsQuery = await client.queries.postConnection({ last: 200 });
    const edges = postsQuery.data?.postConnection?.edges || [];
    for (const edge of edges) {
      const node: any = edge?.node;
      if (!node) continue;
      const slug = node._sys?.filename;
      if (!slug) continue;
      entries.push({
        title: node.title || slug,
        title_en: node.title_en || "",
        description: node.excerpt || "",
        description_en: node.excerpt_en || "",
        url: withBase(`blog/${slug}`),
        type: "blog",
      });
    }
  } catch {
    /* sin blog en el índice si la query falla */
  }

  // ── Páginas principales (entradas fijas) ──
  const pages: Array<Omit<SearchEntry, "type">> = [
    { title: "Nosotros", title_en: "About us", description: "Conoce a Fiberlux, nuestra historia y valores.", description_en: "Get to know Fiberlux, our history and values.", url: withBase("nosotros") },
    { title: "Casos de éxito", title_en: "Success stories", description: "Cómo ayudamos a nuestros clientes en conectividad, seguridad y comunicación.", description_en: "How we help our clients with connectivity, security and communication.", url: withBase("casos-de-exito") },
    { title: "Contacto", title_en: "Contact", description: "Contáctate con nosotros.", description_en: "Get in touch with us.", url: withBase("contacto") },
    { title: "Formas de pago", title_en: "Payment methods", description: "Medios y pasos para pagar tu servicio Fiberlux.", description_en: "Methods and steps to pay for your Fiberlux service.", url: withBase("formas-de-pago") },
    { title: "Soporte técnico", title_en: "Technical support", description: "Contáctate con nuestros ingenieros especializados.", description_en: "Get in touch with our specialized engineers.", url: withBase("soporte-tecnico") },
    { title: "Información a abonados y usuarios", title_en: "Subscriber & user information", description: "Información para abonados y usuarios (OSIPTEL).", description_en: "Information for subscribers and users (OSIPTEL).", url: withBase("informacion-abonados") },
    { title: "Fiberlux App", title_en: "Fiberlux App", description: "Controla y monitorea tus servicios Fiberlux desde tu celular.", description_en: "Control and monitor your Fiberlux services from your phone.", url: withBase("fiberlux-app") },
    { title: "Blog", title_en: "Blog", description: "Artículos y novedades de Fiberlux.", description_en: "Fiberlux articles and news.", url: withBase("blog") },
    { title: "Soluciones", title_en: "Solutions", description: "Todas las soluciones de Fiberlux para tu empresa.", description_en: "All of Fiberlux's solutions for your business.", url: withBase("soluciones") },
  ];
  for (const p of pages) entries.push({ ...p, type: "pagina" });

  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json" },
  });
}
