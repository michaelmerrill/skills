# Public Signing — Minor/Guardian Flow

> Part of: [design.md](../../../../architect-workspace/iteration-1/digital-waivers-design/with_skill/outputs/design.md)
> Issue: 4 of 6
> Type: AFK

## Blocked by

- [03-public-signing-adult.md](./03-public-signing-adult.md) — needs the signing page, `signWaiver` service, and `signWaiverSchema` already working for adults

## What to build

Extend the public signing page and `signWaiver` service to handle guardian-for-minor signing. When a user toggles "I am signing on behalf of a minor," additional fields appear: minor's firstName, lastName, dateOfBirth. The server action validates: guardian (signer) is 18+, minor is under 18. Customer matching for the guardian uses the same email-based flow. Customer matching for the minor uses firstName + lastName + dateOfBirth + organizationId (no email for minors). The waiver record sets `isMinor: true`, `customerId` to the minor's customer, and `guardianCustomerId` to the guardian's customer. Confirmation email goes to the guardian's email address. Include unit tests for minor/guardian validation, minor customer creation, and guardian linking.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/app/[orgSlug]/waiver/page.tsx` | Add "signing for a minor" toggle and minor fields (firstName, lastName, DOB) to the signing form. Conditionally render minor fields when toggle is active. |
| `apps/web/src/lib/waivers.ts` | Extend `signWaiver` function to handle `isMinor: true` case — create/match minor customer by name+DOB, create/match guardian customer by email, set `guardianCustomerId` on waiver record |
| `apps/web/src/lib/validation.ts` | Extend `signWaiverSchema` with optional minor fields: `minorFirstName`, `minorLastName`, `minorDateOfBirth`. Add `.refine()` to require minor fields when `isMinor` is true. |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/__tests__/waivers/waiver-minor-signing.test.ts` | Unit tests: guardian signs for minor happy path, guardian under 18 rejected, minor over 18 rejected, minor customer created by name+DOB, guardian customer matched by email, waiver has correct `isMinor`/`guardianCustomerId` fields | Follow `apps/web/src/__tests__/waivers/waiver-signing.test.ts` (from issue #3) for test structure and seed data |

## Context

### Patterns to follow
- `apps/web/src/lib/waivers.ts` (from issue #3): `signWaiver` Effect.gen function — extend with a conditional branch when `data.isMinor === true`
- `apps/web/src/lib/db/schema/customers.ts` (lines 35-114): customer table shape — minor customer lookup uses `firstName`, `lastName`, `dateOfBirth`, `organizationId`
- `apps/web/src/__tests__/waivers/waiver-signing.test.ts` (from issue #3): test setup pattern with seed templates and customer data

### Key types
```typescript
// Extended signWaiver input (from validation.ts, after issue #3 changes):
// { ...adultFields, isMinor: boolean, minorFirstName?: string, minorLastName?: string, minorDateOfBirth?: Date }

// Minor customer match query:
// db.select().from(customer).where(and(
//   eq(customer.organizationId, orgId),
//   eq(customer.firstName, minorFirstName),
//   eq(customer.lastName, minorLastName),
//   eq(customer.dateOfBirth, minorDateOfBirth)
// )).limit(1)

// Waiver record for minor:
// { ...baseFields, isMinor: true, customerId: minorCustomer.id, guardianCustomerId: guardianCustomer.id }
```

### Wiring notes
- The "signing for a minor" toggle is client-side only — it controls which fields render. The form always submits to the same `signWaiverAction`, with `isMinor` as a boolean field.
- Minor customer creation uses `status: "lead"`, same as adult auto-create.
- Guardian customer matching is identical to adult flow (email-based, case-insensitive).
- Minor customer matching by name+DOB is a best-effort match. If no match, create new. No unique constraint on name+DOB (could be twins).

## Acceptance criteria

- [ ] "Signing for a minor" toggle appears on the signing form
- [ ] Toggling reveals minor firstName, lastName, dateOfBirth fields
- [ ] Guardian age >= 18 validated; under 18 shows error
- [ ] Minor age < 18 validated; 18+ shows error "Minor must be under 18"
- [ ] Guardian customer matched/created by email (same as adult flow)
- [ ] Minor customer matched by firstName + lastName + dateOfBirth + orgId; created if no match
- [ ] Waiver record has `isMinor: true`, `customerId` = minor, `guardianCustomerId` = guardian
- [ ] Confirmation screen shows minor's name and guardian's name
- [ ] All minor signing unit tests pass
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run test -- --run src/__tests__/waivers/waiver-minor-signing.test.ts
cd ../..
bunx biome check apps/web/src
bun run build
```

### Manual verification
1. Visit signing page, toggle "signing for a minor"
2. Fill guardian info (18+), fill minor info (under 18), submit
3. Check DB: two customer records exist (guardian + minor), waiver has `isMinor: true`
4. Try guardian DOB < 18 — error
5. Try minor DOB >= 18 — error

## Notes

- Edge case: same person signs for multiple minors in sequence. Each signing creates a separate waiver record. The guardian customer is matched each time by email (not duplicated).
- Minor DOB validation: calculate age from `dateOfBirth` to today. Under 18 means `dateOfBirth` is less than 18 years ago.
