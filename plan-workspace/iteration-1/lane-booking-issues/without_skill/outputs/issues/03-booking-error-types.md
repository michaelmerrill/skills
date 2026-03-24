# Issue 3: Booking Error Types

## Summary

Add tagged error classes for booking-related failures to the existing errors module, following the Effect `Data.TaggedError` pattern used throughout the codebase.

## Context

The codebase uses Effect's `Data.TaggedError` for all domain errors (see `apps/web/src/lib/errors.ts`). The booking feature needs several new error types for its various failure modes.

## Requirements

Add the following error classes to `apps/web/src/lib/errors.ts`:

```typescript
export class BookingNotFound extends Data.TaggedError("BookingNotFound")<{
  readonly bookingId: string;
}> {}

export class NoLanesAvailable extends Data.TaggedError("NoLanesAvailable")<{
  readonly resourceTypeId: string;
  readonly startTime: Date;
  readonly endTime: Date;
}> {}

export class InvalidBookingTransition extends Data.TaggedError("InvalidBookingTransition")<{
  readonly from: string;
  readonly to: string;
}> {}

export class BookingConflict extends Data.TaggedError("BookingConflict")<{
  readonly resourceId: string;
  readonly startTime: Date;
  readonly endTime: Date;
}> {}

export class BookingExpired extends Data.TaggedError("BookingExpired")<{
  readonly bookingId: string;
}> {}

export class OutsideRefundWindow extends Data.TaggedError("OutsideRefundWindow")<{
  readonly bookingId: string;
  readonly windowMinutes: number;
}> {}

export class PaymentNotAvailable extends Data.TaggedError("PaymentNotAvailable") {}

export class InvalidBookingTime extends Data.TaggedError("InvalidBookingTime")<{
  readonly reason: string;
}> {}
```

## Files to Modify

- **Modify**: `apps/web/src/lib/errors.ts` -- add all error classes above

## Acceptance Criteria

- [ ] All 8 error classes added to `errors.ts`
- [ ] Each follows the existing `Data.TaggedError` pattern
- [ ] Error data fields match what downstream booking logic will need
- [ ] No changes to existing error classes

## Dependencies

None -- can be done in parallel with Issues 1 and 2.
