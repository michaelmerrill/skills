# Issue 6: Waiver Signing Service Layer

## Summary

Implement the `signWaiver` Effect service function that handles the core signing logic: input validation, customer matching/creation, waiver record insertion with frozen template snapshot, and expiration calculation.

## Context

This is the core business logic for waiver signing. It is a public (unauthenticated) operation — the service does NOT depend on `CurrentSession`. It uses `DbService` for database access and `ResendClient` for email (fire-and-forget). The customer table uses case-insensitive email matching.

## Acceptance Criteria

- [ ] `signWaiver(data)` function in `apps/web/src/lib/waivers.ts`:
  1. Lookup the active published template for the org
  2. Validate signer age >= 18 (from `dateOfBirth`)
  3. If `isMinor`: validate minor age < 18 and guardian age >= 18
  4. Normalize email to lowercase
  5. Customer matching (for signer/guardian):
     - Query `customer` WHERE `organizationId = ? AND lower(email) = lower(?)`
     - If match: use existing `customerId`
     - If no match: INSERT new customer with `status: 'lead'`, basic fields (firstName, lastName, email, phone, dateOfBirth)
     - Handle race condition: ON CONFLICT on the new partial unique index, retry query
  6. If minor: create/match minor customer by firstName + lastName + dateOfBirth + organizationId
  7. INSERT `waiver` record with:
     - `templateSnapshot`: frozen HTML body from the published template
     - `signedAt`: current timestamp
     - `expiresAt`: `signedAt + template.expirationDays` (calculated)
     - `ipAddress` and `userAgent` from request metadata
     - `isMinor`, `guardianCustomerId` (if applicable)
  8. Return the created waiver record (for confirmation page rendering)
- [ ] Email sending is fire-and-forget: attempt to send confirmation, log error on failure, never block the waiver save
- [ ] Tagged error handling: `ActiveTemplateNotFound` if no published template, `InvalidSignerAge` for age validation failures

## Technical Notes

- This function does NOT use `CurrentSession` — it's called from a public server action
- IP address and user agent should be passed as parameters (extracted from request headers in the server action)
- For `expiresAt` calculation: `new Date(signedAt.getTime() + expirationDays * 24 * 60 * 60 * 1000)` or use a date library
- The race condition handling for customer creation: wrap the insert in a try/catch for the unique constraint violation, then re-query
- Consider using `db.transaction()` to ensure the customer upsert and waiver insert are atomic

## Dependencies

- Issue 1 (schema)
- Issue 2 (error types, validation types)
- Issue 4 (for `getActiveTemplate` if shared, or this issue can implement its own query)
