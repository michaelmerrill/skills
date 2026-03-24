# Issue 2: BookingRules TypeScript Type and Zod Validation

## Summary

Define the `BookingRules` TypeScript type and corresponding Zod schema for the existing `bookingRules` JSONB column on `organizationSetting`. No migration needed -- the column already exists and defaults to `{}`.

## Context

The `organizationSetting` table already has a `bookingRules` JSONB column (typed as `Record<string, unknown>`). This issue adds proper typing and runtime validation so booking logic can safely read and write booking configuration.

## Requirements

### TypeScript Type

```typescript
type BookingRules = {
  slotDurationMinutes: number;           // e.g., 30, 60
  maxAdvanceBookingDays: number;          // how far ahead bookings allowed
  cancellationWindowMinutes: number;      // free cancellation before this window
  pendingExpirationMinutes: number;       // pending bookings expire after this (default 15)
  operatingHours: Record<string, {       // keyed by locationId
    [dayOfWeek: number]: {               // 0=Sunday, 6=Saturday
      open: string;                       // "09:00"
      close: string;                      // "21:00"
    } | null;                             // null = closed
  }>;
};
```

### Zod Schema

Create a Zod schema `bookingRulesSchema` that validates this structure. The schema should:
- Validate `slotDurationMinutes` as a positive integer
- Validate `maxAdvanceBookingDays` as a positive integer
- Validate `cancellationWindowMinutes` as a non-negative integer
- Validate `pendingExpirationMinutes` as a positive integer with default 15
- Validate `operatingHours` keys as strings (locationIds), values as day-of-week maps
- Validate time strings match `HH:MM` format (24-hour)
- Day of week keys should be 0-6

### Update Schema Type

Update the `$type` annotation on the `bookingRules` column in `apps/web/src/lib/db/schema/organization-settings.ts` to use `BookingRules` instead of `Record<string, unknown>`.

## Files to Create/Modify

- **Modify**: `apps/web/src/lib/validation.ts` -- add `BookingRules` type, `bookingRulesSchema`, and export both
- **Modify**: `apps/web/src/lib/db/schema/organization-settings.ts` -- update `$type` on `bookingRules` column

## Acceptance Criteria

- [ ] `BookingRules` type exported from `validation.ts`
- [ ] `bookingRulesSchema` Zod schema exported from `validation.ts`
- [ ] Schema correctly validates all fields including nested operating hours
- [ ] Invalid data (negative durations, bad time formats, invalid day numbers) rejected by Zod
- [ ] `organizationSetting.bookingRules` column typed as `BookingRules` instead of `Record<string, unknown>`

## Dependencies

None -- can be done in parallel with Issue 1.
