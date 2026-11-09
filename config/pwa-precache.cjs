// Cache the home/offline app and its dependency graph during installation.
// The /offline HTML itself is added by addOfflinePageToPrecache below.
// Other routes use the existing static-resource runtime cache when visited.
function excludeUnusedRouteJavaScript({ asset, compilation }) {
  // Only .next/static is public. Internal manifests/server outputs must stay out.
  if (!asset.name.startsWith('static/')) return true;
  if (!asset.name.startsWith('static/chunks/') || !asset.name.endsWith('.js')) return false;
  const home = compilation.entrypoints.get('app/page');
  if (!home) throw new Error('Cannot determine home page assets for PWA precaching');
  const required = new Set();
  // Every App Router page also loads the root error boundaries; without them the
  // offline fallback cannot hydrate (its buttons and reconnect reload stay inert).
  for (const name of ['main-app', 'app/layout', 'app/page', 'app/offline/page', 'app/error', 'app/global-error']) {
    const entry = compilation.entrypoints.get(name);
    if (!entry) continue;
    for (const file of entry.getFiles()) required.add(file);
  }
  // Next emits the shared root layout separately from route entrypoints.
  if (/^static\/chunks\/app\/layout-/.test(asset.name)) return false;
  return !required.has(asset.name);
}

// Precache the static /offline page used as the navigation fallback.
// A null revision is replaced with the build ID by next-pwa's own transform,
// so each deployment re-fetches the HTML that matches its JavaScript chunks.
async function addOfflinePageToPrecache(entries) {
  if (entries.some(entry => entry.url === '/offline')) return { manifest: entries, warnings: [] };
  return { manifest: [...entries, { url: '/offline', revision: null }], warnings: [] };
}

module.exports = { excludeUnusedRouteJavaScript, addOfflinePageToPrecache };
