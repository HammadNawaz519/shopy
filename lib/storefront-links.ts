/**
 * Store Pages — single source of the collection-card link rule.
 *
 * A category's stored target (categories.target_page) only wins when it
 * points at an ACTIVE custom page; anything else — a null target, a hidden
 * page, a deleted page, or an invalid legacy value — falls back to the
 * standard collection URL. This keeps the homepage sections, the homepage
 * collection grid, and /collections perfectly consistent, and guarantees no
 * broken link is ever rendered.
 */
export function collectionCardHref(
  category: { slug: string; targetPage?: string | null },
  activePageSlugs: readonly string[]
): string {
  const target = category.targetPage ?? null;
  if (target && activePageSlugs.includes(target)) return `/pages/${target}`;
  return `/collections/${category.slug}`;
}
