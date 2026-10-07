const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const { test } = require('node:test')
const ts = require('typescript')

// Use the real TypeScript modules with local session fixtures and a dummy Axios
// adapter. No Next request, provider, backend, or network connection is needed.
function loadSource(relativePath, replacements) {
  const filename = path.resolve(__dirname, '../../', relativePath)
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText
  const sourceModule = new Module(filename, module)
  sourceModule.filename = filename
  sourceModule.paths = Module._nodeModulePaths(path.dirname(filename))
  const originalRequire = sourceModule.require.bind(sourceModule)
  sourceModule.require = id => Object.hasOwn(replacements, id) ? replacements[id] : originalRequire(id)
  sourceModule._compile(compiled, filename)
  return sourceModule.exports
}

function apiFixture(t, fetchFixture) {
  const requests = []
  const sessionRequests = []
  const api = loadSource('app/_helpers/api.ts', {
    'next-auth/react': {
      getSession: async () => { throw new Error('Bound mutations must check the session response directly') },
    },
  })
  api.default.defaults.adapter = async config => {
    requests.push({ method: config.method, url: config.url, authorization: config.headers.get('Authorization'), body: JSON.parse(config.data) })
    return { config, data: { success: true }, status: 200, statusText: 'OK', headers: {} }
  }
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    sessionRequests.push({ url, options })
    return fetchFixture(url, options)
  })
  return { api, requests, sessionRequests }
}

const reviewBody = { review: { content: 'ローカルの回帰試験用に用意した三十文字以上のレビュー本文です。', rating: 3 }, token: 'local-captcha-token' }
const sessionResponse = token => new Response(JSON.stringify(token === null ? {} : { backendToken: token }), { status: 200 })

for (const identity of ['local-account-A', null]) {
  test(`review mutation preserves its ${identity === null ? 'anonymous' : 'authenticated'} initiating identity`, async t => {
    const { api, requests, sessionRequests } = apiFixture(t, () => sessionResponse(identity))
    await api.reviewApi.createReview('3886', reviewBody, { expectedBackendToken: identity })

    assert.equal(requests.length, 1)
    assert.equal(requests[0].authorization ?? null, identity ? `Bearer ${identity}` : null)
    assert.equal(requests[0].url, '/lectures/3886/reviews')
    assert.deepEqual(requests[0].body, reviewBody)
    assert.equal(sessionRequests.length, 1)
    assert.equal(sessionRequests[0].url, '/api/auth/session')
    assert.equal(sessionRequests[0].options.credentials, 'same-origin')
    assert.equal(sessionRequests[0].options.cache, 'no-store')
    assert.equal(sessionRequests[0].options.redirect, 'error')
    assert.ok(sessionRequests[0].options.signal instanceof AbortSignal)
  })
}

for (const [expected, current] of [
  ['local-account-A', 'local-account-B'],
  ['local-account-A', null],
  [null, 'local-account-B'],
]) {
  test(`review mutation rejects identity change ${expected ?? 'anonymous'} to ${current ?? 'anonymous'} before posting`, async t => {
    const { api, requests } = apiFixture(t, () => sessionResponse(current))
    await assert.rejects(api.reviewApi.createReview('3886', reviewBody, { expectedBackendToken: expected }), error => error instanceof api.SessionChangedError)
    assert.equal(requests.length, 0)
  })
}

for (const [name, response] of [
  ['array session', []],
  ['string session', 'invalid-session'],
  ['numeric session', 7],
  ['non-string token', { backendToken: 7 }],
]) {
  test(`review mutation rejects a malformed ${name} before posting anonymously`, async t => {
    const { api, requests } = apiFixture(t, () => new Response(JSON.stringify(response), { status: 200 }))
    await assert.rejects(api.reviewApi.createReview('3886', reviewBody, { expectedBackendToken: null }))
    assert.equal(requests.length, 0)
  })
}

for (const [name, response] of [
  ['HTTP failure', () => new Response('{}', { status: 503 })],
  ['network failure', () => { throw new TypeError('local session unavailable') }],
  ['invalid JSON', () => new Response('{invalid', { status: 200 })],
]) {
  test(`review mutation fails closed on session ${name}`, async t => {
    const { api, requests } = apiFixture(t, response)
    await assert.rejects(api.reviewApi.createReview('3886', reviewBody, { expectedBackendToken: null }))
    assert.equal(requests.length, 0)
  })
}

test('a cancelled review mutation never reaches the Axios adapter', async t => {
  const controller = new AbortController()
  controller.abort()
  const { api, requests } = apiFixture(t, (_url, options) => {
    if (options.signal.aborted) throw new DOMException('Cancelled', 'AbortError')
    return sessionResponse('local-account-A')
  })
  await assert.rejects(api.reviewApi.createReview('3886', reviewBody, { expectedBackendToken: 'local-account-A', signal: controller.signal }))
  assert.equal(requests.length, 0)
})

test('cancelling during the session check aborts that request before posting', async t => {
  const controller = new AbortController()
  let started
  const sessionStarted = new Promise(resolve => { started = resolve })
  const { api, requests } = apiFixture(t, (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true })
    started(options.signal)
  }))
  const pending = api.reviewApi.createReview('3886', reviewBody, { expectedBackendToken: 'local-account-A', signal: controller.signal })
  const rejects = assert.rejects(pending)
  const sessionSignal = await sessionStarted
  controller.abort()
  await rejects
  assert.equal(sessionSignal.aborted, true)
  assert.equal(requests.length, 0)
})

test('an anonymous mutation discards a stale caller Authorization header', async t => {
  const { api, requests } = apiFixture(t, () => sessionResponse(null))
  await api.reviewApi.createReview('3886', reviewBody, { expectedBackendToken: null, headers: { Authorization: 'Bearer stale-local-token' } })
  assert.equal(requests.length, 1)
  assert.equal(requests[0].authorization ?? null, null)
})

test('admin settings mutation preserves the initiating account', async t => {
  const { api, requests } = apiFixture(t, () => sessionResponse('local-admin-A'))
  await api.reviewAccessAdminApi.updateReviewAccess(true, { expectedBackendToken: 'local-admin-A' })
  assert.equal(requests.length, 1)
  assert.equal(requests[0].method, 'patch')
  assert.equal(requests[0].authorization, 'Bearer local-admin-A')
  assert.deepEqual(requests[0].body, { review_access: { lecture_review_restriction_enabled: true } })
})

test('admin settings mutation rejects a changed account before patching', async t => {
  const { api, requests } = apiFixture(t, () => sessionResponse('local-admin-B'))
  await assert.rejects(api.reviewAccessAdminApi.updateReviewAccess(true, { expectedBackendToken: 'local-admin-A' }), error => error instanceof api.SessionChangedError)
  assert.equal(requests.length, 0)
})

// A small hook lifecycle fixture verifies capture, cleanup, and duplicate guards.
// Browser tests separately exercise the real React tree and NextAuth cookies.
function hookFixture(initialSession) {
  let session = initialSession
  let refIndex = 0
  let effectIndex = 0
  const refs = []
  const effects = []
  const react = {
    useRef: initial => refs[refIndex++] ||= { current: initial },
    useCallback: callback => callback,
    useEffect: (effect, dependencies) => {
      const index = effectIndex++
      const previous = effects[index]
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
        previous?.cleanup?.()
        effects[index] = { dependencies, cleanup: effect() }
      }
    },
  }
  const { useMutationRequest } = loadSource('app/_hooks/useMutationRequest.ts', {
    react,
    'next-auth/react': { useSession: () => session },
  })
  const render = nextSession => {
    if (nextSession) session = nextSession
    refIndex = 0
    effectIndex = 0
    return useMutationRequest()
  }
  return { render, unmount: () => effects.forEach(effect => effect.cleanup?.()) }
}

const authenticated = token => ({ data: { backendToken: token }, status: 'authenticated' })
const anonymous = { data: null, status: 'unauthenticated' }

test('mutation hook captures initial identity and aborts it after an account change', () => {
  const fixture = hookFixture(authenticated('local-account-A'))
  const started = fixture.render().beginMutation()
  assert.equal(started.expectedBackendToken, 'local-account-A')
  const next = fixture.render(authenticated('local-account-B')).beginMutation()
  assert.equal(started.expectedBackendToken, 'local-account-A')
  assert.equal(started.signal.aborted, true)
  assert.equal(next.expectedBackendToken, 'local-account-B')
  fixture.unmount()
})

test('mutation hook aborts pending work when its component unmounts', () => {
  const fixture = hookFixture(anonymous)
  const hook = fixture.render()
  const started = hook.beginMutation()
  assert.equal(started.expectedBackendToken, null)
  fixture.unmount()
  assert.equal(started.signal.aborted, true)
  assert.equal(hook.beginMutation(), null)
})

test('mutation hook guards duplicate submissions and releases the guard on finish', () => {
  const fixture = hookFixture(authenticated('local-account-A'))
  const hook = fixture.render()
  const started = hook.beginMutation()
  assert.equal(hook.beginMutation(), null)
  started.finish()
  assert.notEqual(hook.beginMutation(), null)
  fixture.unmount()
})

test('mutation hook preserves pending work during an unchanged session refresh', () => {
  const fixture = hookFixture(authenticated('local-account-A'))
  const started = fixture.render().beginMutation()
  fixture.render(authenticated('local-account-A'))
  assert.equal(started.signal.aborted, false)
  fixture.unmount()
})

test('mutation hook rejects work until initial session loading completes', () => {
  const fixture = hookFixture({ data: null, status: 'loading' })
  const loading = fixture.render()
  assert.equal(loading.isSessionLoading, true)
  assert.equal(loading.beginMutation(), null)
  const ready = fixture.render(anonymous)
  assert.equal(ready.isSessionLoading, false)
  assert.equal(ready.beginMutation().expectedBackendToken, null)
  fixture.unmount()
})
