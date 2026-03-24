---
name: design
description: "UX design interview → living doc UX Design section (flows, screens, states, components, a11y). Optional — UI features only. Triggers: 'design the UX,' 'what screens,' 'how should users interact,' post-define. Not for: technical design (architect), requirements (define). Skip for API-only, CLI, backend, or exact UI replicas."
---

## Purpose

UX design interview → `## UX Design` section in the living document. Pipeline: explore → define → **[design]** → architect → plan.

Translates product requirements into concrete user experience: flows, screens, states, components, accessibility. Does NOT define data models, APIs, architecture (architect), visual design (Figma), or requirements (define).

Phase: UX Design. User may be non-technical (designer/PM). Ask about interactions, not code. Technical constraints inform recommendations silently.

### When to Skip

Skip when: API/backend-only, CLI tool, exact replica of existing UI pattern, config/copy/bug fix.

## Starting

Before asking anything:

1. Read the living doc (`./plans/*.md`). Look for `## Scope`, `## Requirements` (including `### Glossary`). If `## Rollback Notes` has content: resume only affected domains, clear after resolving. Extract every user story from Requirements — each becomes a flow to design. Use glossary canonical terms for all UI labels throughout.
2. Explore existing UI patterns — component library, design system, screens, navigation, forms, notifications, empty states, error handling.
3. Search for design system docs, Storybook, component READMEs, style guides.
4. If the codebase has no UI, tell the user and suggest `/architect` instead.

If Requirements exists: "I've read the requirements for [feature] and explored the existing UI. Requirements include [stories]. App uses [patterns/library]. First: [question about entry points]."

No Requirements? Works — but note that defined requirements produce a better UX spec. No glossary? Be consistent in naming and note terminology decisions.

## Interview Protocol

One decision at a time. Focus on what users see, do, and experience.

### One question per turn

Use `AskUserQuestion` for every question. Never plain text. Each call: one question with `question`, `header` (max 12 chars), `options` (2-4, each with `label` + `description`), recommended option first with "(Recommended)" suffix. Set `multiSelect: true` when choices aren't exclusive. Use `preview` for ASCII mockup/layout comparisons. User can always pick "Other."

### When the user can't decide

State your recommendation, record as assumption in Assumptions & Open Questions, move on.

### Code-first

Explore the codebase before asking questions it could answer. Present as confirmation: "The app uses a dialog component for creation flows. I'll follow that pattern unless you say otherwise."

### Completeness tracking

Track whether you've resolved decisions across these domains:

1. **Entry points & navigation** — Where does user encounter this? New nav items? Information architecture impact?
2. **Core user flows** — For each user story: step-by-step interaction sequence. Entry, actions, responses, branches (success/error/validation/edge cases).
3. **Screen/view inventory** — Every screen, modal, panel this feature introduces or modifies. Purpose, content areas, primary actions.
4. **State coverage** — For every screen: empty, loading, error, success, partial states. Permission-based variations.
5. **Component mapping** — Existing components to reuse? New components needed? Closest existing pattern for new ones.
6. **Interaction details** — Bulk actions, keyboard nav, responsive/mobile, drag-and-drop, real-time, optimistic UI, undo.
7. **Accessibility** — Focus management, keyboard navigation, screen reader announcements, color-independent indicators, touch targets, reduced motion.
8. **Content & copy** — Key labels, button text, error messages, help text, placeholders, empty state messaging. Tone/voice guidelines.

Exhaust every branch depth-first. Resolve sub-questions before moving to the next domain. Only ask what codebase can't answer. No limit on question count.

### Upstream gap tracking

**Minor gaps** (resolvable inline): missing acceptance criteria details, unspecified edge case behavior. Resolve during interview, record in PRD Addendum subsection.

**Missing user stories / acceptance criteria**: note as assumption, continue, flag in PRD Addendum with "BLOCKING — backport to Requirements before architect."

**Contradictory requirements**: append to `## Rollback Notes` with trigger, affected define domains, and UX decisions to preserve. Roll back to `/define`.

**Fundamental scope ambiguity** (wrong problem framing): append to `## Rollback Notes` with trigger, affected explore domains, and decisions to preserve. Roll back to `/explore`.

Glossary does NOT need re-running for Requirements patches discovered during design.

### Scope

No technical implementation (schemas, APIs, architecture, build ordering, tech selection, performance). Redirect: "Captured for technical design — let's stay on how users experience this."

### Wrapping up

When every domain is fully resolved with no remaining sub-questions, proceed to wrap up.

If Requirements exist, verify every user story maps to at least one flow. Surface any missing flows before producing the section.

Write `## UX Design` section into the living doc. After writing: "Review this and tell me what to change. When satisfied, run `/architect`."

Update directly on change requests. No re-interview for minor adjustments. Flag conflicts with earlier decisions.

## UX Design Section Template

Write this as `## UX Design` in the living doc. Include relevant subsections. Omit any that would say "N/A."

```markdown
## UX Design

### Information Architecture

- **Location**: <nav path>
- **New nav items**: <if any>
- **Changes to existing nav**: <if any>

### User Flows

#### <Flow Name> (maps to: <User Story from Requirements>)
**Entry point**: <where>
**Precondition**: <what must be true>

1. User <action>
2. System <response>
   - **Success**: <what happens>
   - **Error — <type>**: <what user sees>
   - **Loading**: <what user sees>
3. ...

### Screen Inventory

#### <Screen/View Name>
- **Purpose**: <what for>
- **Entry points**: <how users get here>
- **States**: Empty: <desc> | Loading: <desc> | Default: <desc> | Error: <desc + recovery>
- **Primary actions**: <what users can do>

### Component Inventory

| Component | Exists? | Source/Path | Notes |
|-----------|---------|-------------|-------|
| | | | Reuse as-is / Extend / New — follows <pattern> |

### Interaction Specs

#### <Interaction Name>
- **Trigger**: <what initiates>
- **Behavior**: <step by step>
- **Keyboard**: <if applicable>
- **Responsive**: <if applicable>

### Accessibility

- **Focus management**: <modals, drawers, dynamic content>
- **Keyboard navigation**: <tab order, shortcuts>
- **Screen reader**: <announcements, live regions, aria>
- **Visual**: <color-independent indicators, contrast, motion>

### Content & Copy

| Element | Text | Notes |
|---------|------|-------|
| <button/label/heading/error/empty state> | <exact text> | <context> |

### External Design References

| Screen | Tool | Link | Status |
|--------|------|------|--------|

### Assumptions & Open Questions

- **Assumption**: <statement>. *Impact if wrong: <consequence>*
- **Open question**: <question>. *Needed by: <when>. Affects: <flows/screens>*

### PRD Addendum

Gaps discovered during UX design, resolved inline. Backport to Requirements if substantive.
- **<FR/US reference>**: <gap + resolution>
```

Update `## Decisions Log` with UX decisions. Update `## Pipeline Status` with design row.
