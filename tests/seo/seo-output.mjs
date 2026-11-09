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
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  browser: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

let sitemapFailing = true;
let sitemapCalls = 0;
const lectureJson = id => ({ id, title: `SEO検証授業${id}`, lecturer: 'テスト教員', faculty: '工学部', avg_rating: 4, review_count: 1 });
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
    if (sitemapFailing) { status = 503; body = { error: 'temporary test failure' }; }
    else body = { lectures: [
      { id: 3886, lastmod: '2026-11-01' },
      { id: 12, lastmod: '2026-10-05' },
      { id: 12, lastmod: '2026-10-05' }, // duplicate: listed once
      { id: 77, lastmod: '2026-13-45T00:00:00Z' }, // not a plain date: no lastmod
      { id: 'x', lastmod: '2026-01-01' }, // invalid id: skipped
      { id: -1, lastmod: '2026-01-01' },
    ] };
  } else if (path === `/api/v1/lectures/${MISSING_LECTURE_ID}`) {
    status = 404; body = { error: 'not found' };
  } else if (/^\/api\/v1\/lectures\/\d+$/.test(path)) {
    body = lectureJson(Number(path.split('/').pop()));
  } else if (/^\/api\/v1\/lectures\/\d+\/reviews$/.test(path)) {
    body = { reviews: [], access: { restriction_enabled: false, access_granted: true } };
  } else if (path === '/api/v1/lectures') {
    body = { lectures: [lectureJson(3886)], pagination: { current_page: 1, total_pages: 1, total_count: 1, per_page: 20 } };
  } else if (path === '/api/v1/lectures/popular' || path === '/api/v1/lectures/no_reviews') {
    body = { lectures: [lectureJson(3886)] };
  } else if (path === '/api/v1/reviews/total') {
    body = { count: 1 };
  } else if (path === '/api/v1/reviews/latest') {
    body = [];
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

const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attr = (tag, name) => { const match = tag.match(new RegExp(`\\s${name}="([^"]*)"`)); return match ? decode(match[1]) : null; };
const tags = (html, pattern) => Array.from(html.matchAll(pattern), match => match[0]);
function inspect(html) {
  const links = tags(html, /<link\b[^>]*>/g);
  const metas = tags(html, /<meta\b[^>]*>/g);
  const metaContents = key => metas.filter(tag => attr(tag, 'name') === key || attr(tag, 'property') === key).map(tag => attr(tag, 'content'));
  const jsonLd = Array.from(html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g), match => JSON.parse(match[1]))
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
  { path: '/lectures?page=0', canonical: `${SITE}/lectures`, breadcrumb: ['ホーム', '授業一覧'] },
  { path: '/lectures?page=abc', canonical: `${SITE}/lectures`, breadcrumb: ['ホーム', '授業一覧'] },
  { path: `/lectures?faculty=${encodeURIComponent('工学部')}&page=3`, canonical: `${SITE}/lectures`, breadcrumb: ['ホーム', '授業一覧'] },
  { path: '/lectures?search=abc', canonical: `${SITE}/lectures`, breadcrumb: ['ホーム', '授業一覧'] },
  { path: '/lectures?sort=highestRating&page=2', canonical: `${SITE}/lectures`, breadcrumb: ['ホーム', '授業一覧'] },
  { path: '/lectures?textbook=%E4%B8%8D%E8%A6%81', canonical: `${SITE}/lectures`, breadcrumb: ['ホーム', '授業一覧'] },
  { path: '/faq', canonical: `${SITE}/faq`, breadcrumb: ['ホーム', 'よくある質問'], faq: true },
  { path: '/privacy', canonical: `${SITE}/privacy`, breadcrumb: ['ホーム', 'プライバシーポリシー'] },
  { path: '/terms', canonical: `${SITE}/terms`, breadcrumb: ['ホーム', '利用規約'] },
  { path: '/lectures/3886', canonical: `${SITE}/lectures/3886`, breadcrumb: null },
];
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
  sitemapFailing = false;
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
  const lastmod = Object.fromEntries(entries.map(entry => [entry.loc, entry.lastmod]));
  assert.equal(lastmod[SITE], '2026-11-01', 'home lastmod = newest review date');
  assert.equal(lastmod[`${SITE}/lectures`], '2026-11-01');
  assert.equal(lastmod[`${SITE}/faq`], null, 'no fake "now" lastmod for static pages');
  assert.equal(lastmod[`${SITE}/lectures/3886`], '2026-11-01');
  assert.equal(lastmod[`${SITE}/lectures/12`], '2026-10-05');
  assert.equal(lastmod[`${SITE}/lectures/77`], null, 'malformed lastmod is dropped');
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
      assert.deepEqual(result.canonicals, [page.canonical], `${label}: canonical`);
      assert.deepEqual(result.robots, [], `${label}: indexable pages carry no robots meta`);
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
        for (const item of faqs[0].mainEntity) {
          assert.ok(body.includes(`>${item.name}<`), `${label}: FAQ question is visible: ${item.name}`);
          assert.ok(body.includes(item.acceptedAnswer.text), `${label}: FAQ answer is visible`);
        }
      } else {
        assert.equal(faqs.length, 0, `${label}: FAQPage only on /faq`);
      }
    }

    for (const path of NOINDEX) {
      const label = `${uaName} ${path}`;
      const { response, body } = await get(path, ua);
      assert.equal(response.status, 200, label);
      const result = inspect(body);
      assertSiteWide(result, label);
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
  console.log(`SEO output checks passed (${INDEXABLE.length + NOINDEX.length + NOT_FOUND.length} routes x ${Object.keys(UAS).length} user agents, robots.txt, sitemap.xml)`);
} catch (error) {
  console.error(output.slice(-4000));
  throw error;
} finally {
  child.kill('SIGTERM');
  backend.close();
}
