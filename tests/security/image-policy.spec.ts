import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
// Installed Next.js validation is the same path used by /_next/image.
const { ImageOptimizerCache } = require('next/dist/server/image-optimizer')
const { imageConfigDefault } = require('next/dist/shared/lib/image-config')

test('SWの事前保存に配信されないApp Router内部manifestを含めない', () => {
  const worker = readFileSync('public/sw.js', 'utf8')
  expect(worker).not.toContain('/_next/app-build-manifest.json')
  expect(worker).not.toMatch(/url:"\/_next\/(?:server\/|build-manifest\.json|react-loadable-manifest\.json)/)
})

test('SWは未閲覧の管理・マイページ・投稿のプログラムを事前保存しない', () => {
  const worker = readFileSync('public/sw.js', 'utf8')
  const urls = Array.from(worker.matchAll(/url:"([^"]+)"/g), match => match[1])
  expect(urls.some(url => /chunks\/app\/(admin|mypage)\//.test(url))).toBe(false)
  expect(urls.some(url => /chunks\/app\/lectures\/.*\/review\//.test(url))).toBe(false)
  expect(urls).not.toContain('/gatareview_ogp.png')
  expect(urls.some(url => /chunks\/app\/page-/.test(url))).toBe(true)
})

test('授業OGPの実行環境に必要なロゴを同梱する', () => {
  const tracePath = '.next/server/app/lectures/[id]/opengraph-image/route.js.nft.json'
  const trace = JSON.parse(readFileSync(tracePath, 'utf8'))
  const files = trace.files.map((file: string) => resolve(dirname(tracePath), file))
  expect(files).toContain(resolve('public/green-footer-title.png'))
})

test('本番画像最適化はlocalhost・HTTP・任意ポートを拒否する', () => {
  const { config } = JSON.parse(readFileSync('.next/required-server-files.json', 'utf8'))
  const allowed = (url: string) => !ImageOptimizerCache.validateParams({ headers: {} }, { url, w: '64', q: '75' }, config, false).errorMessage
  expect(allowed('http://localhost:3000/private.png')).toBe(false)
  expect(allowed('http://127.0.0.1:3000/private.png')).toBe(false)
  expect(allowed('http://lh3.googleusercontent.com/avatar.png')).toBe(false)
  expect(allowed('https://lh3.googleusercontent.com:444/avatar.png')).toBe(false)
  expect(allowed('https://lh3.googleusercontent.com/avatar.png')).toBe(true)
})

test('開発環境では既存のローカル画像取得を許可する', () => {
  const images = JSON.parse(execFileSync(process.execPath, ['-e', 'console.log(JSON.stringify(require("./next.config.js").images))'], {
    env: { ...process.env, NODE_ENV: 'development' }, encoding: 'utf8',
  }))
  const result = ImageOptimizerCache.validateParams({ headers: {} }, { url: 'http://localhost:3001/test.png', w: '64', q: '75' }, { images: { ...imageConfigDefault, ...images } }, true)
  expect(result.errorMessage).toBeUndefined()
})
