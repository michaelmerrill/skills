# Feature Flag Gate + Sidebar Navigation

> Part of: [lane-booking-design](../../plans/lane-booking-design.md)
> Issue: 4 of 11
> Type: HITL

## Blocked by

- [03-staff-booking-actions.md](./03-staff-booking-actions.md) -- needs the bookings page to exist at `[orgSlug]/bookings/`

## What to build

Gate the booking feature behind `laneBooking` feature flag in `organizationSetting.featureFlags`. Add a "Bookings" link to the sidebar navigation, conditionally rendered when the flag is enabled. The org layout must fetch the feature flag and pass it to the sidebar. The bookings page must check the flag and return 404 if disabled.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/components/app-sidebar.tsx` | Add `{ title: "Bookings", url: "/bookings", icon: <CalendarIcon /> }` to `data.navMain` array (after "Customers" at line ~46). Conditionally render based on new `featureFlags` prop. Add `CalendarIcon` to lucide imports (line ~3). |
| `apps/web/src/app/[orgSlug]/layout.tsx` | Fetch `organizationSetting.featureFlags` from `getOrgSettings(org.id)` and pass `featureFlags` to `<AppSidebar>`. Add `getOrgSettings` to imports from `@/lib/queries` (line ~10). |
| `apps/web/src/app/[orgSlug]/bookings/page.tsx` | Add feature flag check at top: fetch org settings, if `!featureFlags.laneBooking` call `notFound()`. |

## Files to create

None.

## Context

### Patterns to follow
- `apps/web/src/components/app-sidebar.tsx` (lines 34-61): `data.navMain` array defines sidebar items with `title`, `url`, `icon`.
- `apps/web/src/app/[orgSlug]/layout.tsx` (lines 23-26): parallel data fetching with `Promise.all`, passing props to `<AppSidebar>`.
- `apps/web/src/lib/queries.ts` (lines 62-76): `getOrgSettings` cached query returns full `organizationSetting` row including `featureFlags`.

### Key types
```typescript
// featureFlags shape (from organizationSetting.featureFlags JSONB)
type FeatureFlags = Record<string, unknown>;
// Access: (featureFlags as Record<string, boolean>).laneBooking ?? false

// AppSidebar prop addition
type AppSidebarProps = {
  // ...existing
  featureFlags?: { laneBooking?: boolean };
};
```

### Wiring notes
- `getOrgSettings` already exists in `queries.ts` (line 62) and is cached per request.
- The layout already fetches org and session in parallel; add `getOrgSettings(org.id)` to the second `Promise.all` (line 37) since it depends on `org.id`.
- Sidebar filtering: wrap the navMain items in a `.filter()` that checks feature flags before rendering. Or conditionally include the "Bookings" item in the array.

## Acceptance criteria

- [ ] "Bookings" link appears in sidebar when `featureFlags.laneBooking === true`
- [ ] "Bookings" link hidden when flag is false or absent
- [ ] Bookings page returns 404 when flag is disabled
- [ ] Bookings page renders normally when flag is enabled
- [ ] No changes to orgs that don't have the flag set (backward compatible)
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes

## Verification

```bash
cd apps/web
bunx biome check src/components/app-sidebar.tsx src/app/\[orgSlug\]/layout.tsx src/app/\[orgSlug\]/bookings/page.tsx
bun run build
```

### Manual verification
1. Set `featureFlags: { laneBooking: true }` on an org's `organization_setting` row
2. Navigate to `<orgSlug>/dashboard` -- sidebar should show "Bookings" link
3. Navigate to `<orgSlug>/bookings` -- page loads
4. Set `featureFlags: { laneBooking: false }` -- sidebar link disappears, bookings page returns 404

## Notes

- This is HITL because sidebar layout/placement decisions may need human review for visual consistency.
- The `CalendarIcon` from lucide-react is the appropriate icon for bookings.
