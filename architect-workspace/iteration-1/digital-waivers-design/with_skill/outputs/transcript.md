# Architect Interview Transcript: Digital Waivers

> Simulated interview for digital waivers technical design
> Date: 2026-03-24

---

**Assistant:** I've read the PRD, scope doc, and explored the codebase. Requirements call for waiver template CRUD, a public signing page at `{org-slug}.rangeops.com/waiver`, auto-customer creation, waiver status badges, and guardian/minor flows. Stack uses Next.js 16 with `proxy.ts`, Drizzle ORM on Postgres (Neon), Effect for service layer, Better Auth with organization plugin, Resend for email, and Zod for validation. Permissions already stub `waiver_template` and `waiver` resources. First question is about architecture.

---

## Domain 1: Architecture & Patterns

**Assistant:** The codebase follows a clear layered pattern: schema (Drizzle) -> service functions (Effect) -> server actions -> RSC pages. I found the proxy.ts rewrites subdomain requests into `[orgSlug]` segments. The signing page needs a public (unauthenticated) route under the org subdomain -- this is the first such route. Two options:

**Q1: Where should the public `/waiver` route live?**
- **(A) Under `app/[orgSlug]/waiver/` — same rewrite path as authenticated routes (Recommended)** — proxy.ts already rewrites `{slug}.rangeops.com/waiver` -> `/[orgSlug]/waiver`. No proxy changes needed. Page simply doesn't call `getSession` / check membership.
- **(B) Separate `app/waiver/` route with custom subdomain handling** — new routing path, more complex.
- **(C) API route that serves HTML** — breaks Next.js conventions.

**User:** A makes total sense. The proxy already handles the rewrite. We just skip the auth check in the page.

**Assistant:** Confirmed. The signing page lives at `app/[orgSlug]/waiver/page.tsx` as a public route. It won't use the org layout (which checks auth) — it'll have its own minimal layout. The confirmation page at `app/[orgSlug]/waiver/confirmation/page.tsx` is also public.

**Q2: Template management pages — under Settings > Waivers?**
- **(A) `app/[orgSlug]/settings/waivers/page.tsx` with a new tab in SettingsTabs (Recommended)** — follows existing pattern (General, Locations, Team, Billing). Add "Waivers" tab.
- **(B) Top-level `app/[orgSlug]/waivers/` section** — breaks settings convention for config pages.

**User:** A. Add the tab to settings-tabs.tsx.

**Assistant:** Confirmed. Template CRUD lives under `settings/waivers/`. SettingsTabs gets a "Waivers" entry after "Billing".

**Q3: Service layer pattern — same Effect-based approach?**
- **(A) Effect services for waiver logic, matching `customers.ts` pattern (Recommended)** — `lib/waivers.ts` for template CRUD and signing logic. Effect + DbService + tagged errors.
- **(B) Plain async functions** — diverges from established patterns.

**User:** A. Keep it consistent with the rest of the codebase.

**Assistant:** Confirmed. New file `lib/waivers.ts` with Effect-based service functions. Server actions in `settings/waivers/actions.ts` and `[orgSlug]/waiver/actions.ts`.

---

## Domain 2: Data & State

**Assistant:** I need two new tables: `waiver_template` (versioned templates) and `waiver` (signed waiver records). The customer table already has email, phone, firstName, lastName, dateOfBirth — all needed for the match/create flow.

**Q4: Template versioning strategy — how should we model draft/publish with version history?**
- **(A) Single `waiver_template` table with `status` column and `version` integer. Each publish bumps version. New row per version (Recommended)** — Immutable rows match the codebase's append-only pattern (see subscription events). Old versions preserved. Simple query: `WHERE organizationId = ? AND status = 'published' ORDER BY version DESC LIMIT 1`.
- **(B) Separate `waiver_template` and `waiver_template_version` tables** — more normalized but adds complexity for a feature that rarely has more than a few versions.
- **(C) Single row per org, overwrite in place** — loses version history, breaks requirement that old waivers link to the version they signed.

**User:** A. One table, row per version. Clean and simple. Matches the immutable-append pattern we use elsewhere.

**Assistant:** Confirmed. `waiver_template` table design:

```
waiver_template:
  id: text PK (prefix: "wtl")
  organizationId: text FK -> organization.id
  name: text NOT NULL
  body: text NOT NULL (rich text as HTML string)
  expirationDays: integer NOT NULL DEFAULT 365
  status: enum('draft', 'published', 'archived')
  version: integer NOT NULL DEFAULT 1
  createdAt: timestamp with tz
  updatedAt: timestamp with tz
```

**Q5: Signed waiver table — what fields and how should we store the frozen waiver text?**
- **(A) `waiver` table with frozen `templateSnapshot` (the template body at time of signing) as text column (Recommended)** — guarantees the exact text the signer agreed to is preserved, even if template is later edited. Matches audit/liability requirements.
- **(B) Just FK to `waiver_template` row (version is immutable anyway)** — relies on never deleting template versions. Simpler but riskier for legal compliance.

**User:** A. Freeze the text. For liability we need the exact document they signed, not a reference that could theoretically change.

**Assistant:** Confirmed. `waiver` table:

```
waiver:
  id: text PK (prefix: "wvr")
  organizationId: text FK -> organization.id
  templateId: text FK -> waiver_template.id
  templateSnapshot: text NOT NULL (frozen HTML body)
  customerId: text FK -> customer.id (linked after match/create)

  -- signer info (captured at signing time)
  signerFirstName: text NOT NULL
  signerLastName: text NOT NULL
  signerEmail: text NOT NULL
  signerPhone: text
  signerDateOfBirth: date NOT NULL

  -- guardian/minor fields (nullable — only populated for minor signing)
  isMinor: boolean NOT NULL DEFAULT false
  guardianFirstName: text
  guardianLastName: text
  guardianEmail: text
  guardianDateOfBirth: date
  minorCustomerId: text FK -> customer.id

  -- e-signature
  signatureText: text NOT NULL (typed legal name)
  consentGiven: boolean NOT NULL DEFAULT true

  -- audit metadata
  signedAt: timestamp with tz NOT NULL
  expiresAt: timestamp with tz NOT NULL
  ipAddress: text
  userAgent: text

  -- timestamps
  createdAt: timestamp with tz NOT NULL DEFAULT now()
```

**Q6: For minor waivers, should we flip the mental model? The signer fields are the guardian, and the minor's info goes in separate fields?**
- **(A) Always: signer = the person signing. For minors: signer = guardian, minor fields hold the child's info (Recommended)** — consistent mental model. The waiver is always "signed by" the signer fields. `isMinor` flag indicates guardian-on-behalf flow.
- **(B) Signer = the person the waiver covers (minor or adult). Guardian info in separate fields** — confusing because minors don't actually sign.

**User:** A. Signer is always the person who signs. For a minor waiver, the signer is the guardian and the minor fields hold the kid's name and DOB.

**Assistant:** Confirmed. Clear mental model: signer = guardian for minor waivers. Minor fields only populated when `isMinor = true`.

**Q7: State management for the signing flow — server-side form submission or client-side state?**
- **(A) Server action via Next.js `"use server"` action, form posts from the client (Recommended)** — matches PRD NFR-6 (works without JS for core path). Progressive enhancement. Server validates, creates records, returns confirmation data.
- **(B) Client-side state with API route** — requires JS, doesn't match NFR-6.

**User:** A. Server action. Aligns with the no-JS requirement and matches our existing patterns.

---

## Domain 3: Core Behavior (Technical)

**Assistant:** Let me walk through each user story's implementation step by step.

**Q8: Template creation flow — when a manager creates a template, should it auto-save as draft, or require explicit save?**
- **(A) Explicit save: fill form, click "Save Draft", then separately "Publish" (Recommended)** — clear two-step process matching the PRD's draft->published lifecycle. Prevents accidental publishing.
- **(B) Auto-save draft on form change** — adds complexity (debouncing, conflict handling) for low-frequency use.

**User:** A. Explicit save. Managers set this up once — auto-save is overkill.

**Assistant:** Confirmed. Flow: Manager fills name/body/expirationDays -> "Save Draft" -> draft row created. "Publish" button flips status to published, archives any previously published version for that org.

**Q9: "Edit published template" behavior — the PRD says editing a published template creates a new draft. How should the UI handle this?**
- **(A) "Edit" button on published template opens a form pre-filled with current content. Save creates a NEW draft row (version + 1). Old published row stays active until new one is published (Recommended)** — matches FR-4 exactly.
- **(B) In-place editing with version diff** — out of scope per PRD.

**User:** A. New draft row. Simple.

**Assistant:** Confirmed. On edit: create new `waiver_template` row with `status: 'draft'`, `version: prevVersion + 1`, pre-populated from the published version. On publish: set new row to `published`, old row to `archived`.

**Q10: Signing flow step-by-step — let me confirm the server-side behavior:**

1. Customer loads `/{orgSlug}/waiver` — RSC fetches active published template by org slug
2. If no published template: render "Waivers not yet available" message (FR-9)
3. Customer fills form, submits server action
4. Server validates: age >= 18 for self-signing; for minors: guardian >= 18, minor < 18
5. Server queries customer by email (case-insensitive, `lower(email)`) within org
6. If match: link waiver to existing customer. If no match: create new customer with status "lead"
7. For minor waivers: also create/link minor customer record
8. Insert waiver row with frozen template snapshot, audit metadata, calculated expiresAt
9. Send confirmation email via Resend
10. Return confirmation data to client for display

Does this match your mental model?

- **(A) Yes, this looks right (Recommended)**
- **(B) Modify the flow** — describe what should change

**User:** Yes, that's exactly right. One thing — step 5, the email match should use the existing index on `(organizationId, email)`. Make sure the query uses `lower()` on both sides or we store emails lowercase.

**Assistant:** Good call. I see the customer table has `index("customer_organization_id_email_idx").on(t.organizationId, t.email)`. We should normalize email to lowercase on insert (both in waiver signing and existing customer creation) and query with `lower()`. This matches FR-23's case-insensitive requirement.

**Q11: Waiver status computation — should this be a computed/derived value or stored?**
- **(A) Derived at query time from `waiver.expiresAt` and `waiver.signedAt` (Recommended)** — no stale data, no cron jobs. Waiver status for a customer = check if they have any waiver where `expiresAt > now()`. Three states: has valid waiver (Signed), has only expired waivers (Expired), no waivers (Not Signed). Computed in the customers list query with a subquery or LEFT JOIN.
- **(B) Stored `waiverStatus` column on customer table, updated by cron** — stale data risk, extra maintenance.

**User:** A. Derive it. We don't want a cron job for this. Subquery or lateral join in the customers list query.

**Assistant:** Confirmed. The customers list query gets a subquery:

```sql
SELECT c.*,
  CASE
    WHEN EXISTS (SELECT 1 FROM waiver w WHERE w.customer_id = c.id AND w.expires_at > now()) THEN 'signed'
    WHEN EXISTS (SELECT 1 FROM waiver w WHERE w.customer_id = c.id) THEN 'expired'
    ELSE 'not_signed'
  END AS waiver_status
FROM customer c
WHERE c.organization_id = ?
```

This becomes a Drizzle subquery in the `listCustomers` function.

---

## Domain 4: Edge Cases & Failure Modes

**Q12: What happens if a customer signs with a different email than their existing record?**
- **(A) Creates a new customer record (accept duplicates for v1, per PRD risk section) (Recommended)** — PRD explicitly calls this out: "accept for v1; manual resolution possible." Don't try to merge.
- **(B) Try to match on name + DOB as fallback** — unreliable, false positives possible.

**User:** A. Accept duplicates. PRD already acknowledges this.

**Q13: Race condition — two people submit the same email simultaneously (new customer)?**
- **(A) Use a unique constraint on `(organizationId, lower(email))` on the customer table and handle the conflict with ON CONFLICT (Recommended)** — if the second insert hits a conflict, query and link to the existing customer instead.
- **(B) No constraint, accept potential duplicates** — messy.

**User:** A. Add a partial unique index. We should have had this anyway.

**Assistant:** Confirmed. Add a unique index on `customer(organizationId, lower(email)) WHERE email IS NOT NULL`. On conflict during waiver signing: catch the constraint violation, query the existing customer, link the waiver.

**Q14: What if someone submits a waiver but the email send fails?**
- **(A) Save the waiver regardless, log the email failure, don't block the user (Recommended)** — the waiver is the critical record. Email is a nice-to-have confirmation. The confirmation screen already shows the necessary info.
- **(B) Roll back the waiver if email fails** — overly aggressive, loses signed data.

**User:** A. Waiver is the source of truth. Email failure shouldn't block the signing.

**Q15: Template deletion — what happens if a manager tries to delete a published template?**
- **(A) No hard delete. Only archive. "Delete" button only appears for draft templates that were never published (Recommended)** — signed waivers reference templates. Can't orphan them.
- **(B) Soft delete with cascade** — signed waivers would reference deleted templates.

**User:** A. No delete for published. Only drafts can be deleted. Published templates get archived when replaced.

---

## Domain 5: Integration & Dependencies

**Q16: Email confirmation — new email template in the `@workspace/email` package?**
- **(A) New `WaiverConfirmationEmail` template in `packages/email/src/templates/waiver-confirmation.tsx`, exported from package index (Recommended)** — follows existing pattern (VerificationEmail, InvitationEmail). Send via the Effect-based `sendEmail` service.
- **(B) Inline the email in the app** — breaks package separation.

**User:** A. New template in the email package.

**Q17: Organization branding — the signing page needs org name and logo. Where does that come from?**
- **(A) Query `organization` table for `name` and `logo`, `organizationSetting` for `branding` JSON (Recommended)** — both already exist. The signing page query joins them. No new data needed.
- **(B) New branding table** — unnecessary.

**User:** A. Organization already has name and logo. Settings has branding. We're good.

**Q18: Rich text editor for template body — which component?**
- **(A) Tiptap (headless, MIT licensed, React-native) (Recommended)** — lightweight, supports the required formatting (headers, bold, italic, lists, paragraphs). No images/tables/embeds needed. Store output as HTML string.
- **(B) Slate** — more complex, heavier.
- **(C) Textarea with Markdown** — worse UX for non-technical managers.

**User:** Tiptap. We can keep it minimal — just the basic extensions. Store as HTML.

---

## Domain 6: Operational & Rollout

**Q19: Feature flag gating — should we gate the waiver feature behind a feature flag?**
- **(A) Yes, use existing `featureFlags` JSON on `organizationSetting` (Recommended)** — `featureFlags.waivers = true`. Settings > Waivers tab only shows when enabled. Public signing page returns "not available" when disabled. Matches the `featureFlags` pattern already in the schema.
- **(B) No flag, ship to all orgs** — less control during rollout.

**User:** A. Use the existing feature flag field. Let us roll out to beta orgs first.

**Q20: Backward compatibility — any existing data or APIs affected?**
- **(A) No breaking changes. New tables only. Customer list query gets an optional waiver status subquery. Settings tabs get a new entry. Public route is net new (Recommended)** — nothing changes for existing features.

**User:** Correct. This is purely additive.

---

## Domain 7: Security & Access

**Q21: The public signing page is unauthenticated. What security measures?**
- **(A) Rate limiting on the server action (5 submissions per IP per minute), CSRF protection via Next.js built-in, input sanitization, no PII exposure in error messages (Recommended)** — rate limit prevents abuse. The page only writes data (no reads of existing customer PII).
- **(B) CAPTCHA** — friction for users on mobile. Overkill for v1.

**User:** A. Rate limiting + CSRF. Skip CAPTCHA for now — the signing page doesn't expose any data, it only accepts input.

**Q22: Permissions enforcement for template management?**
- **(A) Use existing permissions layer. Owner/admin can create, read, update, publish. Member can read only. Already stubbed in `permissions.ts` (Recommended)** — literally already defined: `waiver_template: ["create", "read", "update", "publish"]` for owner, `["create", "read", "update"]` for admin, `["read"]` for member.
- **(B) Custom permission check** — unnecessary when it's already defined.

**User:** A. The permissions are already stubbed. Just enforce them in the service layer like we do for customers.

**Assistant:** Confirmed. I noticed one thing: admin has `waiver_template: ["create", "read", "update"]` but NOT "publish". Only owner can publish. Is that intentional?

**User:** Good catch. Yes, that's intentional. Only owners should be able to activate a template that goes on the public page.

**Q23: Tenant isolation on the public page — how do we ensure one org's data doesn't leak?**
- **(A) The signing page resolves org by slug from the URL, all queries are scoped by `organizationId`. Same pattern as all other tenant-scoped queries (Recommended)** — no cross-tenant data access possible. The page only shows the template for the org in the URL.

**User:** A. Standard tenant scoping. Same as everything else.

---

## Domain 8: Testing Strategy

**Q24: What's the testing approach for waivers?**
- **(A) Unit tests for waiver service functions (Effect-based, matching `customer-list.test.ts` pattern), plus e2e test for the signing flow (Recommended)** — service tests cover: template CRUD, publish lifecycle, signing, customer match/create, expiration logic, permission checks. E2e covers the public page rendering and form submission.
- **(B) Only e2e** — misses edge cases.
- **(C) Only unit** — misses UI rendering and form submission.

**User:** A. Both. The service tests are the critical ones. E2e for the happy path.

**Assistant:** Confirmed. Test plan:

**Unit tests** (`__tests__/waivers/`):
- Template CRUD: create draft, publish, edit creates new draft, archive on republish
- Signing: adult happy path, minor/guardian path, validation (age checks)
- Customer matching: email match, case-insensitive, no match creates lead
- Expiration: status computation (signed, expired, not_signed)
- Permissions: owner publishes, admin can't publish, member read-only

**E2e tests** (`e2e/waiver-signing.spec.ts`):
- Public page loads with org branding
- No template shows "not available" message
- Full signing flow submission

---

## Domain 9: Code Design & Boundaries

**Q25: File organization — where does everything live?**
- **(A) Follow existing conventions exactly (Recommended)**:
  - Schema: `lib/db/schema/waivers.ts` — export from `schema/index.ts`
  - Service: `lib/waivers.ts` — Effect functions for template CRUD, signing, status queries
  - Validation: add waiver schemas to `lib/validation.ts`
  - Errors: add waiver errors to `lib/errors.ts`
  - ID prefixes: add `waiverTemplate: "wtl"` and `waiver: "wvr"` to `lib/id.ts`
  - Server actions: `app/[orgSlug]/settings/waivers/actions.ts` and `app/[orgSlug]/waiver/actions.ts`
  - Pages: `app/[orgSlug]/settings/waivers/page.tsx` and `app/[orgSlug]/waiver/page.tsx`
  - Email template: `packages/email/src/templates/waiver-confirmation.tsx`
  - Tests: `__tests__/waivers/waiver-templates.test.ts`, `waiver-signing.test.ts`

**User:** A. Exactly right. Same structure as everything else.

**Q26: Query pattern for waiver status in customer list — subquery vs separate query?**
- **(A) SQL subquery in the existing `listCustomers` function (Recommended)** — adds waiver status as a derived column. Single query, no N+1. Drizzle supports subqueries via `sql` template.
- **(B) Separate query + merge in JS** — two DB round trips, merge logic.

**User:** A. Subquery. Keep it in one query.

---

## Domain 10: Phased Build Plan

**Q27: How should we phase the build?**
- **(A) Three phases: (1) schema + template CRUD, (2) public signing page + customer integration, (3) UI badges + filtering + coverage stat (Recommended)** — each phase delivers a testable vertical slice. Phase 1 is the foundation. Phase 2 is the core customer-facing feature. Phase 3 is the staff-facing integration.
- **(B) Two phases: backend then frontend** — horizontal slices, harder to test end-to-end.
- **(C) One big phase** — too large for meaningful checkpoints.

**User:** A. Three phases. Each one is a meaningful deliverable.

**Q28: Phase 1 scope — just schema and template CRUD?**
- **(A) Schema for both tables + template CRUD UI + permissions + feature flag + tests (Recommended)** — delivers the complete admin setup flow. Manager can create, preview, and publish a template. Includes the "Waivers" settings tab.
- **(B) Schema only, no UI** — not a useful deliverable.

**User:** A. Schema + CRUD + permissions + tests. Manager can set up everything by end of phase 1.

**Q29: Phase 2 — the signing page is the core deliverable. Should customer auto-creation be in this phase or phase 3?**
- **(A) Include customer creation in phase 2 — signing without customer records is incomplete (Recommended)** — the PRD says "signing a waiver IS customer intake." Can't split them.
- **(B) Defer customer creation to phase 3** — signing would create orphaned waiver records.

**User:** A. Customer creation is inseparable from signing.

**Q30: Phase 3 — UI integration into the existing customers page?**
- **(A) Waiver status badge in customer table, filter by waiver status, coverage stat, email confirmation (Recommended)** — the staff-facing layer. Badge, filter, coverage count.
- **(B) Include email in phase 2** — could, but keeping phase 2 focused on the signing flow makes it cleaner.

**User:** Actually, let's put email confirmation in phase 2. When someone signs, they should get the email immediately. Phase 3 is just the dashboard/staff-facing UI.

**Assistant:** Updated. Email confirmation moves to phase 2.

**Q31: Any concerns about build ordering or dependencies between phases?**

**User:** No. Phase 1 has no external dependencies. Phase 2 depends on phase 1's schema and template data. Phase 3 depends on phase 2's waiver data. Clean chain.

---

**Assistant:** All 10 domains are resolved. No remaining sub-questions. I'll produce the design document now.
