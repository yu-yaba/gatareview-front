import 'server-only';
import { headers } from 'next/headers';

import {
  forwardingSecret,
  isTrustedVercelRuntime,
  signedClientIpHeaders,
  trustedClientIp,
} from './clientIpSignature';

// Server-side calls to the Rails API must not hold a page for as long as the
// API stalls; a timeout is treated like any other backend failure.
export const BACKEND_TIMEOUT_MS = 8_000;

export type ClientIpSigner = (url: string, method?: string) => Record<string, string>;

// No visitor to attribute the call to (ISR routes), or forwarding is off.
export const UNSIGNED: ClientIpSigner = () => ({});

// Returns a function that adds the signed visitor IP to a backend request.
// It reads the incoming request headers, so call it only while handling a
// visitor's request (dynamic pages, route handlers), never inside
// unstable_cache or an ISR route. Without RATE_LIMIT_FORWARDING_SECRET, or
// outside Vercel, it adds nothing and the API keeps its previous behavior.
export async function clientIpSigner(): Promise<ClientIpSigner> {
  const secret = forwardingSecret();
  if (!secret || !isTrustedVercelRuntime()) return UNSIGNED;

  const ip = trustedClientIp(await headers());
  if (!ip) return UNSIGNED;

  // Sign when the request is made, so the timestamp is fresh even if a cache
  // refresh runs the request after the page has been sent.
  return (url, method = 'GET') => signedClientIpHeaders({ secret, ip, url, method });
}
