# Issue 13: Unit Tests — Waiver Template Lifecycle

## Summary

Write unit tests for the waiver template CRUD service functions: create, update, publish, archive, delete, version management, and permission enforcement.

## Context

Tests live in `apps/web/src/__tests__/`. The test infrastructure uses Vitest (`apps/web/vitest.config.ts`). Existing test patterns can be seen in `apps/web/src/__tests__/customers/customer-list.test.ts`. Test helpers are in `apps/web/src/__tests__/helpers/`.

## Acceptance Criteria

- [ ] New test file: `apps/web/src/__tests__/waivers/waiver-templates.test.ts`
- [ ] Test cases:
  - Create draft template (owner) — succeeds, returns template with status 'draft', version 1
  - Create draft template (admin) — succeeds
  - Create draft template (member) — fails with permission error
  - Update draft template — succeeds, fields updated
  - Update published template — fails (can't directly edit published)
  - Publish template (owner) — succeeds, status changes to 'published'
  - Publish template (admin) — fails with permission error
  - Publish archives previous published template — old template status becomes 'archived'
  - Edit published creates new draft — new row with version + 1, original stays published
  - Delete draft template — succeeds
  - Delete published template — fails
  - Delete archived template — fails
  - Only one published template per org at a time
  - Version uniqueness per org enforced
- [ ] Tests use existing test helpers (`createTestSession`, `addMember`, `resetTestState` or equivalent)
- [ ] All tests pass with `vitest run`

## Technical Notes

- Study `apps/web/src/__tests__/customers/customer-list.test.ts` and `apps/web/src/__tests__/helpers/` for setup patterns
- Tests should run the Effect pipeline with test services/layers
- Mock `DbService` or use a test database depending on the existing test infrastructure pattern

## Dependencies

- Issue 1 (schema)
- Issue 4 (template service functions to test)
