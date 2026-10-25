import { expect, test } from '@playwright/test'
const { createContentSecurityPolicy } = require('../../config/content-security-policy.cjs')

test('CSPは外部スクリプト・外部接続・インラインイベント・evalを拒否する', async ({ page }) => {
  const externalRequests: string[] = []
  await page.route('https://untrusted.example/**', async route => {
    externalRequests.push(route.request().url())
    await route.fulfill({ contentType: 'application/javascript', body: 'window.untrustedExecuted = true' })
  })
  const response = await page.goto('/_test/csp-probe')
  expect(response?.headers()['content-security-policy']).toContain("script-src-attr 'none'")
  const result = await page.evaluate(async () => {
    const violations: string[] = (window as any).cspViolations
    const script = document.createElement('script')
    script.src = 'https://untrusted.example/inject.js'
    const scriptDone = new Promise(resolve => { script.onload = resolve; script.onerror = resolve })
    document.body.appendChild(script)
    const button = document.createElement('button')
    button.setAttribute('onclick', 'window.inlineEventExecuted = true')
    document.body.appendChild(button)
    button.click()
    // The server-rendered fixture probes eval before any DevTools evaluation.
    let connectionBlocked = false
    try { await fetch('https://untrusted.example/collect') } catch { connectionBlocked = true }
    await scriptDone
    await new Promise(resolve => setTimeout(resolve, 20))
    return {
      scriptExecuted: Boolean((window as any).untrustedExecuted),
      eventExecuted: Boolean((window as any).inlineEventExecuted),
      evalBlocked: Boolean((window as any).evalBlocked), connectionBlocked, violations,
    }
  })
  expect(result.scriptExecuted).toBe(false)
  expect(result.eventExecuted).toBe(false)
  expect(result.evalBlocked).toBe(true)
  expect(result.connectionBlocked).toBe(true)
  expect(result.violations).toEqual(expect.arrayContaining(['script-src-elem', 'script-src-attr', 'script-src', 'connect-src']))
  expect(externalRequests).toEqual([])
})

test('必要な初期化・同一サイト通信・GoogleとCloudflareの許可先を利用できる', async ({ page }) => {
  await page.route('https://www.google.com/recaptcha/api.js*', route => route.fulfill({
    contentType: 'application/javascript', body: 'window.recaptchaScriptLoaded = true',
  }))
  await page.route('https://static.cloudflareinsights.com/**', route => route.fulfill({
    contentType: 'application/javascript', body: 'window.cloudflareScriptLoaded = true',
  }))
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const inline = document.createElement('script')
    inline.textContent = 'window.frameworkInlineExecuted = true'
    document.body.appendChild(inline)
    const google = document.createElement('script')
    google.src = 'https://www.google.com/recaptcha/api.js?render=test-only'
    const loaded = new Promise(resolve => { google.onload = () => resolve(true); google.onerror = () => resolve(false) })
    document.body.appendChild(google)
    const cloudflare = document.createElement('script')
    cloudflare.src = 'https://static.cloudflareinsights.com/beacon.min.js/test-version'
    const cloudflareLoaded = new Promise(resolve => { cloudflare.onload = () => resolve(true); cloudflare.onerror = () => resolve(false) })
    document.body.appendChild(cloudflare)
    return { inline: Boolean((window as any).frameworkInlineExecuted), google: await loaded, cloudflare: await cloudflareLoaded,
      apiStatus: (await fetch('/api/auth/session')).status }
  })
  expect(result).toEqual({ inline: true, google: true, cloudflare: true, apiStatus: 200 })
})

test('API環境変数をCSPの追加命令に使えず、本番ではevalと開発用接続を許可しない', () => {
  for (const apiBaseUrl of ['https://api.example; script-src *', 'https://api.example\nunsafe',
    'javascript:alert(1)', 'https://user:password@api.example']) {
    expect(() => createContentSecurityPolicy({ apiBaseUrl })).toThrow()
  }
  const production = createContentSecurityPolicy({ apiBaseUrl: 'https://api.example/base' })
  expect(production).toContain("connect-src 'self' https://api.example")
  expect(production).not.toMatch(/unsafe-eval|ws:|localhost/)
  expect(production).toContain("object-src 'none'")
  expect(production).toContain("frame-ancestors 'none'")
})
