import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).cspViolations = []
    document.addEventListener('securitypolicyviolation', event => {
      (window as any).cspViolations.push({ directive: event.effectiveDirective, target: event.blockedURI })
    })
  })
  // Exercise the real policy without contacting Google or creating assessments.
  await page.route('https://www.google.com/recaptcha/**', route => route.fulfill({
    contentType: 'application/javascript', body: 'window.recaptchaScriptLoaded = true;',
  }))
})

test('本番ページを操作でき、CSP適用中も検索・詳細・認証画面が動作する', async ({ page }) => {
  const id = 970000000 + Math.floor(Math.random() * 10000000)
  const api = `http://127.0.0.1:${process.env.PLAYWRIGHT_MOCK_API_PORT || '3101'}`
  await page.request.post(`${api}/_test/response`, { data: {
    path: `/api/v1/lectures/${id}`,
    body: { id, title: 'CSP確認授業', lecturer: 'テスト教員', faculty: '工学部', avg_rating: 4.5, review_count: 1 },
  } })
  await page.request.post(`${api}/_test/response`, { data: {
    path: `/api/v1/lectures/${id}/reviews`,
    body: { reviews: [{ id: 1, lecture_id: id, rating: 4.5, content: 'CSPの検証用レビュー本文です。通常の表示と操作を確認します。', thanks_count: 0 }],
      access: { restriction_enabled: false, access_granted: true } },
  } })
  const response = await page.goto('/')
  const policy = response?.headers()['content-security-policy'] || ''
  expect(policy).toContain("script-src-attr 'none'")
  expect(policy).not.toContain("'unsafe-eval'")
  await page.getByPlaceholder('授業名、教授名、学部名で検索...').fill('CSP検索確認')
  await page.getByPlaceholder('授業名、教授名、学部名で検索...').press('Enter')
  await expect(page).toHaveURL(/\/lectures\?.*CSP/)
  expect(await page.evaluate(() => (window as any).cspViolations)).toEqual([])
  await page.goto(`/lectures/${id}`)
  await expect(page.locator('main h1')).toContainText('CSP確認授業')
  await expect(page.locator('#app-root').getByText('CSPの検証用レビュー本文です。通常の表示と操作を確認します。', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => (window as any).cspViolations)).toEqual([])
  await page.goto('/auth/signin')
  await expect(page.getByRole('button', { name: /Google/ })).toBeVisible()
  await expect.poll(() => page.evaluate(() => (window as any).recaptchaScriptLoaded === true)).toBe(true)
  expect(await page.evaluate(() => (window as any).cspViolations)).toEqual([])
})

test('本番のNext.js初期化とSWを維持し、許可していないスクリプトを読み込まない', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByPlaceholder('授業名、教授名、学部名で検索...')).toBeEditable()
  const scope = await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js')
    const ready = await navigator.serviceWorker.ready
    return ready.scope
  })
  expect(scope).toBe(new URL('/', page.url()).href)
  await expect.poll(() => page.evaluate(async () =>
    (await navigator.serviceWorker.getRegistration())?.active?.state
  )).toBe('activated')
  const result = await page.evaluate(async () => {
    const script = document.createElement('script')
    script.src = 'https://untrusted.example/csp-test.js'
    const completed = new Promise(resolve => { script.onload = () => resolve('loaded'); script.onerror = () => resolve('blocked') })
    document.body.appendChild(script)
    return completed
  })
  expect(result).toBe('blocked')
})

test('事前保存を絞っても、有効化後に表示したホームをオフラインで再表示できる', async ({ page, context }) => {
  const failedScripts: string[] = []
  let requiredScripts = new Set<string>()
  page.on('requestfailed', request => {
    const url = new URL(request.url())
    if (url.origin === new URL(page.url()).origin && requiredScripts.has(url.pathname)) failedScripts.push(url.pathname)
  })
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
  })
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.state)).toBe('activated')
  // The existing start-url policy caches HTML on a controlled online visit.
  // Keep its NetworkFirst freshness policy instead of precaching stale HTML.
  await page.reload()
  await expect.poll(() => page.evaluate(async () =>
    Boolean(await (await caches.open('start-url')).match('/'))
  )).toBe(true)
  // Link prefetch can also append scripts for unvisited routes. Only the scripts
  // in the actual home HTML are required for this offline page.
  const html = await (await page.request.get('/')).text()
  requiredScripts = new Set(Array.from(html.matchAll(/<script[^>]+src="([^"]+)"/g), match =>
    new URL(match[1], page.url())).filter(url => url.origin === new URL(page.url()).origin).map(url => url.pathname))
  const session = await context.newCDPSession(page)
  await session.send('Network.enable')
  await session.send('Network.setCacheDisabled', { cacheDisabled: true })
  await context.setOffline(true)
  try {
    await page.reload()
    await expect(page.getByPlaceholder('授業名、教授名、学部名で検索...')).toBeEditable()
    await expect(page.locator('main h1')).toBeVisible()
    expect(failedScripts).toEqual([])
    await page.evaluate(() => window.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true })))
    await expect(page.getByRole('button', { name: '後で', exact: true })).toBeVisible()
    await page.getByRole('button', { name: '後で', exact: true }).click()
    await expect(page.getByRole('button', { name: '後で', exact: true })).toHaveCount(0)
  } finally { await context.setOffline(false); await session.detach() }
})
