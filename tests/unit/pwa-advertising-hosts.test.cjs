const assert = require('node:assert/strict');
const test = require('node:test');
const { loadPwaOptions } = require('./helpers/load-pwa-options.cjs');

const { runtimeCaching } = loadPwaOptions();

function isNetworkOnly(target) {
  return runtimeCaching.some(rule => rule.handler === 'NetworkOnly'
    && rule.urlPattern({ url: new URL(target), request: { mode: 'no-cors', destination: 'image' } }));
}

test('advertising requests to the A8 domain and its subdomains bypass caching', () => {
  for (const target of ['https://a8.net/pixel.png', 'https://www.a8.net/pixel.png', 'https://img.ads.a8.net/pixel.png']) {
    assert.equal(isNetworkOnly(target), true, target);
  }
});

test('unrelated domains cannot impersonate A8 using a hostname suffix, path or credentials', () => {
  for (const target of [
    'https://nota8.net/pixel.png',
    'https://evil-a8.net/pixel.png',
    'https://a8.net.evil.test/pixel.png',
    'https://evil.test/a8.net/pixel.png',
    'https://a8.net@evil.test/pixel.png',
  ]) {
    assert.equal(isNetworkOnly(target), false, target);
  }
});
