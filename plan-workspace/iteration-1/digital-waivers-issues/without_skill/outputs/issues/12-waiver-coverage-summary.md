# Issue 12: Waiver Coverage Summary on Customers Page

## Summary

Add a coverage summary statistic to the customers page header: "X of Y active customers have valid waivers". This gives managers a quick view of waiver compliance.

## Context

The customers page is at `apps/web/src/app/[orgSlug]/customers/page.tsx`. The design specifies a COUNT query with FILTER clauses to compute coverage. This is a read-only addition to the existing page.

## Acceptance Criteria

- [ ] New query function (e.g., `getWaiverCoverage(orgId)` in `lib/waivers.ts` or `lib/queries.ts`):
  ```sql
  SELECT
    COUNT(*) FILTER (WHERE status = 'active') AS total_active,
    COUNT(*) FILTER (WHERE status = 'active' AND EXISTS (
      SELECT 1 FROM waiver w WHERE w.customer_id = c.id AND w.expires_at > now()
    )) AS with_valid_waiver
  FROM customer c WHERE organization_id = ?
  ```
- [ ] Customers page (`page.tsx`) calls this query and passes results to the UI
- [ ] Coverage summary displayed in the page header area: "X of Y active customers have valid waivers"
- [ ] Summary only shown when `featureFlags.waivers` is enabled
- [ ] Summary correctly reflects current expiration state (real-time, no stale data)
- [ ] Handles edge cases: 0 active customers, 0 waivers

## Technical Notes

- This query can be run in parallel with the existing `getCustomersByOrg` and `getLocationsByOrg` calls in the page component
- Use Drizzle's `sql` template for the FILTER clauses
- The coverage stat is org-wide, not affected by the current page filters
- Consider using a simple `<p>` or small card/banner component — nothing elaborate needed

## Dependencies

- Issue 1 (waiver table)
- Issue 3 (feature flag)
