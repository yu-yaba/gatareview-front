import * as Sentry from '@sentry/nextjs'
import { sentryOptions } from './app/_helpers/monitoring'

Sentry.init(sentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN, process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV))

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
