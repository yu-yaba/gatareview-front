// Cache the home/offline app and its dependency graph during installation.
// Other routes use the existing static-resource runtime cache when visited.
function excludeUnusedRouteJavaScript({ asset, compilation }) {
  // Only .next/static is public. Internal manifests/server outputs must stay out.
  if (!asset.name.startsWith('static/')) return true;
  if (!asset.name.startsWith('static/chunks/') || !asset.name.endsWith('.js')) return false;
  const home = compilation.entrypoints.get('app/page');
  if (!home) throw new Error('Cannot determine home page assets for PWA precaching');
  const required = new Set();
  for (const name of ['main-app', 'app/layout', 'app/page', 'app/offline/page']) {
    const entry = compilation.entrypoints.get(name);
    if (!entry) continue;
    for (const file of entry.getFiles()) required.add(file);
  }
  // Next emits the shared root layout separately from route entrypoints.
  if (/^static\/chunks\/app\/layout-/.test(asset.name)) return false;
  return !required.has(asset.name);
}

module.exports = { excludeUnusedRouteJavaScript };
