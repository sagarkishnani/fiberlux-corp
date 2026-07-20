/**
 * Resolves a CMS image field to a URL the site can actually serve.
 *
 * Why this exists: the media store is git-based (`public/`), so image fields
 * are authored as relative paths like `images/soluciones/x.webp`. At build time
 * (SSR) that raw value is used and resolves to `/images/...` correctly. But on
 * the deployed site `useTina()` re-fetches from Tina Cloud, which rewrites those
 * fields to absolute CDN URLs like `https://assets.tina.io/<id>/images/...`.
 * Prepending `BASE_URL` to that absolute URL produced `/https://assets.tina.io/...`
 * → 404 (see the solution-category, home 3D cover and testimonial avatars).
 *
 * Fix: normalize back to the LOCAL asset. Whatever Tina returns, extract the
 * `images/...` segment and serve it from our own `public/` folder. That keeps
 * SSR and client output identical and never depends on Tina's CDN.
 *
 * Truly external URLs (e.g. an Unsplash `https://images.unsplash.com/photo-...`,
 * which has no `images/` path segment) are left untouched.
 */
export function mediaUrl(value?: string | null): string {
  if (!value) return "";
  const base = import.meta.env.BASE_URL || "/";

  // Tina's media loader prepends `https://assets.tina.io/<id>` to EVERY image
  // field value. When the value was already an absolute URL (e.g. an Unsplash
  // avatar), it glues the prefix directly onto it:
  //   https://assets.tina.io/<id>https://images.unsplash.com/photo-...
  // Recover the embedded URL by taking the last http(s):// occurrence.
  const idx = Math.max(value.lastIndexOf("https://"), value.lastIndexOf("http://"));
  if (idx > 0) {
    value = value.slice(idx);
  }

  // Local git-media asset: capture the `images/...` path (relative, or embedded
  // in the Tina CDN URL) and serve it from our own `public/` folder. Tina glues
  // its prefix with OR without a slash depending on whether the stored value had
  // a leading `/`, so we match `images/` at any position. The required trailing
  // slash in `images\/` means the host `images.unsplash.com` never matches.
  const match = value.match(/(images\/[^?#\s]+)/);
  if (match) {
    return `${base}${match[1]}`.replace(/([^:])\/\//g, "$1/");
  }

  // Truly external URL (e.g. Unsplash) → leave untouched.
  return value;
}
