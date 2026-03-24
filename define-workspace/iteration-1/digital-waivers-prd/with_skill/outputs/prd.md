# PRD: Digital Waivers

> Product requirements for digital waiver signing and management (scope: [digital-waivers-scope.md])
> Generated from define interview on 2026-03-24

## Problem Statement

Every shooting range customer must sign a liability waiver before using the range. Paper waivers create two critical problems: (1) slow, friction-heavy check-in that frustrates customers and staff during peak hours, and (2) unreliable record-keeping that makes it difficult to locate signed waivers, prove compliance, and defend against liability claims. Without digital waivers, RangeOps cannot support the most fundamental daily workflow at a range.

## Target Users

### Range Manager
- **Who**: Organization owners and admins who create and maintain waiver templates
- **Current behavior**: Draft waiver language in Word or Google Docs, print and stack at front desk
- **Key need**: Create and publish a professional waiver template that automatically captures legally defensible signatures
- **Usage frequency**: Infrequent -- set up once, update occasionally (new legal language, annual review)

### Front-Desk Staff
- **Who**: Any staff member (owner, admin, or member role) working the check-in counter
- **Current behavior**: Ask customer to sign paper, manually file it, visually scan paper stack to check returning customers
- **Key need**: Instantly see whether a customer has a valid waiver at check-in -- no searching, no guessing
- **Usage frequency**: Dozens of times daily during operating hours

### Range Customer
- **Who**: All range visitors -- walk-ins, members, guests, minors with guardians. No RangeOps account required
- **Current behavior**: Fill out a paper form at the counter, wait in line while others do the same
- **Key need**: Sign the waiver fast on their phone so they can get to the range
- **Usage frequency**: Once per expiration period (typically annual)

### Guardian
- **Who**: Parent or legal guardian accompanying a minor (under 18) to the range
- **Current behavior**: Sign the paper waiver for themselves and write in the minor's information
- **Key need**: Sign a single waiver that covers themselves and identifies the minor they're responsible for
- **Usage frequency**: Once per expiration period per minor

## User Stories

### Create Waiver Template
- **As a** range manager, **I want** to create a waiver template with formatted legal text and an expiration period, **so that** customers sign a professional document and I know when re-signing is needed
- **Acceptance criteria**:
  - [ ] Manager navigates to Settings > Waivers
  - [ ] Creates a new template with name, rich text body (headers, bold, lists, paragraphs), and expiration period in days (default: 365)
  - [ ] Template saves in draft state
  - [ ] Manager can preview the template as a customer would see it
  - [ ] Manager publishes the template, making it available on the public signing page
  - [ ] Only one template can be active per organization at a time
  - [ ] Publishing a new template does not invalidate previously signed waivers

### Edit and Republish Template
- **As a** range manager, **I want** to update waiver language and publish a new version, **so that** new signers see the latest terms without affecting existing signed waivers
- **Acceptance criteria**:
  - [ ] Manager can edit a published template, which creates a new draft version
  - [ ] Original published version remains active until new version is published
  - [ ] Publishing the new version replaces the active template
  - [ ] Previously signed waivers remain linked to the version they were signed under

### Sign Waiver (Adult)
- **As a** range customer, **I want** to sign the waiver on my phone before or at arrival, **so that** I can skip paperwork and get to the range faster
- **Acceptance criteria**:
  - [ ] Customer accesses public URL: {org-slug}.rangeops.com/waiver
  - [ ] Page shows organization name and logo (if set) with clean, mobile-optimized layout
  - [ ] Customer enters: first name, last name, email, phone, date of birth
  - [ ] System validates age (18+ required for self-signing)
  - [ ] Customer reads the full waiver text
  - [ ] Customer checks "I have read and agree to the terms above"
  - [ ] Customer types their full legal name as e-signature
  - [ ] Customer submits; sees confirmation screen with name, date signed, and expiration date
  - [ ] Confirmation screen is presentable to staff ("show this at check-in")
  - [ ] Customer receives email confirmation with signed date and expiration date

### Sign Waiver (Guardian for Minor)
- **As a** guardian, **I want** to sign the waiver on behalf of my minor child, **so that** they can use the range under my legal responsibility
- **Acceptance criteria**:
  - [ ] Guardian starts the standard signing flow and enters their own information
  - [ ] Guardian indicates they are signing for a minor
  - [ ] Guardian provides the minor's first name, last name, and date of birth
  - [ ] System validates minor is under 18 and guardian is 18+
  - [ ] Guardian signs with their own name on behalf of the minor
  - [ ] Signed waiver records both guardian and minor information
  - [ ] Both guardian and minor appear in the customer list (if not already present)

### Check Waiver Status at Check-In
- **As** front-desk staff, **I want** to see a customer's waiver status at a glance in the customer list, **so that** I can quickly determine if they need to sign before entering the range
- **Acceptance criteria**:
  - [ ] Customer list table displays a waiver status badge for each customer
  - [ ] Three states: "Signed" (green/default -- valid, not expired), "Expired" (yellow/warning -- was signed, past expiration), "Not Signed" (gray/neutral -- no waiver on file)
  - [ ] Badge updates in real time as waivers are signed or expire
  - [ ] Staff can filter the customer list by waiver status

### View Waiver Coverage
- **As a** range manager, **I want** to see what percentage of my active customers have valid waivers, **so that** I know my compliance posture at a glance
- **Acceptance criteria**:
  - [ ] Customers page header shows summary: "X of Y active customers have valid waivers" (or percentage)
  - [ ] Count includes only customers with "active" status
  - [ ] Metric reflects current waiver state (accounts for expirations)

### Auto-Link and Create Customers
- **As a** range operator, **I want** waiver signers to automatically appear in my customer list, **so that** signing a waiver IS customer intake for walk-ins
- **Acceptance criteria**:
  - [ ] When a customer signs and their email matches an existing customer record in the organization, the waiver links to that customer
  - [ ] When no matching customer exists, a new customer record is created with status "lead" and the info provided during signing
  - [ ] Email match is case-insensitive
  - [ ] Created customer is assigned to the organization (not a specific location)

## Functional Requirements

### Template Management
- FR-1: Waiver template CRUD accessible under Settings > Waivers (owner and admin roles only)
- FR-2: Template fields: name (text), body (rich text supporting headers, bold, italic, lists, paragraphs), expiration period (integer, days, default 365)
- FR-3: Template lifecycle: draft -> published. Only one published template per organization
- FR-4: Editing a published template creates a new draft; original stays active until new version is published
- FR-5: Template preview shows the waiver as a customer would see it on the signing page
- FR-6: Member role can view the active template (read-only)

### Public Signing Page
- FR-7: Public URL at {org-slug}.rangeops.com/waiver -- no authentication required
- FR-8: Page displays organization name and logo (from organization settings branding) if available
- FR-9: If no published template exists, show friendly "Waivers are not yet available for [org name]" message
- FR-10: Signing form collects: first name, last name, email, phone number, date of birth
- FR-11: Date of birth validates signer is 18+ for self-signing
- FR-12: Waiver text displayed in full, scrollable, formatted as authored in the template
- FR-13: Consent mechanism: checkbox "I have read and agree to the terms above" + typed full legal name
- FR-14: Both checkbox and typed name required before submission
- FR-15: On submission, capture audit metadata: timestamp, IP address, user agent
- FR-16: Confirmation screen displays: signer name, date signed, expiration date, "Show this to staff" presentation
- FR-17: Email confirmation sent via Resend with signed date and expiration date

### Minor/Guardian Signing
- FR-18: Guardian toggle on signing form: "I am signing on behalf of a minor"
- FR-19: When toggled, additional fields appear: minor's first name, last name, date of birth
- FR-20: Validates minor is under 18 and guardian is 18+
- FR-21: Guardian signs with their own name; waiver record stores both guardian and minor information
- FR-22: Creates customer records for both guardian and minor (if not already existing)

### Customer Integration
- FR-23: Waiver signing auto-matches by email (case-insensitive) to existing customer in the organization
- FR-24: No match creates a new customer record with status "lead," populated from signing form fields
- FR-25: Waiver status badge displayed in the customers table: Signed (valid), Expired, Not Signed
- FR-26: Waiver status filterable in the customers table filter bar
- FR-27: Customers page shows waiver coverage summary: "X of Y active customers have valid waivers"

### Expiration
- FR-28: Waiver expiration calculated from signing date + template expiration period (in days)
- FR-29: Expired waivers automatically reflect "Expired" status -- no manual intervention
- FR-30: Re-signing creates a new waiver record; does not modify the previous one
- FR-31: If a customer has multiple signed waivers, the most recent valid one determines their status

## Non-Functional Requirements

- NFR-1: Signing page is mobile-first responsive, optimized for phone screens (320px+), functional on desktop
- NFR-2: Signing page meets WCAG 2.1 AA: sufficient contrast, keyboard navigable, screen reader compatible
- NFR-3: Signing page loads in under 3 seconds on a 4G mobile connection
- NFR-4: Signed waiver records are retained indefinitely -- no automatic deletion
- NFR-5: All waiver pages are tenant-scoped: data from one organization is never visible to another
- NFR-6: Signing flow works without JavaScript degradation for the core path (form submission)

## Success Metrics

| Metric | Target | Measurement | Timeframe |
|--------|--------|-------------|-----------|
| Digital adoption rate | 80%+ of new customers sign digitally | Signed waivers / new customers per org | 90 days |
| Signing completion rate | 90%+ | Completed submissions / signing page visits | 30 days |
| Average time to sign | Under 2 minutes | Timestamp: page load to submission | 30 days |
| Waiver coverage (active customers) | 70%+ of active customers have valid waiver | Valid waivers / active customers per org | 90 days |
| Template setup rate | 90%+ of active orgs publish a template | Orgs with published template / active orgs | 30 days |

## Scope

**In scope (v1):**
- Waiver template CRUD with draft/publish lifecycle (Settings > Waivers)
- Public, mobile-first waiver signing page at {org-slug}.rangeops.com/waiver
- E-signature: typed legal name + consent checkbox + audit metadata
- Minor/guardian signing (guardian signs, provides minor info)
- Auto-link to existing customer by email; auto-create customer if new
- Waiver status badge in customers table (Signed / Expired / Not Signed)
- Waiver status filter in customers table
- Waiver coverage summary on customers page
- Email confirmation after signing
- One active template per organization
- Template versioning (new version doesn't invalidate old signatures)
- Indefinite waiver record retention

**Out of scope:**
- Automated renewal/expiration reminder emails -- adds email campaign complexity; revisit after core adoption proves out
- Kiosk/shared-tablet mode -- requires session management changes and hardware considerations; defer to v2
- Payment collection during waiver signing -- payment and waiver are separate workflows at ranges
- Waiver analytics or reporting dashboards -- simple coverage stat meets v1 needs; full analytics when demand is clear
- Third-party e-signature integration (DocuSign, etc.) -- typed name + consent is sufficient for range waivers
- Multi-version template diffing -- operators rarely compare versions; build when requested
- Multiple active templates per organization -- one standard waiver covers 95% of ranges
- Per-location template variations -- same waiver applies org-wide for v1
- Multi-language UI -- English UI only; operators can write bilingual content in template body

**Future (conditional):**
- Automated expiration reminders -- trigger: operators request it post-launch, email infrastructure matures
- Kiosk mode -- trigger: operator with dedicated check-in tablets requests it
- Multiple active templates -- trigger: operator demonstrates need for separate firearms rental waiver
- Per-location templates -- trigger: multi-state operator with jurisdiction-specific waiver requirements
- Duplicate customer detection at signing -- trigger: operators report significant duplicate volume

## Dependencies & Constraints

- **Dependency**: Resend email service for confirmation emails. *Status: resolved -- already integrated for invitations and verification*
- **Dependency**: Organization branding (name, logo) for public signing page. *Status: resolved -- organization model has name; logo field exists; branding JSON in org settings*
- **Dependency**: Customer model for auto-link/auto-create. *Status: resolved -- customer schema exists with all needed fields*
- **Constraint**: First public-facing (non-authenticated) page in the platform. *Impact: establishes pattern for tenant-scoped public routes; needs careful URL routing design*
- **Constraint**: Legal review of e-signature approach is pending. *Impact: consent language or audit metadata requirements may evolve; core typed-name + checkbox flow is standard and unlikely to change*
- **Constraint**: No hard deadline, but launch blocker -- beta customers are waiting. *Impact: v1 scope must stay tight*

## Risks & Open Questions

- **Risk**: Legal review may require additional audit metadata or consent language changes. *Mitigation: capture comprehensive audit data (timestamp, IP, user agent) from day one; consent text is configurable in the template*
- **Risk**: Duplicate customer records from waiver signers using different emails. *Mitigation: accept for v1; manual resolution possible; auto-merge tooling is a future item*
- **Risk**: Rich text editor complexity could expand scope. *Mitigation: use a proven rich text component; limit to basic formatting (headers, bold, italic, lists) -- no images, tables, or embeds*
- **Open question**: Should the signed waiver PDF be downloadable by the customer or staff? *Needed by: post-v1. Impact if unresolved: no blockers for v1; printable view from confirmation screen is sufficient*
- **Open question**: Exact data retention policy for signed waivers (indefinite vs. configurable). *Needed by: before scale. Impact if unresolved: defaulting to indefinite is the safe choice; storage costs are negligible at launch scale*

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| explore | 2026-03-24 | Go | Launch blocker. Permissions pre-stubbed. First public-facing page. |
| define | 2026-03-24 | Ready | 27 questions across 8 domains. One active template per org, mobile-first signing, auto-customer creation, three-state waiver badges. |
