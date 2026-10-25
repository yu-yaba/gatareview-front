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
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.register('/sw.js')).scope)
  expect(scope).toBe(new URL('/', page.url()).href)
  const result = await page.evaluate(async () => {
    const script = document.createElement('script')
    script.src = 'https://untrusted.example/csp-test.js'
    const completed = new Promise(resolve => { script.onload = () => resolve('loaded'); script.onerror = () => resolve('blocked') })
    document.body.appendChild(script)
    return completed
  })
  expect(result).toBe('blocked')
})
