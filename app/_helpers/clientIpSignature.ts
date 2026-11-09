import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

// Signed forwarding of the visitor's IP to the Rails API, so that the API's
// per-IP rate limits count server-side calls (lecture pages, searches, Google
// sign-in) per visitor instead of per Vercel egress address.
// Keep in sync with gatareview-back config/initializers/rack_attack.rb
// (SignedClientIp); the shared test vectors in both repositories pin the format.
export const CLIENT_IP_HEADER = 'X-Gatareview-Client-Ip';
export const CLIENT_IP_TIMESTAMP_HEADER = 'X-Gatareview-Client-Ip-Timestamp';
export const CLIENT_IP_SIGNATURE_HEADER = 'X-Gatareview-Client-Ip-Signature';
export const FORWARDING_SECRET_ENV = 'RATE_LIMIT_FORWARDING_SECRET';
export const CLOUDFLARE_PROXY_SECRET_ENV = 'CLOUDFLARE_PROXY_SECRET';
// Added by a Transform Rule in the gatareview.com Cloudflare zone.
export const CLOUDFLARE_PROXY_SECRET_HEADER = 'x-gatareview-proxy-secret';
export const MIN_SECRET_BYTES = 32;
const SIGNATURE_VERSION = 'v1';
const MAX_IP_LENGTH = 45;

type Env = Record<string, string | undefined>;

function secretFrom(env: Env, name: string): string | null {
  const secret = env[name];
  return secret && Buffer.byteLength(secret, 'utf8') >= MIN_SECRET_BYTES ? secret : null;
}

export function forwardingSecret(env: Env = process.env): string | null {
  return secretFrom(env, FORWARDING_SECRET_ENV);
}

function sameSecret(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest();
  return timingSafeEqual(digest(provided), digest(expected));
}

function validIp(value: string | null | undefined): string | null {
  const ip = value?.trim();
  if (!ip || ip.length > MAX_IP_LENGTH || ip.includes('%') || isIP(ip) === 0) return null;
  return ip;
}

// Vercel's edge overwrites x-real-ip (like x-forwarded-for) with the address it
// observed, so the value is trustworthy only on a Vercel deployment. `next dev`,
// Docker, and `vercel env pull` setups (VERCEL_ENV=development) take it from
// the client as-is and must not forward it.
export function isTrustedVercelRuntime(env: Env = process.env): boolean {
  return env.VERCEL === '1' && env.VERCEL_ENV !== 'development';
}

// www.gatareview.com is proxied by Cloudflare, so for normal visits x-real-ip
// holds a Cloudflare edge address shared by many visitors. Cloudflare puts the
// visitor in CF-Connecting-IP, but anyone who reaches Vercel directly can send
// that header too, and a Cloudflare source address alone proves nothing (any
// Cloudflare customer's Worker can connect from one). So CF-Connecting-IP is
// used only when the request carries the secret header that our own zone's
// Transform Rule adds; every other request uses x-real-ip.
export function trustedClientIp(requestHeaders: Pick<Headers, 'get'>, env: Env = process.env): string | null {
  const proxySecret = secretFrom(env, CLOUDFLARE_PROXY_SECRET_ENV);
  if (proxySecret && sameSecret(requestHeaders.get(CLOUDFLARE_PROXY_SECRET_HEADER), proxySecret)) {
    return validIp(requestHeaders.get('cf-connecting-ip'));
  }
  return validIp(requestHeaders.get('x-real-ip'));
}

// Same normalization Rack::Attack applies to PATH_INFO before throttling
// (ActionDispatch::Journey::Router::Utils.normalize_path).
export function normalizedRequestPath(url: string): string {
  let path = `/${new URL(url, 'http://backend.invalid').pathname}`.replace(/\/+/g, '/');
  if (path !== '/') {
    path = path.replace(/\/$/, '').replace(/%[a-f0-9]{2}/gi, (escape) => escape.toUpperCase());
  }
  return path;
}

export function clientIpSignature(
  secret: string,
  { timestamp, method, path, ip }: { timestamp: string; method: string; path: string; ip: string },
): string {
  return createHmac('sha256', secret)
    .update([SIGNATURE_VERSION, timestamp, method, path, ip].join('\n'), 'utf8')
    .digest('hex');
}

export function signedClientIpHeaders({ secret, ip, url, method = 'GET', now = Date.now() }: {
  secret: string;
  ip: string;
  url: string;
  method?: string;
  now?: number;
}): Record<string, string> {
  const timestamp = String(Math.floor(now / 1000));
  const signature = clientIpSignature(secret, {
    timestamp,
    method: method.toUpperCase(),
    path: normalizedRequestPath(url),
    ip,
  });
  return {
    [CLIENT_IP_HEADER]: ip,
    [CLIENT_IP_TIMESTAMP_HEADER]: timestamp,
    [CLIENT_IP_SIGNATURE_HEADER]: signature,
  };
}
