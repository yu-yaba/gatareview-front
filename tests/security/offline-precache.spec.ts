import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

// The offline fallback is served without network access, so every module script
// its static HTML loads must already be in the service worker precache.
test('オフライン画面とホームのHTMLが読み込むスクリプト・CSS・フォントをすべて事前保存する', () => {
  const worker = readFileSync('public/sw.js', 'utf8')
  const precached = new Set(Array.from(worker.matchAll(/url:"([^"]+)"/g), match => match[1]))
  expect(precached).toContain('/offline')
  for (const page of ['offline', 'index']) {
    const html = readFileSync(`.next/server/app/${page}.html`, 'utf8')
    const required = new Set<string>()
    const legacyOnly = new Set<string>()
    for (const tag of Array.from(html.matchAll(/<(script|link)\b[^>]*>/g), match => match[0])) {
      const url = tag.match(/\b(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css|woff2))"/)?.[1]
      if (!url) continue
      // Legacy-browser polyfills (nomodule) are never loaded by browsers that support service workers.
      if (/\bnomodule\b/i.test(tag)) legacyOnly.add(url)
      else required.add(url)
    }
    // Chunks the RSC payload asks the client to load during hydration.
    for (const chunk of Array.from(html.matchAll(/static\/chunks\/[^"\\]+?\.js/g), match => `/_next/${match[0]}`)) {
      if (!legacyOnly.has(chunk)) required.add(chunk)
    }
    expect(legacyOnly.size, page).toBeLessThanOrEqual(1)
    expect(required.size, page).toBeGreaterThan(5)
    expect(Array.from(required).filter(url => !precached.has(url)), page).toEqual([])
  }
})

test('オフライン画面は検索エンジンに登録せず、個人用の表示を静的HTMLに含めない', () => {
  const html = readFileSync('.next/server/app/offline.html', 'utf8')
  expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/)
  expect(html).toContain('オフラインです')
  expect(html).not.toMatch(/backendToken|session-token|@example/)
})
