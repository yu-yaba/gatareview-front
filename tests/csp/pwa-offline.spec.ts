import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { encode } from 'next-auth/jwt'

// These tests never call navigator.serviceWorker.register() themselves:
// the production build must register /sw.js on its own for real visitors.
test.beforeEach(async ({ page }) => {
  // Registration waits for the load event, then installation precaches the app shell.
  test.slow()
  await page.addInitScript(() => {
    const w = window as any
    w.cspViolations = []
    document.addEventListener('securitypolicyviolation', event => {
      w.cspViolations.push({ directive: event.effectiveDirective, target: event.blockedURI })
    })
    w.swRegisterCalls = []
    const register = ServiceWorkerContainer.prototype.register
    ServiceWorkerContainer.prototype.register = function (scriptURL: string | URL, options?: RegistrationOptions) {
      w.swRegisterCalls.push({ scriptURL: String(scriptURL), options: { ...options } })
      return register.call(this, scriptURL, options)
    }
  })
  await page.route('https://www.google.com/recaptcha/**', route => route.fulfill({
    contentType: 'application/javascript', body: 'window.recaptchaScriptLoaded = true;',
  }))
})

async function waitForAutomaticRegistration(page: Page) {
  await expect.poll(() => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    return registration?.active?.state ?? null
  }), { timeout: 30_000 }).toBe('activated')
  // clientsClaim: the page that registered the worker is controlled without a reload.
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
}

async function goOffline(page: Page, context: BrowserContext) {
  // Also bypass the browser HTTP cache so only the service worker can answer.
  const session = await context.newCDPSession(page)
  await session.send('Network.enable')
  await session.send('Network.setCacheDisabled', { cacheDisabled: true })
  await context.setOffline(true)
  return async () => { await context.setOffline(false); await session.detach() }
}

const offlineHeading = (page: Page) => page.getByRole('heading', { level: 1, name: 'オフラインです' })

test('テストからregisterを呼ばなくても、本番ビルドがホーム以外の画面からもSWを登録する', async ({ page }) => {
  await page.goto('/faq')
  await waitForAutomaticRegistration(page)
  const registration = await page.evaluate(async () => {
    const r = (await navigator.serviceWorker.getRegistration())!
    return { script: new URL(r.active!.scriptURL).pathname, scope: r.scope, updateViaCache: r.updateViaCache }
  })
  expect(registration).toEqual({ script: '/sw.js', scope: new URL('/', page.url()).href, updateViaCache: 'none' })
  // The calls recorded here come from the application bundle, not from this test.
  expect(await page.evaluate(() => (window as any).swRegisterCalls)).toEqual([
    { scriptURL: '/sw.js', options: { scope: '/', updateViaCache: 'none' } },
  ])
  expect(await page.evaluate(() => (window as any).cspViolations)).toEqual([])
})

test('オフライン時、未保存の画面へ移動すると事前保存した/offlineを表示し、URLは維持する', async ({ page, context }) => {
  await page.goto('/faq')
  await waitForAutomaticRegistration(page)
  const restore = await goOffline(page, context)
  try {
    for (const target of ['/lectures/123', '/lectures?search=offline', '/faq', '/privacy', '/mypage', '/auth/signin', '/offline']) {
      const response = await page.goto(target)
      expect(response?.status(), target).toBe(200)
      await expect(offlineHeading(page), target).toBeVisible()
      const url = new URL(page.url())
      expect(url.pathname + url.search, target).toBe(target)
    }
    // The page hydrates from precached chunks and its icon comes from the precache.
    await expect.poll(() => page.locator('img[alt="ガタレビュ"]').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
    await page.goto('/lectures/123')
    await page.getByRole('button', { name: 'トップページへ' }).click()
    await expect(page).toHaveURL(/\/$/)
    expect(await page.evaluate(() => (window as any).cspViolations)).toEqual([])
  } finally { await restore() }
})

test('ホームを保存していない状態でオフラインになっても、/offlineを表示する', async ({ page, context }) => {
  await page.goto('/faq')
  await waitForAutomaticRegistration(page)
  await page.evaluate(() => caches.delete('start-url-v2'))
  const restore = await goOffline(page, context)
  try {
    await page.goto('/')
    await expect(offlineHeading(page)).toBeVisible()
  } finally { await restore() }
})

test('オフライン画面は接続が戻ると、本来開こうとした画面を自動で読み込み直す', async ({ page, context }) => {
  await page.goto('/')
  await waitForAutomaticRegistration(page)
  const restore = await goOffline(page, context)
  let restored = false
  try {
    await page.goto('/faq')
    await expect(offlineHeading(page)).toBeVisible()
    await restore()
    restored = true
    await expect(offlineHeading(page)).toHaveCount(0)
    await expect(page).toHaveURL(/\/faq$/)
    await expect(page.locator('main h1')).toBeVisible()
  } finally { if (!restored) await restore() }
})

test('ログイン中に閲覧しても、SWのキャッシュには公開HTML(/と/offline)以外と個人情報を保存しない', async ({ page, context }) => {
  const secret = process.env.NEXTAUTH_SECRET
  test.skip(!secret, 'NEXTAUTH_SECRET is required to create a dummy session')
  const marker = `pwa-test-user-${Date.now()}`
  const value = await encode({
    secret: secret!,
    token: { backendToken: `${marker}-token`, user: { id: `${marker}-id`, name: marker, email: `${marker}@example.test`, avatar_url: null } },
  })
  await context.addCookies([{ name: 'next-auth.session-token', value, url: new URL('/', test.info().project.use.baseURL!).href }])
  await page.goto('/')
  await waitForAutomaticRegistration(page)
  expect(await page.evaluate(async () => (await (await fetch('/api/auth/session')).json()).user?.name)).toBe(marker)
  for (const target of ['/', '/lectures', '/lectures/123', '/mypage', '/faq']) await page.goto(target)
  // A controlled navigation to "/" is what stores the home page.
  await page.goto('/')
  const stored = await page.evaluate(async marker => {
    const entries: Array<{ cache: string, path: string, type: string, leaked: boolean }> = []
    for (const name of await caches.keys()) {
      const cache = await caches.open(name)
      for (const request of await cache.keys()) {
        const response = (await cache.match(request))!
        const type = response.headers.get('Content-Type') || ''
        const body = /^(text\/|application\/(json|javascript))/.test(type) ? await response.text() : ''
        entries.push({ cache: name, path: new URL(request.url).pathname, type, leaked: body.includes(marker) })
      }
    }
    return entries
  }, marker)
  expect(stored.filter(entry => entry.leaked)).toEqual([])
  expect(stored.filter(entry => entry.path.startsWith('/api/'))).toEqual([])
  const html = stored.filter(entry => /text\/html|text\/x-component/.test(entry.type))
  expect(html.map(entry => `${entry.cache.replace(/^workbox-precache-v2-.*/, 'precache')} ${entry.path}`).sort())
    .toEqual(['precache /offline', 'start-url-v2 /'])

  // After sign-out, offline navigation never replays a signed-in page.
  await context.clearCookies()
  const restore = await goOffline(page, context)
  try {
    for (const target of ['/mypage', '/lectures/123']) {
      await page.goto(target)
      await expect(offlineHeading(page)).toBeVisible()
      expect(await page.content()).not.toContain(marker)
    }
  } finally { await restore() }
})
