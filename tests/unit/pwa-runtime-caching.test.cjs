const assert = require('node:assert/strict');
const test = require('node:test');
const { loadPwaOptions } = require('./helpers/load-pwa-options.cjs');
const { addOfflinePageToPrecache } = require('../../config/pwa-precache.cjs');

const origin = 'https://www.gatareview.com';
const options = loadPwaOptions(origin);

// Workbox uses the first matching runtime route (after the precache route).
function route(target, request) {
  return options.runtimeCaching.find(rule => rule.urlPattern({ url: new URL(target, origin), request }));
}
const navigate = { mode: 'navigate', destination: 'document' };
const image = { mode: 'no-cors', destination: 'image' };

test('next-pwa does not inject its Pages Router registration or its own start-url cache', () => {
  assert.equal(options.register, false);
  assert.equal(options.dynamicStartUrl, false);
  assert.equal(options.cacheStartUrl, false);
});

test('only a plain navigation to the home page uses the home cache', () => {
  const home = route('/', navigate);
  assert.equal(home.handler, 'NetworkFirst');
  assert.equal(home.options.cacheName, 'start-url-v2');
  for (const target of ['/?from=pwa', '/lectures', '/lectures/123', '/mypage', '/mypage/reviews', '/auth/signin', '/faq', '/privacy']) {
    const rule = route(target, navigate);
    assert.equal(rule.handler, 'NetworkOnly', target);
    assert.equal(rule.options?.cacheName, undefined, target);
  }
  // Non-navigation requests for "/" (RSC payloads, fetch) are never stored.
  assert.equal(route('/', { mode: 'cors', destination: '' }), undefined);
  assert.equal(route('/?_rsc=abc', { mode: 'cors', destination: '' }), undefined);
});

test('API and auth navigations stay on the network-only API rule', () => {
  for (const target of ['/api/auth/callback/google?code=x', '/api/auth/signout', '/api/public/lectures']) {
    const rule = route(target, navigate);
    assert.equal(rule.handler, 'NetworkOnly', target);
    assert.equal(rule, options.runtimeCaching[0], target);
  }
});

test('every navigation rule falls back to the precached offline page only on network errors', () => {
  const rules = [route('/', navigate), route('/lectures/1', navigate)];
  for (const rule of rules) {
    const plugin = rule.options.plugins.find(p => p.handlerDidError);
    assert.ok(plugin, rule.options.cacheName || 'navigation');
    assert.match(String(plugin.handlerDidError), /caches\.match\('\/offline'/);
    assert.match(String(plugin.handlerDidError), /workbox-precache-v2-/);
  }
});

test('the home cache only keeps public, successful, same-origin HTML', async () => {
  const { cacheWillUpdate } = route('/', navigate).options.plugins.find(p => p.cacheWillUpdate);
  // A minimal stand-in for the Response a service worker sees (type/redirected are read-only on real ones).
  const response = ({ status = 200, headers = {} } = {}, { type = 'basic', redirected = false } = {}) => ({
    status, type, redirected,
    headers: new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate', ...headers }),
  });
  assert.ok(await cacheWillUpdate({ response: response() }));
  assert.equal(await cacheWillUpdate({ response: response({ headers: { 'Content-Type': 'text/html', 'Cache-Control': 'private, no-cache, no-store' } }) }), null);
  assert.equal(await cacheWillUpdate({ response: response({ headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } }) }), null);
  assert.equal(await cacheWillUpdate({ response: response({ headers: { 'Content-Type': 'application/json' } }) }), null);
  assert.equal(await cacheWillUpdate({ response: response({ status: 500 }) }), null);
  assert.equal(await cacheWillUpdate({ response: response({}, { redirected: true }) }), null);
  assert.equal(await cacheWillUpdate({ response: response({}, { type: 'opaqueredirect' }) }), null);
  assert.equal(await cacheWillUpdate({ response: undefined }), null);
});

test('optimized images are cached only when the source is an allowlisted public file', () => {
  const header = route('/_next/image?url=%2Fwhite-header-title.png&w=640&q=75', image);
  assert.equal(header.options.cacheName, 'images-v2');
  for (const target of [
    '/_next/image?url=https%3A%2F%2Flh3.googleusercontent.com%2Fa%2Fprivate&w=64&q=75',
    '/_next/image?url=%2Fwhite-header-title.png&url=https%3A%2F%2Flh3.googleusercontent.com%2Fa%2Fx&w=64&q=75',
    '/_next/image?url=%2Fmypage%2Fprivate.png&w=64&q=75',
    '/_next/image?url=%2Fwhite-header-title.png%3Fx%3D1&w=64&q=75',
    '/_next/image?w=64&q=75',
  ]) {
    assert.equal(route(target, image)?.options?.cacheName, undefined, target);
  }
  // Same allowlisted path but not an image request (e.g. a navigation) is not stored as an image.
  assert.equal(route('/_next/image?url=%2Fwhite-header-title.png&w=640&q=75', navigate).handler, 'NetworkOnly');
});

test('the offline page is added to the precache once and receives the build revision later', async () => {
  const { manifest } = await addOfflinePageToPrecache([{ url: '/icon.png', revision: 'a' }]);
  assert.deepEqual(manifest.filter(entry => entry.url === '/offline'), [{ url: '/offline', revision: null }]);
  const again = await addOfflinePageToPrecache(manifest);
  assert.equal(again.manifest.filter(entry => entry.url === '/offline').length, 1);
  assert.ok(options.manifestTransforms.includes(addOfflinePageToPrecache));
});
