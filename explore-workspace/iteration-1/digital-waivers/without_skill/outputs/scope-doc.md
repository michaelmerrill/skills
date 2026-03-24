# Digital Waiver System -- Feature Scope

## Vision

Replace paper waivers with a digital system where customers sign liability waivers on their own device (phone/tablet) before using the range. Waivers are legally binding documents with drawn signatures, version-controlled templates, and long-term immutable storage. Staff see a clear waiver status on every customer and can audit the full signing history.

## Current State of the Codebase

RangeOps is a Next.js 16 / TypeScript / Drizzle ORM / Neon Postgres monorepo with multi-tenant architecture (subdomain-based routing, `organizationId` on every table). Key findings:

- **Permissions already defined.** `permissions.ts` declares `waiver_template` (create, read, update, publish) and `waiver` (create, read, list) with role-based access for owner, admin, and member.
- **No schema, UI, or logic exists.** The waiver feature is greenfield -- no tables, no routes, no components.
- **Customer model is ready.** The `customer` table has all the fields needed (name, email, phone, DOB, location, status). Waivers would link to customers.
- **Entitlements pattern fits.** The existing immutable grant + append-only ledger pattern in `entitlements.ts` is a good precedent for immutable signed waiver records.
- **Email infrastructure exists.** Resend integration is in place for transactional emails (verification, invitations). Waiver request emails can use the same pipeline.
- **ID system supports extension.** The `id.ts` prefix system needs new entries for waiver entities but is trivially extensible.
- **Multi-tenant FKs are consistent.** Every table uses compound foreign keys with `organizationId`. Waiver tables should follow the same pattern.

## Proposed Scope (v1)

### Core Entities

1. **Waiver Template** -- Rich text document owned by an organization. Supports versioning (new version = new row, old versions are immutable). Assignable to locations and/or specific offerings. Has a `status` (draft, published, archived).

2. **Waiver Template Version** -- Immutable snapshot of template content at a point in time. Contains the full legal text. Never modified after creation.

3. **Signed Waiver** -- Immutable record linking a customer to a specific template version. Stores: signature image (base64 or S3 URL), IP address, user agent, timestamp, the exact template version text at time of signing. For minors: guardian name, relationship, guardian signature.

4. **Waiver Requirement** -- Join table linking waiver templates to locations and/or offerings, defining which waivers are required in which contexts.

### Customer-Facing Flow

- **Pre-visit:** When a booking is created (future feature) or manually triggered by staff, send an email/SMS with a tokenized link to sign waivers.
- **Walk-in:** Customer scans a QR code at the front desk. The QR code encodes a URL to the org's public waiver signing page.
- **Signing page:** Mobile-optimized, unauthenticated (token-based access). Shows required waivers, captures drawn signature via HTML5 canvas, collects name/email/DOB. For minors, prompts for guardian co-signature.
- **Confirmation:** After signing, shows confirmation screen. Optionally emails a copy to the customer.

### Staff-Facing Flow

- **Customer list/detail:** Green/red waiver status indicator. Clicking shows waiver history (all signed waivers, dates, versions, signature images).
- **Template management:** CRUD for waiver templates under org settings. Version history. Publish/archive workflow.
- **Bulk operations:** Ability to send waiver requests to multiple customers (e.g., before a membership renewal wave).

### Access Gating

- Waiver status becomes a check in the customer workflow. If a required waiver is missing or expired, staff sees a block indicator. Integration point for future check-in/lane-assignment features.
- Annual expiration is configurable per template (default 12 months).

## Technical Design Sketch

### New Schema Files

`apps/web/src/lib/db/schema/waivers.ts`:

- `waiver_template` -- id, organizationId, name, description, status (draft/published/archived), expirationDays (default 365), createdAt, updatedAt
- `waiver_template_version` -- id, organizationId, templateId, versionNumber, content (text/HTML), publishedAt, createdAt (immutable, no updatedAt)
- `waiver_requirement` -- id, organizationId, templateId, locationId (nullable), offeringId (nullable), createdAt
- `signed_waiver` -- id, organizationId, customerId, templateVersionId, signatureData (text -- base64 PNG or S3 URL), signerName, signerEmail, signerDob, signerIpAddress, signerUserAgent, signedAt, expiresAt, guardianName, guardianRelationship, guardianSignatureData, metadata (jsonb), createdAt (immutable, no updatedAt)

### New ID Prefixes

- `waiverTemplate: "wtm"`
- `waiverTemplateVersion: "wtv"`
- `waiverRequirement: "wrq"`
- `signedWaiver: "swv"`

### New Routes

- `[orgSlug]/settings/waivers` -- Template management (admin)
- `[orgSlug]/settings/waivers/[templateId]` -- Template detail/editor
- `[orgSlug]/customers` -- Add waiver status column
- `w/[token]` -- Public signing page (unauthenticated, tokenized)
- `api/waivers/sign` -- POST endpoint for waiver submission

### Signature Capture

HTML5 Canvas-based drawing pad. Libraries like `signature_pad` (MIT, 30KB) handle touch/mouse input and export to PNG base64. No new npm dependency strictly required -- can be built with raw canvas API -- but `signature_pad` is battle-tested and small.

### Storage

For v1, store signature images as base64 in the database (they're small -- typically 10-30KB per signature). For scale, move to S3/R2 with presigned URLs in a later iteration.

### Data Retention

- Signed waivers must never be hard-deleted.
- Implement a `retentionExpiresAt` computed field: `expiresAt + 7 years` (or `signerDob + 25 years` for minors, whichever is later).
- Soft-delete/archival after retention period (future concern).

## Feasibility Assessment

| Factor | Assessment |
|--------|-----------|
| Technical complexity | **Medium.** All primitives exist (auth, multi-tenant DB, email, permissions). Signature capture is well-solved. No external service dependencies. |
| Schema impact | **Low.** New tables only; no changes to existing schema. |
| UI effort | **Medium-High.** Mobile-optimized signing page with canvas, template editor, customer status indicators, waiver history views. |
| Legal/compliance | **Medium.** Immutable records and drawn signatures satisfy standard range liability requirements. Consult lawyer on specific state requirements. |
| Integration points | **Low for v1.** Customer table already exists. Future integration with check-in/booking systems is additive, not blocking. |
| Performance risk | **Low.** Waivers are infrequent operations (once per customer per year). No real-time or high-throughput concerns. |

## Risks

1. **Legal sufficiency.** Digital signatures on liability waivers must be legally defensible. The ESIGN Act (federal) and UETA (most states) support electronic signatures, but specific state requirements for shooting ranges may vary. **Mitigation:** Review with legal counsel before shipping. Design the schema to capture all metadata a court would want (IP, timestamp, user agent, exact text signed).

2. **Minor consent complexity.** Parent/guardian flows vary by state. Some require the guardian to physically be present, which a digital system can't fully enforce. **Mitigation:** v1 captures guardian information and signature. Physical presence verification remains a staff responsibility, same as today with paper.

3. **Signature image storage growth.** At scale (thousands of customers x annual renewals x multiple waivers), base64 in Postgres could add up. **Mitigation:** Acceptable for v1 with the current customer base. Plan migration to object storage before hitting ~100K signed records.

4. **Template editing UX.** Legal documents need precise formatting. A basic textarea may not satisfy range operators who want headers, bold text, numbered lists. **Mitigation:** Start with Markdown rendering. Rich text editor is a future enhancement.

5. **SMS delivery.** Pre-visit waiver links via SMS require a messaging provider (Twilio, etc.) not currently integrated. **Mitigation:** v1 uses email only. SMS is a future add-on.

## Out of Scope for v1

- Kiosk/iPad dedicated mode
- SMS delivery of waiver links
- Rich text template editor (Markdown is sufficient)
- Integration with booking/check-in system (not built yet)
- Offline signing
- Object storage for signatures (use DB for now)
- Automated enforcement of waiver gating (staff-visible status only; hard blocks come with check-in system)

## Effort Estimate

| Component | Estimate |
|-----------|----------|
| Schema + migrations | 1-2 days |
| Template CRUD (settings UI + server actions) | 2-3 days |
| Public signing page (mobile UI + signature capture) | 3-4 days |
| Customer waiver status (list + detail views) | 1-2 days |
| Email integration (waiver request emails) | 1 day |
| QR code generation | 0.5 days |
| Minor/guardian flow | 1-2 days |
| Testing | 2-3 days |
| **Total** | **~12-17 days** |

## Recommendation

**Proceed.** This feature is clearly on the product roadmap (permissions are already defined), has strong user demand (replacing a manual paper process), fits cleanly into the existing architecture, and carries manageable technical risk. The codebase conventions (immutable records, multi-tenant FKs, role-based permissions) provide a solid foundation. No architectural changes or new external services are required for v1.

Start with the schema and template management, then build the public signing page, then wire up the customer-facing status indicators. This ordering lets range operators start creating their templates while the customer-facing flow is being built.
