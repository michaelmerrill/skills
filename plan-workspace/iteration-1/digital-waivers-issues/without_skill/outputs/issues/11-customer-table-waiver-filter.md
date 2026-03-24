# Issue 11: Customer Table Waiver Status Filter

## Summary

Add a waiver status filter option to the customer table filter bar, allowing staff to filter customers by Signed, Expired, or Not Signed waiver status.

## Context

The customer table already has filters for search, status, and location (see `apps/web/src/app/[orgSlug]/customers/page.tsx` and the `listCustomersSchema` in `validation.ts`). The waiver status filter needs to integrate with the existing filter bar and URL-based search params.

## Acceptance Criteria

- [ ] New `waiverStatus` filter added to `listCustomersSchema` in `validation.ts` with values: `'signed'`, `'expired'`, `'not_signed'`
- [ ] `listCustomers` in `customers.ts` updated to filter by waiver status when the parameter is provided
  - `signed`: WHERE EXISTS (waiver with expires_at > now())
  - `expired`: WHERE EXISTS (waiver) AND NOT EXISTS (waiver with expires_at > now())
  - `not_signed`: WHERE NOT EXISTS (waiver)
- [ ] Filter UI component in the customer table adds a waiver status dropdown/select
  - Only visible when `featureFlags.waivers` is enabled
- [ ] Filter value persisted in URL search params (matching existing filter pattern)
- [ ] Filter works in combination with existing filters (search, status, location)

## Technical Notes

- The waiver status filter requires subqueries in the WHERE clause, not just simple column equality. Use Drizzle's `sql` template for the EXISTS subqueries.
- The filter should use the same `waiver_customer_id_expires_at_idx` index
- Follow the existing pattern: filter value in URL search params -> parsed by `listCustomersSchema` -> passed to `listCustomers` -> applied as a WHERE condition
- The `exportCustomers` function should also respect this filter

## Dependencies

- Issue 1 (waiver table)
- Issue 3 (feature flag)
- Issue 10 (the waiverStatus subquery — reuse the same SQL pattern)
