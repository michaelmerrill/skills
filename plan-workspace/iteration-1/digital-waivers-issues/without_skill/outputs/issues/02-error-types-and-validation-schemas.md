# Issue 2: Error Types and Zod Validation Schemas

## Summary

Add waiver-specific tagged error classes to `errors.ts` and Zod validation schemas to `validation.ts` for template CRUD and waiver signing operations.

## Context

The codebase uses Effect's `Data.TaggedError` for typed errors (`apps/web/src/lib/errors.ts`) and Zod schemas for all input validation (`apps/web/src/lib/validation.ts`). Every server action validates input through a Zod schema before executing the Effect pipeline.

## Acceptance Criteria

- [ ] New error classes in `apps/web/src/lib/errors.ts`:
  - `WaiverTemplateNotFound` with `{ templateId: string }`
  - `ActiveTemplateNotFound` with `{ organizationId: string }`
  - `InvalidSignerAge` with `{ reason: string }`
- [ ] New Zod schemas in `apps/web/src/lib/validation.ts`:
  - `createWaiverTemplateSchema` — validates name (string, 1-200 chars), body (string, non-empty HTML), expirationDays (integer, 1-3650, default 365), orgId
  - `updateWaiverTemplateSchema` — validates templateId, orgId, optional name/body/expirationDays
  - `publishWaiverTemplateSchema` — validates templateId, orgId
  - `signWaiverSchema` — validates firstName, lastName, email, phone (optional), dateOfBirth, signatureText, consentGiven (must be true), orgSlug, isMinor (boolean, default false), minorFirstName (required if isMinor), minorLastName (required if isMinor), minorDateOfBirth (required if isMinor)
- [ ] All schemas export their inferred TypeScript types (e.g., `CreateWaiverTemplateData`)
- [ ] Sign waiver schema includes age validation refinements: signer must be 18+, minor must be under 18 when `isMinor` is true

## Technical Notes

- Follow existing patterns: `z.object({...})` with `.refine()` for cross-field validation
- The sign waiver schema needs conditional validation — when `isMinor` is true, the minor fields become required. Use `.superRefine()` or a discriminated union.
- Email normalization (lowercase) should happen in the service layer, not in the schema — schema just validates format
- Date of birth should use `z.coerce.date()` or `z.string().pipe(z.coerce.date())` depending on form submission format

## Dependencies

None — can be done in parallel with Issue 1.
