# Template CRUD (Service + Settings UI)

> Part of: [design.md](../../../../architect-workspace/iteration-1/digital-waivers-design/with_skill/outputs/design.md)
> Issue: 2 of 6
> Type: HITL

## Blocked by

- [01-waiver-schema.md](./01-waiver-schema.md) — needs `waiverTemplate` table and `waiverTemplateStatusEnum` in schema

## What to build

Build the complete waiver template management capability: Effect-based service functions (`createTemplate`, `updateTemplate`, `publishTemplate`, `getActiveTemplate`, `getTemplatesByOrg`, `deleteTemplate`) in `lib/waivers.ts`, Zod validation schemas, tagged error types, server actions, and the Settings > Waivers tab UI with Tiptap rich text editor, template list, draft/publish/archive lifecycle, and preview modal. Add feature flag gating via `organizationSetting.featureFlags.waivers`. Owner can publish; admin can create/edit but not publish; member sees read-only. Include unit tests for the template lifecycle service functions.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/lib/validation.ts` | Add `createWaiverTemplateSchema`, `updateWaiverTemplateSchema`, `publishWaiverTemplateSchema` Zod schemas and their inferred types (after line ~363, at end of file) |
| `apps/web/src/lib/errors.ts` | Add `WaiverTemplateNotFound`, `ActiveTemplateNotFound`, `InvalidSignerAge` tagged error classes (after line ~72) |
| `apps/web/src/components/settings/settings-tabs.tsx` | Add `{ label: "Waivers", href: "/settings/waivers" }` to the `tabs` array (after line 11, before Billing). Conditionally render based on feature flag prop. |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/lib/waivers.ts` | Effect service functions for template CRUD: `createTemplate`, `updateTemplate`, `publishTemplate`, `getActiveTemplate`, `getTemplatesByOrg`, `deleteTemplate` | Follow `apps/web/src/lib/customers.ts` for Effect.gen pattern, DbService/CurrentSession usage, permission checks, error handling |
| `apps/web/src/app/[orgSlug]/settings/waivers/page.tsx` | Settings > Waivers page — RSC that queries templates and renders template list + create/edit form with Tiptap editor, preview modal, publish button | Follow `apps/web/src/app/[orgSlug]/settings/team/page.tsx` for settings page structure with permission-based rendering |
| `apps/web/src/app/[orgSlug]/settings/waivers/actions.ts` | Server actions: `createTemplateAction`, `updateTemplateAction`, `publishTemplateAction`, `deleteTemplateAction` | Follow `apps/web/src/app/[orgSlug]/settings/actions.ts` for action pattern (Zod parse -> session check -> Effect pipe -> revalidatePath) |
| `apps/web/src/__tests__/waivers/waiver-templates.test.ts` | Unit tests: create draft, save, publish (owner), publish fails for admin, edit creates new version, archive on republish, delete draft, can't delete published | Follow `apps/web/src/__tests__/customers/customer-list.test.ts` for test setup (resetTestState, createTestSession, addMember, TestLayers) |

## Context

### Patterns to follow
- `apps/web/src/lib/customers.ts` (lines 45-122): `listCustomers` Effect.gen with DbService, conditions building, pagination — template for `getTemplatesByOrg`
- `apps/web/src/lib/settings.ts` (lines 31-82): `updateOrgSettings` with permission checking via `getMemberRole` — template for publish permission (owner-only)
- `apps/web/src/app/[orgSlug]/settings/actions.ts` (lines 38-65): `updateGeneralSettings` server action pattern — Zod parse, session, Effect.match with handleError

### Key types
```typescript
// Service dependencies (from lib/services.ts)
import { CurrentSession, DbService } from "@/lib/services";

// Permission checking pattern (from lib/customers.ts line 28-43)
function getMemberRole(db: Effect.Effect.Success<typeof DbService>, orgId: string, userId: string)

// Schema types the service will use (from lib/db/schema/waivers.ts — created in issue #1)
import { waiverTemplate, waiverTemplateStatusEnum } from "@/lib/db/schema/waivers";

// Existing tagged error pattern (from lib/errors.ts)
export class WaiverTemplateNotFound extends Data.TaggedError("WaiverTemplateNotFound")<{ readonly templateId: string }> {}

// Feature flag check — read from organizationSetting.featureFlags
import { organizationSetting } from "@/lib/db/schema/organization-settings";
// featureFlags is jsonb: Record<string, unknown>
// Check: (settings.featureFlags as Record<string, unknown>).waivers === true
```

### Wiring notes
- `settings-tabs.tsx` needs a `featureFlags` prop passed from the settings layout. Update `apps/web/src/app/[orgSlug]/settings/layout.tsx` to query `organizationSetting.featureFlags` and pass it down. Alternatively, make the Waivers tab always visible since the page itself can gate on the flag.
- The Tiptap editor is a new dependency. Install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder` in `apps/web`. Use only basic extensions (bold, italic, headings, lists, paragraphs). Store output as HTML string.
- `publishTemplate` must be transactional: archive all existing published templates for the org, then set the target draft to published. Use `db.transaction()` (Drizzle supports this).

## Acceptance criteria

- [ ] Owner can create a draft template with name, rich text body (Tiptap HTML), expiration days
- [ ] Owner can preview a template in a modal showing formatted HTML
- [ ] Owner can publish a draft template — previous published template gets archived
- [ ] Admin can create/edit templates but publish button is hidden/disabled
- [ ] Member sees read-only template list
- [ ] Editing a published template creates a new draft with version + 1
- [ ] Deleting a draft succeeds; deleting a published template fails
- [ ] Settings > Waivers tab visible when `featureFlags.waivers` is truthy
- [ ] All template lifecycle unit tests pass
- [ ] `bunx biome check apps/web/src` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes

## Verification

```bash
cd apps/web
bun run test -- --run src/__tests__/waivers/waiver-templates.test.ts
cd ../..
bunx biome check apps/web/src
bun run build
```

### Manual verification
1. Enable feature flag: set `featureFlags` to `{"waivers": true}` in `organization_setting` for a test org
2. Navigate to Settings — "Waivers" tab should appear
3. Click "Create Template" — fill name, body (rich text), expiration days
4. Save draft — appears in list with "Draft" badge
5. Click "Preview" — modal shows formatted HTML
6. Click "Publish" (as owner) — badge changes to "Published"
7. Click "Edit" on published — new draft created with version + 1
8. As admin: publish button should be hidden

## Notes

- Tiptap is headless and MIT-licensed. Keep extensions minimal — no images, no tables, no code blocks for v1.
- The preview modal should render the same HTML layout that the public signing page will use (shared component recommended but not required — the signing page in issue #3 can refactor if needed).
- HITL because: Tiptap editor UX, template list layout, and preview modal all need visual review.
