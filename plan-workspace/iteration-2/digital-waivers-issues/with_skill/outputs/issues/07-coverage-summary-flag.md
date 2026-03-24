# Waiver Coverage Summary + Feature Flag Wiring

> Part of: [digital-waivers-design.md](plans/digital-waivers-design.md)
> Issue: 7 of 7
> Type: AFK

## Blocked by

- [06-waiver-status-badges.md](./06-waiver-status-badges.md) -- needs waiver status subquery pattern established, waiver data in DB

## What to build

Add a waiver coverage summary stat to the customers page header showing "X of Y active customers have valid waivers". Implement `getWaiverCoverage` service function. Ensure feature flag gating is consistent across all waiver touchpoints: settings tab (issue #3), public page (issue #4), customer table badges (issue #6), and this coverage summary. Add integration test verifying feature flag correctly hides/shows waiver UI.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/app/[orgSlug]/customers/page.tsx` | Fetch waiver coverage stats and feature flag. Pass to `CustomersTable` as `waiverCoverage` prop. Query `getOrgSettings` for feature flag, `getWaiverCoverage` for counts. Only fetch/display when feature flag enabled. |
| `apps/web/src/components/customers/customers-table.tsx` | Add coverage summary banner above table when `waiverCoverage` prop is present. Render: "X of Y active customers have valid waivers" with a simple progress indicator. |
| `apps/web/src/lib/waivers.ts` | Add `getWaiverCoverage` Effect function that runs the coverage SQL query from the design. |

## Context

### Patterns to follow
- `apps/web/src/app/[orgSlug]/customers/page.tsx` lines 34-38: parallel data fetching with `Promise.all`. Add `getOrgSettings(org.id)` and conditionally `getWaiverCoverage(org.id)` to the parallel fetch.
- `apps/web/src/lib/customers.ts` lines 45-122: Effect.gen query pattern. `getWaiverCoverage` follows the same pattern.
- `apps/web/src/components/customers/customers-table.tsx` lines 377-384: CardHeader area. The coverage summary can go in the CardDescription or as an additional stat line.

### Key types
```typescript
// Service function
export const getWaiverCoverage = (orgId: string) =>
  Effect.gen(function* () {
    const db = yield* DbService;
    // Uses the SQL from the design doc
    const result = yield* Effect.tryPromise({
      try: () => db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active') AS total_active,
          COUNT(*) FILTER (WHERE status = 'active' AND EXISTS (
            SELECT 1 FROM waiver w WHERE w.customer_id = customer.id
            AND w.organization_id = customer.organization_id
            AND w.expires_at > now()
          )) AS with_valid_waiver
        FROM customer WHERE organization_id = ${orgId}
      `),
      catch: (e) => new DatabaseError({ cause: e }),
    });
    return {
      totalActive: Number(result.rows[0]?.total_active ?? 0),
      withValidWaiver: Number(result.rows[0]?.with_valid_waiver ?? 0),
    };
  });

// Cached query in queries.ts
export const getWaiverCoverage = cache((orgId: string) =>
  getWaiverCoverageEffect(orgId).pipe(Effect.provide(AppLive), Effect.runPromise)
);

// CustomersTable prop addition
interface CustomersTableProps {
  // ... existing
  waiverCoverage?: { totalActive: number; withValidWaiver: number };
}
```

### Wiring notes
- Feature flag check in `customers/page.tsx`: query `getOrgSettings(org.id)` to get `featureFlags`, check `featureFlags.waivers === true`. Only call `getWaiverCoverage` and pass `waiverCoverage` prop when flag is enabled.
- The coverage summary is informational -- it does not affect table data or filtering.
- Add `getWaiverCoverage` to `queries.ts` as a cached query wrapper, following the existing pattern.
- The customer table badges from issue #6 should also be gated by the feature flag. If `featureFlags.waivers` is false, the waiver status column and filter should not appear. Pass a `showWaiverStatus` boolean prop to `CustomersTable`.

## Acceptance criteria

- [ ] Customers page header shows "X of Y active customers have valid waivers" when feature flag enabled
- [ ] Coverage counts are accurate (matches actual waiver records and expiration)
- [ ] Coverage summary hidden when `featureFlags.waivers` is false
- [ ] Waiver status badges in customer table hidden when feature flag is false
- [ ] Waiver status filter hidden when feature flag is false
- [ ] Feature flag gating is consistent across all waiver touchpoints
- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
bun run test -- --grep "waiver"
```

### Manual verification
- View customers page with feature flag enabled -- see coverage summary
- Disable feature flag -- verify coverage summary, badges, and filter disappear
- Re-enable -- verify they reappear
- Check coverage numbers match DB state

## Notes
- The coverage query uses `FILTER (WHERE ...)` aggregate syntax which is Postgres-specific. This is fine since the app uses Postgres.
- This is the final issue in the dependency chain. After this, all digital waiver features are complete for v1.
- The feature flag `featureFlags.waivers` lives in `organization_setting.feature_flags` jsonb column (see `apps/web/src/lib/db/schema/organization-settings.ts` lines 25-28). Access as `(settings.featureFlags as Record<string, unknown>).waivers`.
