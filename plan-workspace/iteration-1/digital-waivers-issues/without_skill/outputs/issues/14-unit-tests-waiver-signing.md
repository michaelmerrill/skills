# Issue 14: Unit Tests — Waiver Signing

## Summary

Write unit tests for the waiver signing service function covering adult signing, guardian/minor signing, customer matching, customer creation, age validation, race conditions, and expiration calculation.

## Context

Same test infrastructure as Issue 13. These tests validate the core signing business logic in `lib/waivers.ts`.

## Acceptance Criteria

- [ ] New test file: `apps/web/src/__tests__/waivers/waiver-signing.test.ts`
- [ ] Test cases:
  - Adult signing happy path — waiver created, customer linked, correct fields
  - Customer matched by email (case-insensitive) — existing customer ID used
  - Customer auto-created when no email match — new customer with status 'lead'
  - Signer under 18 rejected — `InvalidSignerAge` error
  - Guardian/minor signing happy path — both customer records created, waiver links to minor
  - Guardian under 18 rejected
  - Minor 18+ rejected
  - Template snapshot frozen — waiver stores the exact HTML body from the template at signing time
  - `expiresAt` calculated correctly — `signedAt + template.expirationDays`
  - IP address and user agent stored in waiver record
  - No published template — `ActiveTemplateNotFound` error
  - Email send failure does not block waiver creation
  - Race condition: concurrent same-email customer creation handled (unique constraint caught, re-query succeeds)
- [ ] All tests pass with `vitest run`

## Technical Notes

- For the race condition test: simulate by mocking the first INSERT to throw a unique constraint violation, verify the function falls back to querying the existing record
- Age validation tests need controlled "now" dates — mock `Date.now()` or pass a reference date
- Template snapshot test: create a template, sign a waiver, then update the template body — verify the waiver's `templateSnapshot` still has the original text

## Dependencies

- Issue 1 (schema)
- Issue 6 (signing service to test)
