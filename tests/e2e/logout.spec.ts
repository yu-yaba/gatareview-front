import { expect, test } from '@playwright/test'
import { mockSession, mockMypage, dismissInstallPromptIfVisible } from './review-access.helpers'

test.beforeEach(async ({ page }) => {
  await mockSession(page, {
    authenticated: true,
    user: { id: '1', name: '学生ユーザー', email: 'student@example.com' },
    backendToken: 'test-only-backend-token',
  })
  await page.route('**/api/auth/csrf**', route => route.fulfill({ json: { csrfToken: 'test-csrf' } }))
})

for (const scenario of [
  { path: '/mypage', name: '通常のログアウト', relogin: false },
  { path: '/mypage', name: 'マイページの再ログイン', relogin: true },
  { path: '/auth/signout', name: 'サインアウト画面', relogin: false },
]) {
  test(`${scenario.name}でAPI失効後にセッションを終了する`, async ({ page }) => {
    const calls: string[] = []
    if (scenario.relogin) {
      await page.route('**/api/v1/mypage**', route => route.fulfill({ status: 500, json: { error: 'test failure' } }))
    } else {
      await mockMypage(page)
    }
    await page.route('**/api/v1/auth/logout', async route => {
      expect(route.request().method()).toBe('POST')
      expect(route.request().headers().authorization).toBe('Bearer test-only-backend-token')
      calls.push('revoke')
      await route.fulfill({ json: { message: 'logged out' } })
    })
    await page.route('**/api/auth/signout', async route => {
      calls.push('signout')
      await route.fulfill({ json: { url: scenario.relogin ? '/auth/signin' : '/' } })
    })
    await page.goto(scenario.path)
    await dismissInstallPromptIfVisible(page)
    await page.getByRole('button', { name: scenario.relogin ? '再度ログインする' : 'ログアウト', exact: true }).click()
    await expect(page).toHaveURL(scenario.relogin ? /\/auth\/signin$/ : /\/$/)
    expect(calls).toEqual(['revoke', 'signout'])
  })
}

test('失効済みのAPIトークンでもセッションを終了できる', async ({ page }) => {
  let signedOut = false
  await page.route('**/api/v1/auth/logout', route => route.fulfill({ status: 401, json: { error: 'expired' } }))
  await page.route('**/api/auth/signout', async route => {
    signedOut = true
    await route.fulfill({ json: { url: '/' } })
  })
  await page.goto('/auth/signout')
  await dismissInstallPromptIfVisible(page)
  await page.getByRole('button', { name: 'ログアウト', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  expect(signedOut).toBe(true)
})

test('API失効に失敗したらセッションを保持し、再試行できる', async ({ page }) => {
  let fail = true
  let signoutCalls = 0
  await page.route('**/api/v1/auth/logout', route => route.fulfill({ status: fail ? 503 : 200, json: {} }))
  await page.route('**/api/auth/signout', async route => {
    signoutCalls += 1
    await route.fulfill({ json: { url: '/' } })
  })
  await page.goto('/auth/signout')
  await dismissInstallPromptIfVisible(page)
  await page.getByRole('button', { name: 'ログアウト', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'ログアウトに失敗しました' })).toBeVisible()
  expect(signoutCalls).toBe(0)
  await expect(page).toHaveURL(/\/auth\/signout$/)
  fail = false
  await page.getByRole('button', { name: 'ログアウト', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  expect(signoutCalls).toBe(1)
})

for (const fails of [false, true]) {
  test(`別アカウントへのログイン${fails ? 'は失効失敗時に停止する' : 'の前に旧APIトークンを失効する'}`, async ({ page }) => {
    const calls: string[] = []
    await page.route('**/api/v1/auth/logout', async route => {
      calls.push('revoke')
      await route.fulfill({ status: fails ? 503 : 200, json: {} })
    })
    await page.route('**/api/auth/signout', async route => { calls.push('signout'); await route.fulfill({ json: { url: '/auth/signin?force=true' } }) })
    await page.route('**/api/auth/providers', route => route.fulfill({ json: { google: { id: 'google', name: 'Google', type: 'oauth', signinUrl: '/api/auth/signin/google' } } }))
    await page.route('**/api/auth/signin/google', async route => { calls.push('oauth'); await route.fulfill({ json: { url: '/' } }) })
    await page.goto('/auth/signin?force=true')
    await dismissInstallPromptIfVisible(page)
    await page.getByRole('button', { name: 'Googleでログイン' }).click()
    if (fails) {
      await expect(page.getByRole('alert').filter({ hasText: 'ログアウトに失敗しました' })).toBeVisible()
      expect(calls).toEqual(['revoke'])
      await expect(page).toHaveURL(/force=true/)
    } else {
      await expect(page).toHaveURL(/\/$/)
      expect(calls).toEqual(['revoke', 'signout', 'oauth'])
    }
  })
}

test('標準サインアウト側の失効が失敗したら画面のセッション終了も停止する', async ({ page }) => {
  await page.route('**/api/v1/auth/logout', route => route.fulfill({ json: {} }))
  await page.route('**/api/auth/signout', route => route.fulfill({ status: 503, json: { error: 'API revocation failed' } }))
  await page.goto('/auth/signout')
  await dismissInstallPromptIfVisible(page)
  await page.getByRole('button', { name: 'ログアウト', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'ログアウトに失敗しました' })).toBeVisible()
  await expect(page).toHaveURL(/\/auth\/signout$/)
})
