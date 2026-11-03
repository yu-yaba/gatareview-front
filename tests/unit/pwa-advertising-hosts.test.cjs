const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const test = require('node:test');
const vm = require('node:vm');

const configPath = path.resolve(__dirname, '../../next.config.js');
const requireConfig = createRequire(configPath);
let runtimeCaching;
vm.runInNewContext(readFileSync(configPath, 'utf8'), {
  process: { env: { NODE_ENV: 'test' } },
  module: { exports: {} },
  require(name) {
    if (name === 'next-pwa') return options => {
      runtimeCaching = options.runtimeCaching;
      return config => config;
    };
    if (name === '@sentry/nextjs/config') return { withSentryConfig: config => config };
    return requireConfig(name);
  },
}, { filename: configPath });

function isNetworkOnly(target) {
  return runtimeCaching.some(rule => rule.handler === 'NetworkOnly'
    && rule.urlPattern({ url: new URL(target) }));
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
