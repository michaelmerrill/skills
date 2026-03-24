# Issue 16: E2E Test — Public Waiver Signing Flow

## Summary

Write a Playwright end-to-end test for the full public waiver signing flow: page load, form fill, submit, and confirmation screen.

## Context

E2E tests use Playwright, configured at `apps/web/playwright.config.ts`. Existing e2e tests are in `apps/web/e2e/` (e.g., `subdomain-routing.spec.ts`).

## Acceptance Criteria

- [ ] New test file: `apps/web/e2e/waiver-signing.spec.ts`
- [ ] Test scenarios:
  - Public page renders org name/branding and waiver template text
  - "Not available" message when no published template exists
  - "Not available" message when feature flag is disabled
  - Full adult signing flow: fill all fields, check consent, type signature, submit, see confirmation page with signer name, date, and expiration
  - Guardian/minor toggle shows additional fields
  - Full guardian/minor signing flow: fill guardian + minor fields, submit, see confirmation
  - Form validation: under-18 self-signer shows error, missing required fields show errors
- [ ] Tests run against a seeded test org with a published waiver template
- [ ] Tests pass with `playwright test`

## Technical Notes

- The test needs a seeded org with `featureFlags.waivers: true` and a published waiver template. Use the test setup/seed scripts from `apps/web/src/__tests__/global-setup.ts` or create specific e2e seed data.
- For subdomain routing in tests: Playwright may need to be configured to access `{slug}.localhost:3000` or use the direct path `localhost:3000/{orgSlug}/waiver`
- Test the progressive enhancement: form should work with JS disabled (use Playwright's `javaScriptEnabled: false` context option for one test)
- Be careful with date inputs — Playwright's date input interaction varies by browser

## Dependencies

- Issue 7 (the public signing page must exist)
- Issue 6 (signing service must work)
- All Phase 1 issues (schema, templates) must be complete for seeding
