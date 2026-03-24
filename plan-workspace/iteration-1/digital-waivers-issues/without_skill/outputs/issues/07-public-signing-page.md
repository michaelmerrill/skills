# Issue 7: Public Waiver Signing Page

## Summary

Create the public-facing waiver signing page at `app/[orgSlug]/waiver/page.tsx`. This page allows unauthenticated users to view and sign a waiver. Includes the form, minor/guardian toggle, consent UI, and confirmation screen.

## Context

The proxy at `apps/web/src/proxy.ts` already rewrites `{slug}.rangeops.com/*` to `/[orgSlug]/*`, so the page at `app/[orgSlug]/waiver/page.tsx` is automatically accessible at `{slug}.rangeops.com/waiver` with no proxy changes needed.

## Acceptance Criteria

- [ ] New route: `apps/web/src/app/[orgSlug]/waiver/page.tsx`
  - RSC that resolves org by slug (query `organization` table)
  - Checks `featureFlags.waivers` — if disabled, renders "Waivers are not currently available"
  - Queries active published template — if none, renders "Waivers are not yet available for [org name]"
  - Renders the signing page with org header (name + logo from branding), template body HTML, and signing form
- [ ] Signing form fields:
  - First name, last name (text inputs, required)
  - Email (email input, required)
  - Phone (tel input, optional)
  - Date of birth (date input, required)
  - "I am signing on behalf of a minor" toggle/checkbox
  - When minor toggle is on: minor first name, minor last name, minor date of birth (all required)
  - Consent checkbox: "I have read and agree to the terms above"
  - Signature: typed legal name (text input, required)
  - Submit button
- [ ] Form submits via server action (progressive enhancement — works without JS per NFR-6)
  - Server action in `apps/web/src/app/[orgSlug]/waiver/actions.ts`
  - Validates with `signWaiverSchema`
  - Extracts IP address from `x-forwarded-for` or `x-real-ip` header, user agent from headers
  - Calls `signWaiver` service function
  - On success: returns confirmation data
- [ ] Confirmation screen renders after successful submission:
  - Signer name, date signed, expiration date
  - "Show this to staff" message
  - No navigation back to the form (prevents accidental re-submission)
- [ ] Template body HTML is rendered safely (sanitize with DOMPurify or server-side HTML sanitizer to prevent XSS)
- [ ] Page is mobile-responsive (public customers will primarily use phones)
- [ ] No authentication required — this is a fully public page

## Technical Notes

- The page is a React Server Component that does the data fetching, passing data to a client component for the interactive form
- For progressive enhancement: the form should use a `<form>` element with the server action, not just client-side `fetch`
- HTML sanitization of template body is critical — this is user-generated content rendered on a public page. Use a server-side sanitizer or DOMPurify.
- For org resolution, add a query function that fetches org + settings + branding by slug (or extend existing `getOrgBySlug` in `queries.ts`)
- The form can use `useActionState` (React 19) or `useFormState` for progressive enhancement with status feedback

## Dependencies

- Issue 1 (schema)
- Issue 2 (validation schemas)
- Issue 3 (feature flag check)
- Issue 6 (signing service layer)
