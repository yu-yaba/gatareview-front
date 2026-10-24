import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { encode } = require('next-auth/jwt');

// Run after npm run build. Exercise the real Next production Data Cache and
// React rendering; no mock implementation of fetch, cache(), or Next is used.
const appDirectory = process.env.CACHE_TEST_APP_DIR || process.cwd();
const baseline = process.env.CACHE_TEST_BASELINE === '1';
const port = Number(process.env.CACHE_TEST_PORT || 3188);
const secret = 'isolated-public-cache-test-secret';
const id = String(800_000 + Math.floor(Math.random() * 100_000));
const requests = [];
let title = `公開キャッシュ検証${id}`;
let failing = false;
let reviewVersion = 0;
const backend = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const publicInfo = /^\/api\/v1\/lectures\/\d+$/.test(path);
  const authorization = request.headers.authorization || null;
  let body;
  let status = 200;
  if (publicInfo) {
    await delay(30);
    if (failing) { status = 503; body = { error: 'temporary test failure' }; }
    else body = { id: Number(path.split('/').pop()), title, lecturer: 'テスト教員', faculty: '工学部', avg_rating: 4, review_count: 1 };
  } else if (path.endsWith('/reviews')) {
    body = {
      reviews: [{ id: 1, lecture_id: Number(id), rating: 4, content: `review-${++reviewVersion}-${authorization || 'anonymous'}`, thanks_count: 0 }],
      access: { restriction_enabled: true, access_granted: Boolean(authorization) },
    };
  } else { status = 404; body = { error: 'test route not found' }; }
  const json = JSON.stringify(body);
  requests.push({ path, publicInfo, authorization, status, bytes: Buffer.byteLength(json) });
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' });
  response.end(json);
});
await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
const backendURL = `http://127.0.0.1:${backend.address().port}`;
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', String(port)], {
  cwd: appDirectory, env: { ...process.env, DOCKER_BACKEND_URL: backendURL, NEXTAUTH_URL: base, NEXTAUTH_SECRET: secret }, stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
child.stdout.on('data', value => { output += value; });
child.stderr.on('data', value => { output += value; });
const timings = [];
async function page(lectureId = id, token = null) {
  const headers = { 'User-Agent': 'Googlebot' };
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

  failing = true;
  const failureId = String(Number(id) + 2);
  assert.equal((await page(failureId)).response.status, 404);
  failing = false;
  assert.equal((await page(failureId)).response.status, 200, 'a transient API error must not poison the public cache');

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
  console.log(JSON.stringify({ baseline, cold_public_requests: coldCalls, cold_public_json_bytes: publicCalls().slice(0, coldCalls).reduce((sum, item) => sum + item.bytes, 0), cold_ms: timings[0], warm_median_ms: timings.slice(1, 6).sort((a, b) => a - b)[2], checks: ['metadata/page deduplication', 'warm cache', 'uncached reviews', 'account isolation', 'lecture ID isolation', 'transient failure recovery', ...(process.env.CACHE_TEST_EXPIRY === '1' ? ['real 300-second expiry and failed revalidation recovery'] : [])] }));
} catch (error) {
  console.error(output.slice(-5000));
  throw error;
} finally {
  child.kill('SIGTERM');
  if (child.exitCode === null) await once(child, 'exit');
  await new Promise(resolve => backend.close(resolve));
}
