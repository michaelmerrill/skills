# Entitlement Integration for Member Bookings

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 7 of 11
> Type: AFK

## Blocked by

- [06-member-booking-page.md](./06-member-booking-page.md) -- needs `createMemberBooking` function to integrate payment into

## What to build

Wire entitlement consumption into the member booking flow. When a member books a slot, check their entitlement balance for the matching entitlement type. If sufficient, atomically consume the entitlement and confirm the booking. If insufficient, return a signal that Stripe payment is needed (the caller will handle Stripe in issue #9). Store the `entitlementGrantId` on the booking record when paid by entitlement. On cancellation of an entitlement-paid booking, reverse the consumption.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/bookings.ts` | Update `createMemberBooking` to: (1) look up customer's entitlement balance for the resource type's entitlement type, (2) if sufficient, call `consumeEntitlement` from `entitlements.ts` and set `paymentMethod: 'entitlement'` + `entitlementGrantId`, (3) if insufficient, return `{ needsPayment: true }` instead of defaulting to `free`. |
| `apps/web/src/lib/validation.ts` | Add optional `entitlementType` to `createMemberBookingSchema` or resolve it from resource type -> offering rule mapping |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/__tests__/bookings/entitlement-booking.test.ts` | Tests for entitlement consumption on booking, reversal on cancel, insufficient balance fallback | Follow `apps/web/src/__tests__/settings/entitlement-ledger.test.ts` for test setup with grants and balances |

## Context

### Patterns to follow
- `apps/web/src/lib/entitlements.ts` (lines 94-175): `consumeEntitlement(data)` -- checks balance, deducts in transaction, writes ledger entry. Returns `InsufficientEntitlement` error if balance too low.
- `apps/web/src/lib/entitlements.ts` (lines 302-371): `reverseConsumption(orgId, customerId, grantId, units, reason, actorId)` -- restores balance, writes ledger entry with `eventType: 'reverse'`.
- `apps/web/src/lib/entitlements.ts` (lines 177-202): `getEntitlementBalance(orgId, customerId, entitlementType)` -- returns current balance integer.

### Key types
```typescript
// From entitlements.ts
consumeEntitlement(data: ConsumeEntitlementData): Effect<{ balanceAfter: number }, DatabaseError | EntitlementGrantNotFound | InsufficientEntitlement>

reverseConsumption(orgId, customerId, grantId, units, reason?, actorId?): Effect<{ balanceAfter: number }, DatabaseError | EntitlementGrantNotFound>

getEntitlementBalance(orgId, customerId, entitlementType): Effect<number, DatabaseError>

// ConsumeEntitlementData (from validation.ts line 333-342)
type ConsumeEntitlementData = {
  orgId: string;
  customerId: string;
  grantId: string;
  units: number;
  reason?: string;
  actorId?: string;
};
```

### Wiring notes
- Entitlement type mapping: the design notes that `entitlementType` on grants maps to resource types. For v1, use a convention like `range_access` or `pistol_lane_access` stored in offering rules. The `createMemberBooking` function needs to resolve `resourceTypeId` -> `entitlementType` string. Check `offeringRule` table for a rule with `ruleType: 'entitlement_type'` linked to the resource type's offering.
- The `grantId` for consumption: find the earliest non-expired grant with remaining balance. Query `entitlementGrant` where `(orgId, customerId, entitlementType)` and `validFrom <= now()` and `(expiresAt IS NULL OR expiresAt > now())`, then check ledger to find one with remaining balance.
- `reverseConsumption` is called from the cancellation flow (issue #10) but the wiring into `bookings.ts` should be prepared here.

## Acceptance criteria

- [ ] Member booking checks entitlement balance before creating booking
- [ ] If entitlement sufficient: booking created with `paymentMethod: 'entitlement'`, `status: 'confirmed'`, `entitlementGrantId` set
- [ ] Entitlement consumed atomically -- ledger entry written with `eventType: 'consume'`
- [ ] If entitlement insufficient: function returns `{ needsPayment: true }` signal (no booking created yet)
- [ ] `amountCentsPaid` set to 0 for entitlement bookings
- [ ] Cancellation of entitlement booking calls `reverseConsumption` to restore balance
- [ ] Tests: booking with sufficient entitlement, booking with insufficient entitlement, reversal on cancel
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes
- [ ] `bun test` passes

## Verification

```bash
cd apps/web
bunx biome check src/lib/bookings.ts
bun run build
bun test src/__tests__/bookings/entitlement-booking.test.ts
```

## Notes

- The entitlement-to-resource-type mapping is the one "unknown" from the design. For v1, simplest approach: store an `entitlementType` string on the `resourceType.metadata` JSONB. If no mapping exists, skip entitlement check and go straight to payment-needed signal.
- `consumeEntitlement` requires a specific `grantId`. The booking service must pick the best grant (earliest expiring with balance). This grant-selection logic doesn't exist in `entitlements.ts` yet -- add a `findBestGrant(orgId, customerId, entitlementType)` helper.
