# Feature Flag + Sidebar Gate

> Part of: [Lane Booking](../../../../../../architect-workspace/iteration-1/lane-booking-design/with_skill/outputs/design.md)
> Issue: 4 of 8
> Type: HITL

## Blocked by

- [02-staff-booking-crud.md](./02-staff-booking-crud.md) -- needs the bookings actions module to exist so the page can import them

## What to build

Add the `laneBooking` feature flag check to the sidebar navigation and create the authenticated booking management page at `[orgSlug]/bookings/`. The sidebar conditionally renders a "Bookings" link when `featureFlags.laneBooking` is truthy. The bookings page is a staff-facing dashboard that displays today's bookings and provides a "New Booking" form for staff-created bookings (cash/free). This is HITL because the UI layout needs human review.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/app/[orgSlug]/bookings/page.tsx` | Staff booking management page (RSC) with booking list and create form | Follow `apps/web/src/app/[orgSlug]/customers/page.tsx` for RSC data-fetching pattern |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/components/app-sidebar.tsx` | Add "Bookings" nav item to `data.navMain` array (line ~36) with `CalendarIcon` import, conditionally rendered based on `featureFlags` prop. Add `featureFlags` to component props (line ~109). |
| `apps/web/src/app/[orgSlug]/layout.tsx` | Fetch `organizationSetting.featureFlags` and pass to `AppSidebar` as `featureFlags` prop. Add `getOrgSettings` call (line ~37 in parallel promise). |

## Context

### Patterns to follow
- `apps/web/src/components/app-sidebar.tsx` lines 34-61: `data.navMain` array structure with `title`, `url`, `icon`.
- `apps/web/src/app/[orgSlug]/layout.tsx` lines 23-49: parallel data fetching in layout, props passed to sidebar.
- `apps/web/src/app/[orgSlug]/customers/page.tsx`: RSC page that uses `getCustomersByOrg` query and renders table.

### Key types
```typescript
// AppSidebar prop addition
featureFlags: Record<string, unknown>;

// Conditional nav item
...(featureFlags?.laneBooking ? [{
  title: "Bookings",
  url: "/bookings",
  icon: <CalendarIcon />,
}] : []),
```

### Wiring notes
- `getOrgSettings` already exists in `apps/web/src/lib/queries.ts` (line 62-76). Use it in the layout's parallel fetch.
- Feature flag is `featureFlags.laneBooking` (boolean) in the `organizationSetting` JSONB.
- The bookings page needs to query bookings for the current org + location, filtered by date. Use a simple `db.select()` query for now.

## Acceptance criteria

- [ ] Sidebar shows "Bookings" link only when `featureFlags.laneBooking` is truthy
- [ ] Sidebar hides "Bookings" link when flag is falsy or absent
- [ ] `/[orgSlug]/bookings` page renders for authenticated staff
- [ ] Page displays list of bookings (initially empty)
- [ ] Staff can create a booking via the page (calls `createStaffBookingAction`)
- [ ] `biome check` passes
- [ ] `bun run build` passes

## Verification

```bash
cd apps/web && bun run build
bun run lint
```

### Manual verification
1. Set `featureFlags: { laneBooking: true }` on an org's `organization_setting` row
2. Navigate to `/{orgSlug}/` -- sidebar should show "Bookings" link
3. Click "Bookings" -- page loads
4. Set `featureFlags: {}` -- sidebar should hide "Bookings" link
