# Settings > Waivers Tab (Template Management UI)

> Part of: [digital-waivers-design.md](plans/digital-waivers-design.md)
> Issue: 3 of 7
> Type: HITL

## Blocked by

- [02-template-crud-service.md](./02-template-crud-service.md) -- needs template CRUD service functions and validation schemas

## What to build

Add a "Waivers" tab to the settings navigation. Create the settings/waivers page with template list, create/edit form (name, Tiptap rich text editor, expiration days), preview modal, and publish button. Wire server actions to the template CRUD service. Show the tab only when `featureFlags.waivers` is enabled on the org's settings. Enforce permission visibility: owner sees publish button, admin sees create/edit, member sees read-only.

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/components/settings/settings-tabs.tsx` | Add `{ label: "Waivers", href: "/settings/waivers" }` to `tabs` array after "Billing" (line ~11). Conditionally render based on feature flag prop. |
| `apps/web/src/app/[orgSlug]/settings/layout.tsx` | Pass `featureFlags` to `SettingsTabs` -- query org settings and extract `featureFlags.waivers` boolean |

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/app/[orgSlug]/settings/waivers/page.tsx` | Settings waivers page: list templates, create/edit forms, preview, publish | Follow `apps/web/src/app/[orgSlug]/settings/locations/page.tsx` for RSC data-fetching pattern |
| `apps/web/src/app/[orgSlug]/settings/waivers/actions.ts` | Server actions: createTemplate, updateTemplate, publishTemplate, deleteTemplate | Follow `apps/web/src/app/[orgSlug]/settings/actions.ts` (182 lines) -- same Effect.match error-handling pattern |

## Context

### Patterns to follow
- `apps/web/src/components/settings/settings-tabs.tsx` lines 7-12: `tabs` array defining settings navigation. Add new entry.
- `apps/web/src/app/[orgSlug]/settings/actions.ts` lines 38-65: `updateGeneralSettings` server action pattern -- parse with Zod, get session, pipe Effect with CurrentSession + AppLive, match success/failure, revalidate path.
- `apps/web/src/app/[orgSlug]/settings/locations/page.tsx`: RSC page that fetches data and renders component. Follow this for the waivers page.
- `apps/web/src/lib/db/schema/organization-settings.ts` lines 25-28: `featureFlags` is a `jsonb` column typed as `Record<string, unknown>`. Access `featureFlags.waivers` as boolean.

### Key types
```typescript
// SettingsTabs needs to accept feature flag
interface SettingsTabsProps {
  showWaivers?: boolean;
}

// Action signatures
export async function createTemplateAction(formData: unknown): Promise<ActionResult>
export async function updateTemplateAction(formData: unknown): Promise<ActionResult>
export async function publishTemplateAction(orgId: string, templateId: string): Promise<ActionResult>
export async function deleteTemplateAction(orgId: string, templateId: string): Promise<ActionResult>
```

### Wiring notes
- `SettingsTabs` currently takes no props. Must add optional `showWaivers` prop and conditionally include the Waivers tab entry.
- `settings/layout.tsx` must query `getOrgSettings` to get `featureFlags.waivers` and pass to `SettingsTabs`. Import `getOrgSettings` from `@/lib/queries` and `getOrgBySlug` + `getSession` for the org ID.
- Tiptap integration: install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-heading`, `@tiptap/extension-bold`, `@tiptap/extension-italic`, `@tiptap/extension-bullet-list`, `@tiptap/extension-ordered-list`. Decision #13 specifies basic extensions only. Store output as HTML string in `body` field.
- Preview: render template body HTML in a modal using the same sanitized rendering the public page will use (DOMPurify or similar). Can be a simple `dangerouslySetInnerHTML` with sanitization for now.
- Actions revalidate path `/(orgSlug)/settings/waivers` on success.

## Acceptance criteria

- [ ] "Waivers" tab appears in settings navigation when `featureFlags.waivers` is true
- [ ] Tab does not appear when feature flag is false/missing
- [ ] Page lists all templates for the org with name, status badge, version, created date
- [ ] Owner can create a new draft template with name, rich text body (Tiptap), expiration days
- [ ] Owner can edit a draft template
- [ ] Owner can preview a template in a modal showing formatted HTML
- [ ] Owner can publish a draft template (publish button visible only to owner)
- [ ] Admin can create/edit but publish button is hidden
- [ ] Member sees read-only template list (no create/edit/publish buttons)
- [ ] Editing a published template creates a new draft version (UI shows both)
- [ ] Delete button available only for unpublished drafts
- [ ] `bun run lint` passes
- [ ] `bun run build` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
```

### Manual verification
- Navigate to Settings > Waivers tab (with feature flag enabled)
- Create a template with rich text
- Preview the template
- Publish the template
- Edit the published template (should create new draft version)
- Verify admin cannot see publish button
- Verify member sees read-only view

## Notes
- This is HITL because Tiptap editor integration and the template list/form layout require visual review for UX quality.
- The Tiptap editor should be a client component (`"use client"`) wrapped in a form that submits via server action.
- Decision #15: only owner can publish. Admin role has `waiver_template: ["create", "read", "update"]` but NOT `"publish"` (see `apps/web/src/lib/permissions.ts` line 41).
