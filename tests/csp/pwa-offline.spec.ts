import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { encode } from 'next-auth/jwt'

// These tests never call navigator.serviceWorker.register() themselves:
// the production build must register /sw.js on its own for real visitors.
test.beforeEach(async ({ page, context }) => {
  // Registration waits for the load event, then installation precaches the app shell.
  test.slow()
  // Context-wide so that tabs opened by a test record violations and registrations too.
  await context.addInitScript(() => {
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
  // Empty the browser HTTP cache so that only the service worker can answer offline
  // (chunks missing from the precache must fail here, not come from the HTTP cache).
  // Detach right away: a CDP session left attached during offline navigations makes
  // Chromium reload the previous page, which never happens in a real browser.
  const session = await context.newCDPSession(page)
  await session.send('Network.clearBrowserCache')
  await session.detach()
  await context.setOffline(true)
  return async () => { await context.setOffline(false) }
}

const offlineHeading = (page: Page) => page.getByRole('heading', { level: 1, name: 'オフラインです' })

// The heading is in the static HTML. Wait until the page has hydrated from the precache
// (buttons work, reconnect listener attached) before acting on or leaving it.
async function expectHydratedOfflinePage(page: Page, label?: string) {
  await expect(offlineHeading(page), label).toBeVisible()
  await expect(page.locator('[data-ready="true"]'), label).toHaveCount(1)
}

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
  await page.goto('/')
  await waitForAutomaticRegistration(page)
  // The home page is only stored on a controlled visit; make sure "トップページへ" below has nothing stored.
  await page.evaluate(() => caches.delete('start-url-v2'))
  const restore = await goOffline(page, context)
  try {
    // A fresh tab per target: when Playwright navigates an existing offline tab, its network
    // emulation briefly reports "online" to the page being left, which real browsers do not do.
    for (const target of ['/lectures/123', '/lectures?search=offline', '/faq', '/privacy', '/mypage', '/auth/signin', '/offline']) {
      const tab = await context.newPage()
      const response = await tab.goto(target)
      expect(response?.status(), target).toBe(200)
      await expectHydratedOfflinePage(tab, target)
      const url = new URL(tab.url())
      expect(url.pathname + url.search, target).toBe(target)
      // The icon comes from the precache, and the page reports no CSP violations.
      await expect.poll(() => tab.locator('img[alt="ガタレビュ"]').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), target).toBe(true)
      expect(await tab.evaluate(() => (window as any).cspViolations), target).toEqual([])
      await tab.close()
    }
    await page.goto('/lectures/123')
    await expectHydratedOfflinePage(page)
    await page.getByRole('button', { name: 'トップページへ' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expectHydratedOfflinePage(page)
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
    await expectHydratedOfflinePage(page)
  } finally { await restore() }
})

test('オフライン画面は接続が戻ると、本来開こうとした画面を自動で読み込み直す', async ({ page, context }) => {
  await page.goto('/')
  await waitForAutomaticRegistration(page)
  const restore = await goOffline(page, context)
  let restored = false
  try {
    await page.goto('/faq')
    await expectHydratedOfflinePage(page)
    await restore()
    restored = true
    await expect(offlineHeading(page)).toHaveCount(0, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/faq$/)
    await expect(page.locator('main h1')).toBeVisible()
  } finally { if (!restored) await restore() }
})

// Like a server outage or a captive portal: the device never reports a connectivity change.
async function withoutOnlineEvents(context: BrowserContext) {
  await context.addInitScript(() => window.addEventListener('online', event => event.stopImmediatePropagation(), true))
}

test('onlineイベントが来ない場合も、画面に戻ってきたときに本来の画面を読み込み直す', async ({ page, context }) => {
  await withoutOnlineEvents(context)
  await page.goto('/')
  await waitForAutomaticRegistration(page)
  const restore = await goOffline(page, context)
  let restored = false
  try {
    await page.goto('/privacy')
    await expectHydratedOfflinePage(page)
    await restore()
    restored = true
    await page.waitForTimeout(1_000)
    await expect(offlineHeading(page)).toBeVisible()
    // Returning from another app or tab fires visibilitychange.
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
    await expect(offlineHeading(page)).toHaveCount(0, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/privacy$/)
    await expect(page.locator('main h1')).toHaveText('プライバシーポリシー')
  } finally { if (!restored) await restore() }
})

test('オフライン画面から画面内のリンクで移動して「戻る」と、オフライン画面ではなく本来の画面を表示する', async ({ page, context }) => {
  await withoutOnlineEvents(context)
  await page.goto('/')
  await waitForAutomaticRegistration(page)
  const restore = await goOffline(page, context)
  let restored = false
  try {
    await page.goto('/privacy')
    await expectHydratedOfflinePage(page)
    await restore()
    restored = true
    await page.evaluate(() => { (window as any).fallbackDocument = true })
    await page.locator('footer').getByRole('link', { name: 'FAQ', exact: true }).click()
    await expect(page).toHaveURL(/\/faq$/)
    await expect(offlineHeading(page)).toHaveCount(0)
    // Same document: this was a client-side navigation, so "back" is restored by the App Router.
    expect(await page.evaluate(() => (window as any).fallbackDocument)).toBe(true)
    await page.goBack()
    await expect(page).toHaveURL(/\/privacy$/)
    await expect(page.locator('main h1')).toHaveText('プライバシーポリシー', { timeout: 15_000 })
    await expect(offlineHeading(page)).toHaveCount(0)
  } finally { if (!restored) await restore() }
})

test('リンクで移動を始めた直後に画面へ戻っても、自動の読み込み直しで移動を打ち消さない', async ({ page, context }) => {
  await withoutOnlineEvents(context)
  await page.goto('/')
  await waitForAutomaticRegistration(page)
  const restore = await goOffline(page, context)
  let restored = false
  try {
    await page.goto('/privacy')
    await expectHydratedOfflinePage(page)
    await restore()
    restored = true
    // The App Router fetches the next page while the user switches back to this tab.
    await page.evaluate(() => {
      document.querySelector<HTMLAnchorElement>('footer a[href="/faq"]')!.click()
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(page).toHaveURL(/\/faq$/, { timeout: 15_000 })
    await expect(page.locator('main h1')).toBeVisible()
    await expect(offlineHeading(page)).toHaveCount(0)
  } finally { if (!restored) await restore() }
})

test('取り消された移動の後も、待ち時間が過ぎれば画面へ戻ったときに読み込み直す', async ({ page, context }) => {
  await withoutOnlineEvents(context)
  await page.goto('/')
  await waitForAutomaticRegistration(page)
  const restore = await goOffline(page, context)
  let restored = false
  try {
    await page.goto('/privacy')
    await expectHydratedOfflinePage(page)
    await restore()
    restored = true
    // A navigation the user started but that never happened (e.g. stopped while the portal hung).
    await page.evaluate(() => {
      const link = document.createElement('a')
      link.href = '/terms'
      link.textContent = 'cancelled navigation'
      link.addEventListener('click', event => event.preventDefault())
      document.body.appendChild(link)
      link.click()
    })
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
    await page.waitForTimeout(1_000)
    await expect(offlineHeading(page)).toBeVisible()
    await page.waitForTimeout(10_000)
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
    await expect(offlineHeading(page)).toHaveCount(0, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/privacy$/)
    await expect(page.locator('main h1')).toHaveText('プライバシーポリシー')
  } finally { if (!restored) await restore() }
})

test('ログイン中に閲覧しても、SWのキャッシュには公開HTML(/と/offline)以外と個人情報を保存しない', async ({ page, context }) => {
  const secret = process.env.NEXTAUTH_SECRET
  test.skip(!secret, 'NEXTAUTH_SECRET is required to create a dummy session')
  const marker = `pwa-test-user-${Date.now()}`
  // Lifetime fields the jwt callback requires for an active session (app/_helpers/sessionLifetime.ts).
  const now = Math.floor(Date.now() / 1000)
  const value = await encode({
    secret: secret!,
    token: {
      backendToken: `${marker}-token`, user: { id: `${marker}-id`, name: marker, email: `${marker}@example.test`, avatar_url: null },
      remember: true, authTime: now, backendExp: now + 3600,
    },
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
      await expectHydratedOfflinePage(page, target)
      expect(await page.content()).not.toContain(marker)
    }
  } finally { await restore() }
})
