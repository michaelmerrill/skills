# Issue 1: Database Schema — waiver_template and waiver tables

## Summary

Create the two new database tables (`waiver_template`, `waiver`), the `waiver_template_status` pgEnum, ID prefixes, and the partial unique index on the existing `customer` table. Generate and verify the Drizzle migration.

## Context

The digital waivers feature requires two new tables. The codebase uses Drizzle ORM with `pgTable` definitions in `apps/web/src/lib/db/schema/`. ID generation uses nanoid with prefixes defined in `apps/web/src/lib/id.ts`. Migrations live in `apps/web/drizzle/`.

## Acceptance Criteria

- [ ] New file `apps/web/src/lib/db/schema/waivers.ts` containing:
  - `waiverTemplateStatusEnum` pgEnum with values `'draft'`, `'published'`, `'archived'`
  - `waiverTemplate` table with all fields from the design (id, organizationId, name, body, expirationDays, status, version, createdByUserId, createdAt, updatedAt)
  - `waiver` table with all fields from the design (id, organizationId, templateId, templateSnapshot, customerId, signerFirstName, signerLastName, signerEmail, signerPhone, signerDateOfBirth, isMinor, guardianCustomerId, signatureText, consentGiven, signedAt, expiresAt, ipAddress, userAgent, createdAt)
  - All indexes specified in the design doc
  - Relations defined for both tables
- [ ] `apps/web/src/lib/db/schema/index.ts` updated to export from `./waivers`
- [ ] `apps/web/src/lib/id.ts` updated: add `waiverTemplate: "wtl"` and `waiver: "wvr"` to `prefixes`
- [ ] New partial unique index on `customer` table: `customer_organization_id_lower_email_uidx` on `(organizationId, lower(email)) WHERE email IS NOT NULL`
- [ ] Drizzle migration generated and applies cleanly
- [ ] Existing tests still pass (no breaking changes to existing schema)

## Technical Notes

- Follow the pattern in `apps/web/src/lib/db/schema/customers.ts` for table structure, FK references, and index definitions
- Use `$defaultFn(() => createId("waiverTemplate"))` and `$defaultFn(() => createId("waiver"))` for ID generation
- The `waiver.templateId` should FK to `waiverTemplate.id`
- The `waiver.customerId` and `waiver.guardianCustomerId` should FK to `customer.id`
- The customer table partial unique index uses `sql` template literal for the `lower()` function and `WHERE` clause, similar to `organizationSaasSubscription` unique indexes in `organization-settings.ts`

## Dependencies

None — this is the foundational issue.
