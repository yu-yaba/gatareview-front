const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const { test } = require('node:test')
const ts = require('typescript')
const Sentry = require('@sentry/nextjs')
const { createContentSecurityPolicy } = require('../../config/content-security-policy.cjs')

const filename = path.resolve(__dirname, '../../app/_helpers/monitoring.ts')
const source = new Module(filename, module)
source.filename = filename
source.paths = Module._nodeModulePaths(path.dirname(filename))
source._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename)
const { safeErrorEvent, sentryOptions } = source.exports

test('outgoing diagnostics exclude messages, identity, request contents and source context', async () => {
  const marker = 'PRIVATE_REVIEW_EMAIL_TOKEN'
  const input = {
    type: undefined, event_id: 'abc', environment: 'production',
    message: marker, user: { email: marker, ip_address: marker },
    request: { url: `https://site.invalid/?token=${marker}`, headers: { Authorization: marker }, data: marker },
    extra: { review: marker }, contexts: { trace: { data: marker } },
    breadcrumbs: [{ message: marker }], tags: { operation: 'api.request', token: marker },
    exception: { values: [{ type: 'TypeError', value: marker, stacktrace: { frames: [{
      filename: `https://site.invalid/_next/static/chunks/app.js?token=${marker}`,
      function: 'render', lineno: 12, colno: 4, vars: { token: marker }, context_line: marker,
    }] } }] },
  }
  const clean = safeErrorEvent(input)
  assert.equal(JSON.stringify(clean).includes(marker), false)
  assert.equal(clean.exception.values[0].type, 'TypeError')
  assert.equal(clean.exception.values[0].stacktrace.frames[0].lineno, 12)
  assert.equal(input.message, marker)

  const envelopes = []
  Sentry.init({
    ...sentryOptions('https://public@o123.ingest.us.sentry.io/456', 'production'),
    transport: () => ({ send: async envelope => { envelopes.push(envelope); return { statusCode: 200 } }, flush: async () => true }),
  })
  Sentry.captureException(new TypeError(marker), { extra: { review: marker }, user: { email: marker } })
  await Sentry.flush(2000)
  const events = envelopes.flatMap(envelope => envelope[1]).filter(item => item[0].type === 'event')
  assert.equal(events.length, 1)
  assert.equal(JSON.stringify(envelopes).includes(marker), false)
  assert.equal(events[0][1].exception.values[0].type, 'TypeError')
  await Sentry.close(2000)
})

test('preview and development do not consume the production error quota', () => {
  for (const environment of ['preview', 'development', 'test', undefined]) {
    assert.equal(sentryOptions('https://public@o123.ingest.us.sentry.io/456', environment).enabled, false)
  }
  assert.equal(sentryOptions(undefined, 'production').enabled, false)
})

test('CSP permits only the configured Sentry ingest host', () => {
  const csp = createContentSecurityPolicy({ sentryDsn: 'https://public@o123.ingest.us.sentry.io/456' })
  assert.match(csp, /connect-src [^;]*https:\/\/o123\.ingest\.us\.sentry\.io/)
  assert.doesNotMatch(csp, /\*\.sentry\.io|public@/)
  for (const sentryDsn of ['https://public@evil.invalid/1', 'https://public@o123.ingest.us.sentry.io.evil.invalid/1',
    'http://public@o123.ingest.us.sentry.io/1', 'https://o123.ingest.us.sentry.io/1; script-src *']) {
    assert.throws(() => createContentSecurityPolicy({ sentryDsn }))
  }
})
