import type { ErrorEvent, EventHint, StackFrame } from '@sentry/nextjs'

const operations = {
  'api.request': 'Backend API unavailable',
  'auth.backend': 'Backend authentication unavailable',
  'monitoring.test': 'Monitoring delivery test',
  unhandled: 'Unexpected application error',
} as const

function identifier(value: unknown): string | undefined {
  return typeof value === 'string' && /^[\w.$<>[\] :()-]{1,120}$/.test(value) ? value : undefined
}

function safeFrame(frame: StackFrame): StackFrame {
  // Keep code locations, excluding query strings, source lines and local variables.
  const filename = frame.filename?.split(/[?#]/, 1)[0].replaceAll('\\', '/').split('/').slice(-3).join('/')
  return { filename, function: identifier(frame.function), lineno: frame.lineno, colno: frame.colno, in_app: frame.in_app }
}

export function safeErrorEvent(event: ErrorEvent): ErrorEvent {
  const candidate = event.tags?.operation
  const operation = typeof candidate === 'string' && Object.hasOwn(operations, candidate)
    ? candidate as keyof typeof operations : 'unhandled'
  const message = operations[operation]
  // Error messages can include submitted review text or provider responses.
  // Construct the outgoing event from allowed diagnostics rather than copying it.
  return {
    type: undefined,
    event_id: event.event_id, timestamp: event.timestamp, platform: event.platform,
    level: event.level, environment: event.environment, release: event.release, sdk: event.sdk,
    tags: { service: 'gatareview-front', operation }, message,
    exception: event.exception && {
      values: event.exception.values?.map(value => ({
        type: identifier(value.type) ?? 'Error', value: message,
        mechanism: value.mechanism && { type: 'generic', handled: value.mechanism.handled },
        stacktrace: value.stacktrace && { frames: value.stacktrace.frames?.map(safeFrame) },
      })),
    },
  }
}

// A visitor over the API rate limit gets a 5xx error page. That is expected
// and anyone can trigger it on purpose, so it must not use up the error quota.
// Next.js keeps an error's own digest on every copy it reports (server render,
// HTML render, the browser's error boundary), so serverLectureApi.ts marks
// rate-limited failures with this digest. The error page shows it as the error ID.
export const BACKEND_RATE_LIMITED_DIGEST = 'API_RATE_LIMITED'

export function shouldReportRequestError(error: unknown): boolean {
  const digest = typeof error === 'object' && error !== null ? (error as { digest?: unknown }).digest : undefined
  return !(typeof digest === 'string' && digest.startsWith(BACKEND_RATE_LIMITED_DIGEST))
}

export function sentryOptions(dsn: string | undefined, environment: string | undefined) {
  return {
    dsn, enabled: Boolean(dsn) && environment === 'production', environment,
    dataCollection: {
      userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false,
      databaseQueryData: false, queues: false, stackFrameVariables: false, frameContextLines: 0,
      graphQL: { document: false, variables: false }, genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
    },
    tracesSampleRate: 0, tracePropagationTargets: [], maxBreadcrumbs: 0,
    integrations: (defaults: { name: string }[]) => defaults.filter(integration =>
      !['BrowserSession', 'BrowserTracing', 'Breadcrumbs', 'Console', 'HttpContext'].includes(integration.name)),
    replaysSessionSampleRate: 0, replaysOnErrorSampleRate: 0,
    beforeSend: (event: ErrorEvent, hint?: EventHint) =>
      shouldReportRequestError(hint?.originalException) ? safeErrorEvent(event) : null,
    beforeSendLog: () => null, beforeSendMetric: () => null,
  }
}
