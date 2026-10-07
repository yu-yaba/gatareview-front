import { expect, test } from '@playwright/test'

test('クエリが画像・JSに見える認証APIをキャッシュせず、アカウント変更を反映する', async ({ page }) => {
  await page.request.get('/_test/user?user=A')
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
    }
  })
  const before = await page.evaluate(async () => {
    const responses = await Promise.all(['.png', '.js'].map(async suffix => (await fetch(`/api/auth/session?cache-test=${suffix}`)).json()))
    return responses.map(response => response.user.name)
  })
  expect(before).toEqual(['test-only-user-A', 'test-only-user-A'])
  await page.request.get('/_test/user?user=B')
  const after = await page.evaluate(async () => {
    const responses = await Promise.all(['.png', '.js'].map(async suffix => (await fetch(`/api/auth/session?cache-test=${suffix}`)).json()))
    let sensitiveCached = false
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) {
        if (new URL(request.url).pathname.startsWith('/api/')) sensitiveCached = true
      }
    }
    return { users: responses.map(response => response.user.name), sensitiveCached }
  })
  expect(after.users).toEqual(['test-only-user-B', 'test-only-user-B'])
  expect(after.sensitiveCached).toBe(false)
})

test('SW更新で旧機密キャッシュを削除し、新しい公開画像キャッシュを保持する', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    for (const name of ['images', 'static-resources']) {
      await (await caches.open(name)).put('/api/auth/session?cache-test=.png', new Response('test-only-sensitive-response'))
    }
    await (await caches.open('images-v2')).put('/test-public-image.png', new Response('test-only-public-image'))
    await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
  })
  await expect.poll(() => page.evaluate(() => caches.keys())).not.toContain('images')
  await expect.poll(() => page.evaluate(() => caches.keys())).not.toContain('static-resources')
  expect(await page.evaluate(async () => (await (await caches.open('images-v2')).match('/test-public-image.png'))?.text())).toBe('test-only-public-image')
})

test('画像・JSに見えるクエリやパスの個人用HTMLをナビゲーションでもfetchでもキャッシュしない', async ({ page }) => {
  await page.request.get('/_test/user?user=A')
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
    }
  })
  for (const target of ['/mypage?cache=.png', '/lectures/123?cache=.js', '/mypage/private.png', '/lectures/private.js']) {
    await page.request.get('/_test/user?user=A')
    await page.goto(target)
    await expect(page.getByText('test-only-user-A')).toBeVisible()
    expect(await page.evaluate(async target => (await fetch(target)).text(), target)).toContain('test-only-user-A')
    await page.request.get('/_test/user?user=B')
    await page.reload()
    await expect(page.getByText('test-only-user-B')).toBeVisible()
    expect(await page.evaluate(async target => (await fetch(target)).text(), target)).toContain('test-only-user-B')
  }
  const stored = await page.evaluate(async () => {
    const urls = []
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) urls.push(new URL(request.url).pathname)
    }
    return urls.filter(url => url.startsWith('/mypage') || url.startsWith('/lectures/'))
  })
  expect(stored).toEqual([])
})

test('scriptとimgの目的で個人用HTMLを取得してもキャッシュしない', async ({ page }) => {
  await page.request.get('/_test/user?user=A')
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
    }
    await Promise.all([
      ['script', '/lectures/private.js'], ['img', '/mypage/private.png'],
    ].map(([tag, src]) => new Promise(resolve => {
      const element = document.createElement(tag) as HTMLScriptElement | HTMLImageElement
      element.onload = resolve
      element.onerror = resolve
      element.src = src
      document.body.appendChild(element)
    })))
  })
  await page.request.get('/_test/user?user=B')
  const results = await page.evaluate(async () => {
    const cached = []
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) {
        if (/^\/(mypage|lectures)\//.test(new URL(request.url).pathname)) cached.push(request.url)
      }
    }
    return {
      cached,
      pages: await Promise.all(['/lectures/private.js', '/mypage/private.png'].map(async target => (await fetch(target)).text())),
    }
  })
  expect(results.cached).toEqual([])
  expect(results.pages.every(body => body.includes('test-only-user-B'))).toBe(true)
})
