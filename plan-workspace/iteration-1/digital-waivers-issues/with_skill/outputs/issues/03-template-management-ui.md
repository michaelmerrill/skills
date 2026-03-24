# Template Management UI (Settings > Waivers)

> Part of: [digital-waivers-design.md](../../plans/digital-waivers-design.md)
> Issue: 3 of 7
> Type: HITL

## Blocked by

- [02-template-service.md](./02-template-service.md) -- needs `createTemplate`, `updateTemplate`, `publishTemplate`, `getActiveTemplate`, `getTemplatesByOrg` service functions and validation schemas.

## What to build

Add a "Waivers" tab to the Settings page, gated by the `featureFlags.waivers` flag. The page lists all waiver templates with status badges, and provides create/edit/preview/publish actions. Uses a Tiptap rich text editor for the template body. Create server actions following the same Effect pipeline pattern as the existing settings actions.

## Files to create

| File | Purpose | Pattern to follow |
|------|---------|------------------|
| `apps/web/src/app/[orgSlug]/settings/waivers/page.tsx` | Settings > Waivers page -- lists templates, create/edit/publish controls | Follow `apps/web/src/app/[orgSlug]/settings/team/page.tsx` -- RSC that fetches session, org, membership, then renders a client component |
| `apps/web/src/app/[orgSlug]/settings/waivers/actions.ts` | Server actions: `createTemplateAction`, `updateTemplateAction`, `publishTemplateAction`, `deleteTemplateAction` | Follow `apps/web/src/app/[orgSlug]/settings/actions.ts` (182 lines) -- same `"use server"`, parse with Zod, get session from headers, pipe Effect with `CurrentSession` + `AppLive`, revalidate path, return `ActionResult` |
| `apps/web/src/components/settings/waiver-template-form.tsx` | Client component: name input, Tiptap editor for body, expirationDays input, save/publish buttons | Follow other settings form components -- `"use client"`, form state, call server action |
| `apps/web/src/components/settings/waiver-template-list.tsx` | Client component: template list table with status badges, action buttons (edit/preview/publish/delete) | Follow `apps/web/src/components/customers/customers-table.tsx` for table structure |
| `apps/web/src/components/settings/waiver-preview-dialog.tsx` | Modal/drawer that renders the template body HTML exactly as the public signing page would display it | No direct analog -- simple dialog that renders sanitized HTML |

## Files to modify

| File | What changes |
|------|-------------|
| `apps/web/src/components/settings/settings-tabs.tsx` | Add `{ label: "Waivers", href: "/settings/waivers" }` to the `tabs` array (after line ~11, before `] as const`). Conditionally render this tab only when feature flag is enabled -- will need to accept a `featureFlags` prop or use a context/query |
| `apps/web/src/app/[orgSlug]/settings/layout.tsx` | Pass feature flags to `SettingsTabs` -- query `getOrgSettings` to get `featureFlags`, pass `showWaivers` prop |
| `apps/web/src/lib/queries.ts` | Add `getWaiverTemplatesByOrg` cached query function (after line ~168) that calls `getTemplatesByOrg` from `waivers.ts` |

## Context

### Patterns to follow
- `apps/web/src/app/[orgSlug]/settings/actions.ts` lines 38-65: `updateGeneralSettings` shows the complete server action pattern -- parse Zod, get headers+session, pipe Effect with `CurrentSession` + `AppLive`, `Effect.match` for success/failure, `revalidatePath`.
- `apps/web/src/components/settings/settings-tabs.tsx` lines 1-42: tab navigation with active state detection. Currently a static array -- needs conditional entry for Waivers.
- `apps/web/src/app/[orgSlug]/settings/layout.tsx` lines 1-20: settings shell layout. Currently doesn't pass props to `SettingsTabs`.
- `apps/web/src/lib/queries.ts` lines 62-76: `getOrgSettings` cached query returns full settings row including `featureFlags`.

### Key types
```typescript
// Server action return type (from settings/actions.ts)
type ActionResult = { error: string } | { success: true };

// Organization setting featureFlags (from schema, typed as Record<string, unknown>)
featureFlags: jsonb("feature_flags").$type<Record<string, unknown>>()

// Validation schemas to import (from validation.ts after issue #2)
createWaiverTemplateSchema, updateWaiverTemplateSchema

// Service functions to import (from waivers.ts after issue #2)
createTemplate, updateTemplate, publishTemplate, getActiveTemplate, getTemplatesByOrg
```

### Wiring notes
- Tiptap needs to be added as a dependency: `@tiptap/react`, `@tiptap/starter-kit` (MIT, headless). Install from `apps/web`.
- The settings layout needs to query `getOrgSettings` to check `featureFlags.waivers`. Pass as a prop to `SettingsTabs`.
- Preview dialog should render the template body HTML using `dangerouslySetInnerHTML` with DOMPurify sanitization (install `dompurify` + `@types/dompurify`). This same sanitization approach will be reused on the public page in Issue #4.
- Publish button should only be visible/enabled for users with `owner` role. The page RSC already fetches `membership.role` -- pass `canPublish: role === "owner"` to the client component.

## Acceptance criteria

- [ ] Settings > Waivers tab visible when `featureFlags.waivers` is truthy
- [ ] Settings > Waivers tab hidden when flag is falsy or absent
- [ ] Owner can create a draft template with name, rich text body, expiration days
- [ ] Tiptap editor supports headers, bold, italic, lists, paragraphs (Design Decision #13)
- [ ] Owner can preview a template in a modal showing formatted HTML
- [ ] Owner can publish a draft (publish button visible)
- [ ] Admin can create/edit but publish button is hidden/disabled
- [ ] Member sees read-only template list (no create/edit/publish controls)
- [ ] Publishing archives the previous published template
- [ ] Editing a published template shows "Edit creates a new draft version" and creates version+1
- [ ] Delete button only shown for unpublished drafts
- [ ] Template list shows status badges (Draft, Published, Archived)
- [ ] `bun run lint` passes
- [ ] `bun run build` passes

## Verification

```bash
cd apps/web
bun run lint
bun run build
```

### Manual verification
1. Enable `featureFlags.waivers` for a test org in the DB
2. Navigate to Settings -- verify "Waivers" tab appears
3. Create a template: enter name, write rich text body, set expiration days, save
4. Verify draft appears in list with "Draft" badge
5. Click Preview -- verify modal shows formatted HTML
6. Click Publish -- verify template status changes to "Published"
7. Click Edit on published template -- verify new draft created with version+1
8. Log in as admin -- verify publish button hidden
9. Disable feature flag -- verify tab disappears

## Notes

- This is HITL because Tiptap integration and the preview modal layout need human review for visual quality. The form UX (where buttons go, how the editor feels) benefits from a human eye.
- The Tiptap editor should use only basic extensions per Design Decision #13: `StarterKit` from `@tiptap/starter-kit` covers headers, bold, italic, lists, paragraphs. No need for image uploads, tables, or other heavy extensions.
- For the feature flag check, cast `featureFlags.waivers` to boolean: `Boolean(settings?.featureFlags?.waivers)`.
