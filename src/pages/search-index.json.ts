/**
 * Índice de búsqueda generado en build (SPEC 81).
 *
 * Emite `/search-index.json` con una entrada por destino buscable del sitio:
 * categorías de soluciones, subservicios, posts del blog y páginas principales.
 * El overlay de búsqueda (SearchOverlay.tsx) lo baja una vez y filtra en cliente.
 *
 * Se lee el contenido directamente con import.meta.glob (no vía queries de Tina)
 * para no depender de la selección de campos de las queries generadas.
 */

export type SearchType = "solucion" | "subservicio" | "pagina" | "blog";

export interface SearchEntry {
  title: string;
  description?: string;
  url: string;
  type: SearchType;
  category?: string;
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
    entries.push({
      title: doc.title || slug,
      description: doc.hero?.intro || doc.hero?.heading || "",
      url: withBase(`soluciones/${slug}`),
      type: "solucion",
    });
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
      description: doc.hero?.intro || doc.hero?.note || "",
      url: withBase(`soluciones/${doc.solucionSlug}/${slug}`),
      type: "subservicio",
      category: doc.solucionTitle || "",
    });
  }

  // ── Posts del blog (frontmatter MDX) ──
  const posts = import.meta.glob("/src/content/blog/*.mdx", { eager: true });
  for (const [key, mod] of Object.entries(posts)) {
    const fm: any = (mod as any).frontmatter ?? {};
    const slug = fileSlug(key);
    entries.push({
      title: fm.title || slug,
      description: fm.excerpt || "",
      url: withBase(`blog/${slug}`),
      type: "blog",
    });
  }

  // ── Páginas principales (entradas fijas) ──
  const pages: Array<Omit<SearchEntry, "type">> = [
    { title: "Nosotros", description: "Conoce a Fiberlux, nuestra historia y valores.", url: withBase("nosotros") },
    { title: "Casos de éxito", description: "Cómo ayudamos a nuestros clientes en conectividad, seguridad y comunicación.", url: withBase("casos-de-exito") },
    { title: "Contacto", description: "Contáctate con nosotros.", url: withBase("contacto") },
    { title: "Formas de pago", description: "Medios y pasos para pagar tu servicio Fiberlux.", url: withBase("formas-de-pago") },
    { title: "Soporte técnico", description: "Contáctate con nuestros ingenieros especializados.", url: withBase("soporte-tecnico") },
    { title: "Información a abonados y usuarios", description: "Información para abonados y usuarios (OSIPTEL).", url: withBase("informacion-abonados") },
    { title: "Fiberlux App", description: "Controla y monitorea tus servicios Fiberlux desde tu celular.", url: withBase("fiberlux-app") },
    { title: "Blog", description: "Artículos y novedades de Fiberlux.", url: withBase("blog") },
    { title: "Soluciones", description: "Todas las soluciones de Fiberlux para tu empresa.", url: withBase("soluciones") },
  ];
  for (const p of pages) entries.push({ ...p, type: "pagina" });

  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json" },
  });
}
