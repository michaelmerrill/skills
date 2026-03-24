# Digital Waivers — Technical Design

## 1. Database Schema

### New ID Prefixes

Add to `apps/web/src/lib/id.ts`:

```ts
waiverTemplate: "wtl",
waiverTemplateVersion: "wtv",
signedWaiver: "swv",
waiverSigningToken: "wst",
```

### Enums

```ts
export const waiverTemplateStatusEnum = pgEnum("waiver_template_status", [
  "draft",
  "published",
  "archived",
]);

export const waiverSectionTypeEnum = pgEnum("waiver_section_type", [
  "heading",
  "paragraph",
  "acknowledgment",  // checkbox the signer must check
  "signature_field",
]);

export const signatureTypeEnum = pgEnum("signature_type", [
  "typed",
  "drawn",
]);

export const waiverStatusEnum = pgEnum("waiver_status", [
  "active",
  "expired",
  "revoked",
]);
```

### waiver_template

Mutable draft. One per org per logical waiver.

```ts
export const waiverTemplate = pgTable(
  "waiver_template",
  {
    id: text("id").primaryKey().$defaultFn(() => createId("waiverTemplate")),
    organizationId: text("organization_id").notNull().references(() => organization.id),
    name: text("name").notNull(),
    description: text("description"),
    status: waiverTemplateStatusEnum("status").notNull().default("draft"),
    sections: jsonb("sections").$type<WaiverSection[]>().notNull().default([]),
    expirationDays: integer("expiration_days").notNull().default(365),
    isLocationScoped: boolean("is_location_scoped").notNull().default(false),
    currentVersionId: text("current_version_id"), // FK to latest published version
    createdByUserId: text("created_by_user_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    unique("waiver_template_id_organization_id_uidx").on(t.id, t.organizationId),
    index("waiver_template_organization_id_idx").on(t.organizationId),
    index("waiver_template_organization_id_status_idx").on(t.organizationId, t.status),
  ],
);
```

### WaiverSection type (TypeScript, not a DB table)

```ts
type WaiverSection = {
  id: string;           // nanoid for client-side keying
  type: "heading" | "paragraph" | "acknowledgment" | "signature_field";
  content: string;      // the text content / label
  required: boolean;    // for acknowledgments: must be checked
  sortOrder: number;
};
```

### waiver_template_version

Immutable snapshot created on publish.

```ts
export const waiverTemplateVersion = pgTable(
  "waiver_template_version",
  {
    id: text("id").primaryKey().$defaultFn(() => createId("waiverTemplateVersion")),
    organizationId: text("organization_id").notNull().references(() => organization.id),
    templateId: text("template_id").notNull(),
    versionNumber: integer("version_number").notNull(),
    name: text("name").notNull(),
    sections: jsonb("sections").$type<WaiverSection[]>().notNull(),
    expirationDays: integer("expiration_days").notNull(),
    publishedByUserId: text("published_by_user_id"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // NO updatedAt — immutable
  },
  (t) => [
    unique("waiver_template_version_id_organization_id_uidx").on(t.id, t.organizationId),
    unique("waiver_template_version_template_id_version_number_uidx").on(t.templateId, t.versionNumber),
    index("waiver_template_version_template_id_idx").on(t.templateId),
    foreignKey({
      name: "waiver_template_version_template_id_organization_id_fk",
      columns: [t.templateId, t.organizationId],
      foreignColumns: [waiverTemplate.id, waiverTemplate.organizationId],
    }),
  ],
);
```

### waiver_template_location

Many-to-many for location-scoped templates.

```ts
export const waiverTemplateLocation = pgTable(
  "waiver_template_location",
  {
    id: text("id").primaryKey().$defaultFn(() => createId("waiverTemplateLocation")),
    organizationId: text("organization_id").notNull().references(() => organization.id),
    templateId: text("template_id").notNull(),
    locationId: text("location_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("waiver_template_location_template_id_location_id_uidx").on(t.templateId, t.locationId),
    index("waiver_template_location_organization_id_idx").on(t.organizationId),
    foreignKey({
      name: "waiver_template_location_template_id_organization_id_fk",
      columns: [t.templateId, t.organizationId],
      foreignColumns: [waiverTemplate.id, waiverTemplate.organizationId],
    }),
    foreignKey({
      name: "waiver_template_location_location_id_organization_id_fk",
      columns: [t.locationId, t.organizationId],
      foreignColumns: [location.id, location.organizationId],
    }),
  ],
);
```

### signed_waiver

The core record of a completed waiver signing.

```ts
export const signedWaiver = pgTable(
  "signed_waiver",
  {
    id: text("id").primaryKey().$defaultFn(() => createId("signedWaiver")),
    organizationId: text("organization_id").notNull().references(() => organization.id),
    templateVersionId: text("template_version_id").notNull(),
    customerId: text("customer_id"), // nullable: may not have a customer record yet at sign time
    signerName: text("signer_name").notNull(),
    signerEmail: text("signer_email").notNull(),
    signerDateOfBirth: date("signer_date_of_birth", { mode: "date" }),
    signatureType: signatureTypeEnum("signature_type").notNull(),
    signatureData: text("signature_data").notNull(), // typed name string OR base64 drawn image
    acknowledgments: jsonb("acknowledgments").$type<Record<string, boolean>>().notNull(), // sectionId -> checked
    minors: jsonb("minors").$type<MinorInfo[]>().notNull().default([]),
    status: waiverStatusEnum("status").notNull().default("active"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    signedAt: timestamp("signed_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedByUserId: text("revoked_by_user_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // NO updatedAt — status changes are discrete (revoke only)
  },
  (t) => [
    unique("signed_waiver_id_organization_id_uidx").on(t.id, t.organizationId),
    index("signed_waiver_organization_id_idx").on(t.organizationId),
    index("signed_waiver_organization_id_customer_id_idx").on(t.organizationId, t.customerId),
    index("signed_waiver_organization_id_signer_email_idx").on(t.organizationId, t.signerEmail),
    index("signed_waiver_organization_id_status_idx").on(t.organizationId, t.status),
    index("signed_waiver_organization_id_expires_at_idx").on(t.organizationId, t.expiresAt),
    index("signed_waiver_template_version_id_idx").on(t.templateVersionId),
    foreignKey({
      name: "signed_waiver_template_version_id_organization_id_fk",
      columns: [t.templateVersionId, t.organizationId],
      foreignColumns: [waiverTemplateVersion.id, waiverTemplateVersion.organizationId],
    }),
    foreignKey({
      name: "signed_waiver_customer_id_organization_id_fk",
      columns: [t.customerId, t.organizationId],
      foreignColumns: [customer.id, customer.organizationId],
    }),
  ],
);
```

### MinorInfo type

```ts
type MinorInfo = {
  name: string;
  dateOfBirth: string; // ISO date string
};
```

### waiver_signing_token

For unauthenticated signing flows (public URL / QR code).

```ts
export const waiverSigningToken = pgTable(
  "waiver_signing_token",
  {
    id: text("id").primaryKey().$defaultFn(() => createId("waiverSigningToken")),
    organizationId: text("organization_id").notNull().references(() => organization.id),
    templateVersionId: text("template_version_id").notNull(),
    token: text("token").notNull().unique(), // crypto random token for the URL
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // link expiry, not waiver expiry
    usedAt: timestamp("used_at", { withTimezone: true }), // set when waiver is signed
    signedWaiverId: text("signed_waiver_id"), // linked after signing
    createdByUserId: text("created_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("waiver_signing_token_token_idx").on(t.token),
    index("waiver_signing_token_organization_id_idx").on(t.organizationId),
    foreignKey({
      name: "waiver_signing_token_template_version_id_organization_id_fk",
      columns: [t.templateVersionId, t.organizationId],
      foreignColumns: [waiverTemplateVersion.id, waiverTemplateVersion.organizationId],
    }),
  ],
);
```

## 2. File Structure

```
apps/web/src/
  lib/
    db/schema/
      waivers.ts                    # All waiver tables, enums, relations
    waivers.ts                      # Effect-based service functions
    validation.ts                   # (add waiver schemas)
    errors.ts                       # (add waiver errors)
    id.ts                           # (add waiver prefixes)
  app/
    [orgSlug]/
      waivers/
        page.tsx                    # Signed waivers list (staff view)
        templates/
          page.tsx                  # Template list
          new/
            page.tsx                # Create template
          [templateId]/
            page.tsx                # Edit template
        [waiverId]/
          page.tsx                  # Signed waiver detail
    sign/
      [token]/
        page.tsx                    # Public signing page (token-based, no auth)
    api/
      waivers/
        kiosk/
          route.ts                  # Kiosk mode API — returns template for signing
  components/
    waivers/
      template-editor.tsx           # Section builder (drag-and-drop sections)
      template-list.tsx             # Template list table
      signing-form.tsx              # The signing experience (sections, checkboxes, signature)
      signature-pad.tsx             # Canvas-based signature component
      signed-waiver-list.tsx        # Staff lookup table
      signed-waiver-detail.tsx      # View a completed waiver
      waiver-status-badge.tsx       # Active/Expired/Revoked badge
      minor-fields.tsx              # Add/remove minors form section
```

## 3. Service Layer

### New Errors (`errors.ts` additions)

```ts
export class WaiverTemplateNotFound extends Data.TaggedError("WaiverTemplateNotFound")<{ templateId: string }> {}
export class WaiverNotFound extends Data.TaggedError("WaiverNotFound")<{ waiverId: string }> {}
export class InvalidSigningToken extends Data.TaggedError("InvalidSigningToken") {}
export class SigningTokenExpired extends Data.TaggedError("SigningTokenExpired") {}
export class TemplateNotPublished extends Data.TaggedError("TemplateNotPublished")<{ templateId: string }> {}
```

### Waiver Service Functions (`lib/waivers.ts`)

All follow the existing Effect pattern (depend on `DbService`, `CurrentSession`):

**Template CRUD:**
- `createWaiverTemplate(data)` — creates a draft template
- `updateWaiverTemplate(data)` — updates draft content/settings
- `publishWaiverTemplate(data)` — snapshots current draft into a new version, bumps version number, sets `currentVersionId`
- `archiveWaiverTemplate(data)` — sets status to archived
- `listWaiverTemplates(data)` — org-scoped, filterable by status
- `getWaiverTemplate(data)` — single template with current version info

**Location Scoping:**
- `setTemplateLocations(data)` — upserts the location assignments for a template

**Signing:**
- `createSigningToken(data)` — generates a token URL for a published template
- `getTemplateByToken(token)` — resolves token to template version (public, no auth)
- `submitSignedWaiver(data)` — validates all required acknowledgments checked, stores signature, computes `expiresAt`, links to customer if email matches
- `getKioskTemplates(orgId)` — returns published templates for kiosk display (no auth)

**Lookup:**
- `listSignedWaivers(data)` — org-scoped, searchable by signer name/email, filterable by status
- `getSignedWaiver(data)` — full detail including template version content
- `getCustomerWaiverStatus(data)` — for a customer, returns all active/expired waivers
- `revokeWaiver(data)` — sets status to revoked, records who and when

### Validation Schemas (`validation.ts` additions)

```ts
const waiverSectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["heading", "paragraph", "acknowledgment", "signature_field"]),
  content: z.string().min(1),
  required: z.boolean(),
  sortOrder: z.number().int().min(0),
});

export const createWaiverTemplateSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(1000).optional(),
  sections: z.array(waiverSectionSchema).min(1),
  expirationDays: z.number().int().min(1).max(3650).default(365),
  isLocationScoped: z.boolean().default(false),
  locationIds: z.array(z.string().min(1)).optional(),
});

export const publishWaiverTemplateSchema = z.object({
  orgId: z.string().min(1),
  templateId: z.string().min(1),
});

export const submitSignedWaiverSchema = z.object({
  orgId: z.string().min(1),
  templateVersionId: z.string().min(1),
  signerName: z.string().trim().min(1).max(200),
  signerEmail: z.string().email(),
  signerDateOfBirth: z.date().optional(),
  signatureType: z.enum(["typed", "drawn"]),
  signatureData: z.string().min(1), // typed name or base64 image
  acknowledgments: z.record(z.string(), z.boolean()),
  minors: z.array(z.object({
    name: z.string().trim().min(1).max(200),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })).default([]),
  signingTokenId: z.string().optional(), // if signed via token
});

export const listSignedWaiversSchema = z.object({
  orgId: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().optional(),
  status: z.enum(["active", "expired", "revoked"]).optional(),
  templateId: z.string().optional(),
  sortBy: z.enum(["signerName", "signedAt", "expiresAt"]).default("signedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
```

## 4. Permissions

Already stubbed in `permissions.ts`:

| Role | waiver_template | waiver |
|------|----------------|--------|
| owner | create, read, update, publish | create, read, list |
| admin | create, read, update | create, read, list |
| member | read | create, read |

No changes needed. The `member` role having `waiver.create` supports the customer self-service signing flow (if they have an account). The `publish` action is owner-only, which is correct — admins can draft but only owners can publish.

## 5. Signing Flows

### Flow A: Public URL (Pre-arrival)

1. Staff selects a published template, clicks "Generate Signing Link"
2. System creates a `waiver_signing_token` with 72-hour expiry
3. Staff gets a URL like `https://sign.rangeops.com/sign/{token}` (or `https://{orgSlug}.rangeops.com/sign/{token}`)
4. Customer opens link on their phone
5. The `/sign/[token]` page fetches the template version via the token (no auth required)
6. Customer fills in name, email, DOB, checks acknowledgments, signs, optionally adds minors
7. `submitSignedWaiver` validates, stores, computes `expiresAt = signedAt + expirationDays`
8. If email matches an existing customer record, `customerId` is linked automatically
9. Token marked as used

### Flow B: Kiosk (Walk-in)

1. Range sets up a tablet at `/[orgSlug]/waivers/kiosk` (or a dedicated kiosk route)
2. The kiosk page shows published templates for that org (filtered by location if applicable)
3. Customer selects a template, fills out the signing form (same component as Flow A)
4. Same `submitSignedWaiver` logic, but no token involved
5. After submission, kiosk resets to template selection for the next customer

### Flow C: Authenticated (Account holder)

1. Logged-in customer navigates to waiver section
2. System pre-fills name/email from their profile
3. Same signing form, but `customerId` is set directly from session

## 6. Routes & Pages

### Staff Pages (authenticated, org-scoped)

| Route | Page | Description |
|-------|------|-------------|
| `/{orgSlug}/waivers` | Signed waiver list | Search/filter signed waivers, status badges |
| `/{orgSlug}/waivers/templates` | Template list | CRUD templates, status filters |
| `/{orgSlug}/waivers/templates/new` | New template | Section builder form |
| `/{orgSlug}/waivers/templates/{id}` | Edit template | Edit sections, publish, manage locations |
| `/{orgSlug}/waivers/{id}` | Waiver detail | View signed waiver, revoke option |

### Public Pages (no auth)

| Route | Page | Description |
|-------|------|-------------|
| `/sign/{token}` | Signing page | Token-resolved signing form |

### Kiosk Page

| Route | Page | Description |
|-------|------|-------------|
| `/{orgSlug}/waivers/kiosk` | Kiosk mode | Full-screen template selection + signing |

## 7. Server Actions

File: `apps/web/src/app/[orgSlug]/waivers/actions.ts`

```ts
// Template actions (authenticated)
createTemplate(formData)
updateTemplate(formData)
publishTemplate(formData)
archiveTemplate(formData)
setTemplateLocations(formData)

// Signing actions
generateSigningLink(formData)     // creates token, returns URL
submitWaiver(formData)            // the signing submission (works for all flows)
revokeWaiver(formData)            // staff revokes a signed waiver
```

Public signing route will use a separate API route handler (`/api/waivers/sign`) rather than server actions, since it needs to work without auth cookies.

## 8. Key Components

### TemplateEditor
- Drag-and-drop section list (heading, paragraph, acknowledgment, signature_field)
- Add/remove/reorder sections
- Mark acknowledgments as required
- Preview mode
- Expiration days setting
- Location scope toggle + location multi-select

### SigningForm
- Renders template sections in order
- Checkboxes for acknowledgments (required ones must be checked)
- Name, email, DOB fields
- Minor fields (add/remove)
- SignaturePad component for drawn signatures
- Typed name fallback
- IP/user agent captured on submit

### SignaturePad
- HTML5 Canvas for touch/mouse drawing
- Clear button
- Exports to base64 PNG
- Responsive sizing for mobile

### SignedWaiverList
- Server-component table (same pattern as CustomersTable)
- Search by signer name/email
- Filter by status (active/expired/revoked)
- Filter by template
- Pagination
- Status badge component

## 9. Customer Linking Strategy

When a waiver is signed, the system attempts to link it to an existing customer:

1. Query `customer` table: `WHERE organizationId = :orgId AND email = :signerEmail`
2. If found, set `signedWaiver.customerId`
3. If not found, optionally create a new customer record with status "lead" (configurable, but default to not auto-creating)

For the customer detail page (future), waivers will be queryable by `customerId` to show "Active Waiver" / "Expired Waiver" / "No Waiver" status.

## 10. Expiration Handling

- `expiresAt` computed at sign time: `signedAt + template.expirationDays days`
- Status is derived: if `status = 'active'` and `expiresAt < now()`, treat as expired
- A scheduled job (cron or Postgres function) can batch-update `status` to `expired` for past-due waivers, but the application layer should always check `expiresAt` as the source of truth
- Staff lookup queries filter on both `status` and `expiresAt`

## 11. Testing Strategy

Following existing patterns (`apps/web/src/__tests__/`):

- **Unit tests** (Vitest): Service functions for template CRUD, publish versioning, waiver submission validation, expiration computation, customer linking logic
- **E2E tests** (Playwright): Template creation flow, signing flow via public URL, kiosk flow, staff lookup
- Focus areas: required acknowledgment enforcement, version immutability, token expiry, minor data capture

## 12. Migration Plan

1. Add ID prefixes to `id.ts`
2. Create `apps/web/src/lib/db/schema/waivers.ts` with all tables
3. Export from `schema/index.ts`
4. Run `bun run db:generate` then `bun run db:migrate`
5. Implement service layer (`lib/waivers.ts`)
6. Add validation schemas
7. Add error types
8. Build template editor components
9. Build signing form components
10. Wire up routes and server actions
11. Add tests
12. Add sidebar navigation item
