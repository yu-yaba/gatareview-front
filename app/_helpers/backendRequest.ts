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
const warned = new Set<string>();
function warnOnce(key: string, message: string) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

export async function clientIpSigner(): Promise<ClientIpSigner> {
  for (const name of unusableSecrets()) {
    warnOnce(`short:${name}`, `${name} is shorter than 32 bytes and is ignored`);
  }
  const secret = forwardingSecret();
  if (!secret || !isTrustedVercelRuntime()) return UNSIGNED;

  const requestHeaders = await headers();
  // Configured for Cloudflare, but a Cloudflare request arrived without the
  // Transform Rule's header: visitors would share Cloudflare edge addresses.
  if (process.env[CLOUDFLARE_PROXY_SECRET_ENV] && requestHeaders.has('cf-ray') &&
      !hasCloudflareProxySecret(requestHeaders)) {
    warnOnce('proxy-header', 'A Cloudflare request lacked a matching X-Gatareview-Proxy-Secret; check the Transform Rule');
  }
  const ip = trustedClientIp(requestHeaders);
  if (!ip) return UNSIGNED;

  // Sign when the request is made, so the timestamp is fresh even if a cache
  // refresh runs the request after the page has been sent.
  return (url, method = 'GET') => signedClientIpHeaders({ secret, ip, url, method });
}
