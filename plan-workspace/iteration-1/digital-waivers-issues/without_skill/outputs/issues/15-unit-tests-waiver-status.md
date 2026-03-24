# Issue 15: Unit Tests — Waiver Status and Coverage

## Summary

Write unit tests for the waiver status badge computation (signed/expired/not_signed), waiver status filtering, and the coverage summary query.

## Context

Same test infrastructure as Issues 13-14. These tests validate the SQL subquery logic for derived waiver status in the customer list.

## Acceptance Criteria

- [ ] New test file: `apps/web/src/__tests__/waivers/waiver-status.test.ts`
- [ ] Test cases:
  - Customer with valid waiver (expiresAt > now) — status is 'signed'
  - Customer with expired waiver (expiresAt < now) — status is 'expired'
  - Customer with no waivers — status is 'not_signed'
  - Customer with both expired and valid waivers — status is 'signed' (any valid waiver counts)
  - Coverage query: correct counts returned (total active, with valid waiver)
  - Coverage query with 0 active customers — returns 0/0
  - Filter by waiver status 'signed' — only returns customers with valid waivers
  - Filter by waiver status 'expired' — only returns customers with expired waivers only
  - Filter by waiver status 'not_signed' — only returns customers with no waivers
  - Combined filter: waiver status + customer status — both conditions applied
- [ ] All tests pass with `vitest run`

## Technical Notes

- These tests require seeding customers and waiver records with controlled `signedAt` and `expiresAt` timestamps
- For "expired" tests, insert waivers with `expiresAt` in the past
- The coverage query is a standalone function — test it independently from the filter

## Dependencies

- Issue 1 (schema)
- Issue 10 (waiver status badge query logic)
- Issue 11 (waiver status filter logic)
- Issue 12 (coverage query)
