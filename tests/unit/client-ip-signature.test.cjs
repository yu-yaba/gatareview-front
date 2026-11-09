const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  clientIpSignature,
  forwardingSecret,
  isTrustedVercelRuntime,
  normalizedRequestPath,
  signedClientIpHeaders,
  trustedClientIp,
} = require('../../app/_helpers/clientIpSignature.ts');

const secret = 'test-only-forwarding-secret-0123456789abcdef';

test('signatures match the vectors pinned in gatareview-back spec/requests/signed_client_ip_spec.rb', () => {
  assert.equal(
    clientIpSignature(secret, { timestamp: '1762650000', method: 'GET', path: '/api/v1/lectures/42/reviews', ip: '203.0.113.7' }),
    '1736d968df87e6b8f10b8fa1f27ce05e6904e7c4576bd7815bca0fab839e2e69',
  );
  assert.equal(
    clientIpSignature(secret, { timestamp: '1762650000', method: 'POST', path: '/api/v1/auth/google', ip: '2001:db8:1:2::abcd' }),
    '279db82b47ef2a930667238f495a20484fb897627828a461c50b0e6d26abcc5a',
  );
});

test('headers carry the IP, a seconds timestamp, and a signature over method and normalized path', () => {
  const headers = signedClientIpHeaders({
    secret, ip: '203.0.113.7', url: 'https://api.example.test/api/v1/lectures/42/reviews?x=1', now: 1_762_650_000_999,
  });
  assert.deepEqual(headers, {
    'X-Gatareview-Client-Ip': '203.0.113.7',
    'X-Gatareview-Client-Ip-Timestamp': '1762650000',
    'X-Gatareview-Client-Ip-Signature': '1736d968df87e6b8f10b8fa1f27ce05e6904e7c4576bd7815bca0fab839e2e69',
  });
  const post = signedClientIpHeaders({
    secret, ip: '2001:db8:1:2::abcd', url: 'https://api.example.test//api/v1/auth/google/', method: 'post', now: 1_762_650_000_000,
  });
  assert.equal(post['X-Gatareview-Client-Ip-Signature'], '279db82b47ef2a930667238f495a20484fb897627828a461c50b0e6d26abcc5a');
});

test('paths are normalized the same way Rack::Attack rewrites PATH_INFO', () => {
  assert.equal(normalizedRequestPath('https://h.test/api//v1///lectures/42/'), '/api/v1/lectures/42');
  assert.equal(normalizedRequestPath('https://h.test/'), '/');
  assert.equal(normalizedRequestPath('https://h.test/api/v1/lectures?search=a//b'), '/api/v1/lectures');
  assert.equal(normalizedRequestPath('https://h.test/api/v1/%e3%81%82'), '/api/v1/%E3%81%82');
  // Rails upper-cases escapes case-insensitively (%aB -> %AB).
  assert.equal(normalizedRequestPath('https://h.test/api/v1/lectures/%aB'), '/api/v1/lectures/%AB');
  assert.equal(normalizedRequestPath('https://h.test/api/v1/%Ab%cD'), '/api/v1/%AB%CD');
  assert.equal(normalizedRequestPath('https://h.test/api/v1/lectures/../reviews/latest'), '/api/v1/reviews/latest');
});

test('only a secret of at least 32 bytes enables forwarding', () => {
  assert.equal(forwardingSecret({}), null);
  assert.equal(forwardingSecret({ RATE_LIMIT_FORWARDING_SECRET: '' }), null);
  assert.equal(forwardingSecret({ RATE_LIMIT_FORWARDING_SECRET: 'a'.repeat(31) }), null);
  assert.equal(forwardingSecret({ RATE_LIMIT_FORWARDING_SECRET: 'a'.repeat(32) }), 'a'.repeat(32));
});

test('x-real-ip is trusted only on a Vercel production or preview runtime', () => {
  assert.equal(isTrustedVercelRuntime({ VERCEL: '1', VERCEL_ENV: 'production' }), true);
  assert.equal(isTrustedVercelRuntime({ VERCEL: '1', VERCEL_ENV: 'preview' }), true);
  assert.equal(isTrustedVercelRuntime({ VERCEL: '1', VERCEL_ENV: 'development' }), false);
  assert.equal(isTrustedVercelRuntime({}), false);
  assert.equal(isTrustedVercelRuntime({ VERCEL: 'true', VERCEL_ENV: 'production' }), false);
});

test('only a single valid IP address from x-real-ip is forwarded', () => {
  const from = (headers) => trustedClientIp(new Headers(headers), {});
  assert.equal(from({ 'x-real-ip': '203.0.113.7' }), '203.0.113.7');
  assert.equal(from({ 'x-real-ip': ' 2001:db8::1 ' }), '2001:db8::1');
  for (const value of ['', 'not-an-ip', '203.0.113.7, 198.51.100.1', '203.0.113.0/24', 'fe80::1%eth0', '1'.repeat(46)]) {
    assert.equal(from({ 'x-real-ip': value }), null, value);
  }
  // Other client-controlled headers are never used.
  assert.equal(from({ 'x-forwarded-for': '203.0.113.7', 'x-gatareview-client-ip': '203.0.113.8' }), null);
});

test('behind Cloudflare, CF-Connecting-IP is used only with our zone\'s secret header', () => {
  const proxySecret = 'test-only-cloudflare-proxy-secret-0123456789';
  const env = { CLOUDFLARE_PROXY_SECRET: proxySecret };
  const from = (headers, environment = env) => trustedClientIp(new Headers(headers), environment);
  const viaCloudflare = { 'x-real-ip': '172.68.10.20', 'cf-connecting-ip': '203.0.113.7' };

  assert.equal(from({ ...viaCloudflare, 'x-gatareview-proxy-secret': proxySecret }), '203.0.113.7');
  assert.equal(from({ ...viaCloudflare, 'x-gatareview-proxy-secret': proxySecret, 'cf-connecting-ip': '2001:db8::7' }), '2001:db8::7');
  // A request that reaches Vercel directly can forge CF-Connecting-IP but not the secret.
  assert.equal(from(viaCloudflare), '172.68.10.20');
  assert.equal(from({ ...viaCloudflare, 'x-gatareview-proxy-secret': 'wrong' }), '172.68.10.20');
  assert.equal(from({ ...viaCloudflare, 'x-gatareview-proxy-secret': proxySecret.slice(0, -1) }), '172.68.10.20');
  assert.equal(from({ ...viaCloudflare, 'x-gatareview-proxy-secret': `${proxySecret}x` }), '172.68.10.20');
  // A secret header with an unusable CF-Connecting-IP never falls back to a chosen header.
  assert.equal(from({ ...viaCloudflare, 'x-gatareview-proxy-secret': proxySecret, 'cf-connecting-ip': '203.0.113.7, 198.51.100.1' }), null);
  // Without the env var (or with a short one) CF-Connecting-IP is never used.
  assert.equal(from({ ...viaCloudflare, 'x-gatareview-proxy-secret': proxySecret }, {}), '172.68.10.20');
  assert.equal(from({ ...viaCloudflare, 'x-gatareview-proxy-secret': 'short' }, { CLOUDFLARE_PROXY_SECRET: 'short' }), '172.68.10.20');
});
