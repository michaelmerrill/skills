---
name: design-ux
description: "UX design interview -> UX spec (flows, screens, states, components, a11y). Triggers: 'design the UX,' 'what screens,' 'how should users interact,' post-PRD/glossary. Optional — UI features only. Not for: technical design (design-feature), requirements (write-a-prd), plan review (review-plan)."
---

## Purpose

UX design interview -> interaction specification. Pipeline: plan-feature -> write-a-prd -> review-prd -> glossary -> **(design-ux)** -> design-feature -> review-plan.

Translates product requirements into concrete user experience: flows, screens, states, components, accessibility. Does NOT define data models, APIs, architecture (design-feature), visual design (Figma), or requirements (write-a-prd).

### When to Skip

Skip when: API/backend-only, CLI tool, exact replica of existing UI pattern, config/copy/bug fix.

## Starting

Before asking anything:

1. Look for PRD (`*-prd.md`), scope doc (`*-scope.md`), and glossary (`*-glossary.md`) in `./plans/`. Read all found. Extract every user story — each becomes a flow to design. Use glossary canonical terms for all UI labels throughout.
2. Explore existing UI patterns — component library, design system, screens, navigation, forms, notifications, empty states, error handling.
3. Search for design system docs, Storybook, component READMEs, style guides.
4. If the codebase has no UI, tell the user and suggest `/design-feature` instead.

If PRD exists: "I've read the PRD for [feature] and explored the existing UI. Requirements include [stories]. App uses [patterns/library]. First: [question about entry points]."

No PRD? Works — but note that defined requirements produce a better UX spec. No glossary? Be consistent in naming and note terminology decisions.

## Interview Protocol

One decision at a time. Focus on what users see, do, and experience.

### One question per turn

Use `AskUserQuestion` for every question. Never plain text. Each call: one question with `question`, `header` (max 12 chars), `options` (2-4, each with `label` + `description`), recommended option first with "(Recommended)" suffix. Set `multiSelect: true` when choices aren't exclusive. Use `preview` for ASCII mockup/layout comparisons. User can always pick "Other."

### When the user can't decide

State your recommendation, record as assumption in Assumptions & Open Questions, move on.

### Code-first

Explore the codebase before asking questions it could answer. Present as confirmation: "I found the app uses `<Dialog>` in `src/components/ui/dialog.tsx` for creation flows. I'll follow this unless you say otherwise."

### Completeness tracking

Track whether you've resolved decisions across these domains:

1. **Entry points & navigation** — Where does user encounter this? New nav items? Information architecture impact?
2. **Core user flows** — For each PRD user story: step-by-step interaction sequence. Entry, actions, responses, branches (success/error/validation/edge cases).
3. **Screen/view inventory** — Every screen, modal, panel this feature introduces or modifies. Purpose, content areas, primary actions.
4. **State coverage** — For every screen: empty, loading, error, success, partial states. Permission-based variations.
5. **Component mapping** — Existing components to reuse? New components needed? Closest existing pattern for new ones.
6. **Interaction details** — Bulk actions, keyboard nav, responsive/mobile, drag-and-drop, real-time, optimistic UI, undo.
7. **Accessibility** — Focus management, keyboard navigation, screen reader announcements, color-independent indicators, touch targets, reduced motion.
8. **Content & copy** — Key labels, button text, error messages, help text, placeholders, empty state messaging. Tone/voice guidelines.

Safety net, not a script. Check for gaps before producing the UX spec. Every domain needs at least one decision.

### Upstream gap tracking

**Minor gaps** (resolvable inline): missing acceptance criteria details, unspecified edge case behavior. Resolve during interview, record in PRD Addendum section.

**Major gaps** (blocking): missing user stories for flows you need to design, fundamental scope ambiguity. Surface immediately and suggest pausing for `/write-a-prd` or `/review-prd`, or proceed with noted assumptions. If 3+ major gaps accumulate, recommend pausing.

### Scope

No technical implementation (schemas, APIs, architecture, build ordering, tech selection, performance). Redirect: "Captured for technical design — let's stay on how users experience this."

### Wrapping up

If PRD exists, verify every user story maps to at least one flow. Surface any missing flows before producing the document.

Match naming prefix from existing docs. Save to `./plans/<feature-name>-ux.md`. After writing: "Review this and tell me what to change. When satisfied, run `/design-feature`."

Update directly on change requests. No re-interview for minor adjustments. Flag conflicts with earlier decisions.

## UX Spec Template

Include relevant sections. Omit any that would say "N/A."

```markdown
# UX: <Feature Name>

> UX specification for [<feature-name>-prd.md] (scope: [<feature-name>-scope.md])
> Generated from design-ux interview on <date>

## Decisions Log

1. **<Topic>**: <Decision>. *Rationale: <why>*

## Information Architecture

- **Location**: <nav path>
- **New nav items**: <if any>
- **Changes to existing nav**: <if any>

## User Flows

### <Flow Name> (maps to: <User Story from PRD>)
**Entry point**: <where>
**Precondition**: <what must be true>

1. User <action>
2. System <response>
   - **Success**: <what happens>
   - **Error — <type>**: <what user sees>
   - **Loading**: <what user sees>
3. ...

## Screen Inventory

### <Screen/View Name>
- **Purpose**: <what for>
- **Entry points**: <how users get here>
- **States**: Empty: <desc> | Loading: <desc> | Default: <desc> | Error: <desc + recovery>
- **Primary actions**: <what users can do>

## Component Inventory

| Component | Exists? | Source/Path | Notes |
|-----------|---------|-------------|-------|
| | | | Reuse as-is / Extend / New — follows <pattern> |

## Interaction Specs

### <Interaction Name>
- **Trigger**: <what initiates>
- **Behavior**: <step by step>
- **Keyboard**: <if applicable>
- **Responsive**: <if applicable>

## Accessibility

- **Focus management**: <modals, drawers, dynamic content>
- **Keyboard navigation**: <tab order, shortcuts>
- **Screen reader**: <announcements, live regions, aria>
- **Visual**: <color-independent indicators, contrast, motion>

## Content & Copy

| Element | Text | Notes |
|---------|------|-------|
| <button/label/heading/error/empty state> | <exact text> | <context> |

## External Design References

| Screen | Tool | Link | Status |
|--------|------|------|--------|

## Assumptions & Open Questions

- **Assumption**: <statement>. *Impact if wrong: <consequence>*
- **Open question**: <question>. *Needed by: <when>. Affects: <flows/screens>*

## PRD Addendum

Gaps discovered during UX design, resolved inline. Record here. Backport to PRD if substantive; skip for minor clarifications.
- **<FR/US reference>**: <gap + resolution>

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| plan-feature | <date or "skipped"> | <verdict> | <summary> |
| write-a-prd | <date or "skipped"> | -- | <summary> |
| review-prd | <date or "skipped"> | <verdict> | <summary> |
| glossary | <date or "skipped"> | -- | <summary> |
| design-ux | <date> | -- | <summary> |
```
