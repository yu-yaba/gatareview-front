import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { createRequire } from 'node:module';
import { createHmac } from 'node:crypto';
const require = createRequire(import.meta.url);
const { encode } = require('next-auth/jwt');

// Run after npm run build. Exercise the real Next production Data Cache and
// React rendering; no mock implementation of fetch, cache(), or Next is used.
const appDirectory = process.env.CACHE_TEST_APP_DIR || process.cwd();
const baseline = process.env.CACHE_TEST_BASELINE === '1';
const port = Number(process.env.CACHE_TEST_PORT || 3188);
const secret = 'isolated-public-cache-test-secret';
// Dummy value; the mock API below verifies signatures independently of the app code.
const forwardingSecret = 'isolated-forwarding-test-secret-0123456789';
const cloudflareProxySecret = 'isolated-cloudflare-proxy-secret-0123456789';
const id = String(800_000 + Math.floor(Math.random() * 100_000));
const requests = [];
let title = `公開キャッシュ検証${id}`;
let failing = false;
// null, 404, 429, 500, 'malformed', 'null-body' or 'slow' for the public lecture endpoint.
let failureMode = null;
let reviewVersion = 0;
function verifiedClientIp(request, path) {
  const ip = request.headers['x-gatareview-client-ip'];
  const timestamp = request.headers['x-gatareview-client-ip-timestamp'];
  const signature = request.headers['x-gatareview-client-ip-signature'];
  if (!ip && !timestamp && !signature) return null;
  const expected = createHmac('sha256', forwardingSecret)
    .update(['v1', timestamp, request.method, path, ip].join('\n')).digest('hex');
  assert.equal(signature, expected, `invalid client IP signature for ${path}`);
  assert.ok(Math.abs(Number(timestamp) - Date.now() / 1000) <= 60, 'stale client IP signature');
  return ip;
}
const backend = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const publicInfo = /^\/api\/v1\/lectures\/\d+$/.test(path);
  const authorization = request.headers.authorization || null;
  let clientIp;
  try { clientIp = verifiedClientIp(request, path); } catch (error) { clientIp = error; }
  let body;
  let status = 200;
  if (publicInfo) {
    await delay(failureMode === 'slow' ? 9_000 : 30);
    if (failing) { status = 503; body = { error: 'temporary test failure' }; }
    else if (typeof failureMode === 'number') { status = failureMode; body = { error: `test status ${failureMode}` }; }
    else if (failureMode === 'malformed') body = '<html>not json</html>';
    else if (failureMode === 'null-body') body = 'null';
    else body = { id: Number(path.split('/').pop()), title, lecturer: 'テスト教員', faculty: '工学部', avg_rating: 4, review_count: 1 };
  } else if (path.endsWith('/reviews')) {
    body = {
      reviews: [{ id: 1, lecture_id: Number(id), rating: 4, content: `review-${++reviewVersion}-${authorization || 'anonymous'}`, thanks_count: 0 }],
      access: { restriction_enabled: true, access_granted: Boolean(authorization) },
    };
  } else { status = 404; body = { error: 'test route not found' }; }
  const json = typeof body === 'string' ? body : JSON.stringify(body);
  requests.push({ path, publicInfo, authorization, status, clientIp, bytes: Buffer.byteLength(json) });
  if (response.destroyed) return;
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' });
  response.end(json);
});
await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
const backendURL = `http://127.0.0.1:${backend.address().port}`;
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', String(port)], {
  cwd: appDirectory,
  env: {
    ...process.env, DOCKER_BACKEND_URL: backendURL, NEXTAUTH_URL: base, NEXTAUTH_SECRET: secret,
    // Behave like a Vercel production deployment, where the edge sets x-real-ip.
    VERCEL: '1', VERCEL_ENV: 'production', RATE_LIMIT_FORWARDING_SECRET: forwardingSecret,
    CLOUDFLARE_PROXY_SECRET: cloudflareProxySecret,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
child.stdout.on('data', value => { output += value; });
child.stderr.on('data', value => { output += value; });
const timings = [];
const visitorIp = '203.0.113.10';
async function page(lectureId = id, token = null, ip = visitorIp, extraHeaders = {}) {
  const headers = { 'User-Agent': 'Googlebot', 'X-Real-IP': ip, ...extraHeaders };
  if (token) headers.Cookie = `next-auth.session-token=${token}`;
  const started = performance.now();
  const response = await fetch(`${base}/lectures/${lectureId}`, { headers });
  const html = await response.text();
  timings.push(performance.now() - started);
  return { response, html };
}
const publicCalls = () => requests.filter(item => item.publicInfo && item.path.endsWith(`/${id}`));
const waitUntil = async predicate => {
  for (let attempt = 0; attempt < 100; attempt++) { if (await predicate()) return; await delay(100); }
  throw new Error('Timed out waiting for Next/cache revalidation');
};
try {
  await waitUntil(async () => {
    if (child.exitCode !== null) throw new Error(output);
    try { await fetch(`${base}/api/auth/providers`); return true; } catch { return false; }
  });
  const cold = await page();
  assert.equal(cold.response.status, 200);
  assert.ok(cold.html.includes(title));
  assert.ok(cold.html.includes(`<title>${title}`));
  const coldCalls = publicCalls().length;
  assert.equal(coldCalls, baseline ? 2 : 1, 'metadata and page must share one upstream fetch');
  for (let i = 0; i < 5; i++) assert.equal((await page()).response.status, 200);
  assert.equal(publicCalls().length, coldCalls, 'warm requests must use the Data Cache');
  assert.equal(requests.filter(item => item.path === `/api/v1/lectures/${id}/reviews`).length, 6, 'reviews must reach the API on every request');
  const token = await encode({ secret, token: { backendToken: 'account-A', user: { id: 'A', name: 'A', email: 'a@example.test' } } });
  const signedIn = await page(id, token);
  assert.ok(signedIn.html.includes('Bearer account-A'));
  const otherToken = await encode({ secret, token: { backendToken: 'account-B', user: { id: 'B', name: 'B', email: 'b@example.test' } } });
  const otherAccount = await page(id, otherToken);
  assert.ok(otherAccount.html.includes('Bearer account-B'));
  assert.ok(!otherAccount.html.includes('Bearer account-A'));
  const signedOut = await page();
  assert.ok(!signedOut.html.includes('Bearer account-A'));
  assert.ok(signedOut.html.includes('anonymous'));
  assert.equal(publicCalls().length, coldCalls);
  assert.ok(requests.filter(item => item.publicInfo).every(item => item.authorization === null));
  assert.equal((await page(String(Number(id) + 1))).response.status, 200);
  assert.ok(requests.some(item => item.publicInfo && item.path.endsWith(`/${Number(id) + 1}`)));

  // Every API call made for a visitor carries that visitor's signed IP, so the
  // API's per-IP limits do not pool all visitors behind Vercel's address.
  assert.ok(requests.every(item => !(item.clientIp instanceof Error)), 'every forwarded IP must be validly signed');
  const reviewCalls = requests.filter(item => item.path.endsWith('/reviews'));
  assert.ok(reviewCalls.length >= 9 && reviewCalls.every(item => item.clientIp === visitorIp), 'reviews must carry the visitor IP');
  assert.equal(publicCalls()[0].clientIp, visitorIp, 'a public cache miss is counted against the visitor who caused it');
  const otherVisitorId = String(Number(id) + 3);
  assert.equal((await page(otherVisitorId, null, '2001:db8:1:2::7')).response.status, 200);
  assert.ok(requests.filter(item => item.path.endsWith(`/${otherVisitorId}`)).every(item => item.clientIp === '2001:db8:1:2::7'));

  // Through Cloudflare, Vercel sees a Cloudflare edge address. Our zone's
  // Transform Rule adds the proxy secret; only then is CF-Connecting-IP used.
  const cloudflareEdge = '172.68.10.20';
  const viaCloudflareId = String(Number(id) + 6);
  assert.equal((await page(viaCloudflareId, null, cloudflareEdge, {
    'CF-Connecting-IP': '198.51.100.77', 'X-Gatareview-Proxy-Secret': cloudflareProxySecret,
  })).response.status, 200);
  assert.ok(requests.filter(item => item.path.includes(`/${viaCloudflareId}`)).every(item => item.clientIp === '198.51.100.77'));
  const forgedId = String(Number(id) + 7);
  assert.equal((await page(forgedId, null, '192.0.2.66', { 'CF-Connecting-IP': '198.51.100.88' })).response.status, 200);
  assert.ok(requests.filter(item => item.path.includes(`/${forgedId}`)).every(item => item.clientIp === '192.0.2.66'),
    'a forged CF-Connecting-IP without the proxy secret must be ignored');

  // Only a real 404 from the API is a missing page. Rate limits, outages,
  // malformed JSON and timeouts render the error page with a 5xx status, are
  // not cached, and recover on the next request.
  // The RSC payload embeds every not-found boundary, so look at the rendered
  // <title>, which generateMetadata sets only for a missing lecture.
  const isNotFoundPage = html => (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').includes('ページが見つかりません');
  // Malformed IDs are not found without asking the API (an over-long one makes
  // Puma answer 400, which would otherwise be an error page).
  const callsBeforeJunk = requests.length;
  for (const junk of ['abc', '0', '012', '12abc', '12345678901', '7'.repeat(8300)]) {
    const junkPage = await page(junk);
    assert.equal(junkPage.response.status, 404, `junk ID ${junk.slice(0, 20)}`);
  }
  assert.equal(requests.length, callsBeforeJunk, 'junk IDs must not reach the API');

  failureMode = 404;
  const notFound = await page(String(Number(id) + 5));
  failureMode = null;
  assert.equal(notFound.response.status, 404);
  assert.ok(isNotFoundPage(notFound.html));

  const failureCases = [
    ['503', () => { failing = true; }],
    ['429', () => { failureMode = 429; }],
    ['500', () => { failureMode = 500; }],
    ['malformed JSON', () => { failureMode = 'malformed'; }],
    ['200 with a non-lecture body', () => { failureMode = 'null-body'; }],
  ];
  for (const [index, [label, fail]] of failureCases.entries()) {
    const failureId = String(Number(id) + 10 + index);
    fail();
    const failed = await page(failureId);
    failing = false;
    failureMode = null;
    assert.ok(failed.response.status >= 500 && failed.response.status < 600, `${label} must render a 5xx, got ${failed.response.status}`);
    assert.ok(!isNotFoundPage(failed.html), `${label} must not render the not-found page`);
    assert.ok(!/public|s-maxage/.test(failed.response.headers.get('cache-control') || ''), `${label} must not be publicly cacheable`);
    assert.equal((await page(failureId)).response.status, 200, `${label}: a transient API error must not poison the public cache`);
  }

  failureMode = 'slow';
  const slowId = String(Number(id) + 20);
  const slowStarted = performance.now();
  const slow = await page(slowId);
  const slowMs = performance.now() - slowStarted;
  failureMode = null;
  assert.ok(slow.response.status >= 500 && slow.response.status < 600, `timeout must render a 5xx, got ${slow.response.status}`);
  assert.ok(!isNotFoundPage(slow.html));
  assert.ok(slowMs < 8_900, `the API timeout must bound the page (${Math.round(slowMs)} ms)`);
  await delay(1_000);
  assert.equal((await page(slowId)).response.status, 200, 'a timeout must not poison the public cache');

  // The OGP image route renders per request, so it signs like the page. Only a
  // real 404 is a 404 (successful images need Google Fonts and are not fetched here).
  failureMode = 404;
  const imageId = String(Number(id) + 30);
  assert.equal((await fetch(`${base}/lectures/${imageId}/opengraph-image`, { headers: { 'X-Real-IP': visitorIp } })).status, 404);
  failureMode = 503;
  const failedImage = await fetch(`${base}/lectures/${Number(imageId) + 1}/opengraph-image`, { headers: { 'X-Real-IP': visitorIp } });
  failureMode = null;
  assert.ok(failedImage.status >= 500, `a failed OGP lookup must not be a 404, got ${failedImage.status}`);
  const imageCalls = requests.filter(item => item.path.endsWith(`/${imageId}`) || item.path.endsWith(`/${Number(imageId) + 1}`));
  assert.equal(imageCalls.length, 2, 'one API call per OGP lookup');
  assert.ok(imageCalls.every(item => item.clientIp === visitorIp), 'OGP lookups are signed for the requester');

  if (process.env.CACHE_TEST_EXPIRY === '1') {
    // Real 300-second TTL: run locally when changing this cache policy.
    console.error('Checking the real five-minute cache expiry and recovery...');
    await delay(301_000);
    failing = true;
    await page();
    await waitUntil(() => publicCalls().some(item => item.status === 503));
    failing = false;
    title += '更新済み';
    await waitUntil(async () => (await page()).html.includes(title));
    assert.ok(publicCalls().filter(item => item.status === 200).length > coldCalls);
  }
  console.log(JSON.stringify({ baseline, cold_public_requests: coldCalls, cold_public_json_bytes: publicCalls().slice(0, coldCalls).reduce((sum, item) => sum + item.bytes, 0), cold_ms: timings[0], warm_median_ms: timings.slice(1, 6).sort((a, b) => a - b)[2], checks: ['metadata/page deduplication', 'warm cache', 'uncached reviews', 'account isolation', 'lecture ID isolation', 'signed visitor IP forwarding', 'Cloudflare proxy secret', 'junk IDs without API calls', 'real 404 only', '429/5xx/malformed/timeout error pages', 'transient failure recovery', ...(process.env.CACHE_TEST_EXPIRY === '1' ? ['real 300-second expiry and failed revalidation recovery'] : [])] }));
} catch (error) {
  console.error(output.slice(-5000));
  throw error;
} finally {
  child.kill('SIGTERM');
  if (child.exitCode === null) await once(child, 'exit');
  await new Promise(resolve => backend.close(resolve));
}
