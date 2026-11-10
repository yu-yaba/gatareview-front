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

test('a forced sampled sentry-trace header cannot make the SDK send spans or transactions', async () => {
  const marker = 'FORCED_TRACE_QUERY_MARKER'
  const traceId = '0123456789abcdef0123456789abcdef'
  const incoming = [
    { sentryTrace: `${traceId}-0123456789abcdef-1`, baggage: undefined },
    { sentryTrace: `${traceId}-0123456789abcdef-1`,
      baggage: `sentry-trace_id=${traceId},sentry-sampled=true,sentry-sample_rate=1,sentry-sample_rand=0.000001` },
    // No sampled flag in sentry-trace, but the baggage claims the trace was sampled.
    { sentryTrace: `${traceId}-0123456789abcdef`, baggage: `sentry-trace_id=${traceId},sentry-sampled=true` },
  ]
  async function sentItems(options) {
    const envelopes = []
    Sentry.init({
      ...options,
      transport: () => ({ send: async envelope => { envelopes.push(envelope); return { statusCode: 200 } }, flush: async () => true }),
    })
    for (const headers of incoming) {
      Sentry.continueTrace(headers, () => Sentry.startSpan({
        name: `GET /lectures?keyword=${marker}`, op: 'http.server', forceTransaction: true,
        attributes: { 'http.target': `/lectures?keyword=${marker}` },
      }, () => Sentry.startSpan({ name: `render /lectures?keyword=${marker}` }, () => undefined)))
    }
    await Sentry.flush(2000)
    await Sentry.close(2000)
    return { items: envelopes.flatMap(envelope => envelope[1]), json: JSON.stringify(envelopes) }
  }
  const tracing = item => ['span', 'transaction'].includes(item[0].type)
  const dsn = 'https://public@o123.ingest.us.sentry.io/456'

  for (const traceLifecycle of [undefined, 'static']) {
    // Control: without our sampler the SDK inherits the attacker's sampled flag, proving the harness sees spans.
    const control = await sentItems({ ...sentryOptions(dsn, 'production'), traceLifecycle, tracesSampler: undefined })
    assert.equal(control.items.some(tracing), true, `control (${traceLifecycle ?? 'stream'}) should send spans`)

    const { items, json } = await sentItems({ ...sentryOptions(dsn, 'production'), traceLifecycle })
    assert.deepEqual(items.filter(tracing), [], `${traceLifecycle ?? 'stream'} lifecycle sent spans`)
    assert.equal(json.includes(marker), false)
  }
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

test('rate-limited failures are reported at most once per interval, from the server or the browser', () => {
  const { shouldReportRequestError, BACKEND_RATE_LIMITED_DIGEST } = source.exports
  const options = sentryOptions('https://public@o123.ingest.us.sentry.io/456', 'production')
  const event = { event_id: 'e', exception: { values: [{ type: 'Error', value: 'x' }] } }
  const marked = digest => Object.assign(new Error('An error occurred in the Server Components render.'), { digest })

  assert.equal(BACKEND_RATE_LIMITED_DIGEST, 'API_RATE_LIMITED')
  // The first one is sent, tagged, so limits hit by everyone stay visible.
  const first = options.beforeSend(event, { originalException: marked('API_RATE_LIMITED') })
  assert.equal(first.tags.operation, 'api.rate_limited')
  assert.equal(first.message, 'Backend API rate limited (sampled)')
  // Further copies (server, HTML render, browser) within the interval are dropped.
  assert.equal(options.beforeSend(event, { originalException: marked('API_RATE_LIMITED') }), null)
  assert.equal(options.beforeSend(event, { originalException: marked('API_RATE_LIMITED@E123') }), null)
  assert.equal(shouldReportRequestError(marked('API_RATE_LIMITED'), Date.now() + 10 * 60_000 + 1), true)
  // Browsers never send them: their interval would restart on every page load.
  assert.equal(shouldReportRequestError(marked('API_RATE_LIMITED'), Date.now() + 60 * 60_000, true), false)
  assert.equal(shouldReportRequestError(new Error('unexpected'), Date.now(), true), true)
  // Outages and unexpected errors are always reported.
  for (let i = 0; i < 3; i++) {
    assert.notEqual(options.beforeSend(event, { originalException: marked('3253150281') }), null)
    assert.notEqual(options.beforeSend(event, { originalException: new Error('unexpected') }), null)
  }
  assert.notEqual(options.beforeSend(event, undefined), null)
  assert.equal(shouldReportRequestError('not an error'), true)
})
