# Issue 4: Waiver Template Service Layer (lib/waivers.ts)

## Summary

Implement the Effect-based service functions for waiver template CRUD: `createTemplate`, `updateTemplate`, `publishTemplate`, `getActiveTemplate`, `getTemplatesByOrg`, and `deleteTemplate`.

## Context

The codebase uses Effect for service functions (see `apps/web/src/lib/customers.ts` for the pattern). Services depend on `DbService` and `CurrentSession` from `apps/web/src/lib/services.ts`. Permission checks use role-based logic inline (not the `ac` access control object directly in services — that's used for role definitions).

## Acceptance Criteria

- [ ] New file `apps/web/src/lib/waivers.ts` with the following Effect-based functions:
  - `createTemplate(data)` — inserts a new `waiver_template` with `status: 'draft'`, `version: 1`. Requires owner or admin role.
  - `updateTemplate(data)` — updates an existing draft template's name/body/expirationDays. Only drafts can be edited. Requires owner or admin role.
  - `publishTemplate(data)` — in a transaction: archives all `published` templates for the org, sets the target draft to `published`. Requires **owner** role only.
  - `getActiveTemplate(orgId)` — returns the single `published` template for an org, or yields `ActiveTemplateNotFound`.
  - `getTemplatesByOrg(orgId)` — returns all templates for an org, ordered by version desc.
  - `deleteTemplate(data)` — deletes a draft template. Cannot delete published or archived templates. Requires owner or admin role.
- [ ] All functions use `DbService` and `CurrentSession` from the Effect context
- [ ] Permission checks: owner can do everything including publish; admin can create/update/delete drafts but NOT publish; member can only read
- [ ] `publishTemplate` uses a database transaction (Drizzle's `db.transaction()`)
- [ ] Appropriate tagged errors yielded for not-found and permission failures

## Technical Notes

- Match the pattern in `customers.ts`: `Effect.gen(function* () { const db = yield* DbService; ... })`
- For the publish transaction, use `db.transaction(async (tx) => { ... })` wrapped in `Effect.tryPromise`
- The "edit published template" behavior (creating a new draft version) is handled at the action/UI level — the service just needs `createTemplate` with a specified version number, or an `editPublishedTemplate` convenience function that copies fields and bumps version
- Consider adding a `getTemplateById(templateId, orgId)` helper for internal use

## Dependencies

- Issue 1 (schema must exist)
- Issue 2 (error types and validation types)
