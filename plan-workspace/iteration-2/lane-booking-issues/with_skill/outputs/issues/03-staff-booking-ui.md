# Staff Booking UI + Sidebar Nav Gate

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 3 of 7
> Type: HITL

## Blocked by

- [02-booking-service-staff.md](./02-booking-service-staff.md) -- needs `createStaffBooking` action and booking queries

## What to build

Create the staff-facing booking management page at `[orgSlug]/bookings/` with a booking creation form (select location, date, time slot, resource type, customer, payment method) and a bookings list table showing today's and upcoming bookings. Gate the sidebar "Bookings" nav link behind the `laneBooking` feature flag from `organizationSetting.featureFlags`. Add the feature flag check to the org layout data flow so the sidebar knows whether to show the link.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/app/[orgSlug]/bookings/page.tsx` | Staff bookings page: list + create form | Follow `apps/web/src/app/[orgSlug]/customers/page.tsx` (RSC page with data fetch + client table) |
| `apps/web/src/components/bookings/booking-form.tsx` | Staff booking creation form (location, date, slot, customer, payment) | Follow `apps/web/src/components/settings/general-form.tsx` (client form with server action) |
| `apps/web/src/components/bookings/bookings-table.tsx` | Table listing bookings with status badges | Follow `apps/web/src/components/customers/customers-table.tsx` (data-table pattern with columns) |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/components/app-sidebar.tsx` | Add "Bookings" entry to `data.navMain` array (after "Customers" at line ~46) conditionally based on `featureFlags.laneBooking`. Add `featureFlags` to component props. |
| `apps/web/src/app/[orgSlug]/layout.tsx` | Fetch `organizationSetting.featureFlags` alongside existing queries (extend `getOrgBySlug` or add separate query) and pass `featureFlags` to `AppSidebar` component (line ~65) |

## Context

### Patterns to follow

- `apps/web/src/components/app-sidebar.tsx` lines 34-61: `data.navMain` array structure with `title`, `url`, `icon`. Add `{ title: "Bookings", url: "/bookings", icon: <CalendarIcon /> }` conditionally.
- `apps/web/src/app/[orgSlug]/layout.tsx` lines 12-90: OrgLayout RSC that fetches session, org, locations, membership and passes to sidebar. Extend to also fetch feature flags.
- `apps/web/src/app/[orgSlug]/customers/page.tsx`: RSC page pattern for data-heavy pages.
- `apps/web/src/components/customers/customers-table.tsx`: Client-side data table with column definitions, sorting, status badges.

### Key types

```typescript
// Existing -- from app-sidebar.tsx line 104
type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  org: { name: string; slug: string };
  user: { name: string; email: string; image: string | null };
  locations: { id: string; name: string; isActive: boolean }[];
  // NEW: add featureFlags
  featureFlags: Record<string, unknown>;
};

// From organizationSetting schema (organization-settings.ts line 25-28)
featureFlags: jsonb("feature_flags").$type<Record<string, unknown>>()
```

### Wiring notes

- `organizationSetting.featureFlags` is already a JSONB column (line 25-28 of `organization-settings.ts`). The feature flag `laneBooking` is a boolean at `featureFlags.laneBooking`.
- The layout already queries `getOrgBySlug` which joins `organizationSetting` (queries.ts lines 34-57). Extend the select to include `featureFlags` field.
- Sidebar nav link URL should be relative (`/bookings`) since the org slug prefix is handled by the layout's routing context.

## Acceptance criteria

- [ ] Sidebar shows "Bookings" link only when `featureFlags.laneBooking === true`
- [ ] Sidebar hides "Bookings" link when feature flag is false or absent
- [ ] Staff bookings page renders at `[orgSlug]/bookings/`
- [ ] Booking form allows selecting location, date, time slot, resource type, customer, payment method
- [ ] Form submission calls `createStaffBooking` action and shows success/error
- [ ] Bookings table shows list of bookings with status, customer, time, lane, confirmation code
- [ ] `bun run lint` passes
- [ ] `bun run build` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
```

### Manual verification

1. Enable feature flag: set `featureFlags: { laneBooking: true }` on org setting in DB
2. Visit `[orgSlug]/` -- sidebar should show "Bookings" link
3. Click "Bookings" -- page should render with empty state
4. Create a booking via the form -- booking should appear in table
5. Disable feature flag -- "Bookings" link should disappear from sidebar

## Notes

- This is HITL because the booking form UX (date picker, time slot selector, customer search) requires human review for usability. The form layout and flow should be reviewed before merging.
- The booking form needs to fetch available resource types for the selected location. This depends on the `resource` + `resourceType` tables already seeded for the org.
- Calendar/date picker component may need to be added -- check if shadcn/ui has one installed, otherwise add it.
