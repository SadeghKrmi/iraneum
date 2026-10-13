/**
 * The path the site is published under, e.g. "/iraneum" on GitHub Pages; empty when it is served from the root
 * (local development, tests). Set at build time through NEXT_PUBLIC_BASE_PATH, which also sets Next's basePath.
 * next/link and the router add it by themselves; plain URLs (fetches, icons, audio) go through withBase().
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** A root-relative URL (starting with "/") under the site's base path. */
export function withBase(path: string): string {
  return basePath + path;
}
