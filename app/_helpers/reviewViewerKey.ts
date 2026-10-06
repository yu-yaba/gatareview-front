export const ANONYMOUS_REVIEW_VIEWER = 'anonymous'

// Bind server-rendered review data to an API session without serializing its bearer token.
export async function getReviewViewerKey(backendToken?: string | null): Promise<string> {
  if (!backendToken) return ANONYMOUS_REVIEW_VIEWER
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(backendToken))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}
