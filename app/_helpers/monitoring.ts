import type { ErrorEvent, StackFrame } from '@sentry/nextjs'

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
    beforeSend: safeErrorEvent, beforeSendLog: () => null, beforeSendMetric: () => null,
  }
}
