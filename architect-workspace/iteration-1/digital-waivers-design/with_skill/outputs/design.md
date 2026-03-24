# Design: Digital Waivers

> Technical design for [digital-waivers-prd.md] (scope: [digital-waivers-scope.md])
> Generated from architect interview on 2026-03-24

## Decisions Log

1. **Public route location**: `app/[orgSlug]/waiver/page.tsx` — reuses existing proxy.ts subdomain rewrite. No proxy changes. *Rationale: proxy already rewrites `{slug}.rangeops.com/*` to `/[orgSlug]/*`*
2. **Template management location**: `app/[orgSlug]/settings/waivers/` with new SettingsTabs entry. *Rationale: follows existing settings pattern (General, Locations, Team, Billing)*
3. **Service layer pattern**: Effect-based services in `lib/waivers.ts`, matching `lib/customers.ts`. *Rationale: consistency with established codebase patterns*
4. **Template versioning**: Single `waiver_template` table, one row per version, append-only. `status` enum (draft/published/archived). *Rationale: matches codebase's immutable-append pattern; preserves version history*
5. **Frozen template snapshot**: `waiver.templateSnapshot` stores exact HTML body at signing time. *Rationale: legal compliance — signed waivers must reference the exact text agreed to*
6. **Signer mental model**: Signer fields always hold the person signing. For minors: signer = guardian, minor fields hold child info. *Rationale: consistent semantics; the guardian is the legal signer*
7. **Form submission**: Next.js server action, progressive enhancement (works without JS per NFR-6). *Rationale: matches existing server action patterns; NFR-6 compliance*
8. **Waiver status computation**: Derived at query time via SQL subquery on `expiresAt`. No stored status. *Rationale: no stale data, no cron jobs*
9. **Email matching**: Case-insensitive via `lower()`. New partial unique index on `customer(organizationId, lower(email)) WHERE email IS NOT NULL`. ON CONFLICT for race condition handling. *Rationale: FR-23 requires case-insensitive matching; unique index prevents duplicates from race conditions*
10. **Email failure handling**: Save waiver regardless of email send failure. Log error but don't block user. *Rationale: waiver record is the critical audit trail; email is informational*
11. **No hard delete**: Published templates archived only. Delete only available for unpublished drafts. *Rationale: signed waivers reference templates; can't orphan them*
12. **Feature flag**: `featureFlags.waivers` on `organizationSetting`. Controls tab visibility + public page availability. *Rationale: controlled rollout to beta orgs using existing feature flag infrastructure*
13. **Rich text editor**: Tiptap (headless, MIT). Basic extensions only — headers, bold, italic, lists, paragraphs. Store as HTML. *Rationale: lightweight, meets requirements, no overkill*
14. **Rate limiting**: 5 submissions per IP per minute on signing action. *Rationale: abuse prevention on public endpoint without user friction*
15. **Publish permission**: Owner only. Admin can create/read/update but not publish. *Rationale: publishing affects the public-facing page; requires owner-level authority (already reflected in permissions.ts)*
16. **Duplicate customers**: Accept for v1. Different email = different customer. *Rationale: PRD explicitly acknowledges this risk and defers auto-merge*

## Data Models

### WaiverTemplate

- **Fields**:
  - `id`: text PK, prefix `"wtl"` (e.g., `wtl_abc123`)
  - `organizationId`: text FK -> `organization.id`, NOT NULL
  - `name`: text NOT NULL (template display name)
  - `body`: text NOT NULL (rich text as HTML)
  - `expirationDays`: integer NOT NULL DEFAULT 365
  - `status`: pgEnum `waiver_template_status` (`'draft'`, `'published'`, `'archived'`), NOT NULL DEFAULT `'draft'`
  - `version`: integer NOT NULL DEFAULT 1
  - `createdByUserId`: text (FK -> user.id, nullable)
  - `createdAt`: timestamp with tz NOT NULL DEFAULT now()
  - `updatedAt`: timestamp with tz NOT NULL DEFAULT now()
- **Indexes**:
  - `waiver_template_organization_id_idx` on `(organizationId)`
  - `waiver_template_organization_id_status_idx` on `(organizationId, status)` — fast lookup of published template
  - `waiver_template_organization_id_version_uidx` UNIQUE on `(organizationId, version)` — prevents duplicate versions
- **Relationships**: belongs to `organization`
- **Migration notes**: New table. No changes to existing tables. Add `"waiverTemplate"` prefix to `id.ts`.

### Waiver (signed waiver record)

- **Fields**:
  - `id`: text PK, prefix `"wvr"` (e.g., `wvr_xyz789`)
  - `organizationId`: text FK -> `organization.id`, NOT NULL
  - `templateId`: text FK -> `waiver_template.id`, NOT NULL
  - `templateSnapshot`: text NOT NULL (frozen HTML body at time of signing)
  - `customerId`: text FK -> `customer.id`, NOT NULL (the customer this waiver covers)
  - `signerFirstName`: text NOT NULL
  - `signerLastName`: text NOT NULL
  - `signerEmail`: text NOT NULL
  - `signerPhone`: text
  - `signerDateOfBirth`: date NOT NULL
  - `isMinor`: boolean NOT NULL DEFAULT false
  - `guardianCustomerId`: text FK -> `customer.id` (nullable, only for minor waivers)
  - `signatureText`: text NOT NULL (typed legal name)
  - `consentGiven`: boolean NOT NULL DEFAULT true
  - `signedAt`: timestamp with tz NOT NULL
  - `expiresAt`: timestamp with tz NOT NULL (calculated: `signedAt + templateExpirationDays`)
  - `ipAddress`: text
  - `userAgent`: text
  - `createdAt`: timestamp with tz NOT NULL DEFAULT now()
- **Indexes**:
  - `waiver_organization_id_idx` on `(organizationId)`
  - `waiver_customer_id_idx` on `(customerId)` — fast lookup for waiver status badge
  - `waiver_customer_id_expires_at_idx` on `(customerId, expiresAt)` — optimal for "has valid waiver?" query
  - `waiver_organization_id_signer_email_idx` on `(organizationId, signerEmail)` — useful for lookup by email
- **Relationships**: belongs to `organization`, belongs to `waiver_template`, belongs to `customer` (via `customerId`), optionally belongs to `customer` (via `guardianCustomerId`)
- **Migration notes**: New table. No changes to existing tables. Add `"waiver"` prefix to `id.ts`.

### Customer (existing — modifications)

- **New index**: Partial unique index `customer_organization_id_lower_email_uidx` on `(organizationId, lower(email)) WHERE email IS NOT NULL` — prevents duplicate customers from race conditions during waiver signing
- **No column changes**: all needed fields already exist (firstName, lastName, email, phone, dateOfBirth, status)

## Behavior Specs

### Create Waiver Template

- **Trigger**: Manager navigates to Settings > Waivers, clicks "Create Template"
- **Steps**:
  1. Validate user has `waiver_template:create` permission (owner or admin)
  2. Render form: name (text input), body (Tiptap editor), expirationDays (number input, default 365)
  3. On "Save Draft": validate inputs, insert `waiver_template` row with `status: 'draft'`, `version: 1`
  4. Revalidate settings/waivers path
- **Result**: Draft template appears in template list with "Draft" badge
- **Variations**: If a draft already exists for this org, user can edit it instead of creating a new one
- **PRD coverage**: FR-1, FR-2, FR-3, User Story: Create Waiver Template

### Preview Template

- **Trigger**: Manager clicks "Preview" on a draft or published template
- **Steps**:
  1. Render template body in a modal/drawer using the same layout as the public signing page
  2. Show org name/logo header + formatted body
- **Result**: Manager sees exactly what customers will see
- **PRD coverage**: FR-5

### Publish Template

- **Trigger**: Manager (owner only) clicks "Publish" on a draft template
- **Steps**:
  1. Validate user has `waiver_template:publish` permission (owner only)
  2. In a transaction:
     a. Set all existing `published` templates for this org to `archived`
     b. Set the target draft to `published`
  3. Revalidate settings/waivers path
- **Result**: Template is live on the public signing page. Previous published template archived.
- **Variations**: If no draft exists, publish button is disabled
- **PRD coverage**: FR-3, FR-4, User Story: Create Waiver Template (publish step)

### Edit Published Template

- **Trigger**: Manager clicks "Edit" on the published template
- **Steps**:
  1. Create new `waiver_template` row with `status: 'draft'`, `version: prevVersion + 1`, body/name/expirationDays copied from published version
  2. Render edit form
  3. On save: update the draft row
- **Result**: New draft exists alongside the active published version. Published stays active.
- **PRD coverage**: FR-4, User Story: Edit and Republish Template

### Sign Waiver (Adult)

- **Trigger**: Customer loads `{org-slug}.rangeops.com/waiver`
- **Steps**:
  1. RSC page resolves org by slug (query `organization` table via slug from proxy rewrite)
  2. Check feature flag `featureFlags.waivers` — if disabled, show "not available"
  3. Query active published `waiver_template` for org
  4. If no published template: render "Waivers are not yet available for [org name]" (FR-9)
  5. Render signing page: org header (name + logo), form fields, waiver text, consent UI
  6. Customer fills: firstName, lastName, email, phone, dateOfBirth
  7. Customer reads waiver text, checks consent checkbox, types legal name
  8. Submit triggers server action `signWaiver`:
     a. Validate all inputs (Zod schema)
     b. Validate age >= 18 (calculate from DOB)
     c. Normalize email to lowercase
     d. Query `customer` WHERE `organizationId = ? AND lower(email) = lower(?)` LIMIT 1
     e. If match: use existing `customerId`. If no match: INSERT into `customer` (status: 'lead', org-scoped) — ON CONFLICT (race condition) retry query
     f. INSERT into `waiver` with frozen template snapshot, audit metadata, calculated `expiresAt`
     g. Send confirmation email via Resend (fire-and-forget — don't block on failure)
     h. Return confirmation data
  9. Render confirmation page: signer name, date signed, expiration date, "Show this to staff"
- **Result**: Waiver record created, customer record created/linked, confirmation displayed
- **PRD coverage**: FR-7 through FR-17, FR-23, FR-24, FR-28, User Story: Sign Waiver (Adult), Auto-Link and Create Customers

### Sign Waiver (Guardian for Minor)

- **Trigger**: Customer toggles "I am signing on behalf of a minor" on the signing page
- **Steps**:
  1. Additional fields appear: minor's firstName, lastName, dateOfBirth
  2. On submit, server action validates:
     a. Guardian (signer) is 18+
     b. Minor is under 18
  3. Customer matching for guardian (by guardian email, same as adult flow)
  4. Customer matching for minor: query by firstName + lastName + dateOfBirth + organizationId (no email for minors typically). If no match: create new customer with status 'lead'.
  5. INSERT waiver with `isMinor: true`, `guardianCustomerId` set to the guardian's customer record, `customerId` set to the minor's customer record
  6. Send confirmation email to guardian's email
- **Result**: Both guardian and minor have customer records. Waiver covers the minor, signed by guardian.
- **PRD coverage**: FR-18 through FR-22, User Story: Sign Waiver (Guardian for Minor)

### Check Waiver Status at Check-In

- **Trigger**: Staff views customer list
- **Steps**:
  1. `listCustomers` query includes waiver status subquery:
     ```sql
     CASE
       WHEN EXISTS (SELECT 1 FROM waiver w WHERE w.customer_id = c.id
                    AND w.organization_id = c.organization_id
                    AND w.expires_at > now()) THEN 'signed'
       WHEN EXISTS (SELECT 1 FROM waiver w WHERE w.customer_id = c.id
                    AND w.organization_id = c.organization_id) THEN 'expired'
       ELSE 'not_signed'
     END AS waiver_status
     ```
  2. Customer table renders badge: green "Signed", yellow "Expired", gray "Not Signed"
  3. Filter bar adds waiver status option
- **Result**: Staff sees waiver status for every customer at a glance
- **PRD coverage**: FR-25, FR-26, FR-29, FR-31, User Story: Check Waiver Status at Check-In

### View Waiver Coverage

- **Trigger**: Manager views Customers page
- **Steps**:
  1. Query count of active customers with valid waivers vs total active customers
     ```sql
     SELECT
       COUNT(*) FILTER (WHERE status = 'active') AS total_active,
       COUNT(*) FILTER (WHERE status = 'active' AND EXISTS (
         SELECT 1 FROM waiver w WHERE w.customer_id = c.id AND w.expires_at > now()
       )) AS with_valid_waiver
     FROM customer c WHERE organization_id = ?
     ```
  2. Render summary: "X of Y active customers have valid waivers"
- **Result**: Manager sees compliance posture
- **PRD coverage**: FR-27, User Story: View Waiver Coverage

## Edge Cases & Failure Modes

| Scenario | Expected Behavior | Severity |
|----------|-------------------|----------|
| No published template, customer visits signing page | Friendly "not available" message with org name. No form rendered. | graceful |
| Signer is under 18, not signing for a minor | Validation error: "You must be 18 or older to sign." Form not submitted. | graceful |
| Minor is 18+ (DOB validation) | Validation error: "Minor must be under 18." | graceful |
| Guardian is under 18 | Validation error: "Guardian must be 18 or older." | graceful |
| Two people sign with same email simultaneously (new customer) | Unique index prevents duplicate. Second insert catches constraint violation, queries existing customer, links waiver. | graceful |
| Email send fails after waiver saved | Waiver record preserved. Error logged. User sees confirmation screen normally. | warning |
| Manager publishes while another is editing draft | Publish is transactional — archive old, publish new. If two publish attempts race, one wins (last-write-wins on status update). Acceptable for low-frequency operation. | graceful |
| Customer signs, then template is edited and republished | Old waiver retains `templateSnapshot` of the text they signed. New signers get new template. No retroactive changes. | graceful |
| Extremely long waiver body (100KB+ HTML) | Accept. `text` column has no practical limit in Postgres. Loading may be slow on poor connections — mitigated by NFR-3 performance budget. | warning |
| Bot spam on public signing page | Rate limit (5/min per IP) rejects excess submissions. No CAPTCHA for v1. | warning |
| Feature flag disabled mid-session | Page returns "not available" on next load. Any in-progress form submission fails gracefully with "waivers not available." | graceful |
| Customer email is null in existing record | No match possible — new customer created. Email is optional on customer but required on signing form. | graceful |

## Scope

**In scope (v1):**
- `waiver_template` table with draft/published/archived lifecycle
- `waiver` table with frozen template snapshot and audit metadata
- Template CRUD under Settings > Waivers (owner/admin create+edit, owner publish)
- Public signing page at `{org-slug}.rangeops.com/waiver`
- Adult and guardian/minor signing flows
- Customer auto-match (email) and auto-create (status: lead)
- Waiver status badge in customer table (derived, no cron)
- Waiver status filter in customer table
- Coverage summary on customers page
- Email confirmation via Resend
- Feature flag gating
- Rate limiting on public endpoint

**Out of scope:**
- Expiration reminder emails — future, post email infrastructure maturity
- Kiosk/shared-tablet mode — deferred to v2
- PDF download of signed waiver — post-v1
- Multiple active templates per org — v1 is one template
- Per-location templates — org-wide for v1
- CAPTCHA on signing page — rate limiting sufficient for v1
- Drawn/finger signature — typed name + consent per PRD

## Assumptions & Unknowns

- **Assumption**: Tiptap HTML output is sanitized and safe to render on the public page. *Risk if incorrect: XSS via template body. Mitigation: sanitize HTML on render with a whitelist (DOMPurify or similar).*
- **Assumption**: Legal review will confirm typed-name + consent checkbox is sufficient for US range waivers. *Risk if incorrect: need drawn signature component. Mitigation: low likelihood per scope doc; component can be added without schema changes.*
- **Assumption**: Waiver records are small enough that indefinite retention won't cause storage issues. *Risk if incorrect: need archival strategy. Mitigation: negligible at launch scale — a waiver is ~5KB per record.*
- **Unknown**: Exact consent checkbox text — configurable per template or hardcoded? *Current decision: hardcoded "I have read and agree to the terms above" for v1. Can be made configurable without schema changes.*

## Documentation Impact

- **Must update**: README (add waivers to feature list), `permissions.ts` docs (waiver permissions are now enforced, not just stubbed)
- **New docs needed**: waiver template setup guide for operators

## Source-of-Truth Conflicts

| Conflict | Sources | Classification | Resolution |
|----------|---------|---------------|------------|
| `permissions.ts` stubs `waiver_template` and `waiver` but no schema/routes exist | permissions.ts vs codebase | Incomplete implementation | Now being implemented — permissions match the design |
| Admin role has `waiver_template: ["create", "read", "update"]` but not `"publish"` | permissions.ts | Intentional | Confirmed: only owner can publish. Design matches existing permission stubs. |

## Operational Considerations

- **Rollout strategy**: Feature-flagged per org via `featureFlags.waivers`. Enable for beta orgs first. Monitor for issues. Unflag for general availability.
- **Backward compatibility**: Fully additive. No existing tables, queries, or APIs affected. Customer list query gets optional waiver status subquery (only when waiver tables exist and have data).
- **Feature flags**: `organizationSetting.featureFlags.waivers: boolean`. Controls: settings tab visibility, public page availability, customer list badge rendering.
- **Performance / cost**: Signing page is a single RSC render + one DB query (template). Signing action is 2-3 DB operations (customer lookup, customer upsert, waiver insert). Waiver status subquery adds one EXISTS check per customer row in list — covered by `(customerId, expiresAt)` index.
- **Monitoring**: Log waiver signing events (org, timestamp, success/failure). Track email send failures separately. No new infrastructure needed.
- **Failure recovery**: Waiver records are append-only. No destructive operations. If signing partially fails, the customer record may exist without a waiver — acceptable, retry-safe.

## Security & Access

- **Permissions affected**: `waiver_template` (owner: full CRUD + publish, admin: CRUD no publish, member: read). `waiver` (all authenticated roles: create + read + list). Public signing: unauthenticated create only.
- **Sensitive data**: Signer PII (name, email, phone, DOB) stored in waiver records. IP address and user agent for audit. All scoped to organization. Same PII handling as existing customer records.
- **Trust boundaries**: Public signing page is untrusted input. Server-side validation mandatory. No PII exposed in responses beyond what the signer just entered. Template body HTML must be sanitized on render to prevent XSS.
- **Abuse risks**: Bot form spam (mitigated by rate limiting). Fake/junk email addresses (acceptable for v1 — waiver is the binding document, not the email). Template body XSS (mitigated by HTML sanitization).

## Code Design & Boundaries

- **Key interfaces/abstractions**:
  - `lib/waivers.ts`: `createTemplate`, `updateTemplate`, `publishTemplate`, `getActiveTemplate`, `getTemplatesByOrg`, `signWaiver`, `getWaiverStatus`, `getWaiverCoverage`
  - `lib/db/schema/waivers.ts`: `waiverTemplate`, `waiver` table definitions + relations
  - `lib/validation.ts`: `createWaiverTemplateSchema`, `updateWaiverTemplateSchema`, `signWaiverSchema`
  - `lib/errors.ts`: `WaiverTemplateNotFound`, `ActiveTemplateNotFound`, `InvalidSignerAge`
- **Dependency direction**: Pages -> Actions -> Services (Effect) -> DB. Services depend on `DbService`, `ResendClient`, `CurrentSession` (for authenticated routes only). Public signing doesn't use `CurrentSession`.
- **Patterns applied**: Effect service layer (matching customers.ts), server actions (matching settings/actions.ts), React server components (matching customers page), tagged errors (matching errors.ts), Zod validation (matching validation.ts), nanoid prefixed IDs (matching id.ts).
- **Extension points**: Template body format (HTML now, could support Markdown or JSON-based blocks later). Consent mechanism (checkbox + typed name now, could add drawn signature later). Customer matching (email only now, could add phone/name matching later).

## Testing Strategy

- **Unit tests** (`__tests__/waivers/`):
  - `waiver-templates.test.ts`: Create draft, save, publish (owner), publish fails for admin, edit creates new version, archive on republish, delete draft, can't delete published
  - `waiver-signing.test.ts`: Adult signing happy path, customer email match, customer auto-create (lead status), minor/guardian signing, age validation (under 18 rejected for self-sign, over 18 rejected for minor), race condition (concurrent same-email), waiver expiration calculation
  - `waiver-status.test.ts`: Status computation (signed/expired/not_signed), coverage query, filter by waiver status
- **Integration tests**: Server action tests via `actions.ts` — form validation, auth checks, Effect pipeline execution
- **End-to-end tests** (`e2e/waiver-signing.spec.ts`): Public page renders org branding, no-template message, full signing flow (fill form, submit, see confirmation), guardian/minor toggle
- **Test data**: Seed templates and signed waivers in beforeAll. Use existing `createTestSession`/`addMember`/`resetTestState` helpers.
- **Acceptance verification**: Each phase has acceptance criteria tied to specific tests. Phase is done when all tests pass + lint + build green.

## Phased Build Plan

### Phase 1: Schema + Template Management
**Depends on**: Nothing
**Decisions**: #1, #2, #3, #4, #12, #13, #15
**PRD coverage**: FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, User Story: Create Waiver Template, User Story: Edit and Republish Template
**What**: New DB tables (`waiver_template`, `waiver`), ID prefixes, schema export. Template CRUD service functions. Settings > Waivers tab with create/edit/preview/publish UI. Permission enforcement. Feature flag check. Unit tests for template lifecycle.
**Acceptance criteria**:
- [ ] `waiver_template` and `waiver` tables created via Drizzle migration
- [ ] Owner can create a draft template with name, rich text body, expiration days
- [ ] Owner can preview a template as customers would see it
- [ ] Owner can publish a draft template (only one published per org)
- [ ] Admin can create/edit but cannot publish
- [ ] Member sees read-only template view
- [ ] Editing a published template creates a new draft (version + 1)
- [ ] Publishing a new version archives the previous published template
- [ ] Settings > Waivers tab visible when feature flag enabled
- [ ] All template lifecycle tests pass

### Phase 2: Public Signing Page + Customer Integration + Email
**Depends on**: Phase 1
**Decisions**: #5, #6, #7, #9, #10, #14, #16, #17
**PRD coverage**: FR-7 through FR-24, FR-28, FR-29, FR-30, User Story: Sign Waiver (Adult), User Story: Sign Waiver (Guardian for Minor), User Story: Auto-Link and Create Customers
**What**: Public signing page at `/{orgSlug}/waiver`. Adult and minor/guardian signing flows. Customer auto-match by email + auto-create. Waiver record with frozen template snapshot and audit metadata. Confirmation page. Email confirmation via new Resend template. Rate limiting. Unique email index on customer table.
**Acceptance criteria**:
- [ ] Public page loads at `{slug}.rangeops.com/waiver` without authentication
- [ ] Page shows org name/logo and formatted waiver text
- [ ] "Not available" message when no published template or feature flag disabled
- [ ] Adult can complete signing flow: fill form, consent, type name, submit
- [ ] Age validation rejects under-18 self-signers
- [ ] Guardian can sign for minor with additional fields
- [ ] Guardian age >= 18, minor age < 18 validated
- [ ] Existing customer matched by email (case-insensitive)
- [ ] New customer created with status "lead" when no match
- [ ] Waiver record includes frozen template text, IP, user agent, timestamps
- [ ] `expiresAt` calculated correctly from signing date + template expiration days
- [ ] Confirmation screen shows signer name, date, expiration
- [ ] Email confirmation sent (failure doesn't block signing)
- [ ] Rate limiting enforced on signing endpoint
- [ ] E2e test passes for full signing flow

### Phase 3: Staff-Facing UI (Badges, Filtering, Coverage)
**Depends on**: Phase 2
**Decisions**: #8, #16
**PRD coverage**: FR-25, FR-26, FR-27, FR-31, User Story: Check Waiver Status at Check-In, User Story: View Waiver Coverage
**What**: Waiver status badge (Signed/Expired/Not Signed) in customer table via derived subquery. Waiver status filter in customer table filter bar. Coverage summary stat on customers page header. Update `listCustomers` query.
**Acceptance criteria**:
- [ ] Customer table shows waiver status badge per customer
- [ ] Badge correctly shows "Signed" (green), "Expired" (yellow), "Not Signed" (gray)
- [ ] Badge reflects real-time status (no stale data)
- [ ] Customer list filterable by waiver status
- [ ] Customers page header shows "X of Y active customers have valid waivers"
- [ ] Coverage count reflects current expiration state
- [ ] All waiver status tests pass

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| explore | 2026-03-24 | Go | Launch blocker. Permissions pre-stubbed. First public-facing page. |
| define | 2026-03-24 | Ready | 27 questions across 8 domains. One active template per org, mobile-first signing, auto-customer creation, three-state waiver badges. |
| design | skipped | -- | No UX spec produced (not required for this feature) |
| architect | 2026-03-24 | Ready | 31 questions across 10 domains. 2 new tables, 3-phase build. Public route via existing proxy rewrite. Derived waiver status. Feature-flagged rollout. |
