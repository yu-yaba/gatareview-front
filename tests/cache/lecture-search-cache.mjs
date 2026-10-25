import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const requests = [];
let version = 1, fail = false, malformed = false;
const nonce = String(Date.now());
const backend = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  if (url.pathname !== '/api/v1/lectures') { response.writeHead(404).end(); return; }
  await delay(30);
  const data = {
    lectures: [{ id: 99901, title: `検索検証-${nonce}-${version}`, lecturer: 'テスト教員', faculty: 'T:工学部',
      avg_rating: 4, review_count: 1, reviews: [{ content: 'never-expose-review' }], backendToken: 'never-expose-token' }],
    pagination: { current_page: Number(url.searchParams.get('page') || 1), total_pages: 2, total_count: 21, per_page: 20 },
    user: { email: 'never-expose-user@example.test' },
  };
  if (malformed) delete data.pagination;
  const status = fail ? 503 : 200;
  const json = JSON.stringify(fail ? { error: 'temporary failure' } : data);
  requests.push({ query: url.search, authenticated: !!request.headers.authorization, cookie: !!request.headers.cookie,
    status, bytes: Buffer.byteLength(json) });
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' }).end(json);
});
await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
const backendURL = `http://127.0.0.1:${backend.address().port}`;
const port = Number(process.env.SEARCH_CACHE_TEST_PORT || 3186);
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', String(port)], {
  env: { ...process.env, DOCKER_BACKEND_URL: backendURL, NEXTAUTH_URL: base, NEXTAUTH_SECRET: 'search-cache-test-secret' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { output += data; });
const waitUntil = async condition => {
  for (let i = 0; i < 100; i++) { if (await condition()) return; await delay(100); }
  throw new Error('Search cache condition timed out');
};
const query = `page=1&search=${nonce}`;
const calls = () => requests.filter(r => r.query === '?' + query);
const get = (suffix = query, headers = {}) => fetch(`${base}/api/public/lectures?${suffix}`, { headers });
try {
  await waitUntil(async () => {
    if (child.exitCode !== null) throw new Error(output);
    try { await fetch(`${base}/api/auth/providers`); return true; } catch { return false; }
  });
  // Reproduce the previous browser -> API path with the same no-store dummy API.
  for (let i = 0; i < 6; i++) {
    const response = await fetch(`${backendURL}/api/v1/lectures?${query}`);
    assert.equal(response.status, 200); await response.arrayBuffer();
  }
  const baselineRequests = requests.length;
  const baselineBytes = requests.reduce((sum, request) => sum + request.bytes, 0);
  requests.length = 0;
  const coldStart = performance.now();
  const cold = await get(); assert.equal(cold.status, 200);
  const first = await cold.json(); const coldMs = performance.now() - coldStart;
  assert.equal(calls().length, 1);
  const elapsed = [];
  for (const headers of [{ Cookie: 'test-account=A', Authorization: 'Bearer test-A' },
    { Cookie: 'test-account=B', Authorization: 'Bearer test-B' }, {}, {}, {}]) {
    const started = performance.now(), r = await get(query, headers);
    assert.equal(r.status, 200); assert.deepEqual(await r.json(), first);
    assert.match(r.headers.get('cache-control'), /private.*no-store/);
    elapsed.push(performance.now() - started);
  }
  assert.equal(calls().length, 1, 'six reads must reuse one upstream result');
  const html = await (await fetch(`${base}/lectures?search=${nonce}`)).text();
  assert.ok(html.includes(`検索検証-${nonce}-1`), 'initial HTML must contain real search results');
  assert.equal(calls().length, 1, 'SSR and browser API must share the cache');
  for (const text of [JSON.stringify(first), html]) {
    for (const secret of ['never-expose-review', 'never-expose-token', 'never-expose-user']) assert.ok(!text.includes(secret));
  }
  await get(`detailed=true&tracking=ignored&search=${nonce}&page=01`);
  assert.equal(calls().length, 1, 'equivalent keys share data');
  await get(`page=2&search=${nonce}`); await get(`page=1&search=${nonce}&faculty=T`);
  assert.ok(requests.some(r => r.query.includes('page=2')) && requests.some(r => r.query.includes('faculty=T')));
  const beforeInvalid = requests.length;
  assert.equal((await get('page=0')).status, 400);
  assert.equal((await get('search=' + 'a'.repeat(256))).status, 400);
  assert.equal(requests.length, beforeInvalid, 'invalid inputs must not reach the backend');
  fail = true; const recoveryQuery = `page=1&search=failure-${nonce}`;
  assert.equal((await get(recoveryQuery)).status, 503);
  fail = false; assert.equal((await get(recoveryQuery)).status, 200);
  malformed = true; const malformedQuery = `page=1&search=invalid-${nonce}`;
  assert.equal((await get(malformedQuery)).status, 503);
  malformed = false; assert.equal((await get(malformedQuery)).status, 200);
  assert.ok(requests.every(r => !r.authenticated && !r.cookie), 'viewer credentials never go upstream');

  console.error('Checking the real 60-second search cache expiry...');
  await delay(61000);
  fail = true; await get();
  await waitUntil(() => calls().some(r => r.status === 503));
  fail = false; version = 2;
  await waitUntil(async () => (await (await get()).json()).lectures[0].title.endsWith('-2'));
  const successfulFirstBytes = calls().find(r => r.status === 200).bytes;
  console.log(JSON.stringify({ coldMs, warmMedianMs: elapsed.sort((a, b) => a - b)[2],
    sixReadsBaselineRequests: baselineRequests, sixReadsCachedRequests: 1,
    sixReadsBaselineUpstreamJsonBytes: baselineBytes, sixReadsCachedUpstreamJsonBytes: successfulFirstBytes,
    checks: ['SSR results', 'same-query reuse', 'query/filter/page separation', 'account-independent public data',
      'no credential forwarding', 'private fields removed', 'invalid query rejected', 'failure and malformed-data recovery',
      'real 60-second expiry', 'stale failure and recovery'] }));
} catch (error) { console.error(output.slice(-2400)); throw error; }
finally {
  child.kill('SIGTERM'); if (child.exitCode === null) await once(child, 'exit');
  await new Promise(resolve => backend.close(resolve));
}
