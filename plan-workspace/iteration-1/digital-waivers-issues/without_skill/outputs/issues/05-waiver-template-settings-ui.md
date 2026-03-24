# Issue 5: Settings > Waivers Tab — Template Management UI

## Summary

Add a "Waivers" tab to the organization settings page with UI for creating, editing, previewing, publishing, and deleting waiver templates. Includes the Tiptap rich text editor for template body editing.

## Context

Settings tabs are at `apps/web/src/app/[orgSlug]/settings/`. Existing tabs: General (`page.tsx`), Locations (`locations/`), Team (`team/`), Billing (`billing/`). The settings layout likely manages tab navigation. Components live in `apps/web/src/components/settings/`.

## Acceptance Criteria

- [ ] New route: `apps/web/src/app/[orgSlug]/settings/waivers/page.tsx`
  - RSC that fetches templates for the org via a query function
  - Passes serialized data to a client component
- [ ] Settings tab navigation updated to include "Waivers" tab
  - Tab only visible when `featureFlags.waivers` is enabled
- [ ] Template list view showing all templates with:
  - Name, status badge (Draft/Published/Archived), version number, created date
  - Action buttons per row: Edit (draft only), Preview (any), Publish (draft, owner only), Delete (draft only)
- [ ] "Create Template" button that opens a form with:
  - Name text input
  - Body: Tiptap rich text editor (headless, basic extensions: headers, bold, italic, lists, paragraphs)
  - Expiration days number input (default 365)
  - "Save Draft" button
- [ ] Edit form: same as create, pre-populated with existing draft data
- [ ] "Edit" on a published template: triggers creation of a new draft version (version + 1, fields copied), then opens the edit form
- [ ] Preview modal/drawer: renders template body HTML with org name/logo header, matching the public signing page layout
- [ ] Publish confirmation: dialog confirming that publishing will replace the current active template
- [ ] Server actions in `apps/web/src/app/[orgSlug]/settings/waivers/actions.ts` wiring form submissions to the service layer functions
- [ ] Permission-based UI: publish button hidden for non-owners; edit/create hidden for members

## Technical Notes

- Install Tiptap packages: `@tiptap/react`, `@tiptap/starter-kit` (or individual extensions), `@tiptap/pm`
- Store body as HTML string (Tiptap's `editor.getHTML()`)
- Follow the server action pattern from `apps/web/src/app/[orgSlug]/settings/actions.ts`: parse with Zod, get session, run Effect pipeline, revalidate path
- For the template list query, add a cached query function in `apps/web/src/lib/queries.ts` (pattern: `getTemplatesByOrg`)
- Use existing UI components from `apps/web/src/components/ui/` (likely shadcn/ui components)

## Dependencies

- Issue 1 (schema)
- Issue 2 (validation schemas)
- Issue 3 (feature flag for tab visibility)
- Issue 4 (service layer functions)
