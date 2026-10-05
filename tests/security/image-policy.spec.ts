import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
// Installed Next.js validation is the same path used by /_next/image.
const { ImageOptimizerCache } = require('next/dist/server/image-optimizer')
const { imageConfigDefault } = require('next/dist/shared/lib/image-config')

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
