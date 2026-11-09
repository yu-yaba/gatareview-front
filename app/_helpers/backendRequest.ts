import 'server-only';
import { headers } from 'next/headers';

import {
  CLOUDFLARE_PROXY_SECRET_ENV,
  forwardingSecret,
  hasCloudflareProxySecret,
  isTrustedVercelRuntime,
  signedClientIpHeaders,
  trustedClientIp,
  unusableSecrets,
} from './clientIpSignature';

// Server-side calls to the Rails API must not hold a page for as long as the
// API stalls; a timeout is treated like any other backend failure.
export const BACKEND_TIMEOUT_MS = 8_000;

export type ClientIpSigner = (url: string, method?: string) => Record<string, string>;

// No visitor to attribute the call to (the home page's ISR refresh), or
// forwarding is off.
export const UNSIGNED: ClientIpSigner = () => ({});

// Returns a function that adds the signed visitor IP to a backend request.
// It reads the incoming request headers, so call it only while handling a
// visitor's request (dynamic pages, route handlers), never inside
// unstable_cache or an ISR route. Without RATE_LIMIT_FORWARDING_SECRET, or
// outside Vercel, it adds nothing and the API keeps its previous behavior.
// Configuration warnings, repeated at most every 10 minutes per process.
// Anyone can send a CF-Ray header straight to Vercel, so a one-time warning
// could be used up on purpose and hide a real misconfiguration.
const WARNING_INTERVAL_MS = 10 * 60_000;
const lastWarnedAt = new Map<string, number>();
function warnPeriodically(key: string, message: string) {
  const now = Date.now();
  if (now - (lastWarnedAt.get(key) ?? Number.NEGATIVE_INFINITY) < WARNING_INTERVAL_MS) return;
  lastWarnedAt.set(key, now);
  console.warn(message);
}

export async function clientIpSigner(): Promise<ClientIpSigner> {
  for (const name of unusableSecrets()) {
    warnPeriodically(`short:${name}`, `${name} is shorter than 32 bytes and is ignored`);
  }
  const secret = forwardingSecret();
  if (!secret || !isTrustedVercelRuntime()) return UNSIGNED;

  const requestHeaders = await headers();
  // A Cloudflare request whose visitor IP cannot be used: visitors behind the
  // same Cloudflare edge address would share one rate-limit bucket.
  if (requestHeaders.has('cf-ray') && !hasCloudflareProxySecret(requestHeaders)) {
    warnPeriodically('proxy-header', process.env[CLOUDFLARE_PROXY_SECRET_ENV]
      ? 'A Cloudflare request lacked a matching X-Gatareview-Proxy-Secret; check the Transform Rule and CLOUDFLARE_PROXY_SECRET'
      : 'Cloudflare requests arrive but CLOUDFLARE_PROXY_SECRET is not set; visitors share Cloudflare edge addresses');
  }
  const ip = trustedClientIp(requestHeaders);
  if (!ip) return UNSIGNED;

  // Sign when the request is made, so the timestamp is fresh even if a cache
  // refresh runs the request after the page has been sent.
  return (url, method = 'GET') => signedClientIpHeaders({ secret, ip, url, method });
}
