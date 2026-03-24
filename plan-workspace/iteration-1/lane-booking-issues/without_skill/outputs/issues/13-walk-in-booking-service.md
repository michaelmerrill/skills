# Issue 13: Walk-in Online Booking Service

## Summary

Implement the `createWalkInBooking` function for unauthenticated walk-in customers who book and pay via Stripe Checkout on the org's Connect account.

## Context

Walk-in bookings come through a public (unauthenticated) route. The customer provides name, email, phone, selects a slot, and is redirected to Stripe Checkout. A `customer` record is auto-created or linked by email within the org.

## Requirements

### Zod Schema

Add to `validation.ts`:

```typescript
export const createWalkInBookingSchema = z.object({
  orgId: z.string().min(1),
  locationId: z.string().min(1),
  resourceTypeId: z.string().min(1),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});
```

### Function Signature

```typescript
export const createWalkInBooking = (
  data: CreateWalkInBookingData,
): Effect<
  { booking: Booking; checkoutUrl: string },
  NoLanesAvailable | PaymentNotAvailable | StripeError | DatabaseError
>
```

### Logic

1. Validate time slot (not in past, within `maxAdvanceBookingDays`)
2. Check org has Stripe Connect account onboarded. If not, return `PaymentNotAvailable`
3. Check lane availability, auto-assign by `sortOrder`
4. Resolve pricing: look up active `offering` + `offeringPrice` for the resource type at the location
5. Upsert customer:
   - Query `customer` by `(organizationId, email)`
   - If found: use existing customer record
   - If not found: INSERT new customer with `status: 'lead'`, `firstName`, `lastName`, `email`, `phone`
6. Generate confirmation code
7. Create Stripe Checkout session on Connect account:
   - `mode: 'payment'`
   - `customer_email`: walk-in's email
   - `line_items`: from offering price
   - `success_url`: public booking confirmation page
   - `cancel_url`: public booking page
   - `metadata`: `{ bookingId, orgId, customerId }`
8. INSERT `booking`:
   - `status: 'pending'`
   - `bookerType: 'walk_in'`
   - `paymentMethod: 'stripe'`
   - `customerId`: resolved from step 5
   - `stripeCheckoutSessionId`: from Checkout session
   - `amountCentsPaid`: from offering price (snapshot)
9. INSERT `bookingEvent` with `eventType: 'created'`
10. Return booking + checkout URL

### Customer Upsert

Match by `(organizationId, email)` -- case-insensitive email comparison. If existing customer found, do NOT overwrite their name/phone (they may have been edited by staff).

## Files to Modify

- **Modify**: `apps/web/src/lib/bookings.ts` -- add `createWalkInBooking`
- **Modify**: `apps/web/src/lib/validation.ts` -- add `createWalkInBookingSchema`

## Acceptance Criteria

- [ ] Walk-in booking creates customer record with `status: 'lead'` or links to existing by email
- [ ] Stripe Checkout session created on org's Connect account
- [ ] Booking created with `pending` status
- [ ] Offering price snapshot stored as `amountCentsPaid`
- [ ] `PaymentNotAvailable` returned if org has no Stripe Connect
- [ ] Confirmation code generated
- [ ] Lane auto-assigned
- [ ] No authentication required (function doesn't depend on `CurrentSession`)

## Dependencies

- Issue 1 (schema)
- Issue 6 (confirmation code)
- Issue 8 (availability)
- Issue 9 (establishes booking creation patterns)
