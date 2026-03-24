# Issue 6: Confirmation Code Generator

## Summary

Implement the `generateConfirmationCode` Effect function that produces unique `BK-XXXX` codes within an org, with collision retry logic.

## Context

Every booking gets a human-readable confirmation code in `BK-XXXX` format (4 alphanumeric characters). The code must be unique within an org. With 36^4 = ~1.6M possibilities per org, collisions are rare but must be handled.

## Requirements

### Function Signature

```typescript
export const generateConfirmationCode = (orgId: string): Effect<string, DatabaseError>
```

### Logic

1. Generate a random 4-character alphanumeric string (uppercase letters + digits)
2. Prefix with `BK-` to form `BK-XXXX`
3. Check uniqueness: query `booking` table for `(organizationId, confirmationCode)`
4. If collision, retry (loop up to N times, e.g., 10 attempts)
5. If all retries fail, return `DatabaseError` (should never happen in practice)
6. Return the unique code

### Implementation Notes

- Follow the Effect pattern used in `entitlements.ts` and `subscriptions.ts`
- Depends on `DbService` for database access
- Use the `booking` table from Issue 1's schema
- Characters: `A-Z0-9` (uppercase only for readability)

## Files to Create/Modify

- **Create**: `apps/web/src/lib/bookings.ts` (this will be the main booking service file; this issue creates it with just the code generator; subsequent issues add more functions)

  OR add to an existing appropriate file. The key is that `generateConfirmationCode` is exported and usable.

## Acceptance Criteria

- [ ] Function generates codes in `BK-XXXX` format
- [ ] Only uppercase alphanumeric characters used (A-Z, 0-9)
- [ ] Uniqueness checked against `booking` table scoped to org
- [ ] Retries on collision (up to 10 attempts)
- [ ] Returns `DatabaseError` on exhausted retries
- [ ] Follows Effect service pattern with `DbService` dependency

## Dependencies

- Issue 1 (booking schema) -- needs the `booking` table to check uniqueness
