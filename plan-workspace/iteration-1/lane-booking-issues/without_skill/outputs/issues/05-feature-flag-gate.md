# Issue 5: Feature Flag Gate for Lane Booking

## Summary

Add the `laneBooking` feature flag check infrastructure and conditionally show/hide the booking link in the sidebar navigation. This gates the entire booking feature for controlled per-org rollout.

## Context

The `organizationSetting.featureFlags` JSONB column already exists and defaults to `{}`. The sidebar is rendered in `apps/web/src/components/app-sidebar.tsx`. The design requires a `laneBooking` boolean flag that gates sidebar nav and public routes.

## Requirements

### Feature Flag Helper

Create a helper function (or add to an existing utility) that checks whether a feature flag is enabled for an org:

```typescript
function isFeatureEnabled(featureFlags: Record<string, unknown>, flag: string): boolean
```

This could live in `apps/web/src/lib/settings.ts` or a new `apps/web/src/lib/feature-flags.ts` file.

### Sidebar Integration

1. In the org layout (`apps/web/src/app/[orgSlug]/layout.tsx`), fetch `organizationSetting.featureFlags` alongside the existing queries
2. Pass a `featureFlags` (or just `bookingEnabled: boolean`) prop to `AppSidebar`
3. In `AppSidebar`, conditionally render a "Bookings" nav link pointing to `/{orgSlug}/bookings` when the flag is true

### Route Guard

Create a reusable check that booking pages can use to 404 when the flag is disabled. This will be used by Issues 8+ when they create booking routes.

## Files to Modify

- **Create or modify**: `apps/web/src/lib/settings.ts` or new `feature-flags.ts` -- helper function
- **Modify**: `apps/web/src/app/[orgSlug]/layout.tsx` -- fetch featureFlags, pass to sidebar
- **Modify**: `apps/web/src/components/app-sidebar.tsx` -- conditionally render booking link

## Acceptance Criteria

- [ ] `laneBooking` feature flag check implemented
- [ ] Sidebar shows "Bookings" link only when `featureFlags.laneBooking === true`
- [ ] Sidebar link points to `/{orgSlug}/bookings`
- [ ] Layout fetches feature flags without adding N+1 queries (use existing settings query or batch)
- [ ] Helper is reusable for route-level gating

## Dependencies

None -- can be done in parallel with Issues 1-4.
