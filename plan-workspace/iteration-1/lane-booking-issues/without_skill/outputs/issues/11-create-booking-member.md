# Issue 11: Create Booking -- Member Self-Service Flow

## Summary

Implement the member booking flow where authenticated members can book a lane, paying with their entitlement balance or falling back to Stripe Checkout.

## Context

Members are authenticated users with a customer record linked via `customer.userId`. They select a lane type and time slot, and the system auto-assigns a specific lane. Payment is first attempted via entitlement; if insufficient, Stripe Checkout on the org's Connect account is used.

## Requirements

### Zod Schema

Add to `validation.ts`:

```typescript
export const createMemberBookingSchema = z.object({
  orgId: z.string().min(1),
  locationId: z.string().min(1),
  resourceTypeId: z.string().min(1),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});
```

### Function Signature

```typescript
export const createMemberBooking = (
  data: CreateMemberBookingData,
  userId: string,
): Effect<
  { booking: Booking; checkoutUrl?: string },
  NoLanesAvailable | InsufficientEntitlement | PaymentNotAvailable | DatabaseError | StripeError
>
```

### Logic

1. Resolve the member's `customerId` from `customer.userId` + `customer.organizationId`
2. Validate time slot (not in past, within `maxAdvanceBookingDays`)
3. Check lane availability, auto-assign by `sortOrder` (same as staff flow)
4. Check entitlement balance for the relevant entitlement type:
   - Look up offering/offeringRule that maps the resource type to an entitlement type
   - Query `getEntitlementBalance` for that type
5. If entitlement sufficient:
   - `consumeEntitlement` atomically
   - Create booking with `status: 'confirmed'`, `paymentMethod: 'entitlement'`
   - Return booking
6. If entitlement insufficient:
   - Check org has Stripe Connect account onboarded
   - If no Connect account: return `PaymentNotAvailable`
   - Resolve pricing from active `offeringPrice` for the resource type
   - Create Stripe Checkout session on Connect account with `bookingId` in metadata
   - Create booking with `status: 'pending'`, `paymentMethod: 'stripe'`
   - Return booking + checkout URL
7. Generate confirmation code, insert `bookingEvent`

### Stripe Checkout Session

Create on the org's Connect account:
- `mode: 'payment'`
- `line_items`: from `offeringPrice.amountCents` / `offeringPrice.stripePriceId`
- `success_url`: `/{orgSlug}/bookings/{bookingId}?checkout=success`
- `cancel_url`: `/{orgSlug}/bookings/{bookingId}?checkout=cancel`
- `metadata`: `{ bookingId, orgId }`

## Files to Modify

- **Modify**: `apps/web/src/lib/bookings.ts` -- add `createMemberBooking`
- **Modify**: `apps/web/src/lib/validation.ts` -- add `createMemberBookingSchema`

## Acceptance Criteria

- [ ] Member can book a slot and pay with entitlement
- [ ] Entitlement consumed atomically in same transaction as booking
- [ ] If insufficient entitlement, Stripe Checkout session created
- [ ] Booking created as `pending` when using Stripe payment
- [ ] `PaymentNotAvailable` returned if no Connect account
- [ ] Auto-advance booking days limit enforced
- [ ] Confirmation code generated for all bookings

## Dependencies

- Issue 1 (schema)
- Issue 6 (confirmation code)
- Issue 8 (availability)
- Issue 9 (establishes core booking creation patterns)
