import { createHmac } from 'node:crypto';
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
export const MIN_SECRET_BYTES = 32;
const SIGNATURE_VERSION = 'v1';
const MAX_IP_LENGTH = 45;

type Env = Record<string, string | undefined>;

export function forwardingSecret(env: Env = process.env): string | null {
  const secret = env[FORWARDING_SECRET_ENV];
  return secret && Buffer.byteLength(secret, 'utf8') >= MIN_SECRET_BYTES ? secret : null;
}

// Vercel's edge overwrites x-real-ip (like x-forwarded-for) with the address it
// observed, so the value is trustworthy only on a Vercel deployment. `next dev`,
// Docker, and `vercel env pull` setups (VERCEL_ENV=development) take it from
// the client as-is and must not forward it.
export function isTrustedVercelRuntime(env: Env = process.env): boolean {
  return env.VERCEL === '1' && env.VERCEL_ENV !== 'development';
}

export function trustedClientIp(requestHeaders: Pick<Headers, 'get'>): string | null {
  const value = requestHeaders.get('x-real-ip')?.trim();
  if (!value || value.length > MAX_IP_LENGTH || value.includes('%') || isIP(value) === 0) return null;
  return value;
}

// Same normalization Rack::Attack applies to PATH_INFO before throttling
// (ActionDispatch::Journey::Router::Utils.normalize_path).
export function normalizedRequestPath(url: string): string {
  let path = `/${new URL(url, 'http://backend.invalid').pathname}`.replace(/\/+/g, '/');
  if (path !== '/') {
    path = path.replace(/\/$/, '').replace(/%[a-f0-9]{2}/g, (escape) => escape.toUpperCase());
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
