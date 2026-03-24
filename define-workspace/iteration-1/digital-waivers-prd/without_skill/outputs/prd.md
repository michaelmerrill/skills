# Product Requirements Document: Digital Waivers

## Overview

| Field | Value |
|---|---|
| Feature | Digital Waivers |
| Status | Draft |
| Author | Assistant |
| Date | 2026-03-24 |
| Target timeline | ~2-3 weeks |
| Stakeholders | Range customers, front-desk staff, managers/owners |

## Problem Statement

Shooting ranges currently rely on paper waivers, which are slow to process at check-in, difficult to search and retrieve, prone to loss, and create compliance risk when records cannot be located. Front-desk staff waste time on manual data entry and filing. There is no reliable way to verify whether a returning customer has a current, valid waiver on file.

## Goals

1. Eliminate paper waivers entirely for participating ranges.
2. Reduce check-in friction -- staff can verify waiver status in seconds.
3. Provide legally defensible electronic signatures with full audit metadata.
4. Support the minor/guardian signing flow that ranges require.
5. Give operators control over waiver content, versioning, and expiration policies.

## Non-Goals (Out of Scope)

- Automated reminder emails for expiring waivers
- Kiosk mode / dedicated kiosk hardware support
- Payment collection during the waiver flow
- Analytics dashboards for waiver completion rates
- Third-party e-signature provider integration (DocuSign, etc.)
- Blocking check-in or access based on waiver status (future access-control feature)

---

## Personas

### Range Customer (Signer)
Walks in or receives a text link. Needs to read, understand, and sign a waiver quickly on their phone or a handed tablet. May be signing for themselves or as a guardian for minors.

### Front-Desk Staff
Looks up customers, checks waiver status, sends signing links, and occasionally voids waivers. Needs clear status indicators and quick actions.

### Manager / Owner
Creates and manages waiver templates, publishes new versions, configures expiration policies. Needs confidence that legal requirements are met and records are retrievable.

---

## Functional Requirements

### FR-1: Waiver Template Management

**FR-1.1: Template CRUD**
- Operators create waiver templates scoped to their organization.
- Each template has: name, content body, expiration policy, minor-age-cutoff, and status (draft/published/archived).
- Templates are organization-wide (not per-location).

**FR-1.2: Content Editor**
- Basic rich-text editor supporting: headings, bold, italic, numbered lists, bulleted lists.
- Content must render cleanly on mobile viewports (320px+).
- Operators typically paste legal text from external counsel.

**FR-1.3: Draft/Publish Workflow**
- New templates start as drafts. Drafts are not visible to customers.
- Publishing a template makes it available for signing.
- Permissions: owners and admins can create/edit drafts. Only owners can publish.
- Existing permission model already defines `waiver_template: [create, read, update, publish]`.

**FR-1.4: Template Versioning**
- Each publish creates an immutable version snapshot (version number, content, published timestamp).
- When updating a published template, the operator chooses:
  - **Minor change** (typo fix): existing signed waivers remain valid under the old version.
  - **Material change**: existing signed waivers for the old version are flagged, and customers are prompted to re-sign the new version. The old signed waivers remain on record but are marked as "superseded."
- Signed waivers always reference the specific version they were signed against.

**FR-1.5: Archiving**
- Operators can archive a template to remove it from the active list. Archived templates cannot be signed but all historical signed waivers remain accessible.

### FR-2: Signing Flow

**FR-2.1: Public Signing Page**
- Each published template has a shareable public URL: `https://{orgSlug}.getrangeops.com/waiver/{templateId}`.
- No authentication required to access the signing page.
- The page displays the waiver content and a signing form.

**FR-2.2: Customer-Specific Links**
- Staff can generate a customer-specific signing link that pre-fills name, email, and date of birth from the customer record.
- URL includes a short-lived token (e.g., 24-hour expiry) to authorize pre-fill without authentication.

**FR-2.3: Anonymous / Generic Links**
- A generic link (suitable for QR codes, lobby signage) shows a blank form.
- Signer enters: first name, last name, email, date of birth.
- On submission, the system matches or creates a customer record (match on org + email).

**FR-2.4: Signer Agreement**
- Signer must scroll through or view the full waiver text.
- Signer checks an explicit agreement checkbox (e.g., "I have read and agree to the terms above").
- Agreement checkbox is required before signature capture is enabled.

**FR-2.5: Signature Capture**
- Full-screen-capable drawn signature canvas (touch and mouse compatible).
- Clear and redo controls.
- Signature is captured as a PNG image and stored.

**FR-2.6: Audit Metadata**
- On submission, the system records: signer IP address, user agent string, timestamp (UTC), and the template version ID.
- This metadata is stored immutably alongside the signed waiver.

**FR-2.7: Confirmation**
- After successful submission, the signer sees a confirmation screen with: "Waiver signed successfully," the waiver name, and the date.

### FR-3: Minor / Guardian Signing

**FR-3.1: Age Determination**
- The system compares the signer's date of birth against the template's minor-age-cutoff (configurable per org, default 18).
- If the signer is under the cutoff, the flow switches to guardian mode.

**FR-3.2: Guardian Flow**
- Guardian enters their own information: full name, date of birth, email, phone, relationship to minor (parent/legal guardian).
- Guardian then enters the minor's information: full name, date of birth.
- Guardian can add multiple minors in one session (add another minor button).
- Guardian draws one signature that applies to all listed minors.

**FR-3.3: Record Linkage**
- Each minor gets their own signed-waiver record linked to the guardian's record.
- Guardian info is stored on each minor's waiver record for retrieval.
- Minors are matched or created as customer records (match on org + name + DOB if no email).

### FR-4: Status Tracking & Expiration

**FR-4.1: Waiver Statuses**
- `signed` -- active, valid waiver on file.
- `expired` -- past the template's expiration period.
- `voided` -- manually invalidated by an admin/owner.
- `superseded` -- a material template change flagged this version as requiring re-sign.

**FR-4.2: Expiration Policy**
- Configurable per template: number of days from signing date, or "never expires."
- Default: 365 days.
- Expiration is evaluated at read time (no background job needed for MVP). A waiver is expired if `signedAt + expirationDays < now`.

**FR-4.3: Customer Profile Integration**
- The customer detail page displays waiver status prominently: a badge showing "Waiver Current," "Waiver Expired," "No Waiver," etc.
- Clicking the badge opens a list of all waiver records for that customer.

**FR-4.4: Customer List Integration**
- The customer list/table includes a waiver status column (icon or badge).
- Filterable by waiver status (current, expired, none).

**FR-4.5: Void Waivers**
- Admins and owners can void a signed waiver with a required reason.
- Voiding is a soft operation -- the record persists with status changed to `voided`, void reason, and voided-by user ID.

### FR-5: Waiver Record Management

**FR-5.1: View Signed Waiver**
- Staff can view the complete signed waiver: full template text (as of the signed version), signer info, signature image, and audit metadata.

**FR-5.2: PDF Download**
- Staff can download a PDF of any signed waiver containing: organization name/logo, waiver title and version, full waiver text, signer name/email/DOB, signature image, signing timestamp, and audit metadata (IP, user agent).

**FR-5.3: Waiver List**
- Staff can view a list of all signed waivers for the organization, filterable by: status, template, date range, customer name/email.

---

## Data Model

### New Tables

**`waiver_template`**
| Column | Type | Notes |
|---|---|---|
| id | text (PK) | prefix: `wtm` |
| organization_id | text (FK -> organization) | |
| name | text | Template display name |
| status | enum: draft, published, archived | |
| minor_age_cutoff | integer | Default 18 |
| expiration_days | integer | Null = never expires, default 365 |
| created_by_user_id | text (FK -> user) | |
| metadata | jsonb | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**`waiver_template_version`**
| Column | Type | Notes |
|---|---|---|
| id | text (PK) | prefix: `wtv` |
| template_id | text (FK -> waiver_template) | |
| organization_id | text (FK -> organization) | |
| version_number | integer | Auto-incremented per template |
| content | text | Rich text / markdown content |
| is_material_change | boolean | If true, supersedes prior signed waivers |
| published_at | timestamptz | |
| published_by_user_id | text (FK -> user) | |
| created_at | timestamptz | |

**`signed_waiver`**
| Column | Type | Notes |
|---|---|---|
| id | text (PK) | prefix: `swv` |
| organization_id | text (FK -> organization) | |
| template_id | text (FK -> waiver_template) | |
| template_version_id | text (FK -> waiver_template_version) | |
| customer_id | text (FK -> customer) | The signer (or minor) |
| guardian_customer_id | text (FK -> customer, nullable) | If signed by guardian |
| guardian_name | text (nullable) | Snapshot |
| guardian_relationship | text (nullable) | e.g., "parent", "legal guardian" |
| status | enum: signed, expired, voided, superseded | |
| signer_first_name | text | Snapshot at time of signing |
| signer_last_name | text | Snapshot |
| signer_email | text | Snapshot |
| signer_date_of_birth | date | |
| signature_image_url | text | S3/R2 path to PNG |
| signed_at | timestamptz | |
| expires_at | timestamptz (nullable) | Computed: signed_at + expiration_days |
| ip_address | text | |
| user_agent | text | |
| voided_at | timestamptz (nullable) | |
| voided_by_user_id | text (nullable) | |
| void_reason | text (nullable) | |
| metadata | jsonb | |
| created_at | timestamptz | |

**`waiver_signing_token`**
| Column | Type | Notes |
|---|---|---|
| id | text (PK) | prefix: `wst` |
| organization_id | text (FK -> organization) | |
| template_id | text (FK -> waiver_template) | |
| customer_id | text (FK -> customer, nullable) | Null for generic links |
| token | text (unique) | Short random token |
| expires_at | timestamptz | Default: 24 hours from creation |
| used_at | timestamptz (nullable) | |
| created_at | timestamptz | |

### ID Prefixes to Add

| Model | Prefix |
|---|---|
| waiverTemplate | `wtm` |
| waiverTemplateVersion | `wtv` |
| signedWaiver | `swv` |
| waiverSigningToken | `wst` |

### Schema Relationships
- `waiver_template` -> `organization` (many-to-one)
- `waiver_template_version` -> `waiver_template` (many-to-one)
- `signed_waiver` -> `customer` (many-to-one, signer)
- `signed_waiver` -> `customer` (many-to-one, guardian, nullable)
- `signed_waiver` -> `waiver_template_version` (many-to-one)

---

## API / Actions

Following the codebase's Effect-based action pattern:

| Action | Inputs | Permission |
|---|---|---|
| `createWaiverTemplate` | name, content, expirationDays, minorAgeCutoff | waiver_template:create |
| `updateWaiverTemplate` | templateId, name?, content?, expirationDays?, minorAgeCutoff? | waiver_template:update |
| `publishWaiverTemplate` | templateId, isMaterialChange | waiver_template:publish |
| `archiveWaiverTemplate` | templateId | waiver_template:update |
| `getWaiverTemplate` | templateId | waiver_template:read |
| `listWaiverTemplates` | orgId, status? | waiver_template:read |
| `generateSigningLink` | templateId, customerId? | waiver:create |
| `submitSignedWaiver` | token, signerInfo, signatureImage, guardianInfo?, minors? | Public (token-authenticated) |
| `getSignedWaiver` | waiverId | waiver:read |
| `listSignedWaivers` | orgId, filters | waiver:list |
| `voidSignedWaiver` | waiverId, reason | waiver:create (admin+) |
| `downloadWaiverPdf` | waiverId | waiver:read |
| `getCustomerWaiverStatus` | customerId | waiver:read |

---

## UI Screens

### Staff-Facing (within `[orgSlug]` tenant portal)

1. **Waiver Templates list** (`/settings/waivers`) -- table of templates with status badges, create button.
2. **Template editor** (`/settings/waivers/[templateId]`) -- name, content editor, expiration config, minor age cutoff, publish button.
3. **Template version history** -- list of versions with diff indicators.
4. **Customer profile waiver section** -- badge + expandable waiver list on customer detail page.
5. **Customer list waiver column** -- status icon in the customers data table.
6. **Signed waiver detail** -- full text, signature image, audit info, void button.
7. **Organization waiver list** (`/waivers`) -- filterable table of all signed waivers.

### Customer-Facing (public)

8. **Signing page** (`/waiver/{templateId}?token=...`) -- waiver text, signer form, agreement checkbox, signature canvas, submit.
9. **Guardian signing page** -- same as above with guardian info fields and add-minor flow.
10. **Confirmation page** -- success message after signing.

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Signing page load time | < 2s on 3G mobile |
| Signature image storage | S3-compatible object store (R2 recommended given Cloudflare tunnel setup) |
| PDF generation | Server-side, on-demand |
| Signing page accessibility | WCAG 2.1 AA |
| Signature canvas | Touch + mouse, minimum 300x150px capture area |
| Data retention | Signed waivers retained indefinitely (legal requirement) |
| Multi-tenant isolation | All queries scoped by organization_id, enforced at query layer |

---

## Rollout Plan

### Phase 1 (Week 1): Foundation
- Database schema + migrations
- Waiver template CRUD + draft/publish workflow
- Template versioning

### Phase 2 (Week 2): Signing Flow
- Public signing page with signature canvas
- Customer-specific and generic signing links
- Audit metadata capture
- Minor/guardian flow
- Customer record matching/creation

### Phase 3 (Week 3): Integration & Polish
- Customer profile waiver status badges
- Customer list waiver column
- Signed waiver viewer + PDF download
- Void waiver flow
- Organization-wide signed waiver list

---

## Open Questions

1. **Signature image storage**: Confirm use of Cloudflare R2 vs. other S3-compatible store. Need to check if the project already has object storage configured.
2. **PDF generation library**: Evaluate options (e.g., `@react-pdf/renderer`, `puppeteer`, or a lightweight approach). Should align with the existing stack (Bun runtime, serverless deployment).
3. **SMS delivery for signing links**: The scope mentions sending links via text. Does the platform have SMS infrastructure, or is this a copy-link-to-clipboard flow for MVP? The email package exists but no SMS equivalent was found.
4. **Customer matching logic for anonymous signers**: Need to define exact matching rules -- email-only match, or name+DOB fallback for minors? What happens on a near-match?
5. **Template content format**: Rich text stored as HTML or Markdown? Markdown is simpler to store and render but may limit formatting.
