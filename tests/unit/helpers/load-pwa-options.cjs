const { readFileSync } = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const vm = require('node:vm');

// Evaluate next.config.js in isolation and capture the options passed to next-pwa.
// The rules run in the browser's service worker, so `self.location` is the site origin.
function loadPwaOptions(origin = 'https://www.gatareview.com') {
  const configPath = path.resolve(__dirname, '../../../next.config.js');
  const requireConfig = createRequire(configPath);
  let options;
  vm.runInNewContext(readFileSync(configPath, 'utf8'), {
    process: { env: { NODE_ENV: 'test' } },
    module: { exports: {} },
    self: { location: { origin }, registration: { scope: `${origin}/` } },
    require(name) {
      if (name === 'next-pwa') return pwaOptions => {
        options = pwaOptions;
        return config => config;
      };
      if (name === '@sentry/nextjs/config') return { withSentryConfig: config => config };
      return requireConfig(name);
    },
  }, { filename: configPath });
  return options;
}

module.exports = { loadPwaOptions };
