# Ubiquitous Language: Digital Waivers

> Domain glossary for [digital-waivers-prd.md] (scope: [digital-waivers-scope.md])
> Generated from define glossary analysis on 2026-03-24

## Glossary

| Term | Definition | Aliases | Code Name | Status |
|------|-----------|---------|-----------|--------|
| waiver template | The authored document that defines waiver content, name, and expiration period. Has draft/published lifecycle. One active per organization. | template, waiver form | `waiver_template` (permission stub) | new |
| template version | A snapshot of a waiver template's content at the time of publishing. Signed waivers reference the version they were signed under. | version, revision | new | new |
| signed waiver | A record of a customer's agreement to a specific template version, including signer info, consent, and audit metadata. | waiver, waiver record, signature | `waiver` (permission stub) | new |
| waiver status | The computed state of a customer's waiver: Signed (valid, not expired), Expired (past expiration), Not Signed (no waiver on file). | status, signing status | new | new |
| expiration period | Number of days after signing that a waiver remains valid. Set on the template. | validity period, duration, TTL | new | new |
| e-signature | The combination of typed legal name + consent checkbox + audit metadata that constitutes the customer's agreement. | signature, electronic signature, consent | new | new |
| audit metadata | Data captured at signing time for legal defensibility: timestamp, IP address, user agent. | signing metadata, signature proof | new | new |
| guardian | An adult (18+) who signs a waiver on behalf of a minor. Recorded as the legally responsible party. | parent, responsible party | new | new |
| minor | A person under 18 who cannot self-sign a waiver. Must be signed for by a guardian. | child, dependent | new | new |
| customer | A person who visits or is associated with a range. Existing concept -- extended with waiver status. | member, visitor, walk-in | `customer` (schema table) | canonical |
| organization | The range business entity that owns templates and customer records. Tenant boundary. | range, company, org | `organization` (schema table) | canonical |
| location | A physical range site within an organization. Waivers are org-wide, not location-specific in v1. | site, branch, facility | `location` (schema table) | canonical |
| owner | Org role with full permissions including template publish. | -- | `owner` (permission role) | canonical |
| admin | Org role that can create/edit templates but not publish in some contexts. | manager | `admin` (permission role) | canonical |
| member | Org role (staff) with read-only template access and waiver creation (signing). | staff, employee | `member` (permission role) | canonical |
| waiver coverage | The percentage of active customers with a valid (non-expired) signed waiver. | compliance rate, coverage rate | new | new |
| signing page | The public, unauthenticated page where customers complete waiver signing. | waiver page, public waiver | new | new |

### Status key
- **canonical**: Term and code name match -- no action needed
- **rename**: Code uses different name -- design should use canonical, implementation should rename
- **new**: No existing code representation -- design introduces using this term

## Ambiguities Resolved

### "Waiver" refers to two things
- **Problem**: "Waiver" is used informally to mean both the template (the document operators create) and the signed record (what a customer produces). The permission system has both `waiver_template` and `waiver` as separate resources.
- **Resolution**: Use "waiver template" for the authored document and "signed waiver" for the customer's record. Short form "waiver" in UI labels where context is unambiguous (e.g., waiver status badge clearly refers to signed state).
- **Action**: PRD and design should use full terms. Code should follow `waiver_template` and `signed_waiver` (or `waiver`) naming from permissions.

### "Member" is overloaded
- **Problem**: "Member" means two things in the codebase: (1) the `member` permission role (staff), and (2) a customer who has a membership/subscription to the range (customer with "active" status). The scope doc uses "members" in the customer sense.
- **Resolution**: In waiver context, "member" refers to the staff role. Range customers are always "customer" regardless of their membership status.
- **Action**: PRD uses "customer" consistently for range visitors. "Member" only appears when referencing the staff permission role.

### "Signature" vs. "e-signature" vs. "consent"
- **Problem**: Multiple terms for the act of agreeing: signature, e-signature, electronic signature, consent.
- **Resolution**: "E-signature" is the canonical term for the full mechanism (typed name + checkbox + audit data). "Consent" refers specifically to the checkbox agreement. Individual terms should not be used interchangeably.
- **Action**: Design should label the typed-name field "E-Signature" and the checkbox as consent affirmation.

## Naming Conventions

- The codebase uses snake_case for database tables and columns (`waiver_template`, `signed_at`)
- Entity IDs use prefixed nanoids via `createId("entity")` -- new entities should follow this: `createId("waiver_template")`, `createId("waiver")`
- Permission resources use snake_case: `waiver_template`, `waiver`
- UI labels use title case: "Waiver Template," "Signed Waiver," "Waiver Status"
- URL segments use kebab-case: `/waiver`, `/settings/waivers`
- The existing pattern for enums uses snake_case arrays: follow for waiver-related enums
