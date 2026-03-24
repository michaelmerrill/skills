# Check-in + Cancellation + Operations

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 7 of 7
> Type: AFK

## Blocked by

- [06-stripe-webhook-confirmation.md](./06-stripe-webhook-confirmation.md) -- needs confirmed bookings (from both member and walk-in flows) to check in and cancel

## What to build

Implement check-in flow: staff searches by confirmation code (`BK-XXXX`), validates booking is `confirmed` and within the time window (30 min before start to slot end), transitions to `checked_in`. Implement cancellation: validate cancellation policy from `bookingRules.cancellationWindowMinutes`, issue Stripe refund for stripe-paid bookings within refund window, call `reverseConsumption` for entitlement-paid bookings, transition to `cancelled`. Implement no-show marking (staff marks after slot time). Add operational views to the staff bookings page: today's bookings, upcoming bookings, confirmation code search, and stuck-pending-bookings indicator. Write unit tests for check-in validation, cancellation logic, refund, and entitlement reversal.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/components/bookings/checkin-dialog.tsx` | Check-in dialog: confirmation code input, booking preview, check-in button | Follow `apps/web/src/components/settings/invite-member-dialog.tsx` (dialog with form + action) |
| `apps/web/src/__tests__/bookings/checkin-cancellation.test.ts` | Tests: check-in flow, time window validation, cancellation + refund, entitlement reversal, no-show | Follow `apps/web/src/__tests__/settings/entitlement-ledger.test.ts` (Effect test pattern) |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/bookings.ts` | Add `checkInBooking(orgId, confirmationCode)`, `cancelBooking(orgId, bookingId, actorId)`, `markNoShow(orgId, bookingId)` functions |
| `apps/web/src/app/[orgSlug]/bookings/actions.ts` | Add server actions: `checkInBooking`, `cancelBooking`, `markNoShow` with owner/admin role guard |
| `apps/web/src/components/bookings/bookings-table.tsx` | Add action buttons per booking row: Check-in (for confirmed), Cancel (for confirmed/pending), No-show (for confirmed past slot time). Add confirmation code search input. Add "stuck pending" warning badge. |
| `apps/web/src/app/[orgSlug]/bookings/page.tsx` | Add tabs or sections: "Today", "Upcoming", "All". Pass search params for confirmation code lookup. |

## Context

### Patterns to follow

- `apps/web/src/lib/entitlements.ts` lines 302-371: `reverseConsumption(orgId, customerId, grantId, units, reason, actorId)` -- restores entitlement balance. Call this for cancellation of entitlement-paid bookings.
- `apps/web/src/lib/subscriptions.ts` lines 22-70: State transition with validation + transaction. Follow for `checkInBooking` and `cancelBooking`.
- `apps/web/src/lib/stripe.ts` lines 70-79: `withConnectedAccount` to get Connect account ID for issuing refunds.
- `apps/web/src/components/settings/invite-member-dialog.tsx`: Dialog component pattern with form submission calling a server action.
- `apps/web/src/components/customers/customers-table.tsx`: Table with action buttons per row.

### Key types

```typescript
// From existing codebase
import { reverseConsumption } from "@/lib/entitlements";
// entitlements.ts line 302: reverseConsumption(orgId, customerId, grantId, units, reason?, actorId?)

// From booking schema (issue #01)
// booking.confirmationCode: text NOT NULL
// booking.paymentMethod: bookingPaymentMethodEnum
// booking.entitlementGrantId: text (nullable)
// booking.stripePaymentIntentId: text (nullable)
// booking.amountCentsPaid: integer
// booking.startTime: timestamptz
// booking.endTime: timestamptz

// Cancellation policy
// organizationSetting.bookingRules.cancellationWindowMinutes: number
// If (startTime - now) > cancellationWindowMinutes: eligible for refund
// Else: cancellation allowed but no refund

// Check-in time window
// Valid if: now >= (startTime - 30min) AND now <= endTime

// Stripe refund (on Connect account)
// stripe.refunds.create({ payment_intent: booking.stripePaymentIntentId }, { stripeAccount: connectedAccountId })
```

### Wiring notes

- Check-in lookup: query `booking` by `(organizationId, confirmationCode)` using the UNIQUE index from issue #01. Return booking with customer and resource details for the staff preview.
- Cancellation refund: for `paymentMethod: 'stripe'`, retrieve the org's Connect account ID via `organizationPaymentAccount.externalAccountId` (organization-settings.ts line 89), then call `stripe.refunds.create` on the Connect account.
- Cancellation entitlement reversal: for `paymentMethod: 'entitlement'`, call `reverseConsumption` with `booking.entitlementGrantId` and `booking.amountCentsPaid` as units. The `reason` should be `"Booking cancelled: BK-XXXX"`.
- No-show: only valid for `confirmed` bookings where `endTime` has passed. Transition to `no_show` status. No refund or entitlement reversal.
- Stuck pending indicator: query bookings where `status = 'pending' AND createdAt < now() - pendingExpirationMinutes`. Show count as a warning badge on the bookings page.
- The `StripeService` context tag (services.ts line 41) provides the Stripe client. For refund in an Effect function, yield `StripeService` then call `stripe.refunds.create`.

## Acceptance criteria

- [ ] Staff can search by confirmation code to find a booking
- [ ] Check-in validates booking is `confirmed` and within time window (30 min before to slot end)
- [ ] Check-in transitions booking to `checked_in` with `bookingEvent`
- [ ] Check-in rejects bookings outside time window with descriptive error
- [ ] Cancellation of `confirmed` booking within refund window issues Stripe refund (if stripe-paid)
- [ ] Cancellation of entitlement-paid booking reverses entitlement consumption
- [ ] Cancellation outside refund window: booking cancelled, no refund, metadata records reason
- [ ] Cancellation of `pending` booking: cancelled without refund (no payment yet)
- [ ] No-show marking only allowed for `confirmed` bookings past slot time
- [ ] `bookingEvent` entries created for all status transitions
- [ ] Bookings table shows action buttons contextually (check-in for confirmed, cancel for pending/confirmed, no-show for confirmed-past-time)
- [ ] Stuck pending bookings shown as warning indicator
- [ ] Today's and upcoming bookings filtered correctly
- [ ] Unit tests pass for check-in, cancellation, refund, entitlement reversal, no-show
- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
bun run test
```

### Manual verification

1. Create a confirmed booking (via staff or complete walk-in flow)
2. Search by confirmation code on bookings page -- booking should appear
3. Click Check-in -- booking status should change to `checked_in`
4. Create another confirmed booking, click Cancel -- verify refund issued (check Stripe dashboard)
5. Create a confirmed booking, let slot time pass, click No-show -- status should change to `no_show`
6. Create a pending booking, wait for expiration -- verify it shows in "stuck pending" indicator

## Notes

- The cancellation refund uses `stripe.refunds.create` with `stripeAccount` option for Connect. This is different from the SaaS billing refund path -- it targets the connected account, not the platform.
- For the QR code scan check-in: the QR encodes just the `confirmationCode` string (e.g., "BK-A1B2"). The staff scans it, which populates the search field. No separate QR scanning route needed -- it's just a text input.
- The "stuck pending" query should use `bookingRules.pendingExpirationMinutes` (default 15) from the org settings. If the value is not set, default to 15 minutes.
