import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// Run after npm run build. Starts the real production server against a local
// dummy API and checks the SEO-relevant output (canonical, robots, titles,
// JSON-LD, robots.txt, sitemap.xml) of representative routes.
const appDirectory = process.env.SEO_TEST_APP_DIR || process.cwd();
const port = Number(process.env.SEO_TEST_PORT || 3193);
const backendPort = Number(process.env.SEO_TEST_BACKEND_PORT || 0);
const SITE = 'https://www.gatareview.com';
const HOME_TITLE = 'ガタレビュ！ - 新潟大学の授業レビューサイト';
const MISSING_LECTURE_ID = 999999;
const UAS = {
  // Google crawls with the smartphone Googlebot by default.
  googlebot: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.204 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  browser: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

// 'error' (503), 'html' (200 with a non-JSON body), 'strings' (200 with invalid ids),
// 'missing' (404 from a backend without the endpoint), or 'ok'.
let sitemapMode = 'error';
const LIST_TOTAL_PAGES = 5;
let sitemapCalls = 0;
// Timestamps are never published (not in HTML, RSC payload, sitemap or JSON-LD). Every mocked
// lecture/review carries marker values; no page may contain them.
const TIMESTAMP_MARKERS = ['LECTURE_CREATED_AT_MARKER', 'LECTURE_UPDATED_AT_MARKER', 'REVIEW_CREATED_AT_MARKER', 'REVIEW_UPDATED_AT_MARKER'];
const lectureJson = id => ({ id, title: `SEO検証授業${id}`, lecturer: 'テスト教員', faculty: '工学部', avg_rating: 4, review_count: 1,
  created_at: 'LECTURE_CREATED_AT_MARKER', updated_at: 'LECTURE_UPDATED_AT_MARKER' });
const reviewJson = lectureId => ({ id: 501, rating: 4, lecture_id: lectureId, thanks_count: 0, period_year: '2026', period_term: '1ターム',
  content: 'SEO検証のレビュー本文です。三十文字以上になるように少し長めに書いておきます。',
  created_at: 'REVIEW_CREATED_AT_MARKER', updated_at: 'REVIEW_UPDATED_AT_MARKER' });
// Next's Data Cache persists in .next/cache across runs. A unique path prefix per
// run gives the sitemap fetch a fresh cache key, so the cold-cache case is real.
const runPrefix = `/seo-run-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
const backend = createServer((request, response) => {
  let path = new URL(request.url, 'http://localhost').pathname;
  if (path.startsWith(runPrefix)) path = path.slice(runPrefix.length);
  let status = 200;
  let body;
  if (path === '/api/v1/lectures/sitemap') {
    sitemapCalls += 1;
    if (sitemapMode === 'error') { status = 503; body = { error: 'temporary test failure' }; }
    else if (sitemapMode === 'missing') { status = 404; body = { error: '指定された講義は存在しません。' }; }
    else if (sitemapMode === 'strings') body = { lecture_ids: ['1', '2'] };
    else if (sitemapMode === 'html') {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end('<!doctype html><title>maintenance</title>');
      return;
    } else body = { lecture_ids: [3886, 12, 12 /* duplicate: listed once */, 77] };
  } else if (path === `/api/v1/lectures/${MISSING_LECTURE_ID}`) {
    status = 404; body = { error: 'not found' };
  } else if (/^\/api\/v1\/lectures\/\d+$/.test(path)) {
    body = lectureJson(Number(path.split('/').pop()));
  } else if (/^\/api\/v1\/lectures\/\d+\/reviews$/.test(path)) {
    body = { reviews: [reviewJson(Number(path.split('/')[4]))], access: { restriction_enabled: false, access_granted: true } };
  } else if (path === '/api/v1/lectures') {
    const page = Number(new URL(request.url, 'http://localhost').searchParams.get('page') || 1);
    body = { lectures: page <= LIST_TOTAL_PAGES ? [lectureJson(3886)] : [],
      pagination: { current_page: page, total_pages: LIST_TOTAL_PAGES, total_count: LIST_TOTAL_PAGES * 20, per_page: 20 } };
  } else if (path === '/api/v1/lectures/popular' || path === '/api/v1/lectures/no_reviews') {
    body = { lectures: [lectureJson(3886)] };
  } else if (path === '/api/v1/reviews/total') {
    body = { count: 1 };
  } else if (path === '/api/v1/reviews/latest') {
    body = [{ ...reviewJson(3886), lecture: lectureJson(3886) }];
  } else { status = 404; body = { error: 'test route not found' }; }
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' });
  response.end(JSON.stringify(body));
});
await new Promise(resolve => backend.listen(backendPort, '127.0.0.1', resolve));
const backendURL = `http://127.0.0.1:${backend.address().port}${runPrefix}`;
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', String(port)], {
  cwd: appDirectory,
  env: { ...process.env, DOCKER_BACKEND_URL: backendURL, NEXT_PUBLIC_ENV: backendURL, NEXTAUTH_URL: base, NEXTAUTH_SECRET: 'isolated-seo-test-secret' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
child.stdout.on('data', value => { output += value; });
child.stderr.on('data', value => { output += value; });

// &amp; last, so "&amp;quot;" decodes to "&quot;" (not '"').
const decode = value => value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const attr = (tag, name) => { const match = tag.match(new RegExp(`\\s${name}="([^"]*)"`)); return match ? decode(match[1]) : null; };
const tags = (html, pattern) => Array.from(html.matchAll(pattern), match => match[0]);
function inspect(html) {
  const links = tags(html, /<link\b[^>]*>/g);
  const metas = tags(html, /<meta\b[^>]*>/g);
  const metaContents = key => metas.filter(tag => attr(tag, 'name') === key || attr(tag, 'property') === key).map(tag => attr(tag, 'content'));
  const jsonLd = Array.from(html.matchAll(/<script\b[^>]*\btype="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g), match => JSON.parse(match[1]))
    .flatMap(value => (Array.isArray(value) ? value : [value]));
  return {
    canonicals: links.filter(tag => attr(tag, 'rel') === 'canonical').map(tag => attr(tag, 'href')),
    hreflangs: links.filter(tag => attr(tag, 'hreflang') !== null),
    maskIcons: links.filter(tag => attr(tag, 'rel') === 'mask-icon'),
    robots: metaContents('robots'),
    googlebot: metaContents('googlebot'),
    verification: metaContents('google-site-verification'),
    ogUrl: metaContents('og:url'),
    ogImageWidth: metaContents('og:image:width'),
    titles: Array.from(html.matchAll(/<title>([^<]*)<\/title>/g), match => decode(match[1])),
    jsonLd,
    types: jsonLd.map(item => item['@type']),
  };
}
// Google only uses rel=canonical from <head>; Next 15 may stream metadata into <body>
// unless the UA is in htmlLimitedBots. For Googlebot, everything must be in <head>.
function assertInHead(html, label) {
  const headEnd = html.indexOf('</head>');
  assert.ok(headEnd > 0, `${label}: has </head>`);
  const all = inspect(html);
  const head = inspect(html.slice(0, headEnd));
  assert.deepEqual(head.canonicals, all.canonicals, `${label}: canonical must be in <head>`);
  assert.deepEqual(head.robots, all.robots, `${label}: robots meta must be in <head>`);
  assert.deepEqual(head.titles, all.titles, `${label}: <title> must be in <head>`);
  assert.deepEqual(head.ogUrl, all.ogUrl, `${label}: og:url must be in <head>`);
}
function assertNoTimestamps(html, label) {
  for (const marker of TIMESTAMP_MARKERS) assert.ok(!html.includes(marker), `${label}: must not publish ${marker}`);
  assert.ok(!/datePublished|dateModified|dateCreated|uploadDate/.test(html), `${label}: no JSON-LD dates`);
}
async function get(path, ua = UAS.googlebot) {
  const response = await fetch(`${base}${path}`, { headers: { 'User-Agent': ua }, redirect: 'manual' });
  return { response, body: await response.text() };
}
const waitUntil = async predicate => {
  for (let attempt = 0; attempt < 150; attempt++) { if (await predicate()) return; await delay(100); }
  throw new Error('Timed out waiting for next start');
};

const INDEXABLE = [
  { path: '/', canonical: SITE, title: HOME_TITLE, breadcrumb: null },
  { path: '/lectures', canonical: `${SITE}/lectures`, breadcrumb: ['ホーム', '授業一覧'] },
  { path: '/lectures?page=2', canonical: `${SITE}/lectures?page=2`, titleIncludes: '2ページ目', breadcrumb: ['ホーム', '授業一覧'] },
  { path: '/lectures?page=2&sort=newest&utm_source=x', canonical: `${SITE}/lectures?page=2`, breadcrumb: ['ホーム', '授業一覧'] },
  { path: '/lectures?page=1', canonical: `${SITE}/lectures`, breadcrumb: ['ホーム', '授業一覧'] },
  { path: `/lectures?faculty=${encodeURIComponent('工学部')}&page=3`, canonical: `${SITE}/lectures`, breadcrumb: ['ホーム', '授業一覧'] },
  { path: '/lectures?search=abc', canonical: `${SITE}/lectures`, breadcrumb: ['ホーム', '授業一覧'] },
  // The backend ignores a search of only spaces / zero-width spaces, so this is plain page 2.
  { path: '/lectures?search=%E2%80%8B%E3%80%80&page=2', canonical: `${SITE}/lectures?page=2`, breadcrumb: ['ホーム', '授業一覧'] },
  { path: '/lectures?sort=highestRating&page=2', canonical: `${SITE}/lectures`, breadcrumb: ['ホーム', '授業一覧'] },
  { path: '/lectures?textbook=%E4%B8%8D%E8%A6%81', canonical: `${SITE}/lectures`, breadcrumb: ['ホーム', '授業一覧'] },
  { path: '/faq', canonical: `${SITE}/faq`, breadcrumb: ['ホーム', 'よくある質問'], faq: true },
  { path: '/privacy', canonical: `${SITE}/privacy`, breadcrumb: ['ホーム', 'プライバシーポリシー'] },
  { path: '/terms', canonical: `${SITE}/terms`, breadcrumb: ['ホーム', '利用規約'] },
  { path: '/lectures/3886', canonical: `${SITE}/lectures/3886`, breadcrumb: null },
];
// Invalid page numbers are redirected to the first page instead of being rendered.
const REDIRECTS = [['/lectures?page=0', '/lectures'], ['/lectures?page=abc', '/lectures'], ['/lectures?page=10001', '/lectures']];
const NOINDEX = ['/mypage', '/mypage/bookmarks', '/mypage/reviews', '/auth/signin', '/auth/signout',
  '/admin/review-access', '/reviews/new', '/offline', '/lectures/3886/review'];
const NOT_FOUND = ['/no-such-page', `/lectures/${MISSING_LECTURE_ID}`, '/lectures/abc', '/reviews', '/debug/session',
  '/lectures/3886/no-such-child'];

function assertSiteWide(result, label, { notFound = false } = {}) {
  assert.equal(result.verification.length, 0, `${label}: placeholder google-site-verification must be gone`);
  assert.equal(result.maskIcons.length, 0, `${label}: mask-icon pointed to a missing /icon.svg`);
  assert.equal(result.hreflangs.length, 0, `${label}: hreflang alternates must not point every page to the home page`);
  assert.ok(result.ogImageWidth.length <= 1, `${label}: og:image:width must not be duplicated (${result.ogImageWidth.length})`);
  assert.ok(result.canonicals.length <= 1, `${label}: at most one canonical (${result.canonicals})`);
  assert.ok(result.robots.length <= 1, `${label}: at most one robots meta (${result.robots})`);
  assert.equal(result.titles.length, 1, `${label}: exactly one <title>`);
  assert.equal(result.googlebot.length, 0, `${label}: no googlebot meta that could contradict robots`);
  // A notFound() thrown by a dynamic page is rendered by Next with a minimal <head>
  // (no root-layout head children, same as production before this change), so 404s
  // only must not duplicate it.
  const websites = result.types.filter(type => type === 'WebSite').length;
  if (notFound) assert.ok(websites <= 1, `${label}: at most one WebSite JSON-LD`);
  else assert.equal(websites, 1, `${label}: one WebSite JSON-LD`);
  assert.ok(!result.types.includes('EducationalOrganization'), `${label}: EducationalOrganization was removed`);
}

try {
  await waitUntil(async () => {
    if (child.exitCode !== null) throw new Error(output);
    try { await fetch(`${base}/robots.txt`); return true; } catch { return false; }
  });

  // robots.txt: rendering assets crawlable, private API/admin blocked, sitemap advertised.
  const robots = await get('/robots.txt');
  assert.equal(robots.response.status, 200);
  const robotsLines = robots.body.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  assert.ok(robotsLines.includes('User-agent: *'));
  assert.ok(robotsLines.includes('Disallow: /api/'));
  assert.ok(robotsLines.includes('Disallow: /admin/'));
  assert.ok(robotsLines.includes(`Sitemap: ${SITE}/sitemap.xml`));
  for (const line of robotsLines) {
    assert.ok(!/^Disallow:\s*\/_next/i.test(line), `robots.txt must not block /_next/: ${line}`);
    assert.ok(!/^Crawl-delay/i.test(line), 'Crawl-delay is ignored by Google');
    assert.ok(!/\*\.json/i.test(line), 'wildcard .json rule removed');
    assert.ok(!/^Disallow:\s*\/(mypage|auth|lectures|faq)\b/i.test(line), `noindex pages must stay crawlable: ${line}`);
  }

  // sitemap.xml: a cold cache plus a failing API is an error (Google retries), not an empty sitemap.
  const failed = await get('/sitemap.xml');
  assert.ok(failed.response.status >= 500, `cold sitemap with failing API must be 5xx, got ${failed.response.status}`);
  // A 200 with a broken body must not be cached: the next request after the API recovers succeeds.
  sitemapMode = 'html';
  const broken = await get('/sitemap.xml');
  assert.ok(broken.response.status >= 500, `cold sitemap with a non-JSON 200 must be 5xx, got ${broken.response.status}`);
  sitemapMode = 'strings';
  const invalidIds = await get('/sitemap.xml');
  assert.ok(invalidIds.response.status >= 500, `a response with invalid ids is rejected whole, got ${invalidIds.response.status}`);
  // A backend without the endpoint (front deployed first): static pages only, 200, not cached.
  sitemapMode = 'missing';
  const staticOnly = await get('/sitemap.xml');
  assert.equal(staticOnly.response.status, 200, 'missing endpoint must not break sitemap.xml');
  assert.deepEqual(Array.from(staticOnly.body.matchAll(/<loc>([^<]*)<\/loc>/g), match => match[1]),
    [SITE, `${SITE}/lectures`, `${SITE}/faq`, `${SITE}/privacy`, `${SITE}/terms`]);
  sitemapMode = 'ok';
  const callsBefore = sitemapCalls;
  const sitemap = await get('/sitemap.xml');
  assert.equal(sitemap.response.status, 200, sitemap.body);
  assert.match(sitemap.response.headers.get('content-type'), /xml/);
  const entries = Array.from(sitemap.body.matchAll(/<url>([\s\S]*?)<\/url>/g), match => ({
    loc: match[1].match(/<loc>([^<]*)<\/loc>/)?.[1],
    lastmod: match[1].match(/<lastmod>([^<]*)<\/lastmod>/)?.[1] ?? null,
  }));
  const locs = entries.map(entry => entry.loc);
  assert.deepEqual(locs, [SITE, `${SITE}/lectures`, `${SITE}/faq`, `${SITE}/privacy`, `${SITE}/terms`,
    `${SITE}/lectures/3886`, `${SITE}/lectures/12`, `${SITE}/lectures/77`]);
  assert.equal(new Set(locs).size, locs.length, 'sitemap URLs are unique');
  assert.ok(entries.every(entry => entry.lastmod === null), 'no lastmod: dates derived from reviews are never published');
  assert.ok(!/<lastmod>/.test(sitemap.body), 'no lastmod element at all');
  assert.ok(!sitemap.body.includes('/reviews'), 'the 404 /reviews URL is not listed');
  assert.ok(!/<changefreq>|<priority>/.test(sitemap.body), 'Google ignores changefreq/priority');
  const callsAfterFirst = sitemapCalls;
  assert.equal(callsAfterFirst - callsBefore, 1);
  assert.equal((await get('/sitemap.xml')).response.status, 200);
  assert.equal(sitemapCalls, callsAfterFirst, 'second sitemap request must use the Data Cache, not the API');

  // Every sitemap URL must be a 200, indexable page whose canonical is the listed URL.
  for (const loc of locs) {
    const { response, body } = await get(loc.replace(SITE, '') || '/');
    assert.equal(response.status, 200, `${loc} in sitemap must be 200`);
    const result = inspect(body);
    assertInHead(body, loc);
    assertNoTimestamps(body, loc);
    assert.deepEqual(result.canonicals, [loc], `${loc}: canonical must be itself`);
    assert.ok(!result.robots.some(value => /noindex/.test(value)), `${loc}: must be indexable`);
  }

  for (const [uaName, ua] of Object.entries(UAS)) {
    for (const page of INDEXABLE) {
      const label = `${uaName} ${page.path}`;
      const { response, body } = await get(page.path, ua);
      assert.equal(response.status, 200, label);
      const result = inspect(body);
      assertSiteWide(result, label);
      if (ua === UAS.googlebot) assertInHead(body, label);
      assertNoTimestamps(body, label);
      assert.deepEqual(result.canonicals, [page.canonical], `${label}: canonical`);
      assert.equal(result.robots.length, 1, `${label}: one robots meta`);
      assert.ok(!/noindex|nofollow/.test(result.robots[0]), `${label}: indexable (${result.robots[0]})`);
      assert.ok(result.robots[0].includes('max-image-preview:large'), `${label}: large previews allowed (${result.robots[0]})`);
      assert.deepEqual(result.ogUrl, [page.canonical], `${label}: og:url matches canonical`);
      if (page.title) assert.equal(result.titles[0], page.title, label);
      else assert.notEqual(result.titles[0], HOME_TITLE, `${label}: must not reuse the home title`);
      if (page.titleIncludes) assert.ok(result.titles[0].includes(page.titleIncludes), `${label}: ${result.titles[0]}`);

      const breadcrumbs = result.jsonLd.filter(item => item['@type'] === 'BreadcrumbList');
      if (page.breadcrumb) {
        assert.equal(breadcrumbs.length, 1, `${label}: one page-specific breadcrumb`);
        assert.deepEqual(breadcrumbs[0].itemListElement.map(item => item.name), page.breadcrumb, label);
        assert.equal(breadcrumbs[0].itemListElement.at(-1).item, page.canonical.replace(/\?.*$/, ''), label);
      } else {
        assert.equal(breadcrumbs.length, 0, `${label}: no site-wide breadcrumb`);
      }

      const faqs = result.jsonLd.filter(item => item['@type'] === 'FAQPage');
      if (page.faq) {
        assert.equal(faqs.length, 1, `${label}: FAQPage on /faq`);
        const questions = faqs[0].mainEntity.map(item => item.name);
        assert.equal(questions.length, 8, `${label}: every visible question is marked up`);
        // ">text<" only matches element text: JSON-LD escapes < and >, and the RSC payload is JSON.
        for (const item of faqs[0].mainEntity) {
          assert.ok(body.includes(`>${item.name}<`), `${label}: FAQ question is visible: ${item.name}`);
          assert.ok(body.includes(`>${item.acceptedAnswer.text}<`), `${label}: FAQ answer is visible: ${item.name}`);
        }
      } else {
        assert.equal(faqs.length, 0, `${label}: FAQPage only on /faq`);
      }
    }

    // Past the last page: an empty list, so noindex without a canonical.
    const pastEnd = await get(`/lectures?page=${LIST_TOTAL_PAGES + 1}`, ua);
    assert.equal(pastEnd.response.status, 200);
    const pastEndResult = inspect(pastEnd.body);
    if (ua === UAS.googlebot) assertInHead(pastEnd.body, `${uaName} past-end page`);
    assert.deepEqual(pastEndResult.robots, ['noindex, follow'], `${uaName} past-end page: noindex`);
    assert.deepEqual(pastEndResult.canonicals, [], `${uaName} past-end page: no canonical`);
    const lastPage = inspect((await get(`/lectures?page=${LIST_TOTAL_PAGES}`, ua)).body);
    assert.deepEqual(lastPage.canonicals, [`${SITE}/lectures?page=${LIST_TOTAL_PAGES}`], `${uaName} last page stays indexable`);

    for (const [from, to] of REDIRECTS) {
      const { response } = await get(from, ua);
      assert.ok([307, 308].includes(response.status), `${uaName} ${from}: redirect, got ${response.status}`);
      const location = new URL(response.headers.get('location'), base);
      assert.equal(location.pathname + location.search, to, `${uaName} ${from}: redirect target`);
    }

    for (const path of NOINDEX) {
      const label = `${uaName} ${path}`;
      const { response, body } = await get(path, ua);
      assert.equal(response.status, 200, label);
      const result = inspect(body);
      assertSiteWide(result, label);
      if (ua === UAS.googlebot) assertInHead(body, label);
      assertNoTimestamps(body, label);
      assert.deepEqual(result.robots, ['noindex, follow'], `${label}: noindex`);
      assert.deepEqual(result.canonicals, [], `${label}: noindex pages must not declare a canonical`);
      assert.ok(!result.types.includes('FAQPage') && !result.types.includes('BreadcrumbList'), label);
    }

    for (const path of NOT_FOUND) {
      const label = `${uaName} ${path}`;
      const { response, body } = await get(path, ua);
      assert.equal(response.status, 404, label);
      const result = inspect(body);
      assertSiteWide(result, label, { notFound: true });
      if (ua === UAS.googlebot) assertInHead(body, label);
      assertNoTimestamps(body, label);
      assert.deepEqual(result.robots, ['noindex'], `${label}: exactly one noindex robots meta`);
      assert.deepEqual(result.canonicals, [], `${label}: 404 must not declare a canonical`);
      assert.deepEqual(result.ogUrl, [], `${label}: 404 must not declare og:url`);
      assert.notEqual(result.titles[0], HOME_TITLE, `${label}: 404 must not reuse the home title`);
      assert.ok(!result.types.includes('FAQPage') && !result.types.includes('BreadcrumbList'), label);
      assert.ok(body.includes('ホームに戻る') && body.includes('授業を検索'), `${label}: the shared styled 404 design`);
      assert.ok(!body.includes('not found!'), `${label}: the bare lecture 404 is gone`);
    }
    const missingLecture = await get(`/lectures/${MISSING_LECTURE_ID}`, ua);
    assert.ok(missingLecture.body.includes('授業が見つかりません'), `${uaName}: lecture-specific 404 copy`);
  }
  // The client-side search JSON is public too.
  const searchJson = await get('/api/public/lectures?page=1');
  assert.equal(searchJson.response.status, 200, searchJson.body);
  assertNoTimestamps(searchJson.body, '/api/public/lectures');
  // The lecture page renders the mocked review (so the marker check above covered review data too).
  assert.ok((await get('/lectures/3886')).body.includes('SEO検証のレビュー本文です'), 'lecture page renders its review');
  console.log(`SEO output checks passed (${INDEXABLE.length + REDIRECTS.length + NOINDEX.length + NOT_FOUND.length} routes x ${Object.keys(UAS).length} user agents, robots.txt, sitemap.xml)`);
} catch (error) {
  console.error(output.slice(-4000));
  throw error;
} finally {
  child.kill('SIGTERM');
  backend.close();
}
