# Issue 8: Rate Limiting on Public Signing Endpoint

## Summary

Add rate limiting to the waiver signing server action: 5 submissions per IP address per minute. This prevents bot spam on the public endpoint.

## Context

The signing page is unauthenticated and publicly accessible. Without rate limiting, bots could flood the endpoint with junk waiver records. The design specifies 5 submissions per IP per minute as sufficient for v1 (no CAPTCHA).

## Acceptance Criteria

- [ ] Rate limiter applied to the `signWaiver` server action (or middleware wrapping it)
- [ ] Limit: 5 requests per IP per minute
- [ ] IP extracted from `x-forwarded-for` or `x-real-ip` headers (behind proxy/CDN)
- [ ] When rate limit exceeded: return a user-friendly error message ("Too many submissions. Please wait a moment and try again.")
- [ ] Rate limit state stored in-memory (acceptable for single-server v1) or via a lightweight store
- [ ] Does not affect authenticated settings/template management endpoints

## Technical Notes

- Options for implementation:
  - In-memory Map with TTL cleanup (simplest, works for single-server deployments)
  - `next-rate-limit` or `@upstash/ratelimit` if an external store is preferred
  - Middleware-level rate limiting in `proxy.ts` (but this is specifically for the signing action, not all routes)
- The simplest approach: a `Map<string, { count: number; resetAt: number }>` in the server action file, with cleanup on each request
- Consider making the rate limit configurable for future adjustment

## Dependencies

- Issue 7 (the signing page/action that will be rate-limited)
