---
name: design
description: "UX design interview → living doc UX Design section (flows, screens, states, components, a11y). Optional — UI features only. Triggers: 'design the UX,' 'what screens,' 'how should users interact,' post-define. Not for: technical design (architect), requirements (define). Skip for API-only, CLI, backend, or exact UI replicas."
---

UX design interview → `## UX Design` section in the living document. Pipeline: explore → define → **[design]** → architect → plan.

Translates product requirements into concrete UX: flows, screens, states, components, accessibility. Does NOT define data models, APIs, architecture (architect), visual design (Figma), or requirements (define).

Phase: UX Design. User may be non-technical (designer/PM). Ask about interactions, not code. Technical constraints inform recommendations silently. Skip when: API/backend-only, CLI tool, exact replica of existing UI pattern, config/copy/bug fix.

## Starting

Before asking anything:

1. Read the living doc (`./plans/*.md`). If multiple `.md` files found in `./plans/`, list them via `AskUserQuestion` and ask which feature to work on. Look for `## Scope`, `## Requirements` (including `### Glossary`). If `## Rollback Notes` has content: this takes priority — skip steps 2-4, resume only affected domains, clear after resolving. Extract every user story from Requirements — each becomes a flow to design. Use glossary canonical terms for all UI labels.
2. Explore existing UI patterns — component library, design system, screens, navigation, forms, notifications, empty states, error handling.
3. Search for design system docs, Storybook, component READMEs, style guides.
4. If the codebase has no UI, tell the user and suggest `/architect` instead.

If Requirements exists: "I've read the requirements for [feature] and explored the existing UI. Requirements include [stories]. App uses [patterns/library]. First: [question about entry points]."

No Requirements? Works — but note that defined requirements produce a better UX spec. No glossary? Be consistent in naming and note terminology decisions.

## Interview Protocol

One decision at a time. Focus on what users see, do, and experience.

Use `AskUserQuestion` for every question — header (≤12 chars), 2–4 options, one marked "(Recommended)". When user can't decide: push — reframe the question, explain tradeoffs, give a stronger recommendation. Only record as assumption after two attempts. Revisit assumptions when later answers provide resolution.

### Code-first

Explore codebase before asking questions it could answer. Present as confirmation: "The app uses a dialog component for creation flows. I'll follow that pattern unless you say otherwise." When codebase has competing patterns for the same concern, surface the conflict and ask user which to follow — don't silently pick one. After user answers, verify against codebase — surface contradictions before proceeding.

### Completeness tracking

Exhaust every branch depth-first. Resolve sub-questions before moving to the next domain. Only ask what codebase can't answer. No limit on questions; depth from more turns, not longer ones.

1. **Entry points & navigation** — Where does user encounter this? New nav items? IA impact?
2. **Core user flows** — For each user story: step-by-step interaction sequence (entry, actions, responses, branches).
3. **Screen/view inventory** — Every screen, modal, panel introduced or modified. Purpose, content areas, primary actions.
4. **State coverage** — For every screen: empty, loading, error, success, partial. Permission-based variations.
5. **Component mapping** — Existing components to reuse? New ones needed? Closest existing pattern?
6. **Interaction details** — Bulk actions, keyboard nav, responsive/mobile, drag-and-drop, real-time, optimistic UI, undo.
7. **Accessibility** — Focus management, keyboard nav, screen reader announcements, color-independent indicators, touch targets, reduced motion.
8. **Content & copy** — Key labels, button text, error messages, help text, placeholders, empty state messaging, tone/voice.

### Upstream gap tracking

**Minor gaps** (missing AC details, unspecified edge cases): resolve inline, record in PRD Addendum.

**Missing user stories/AC**: note as assumption, continue, flag in PRD Addendum with "BLOCKING — backport to Requirements before architect."

**Contradictory requirements**: append to `## Rollback Notes` with trigger, affected domains, UX decisions to preserve. Roll back to `/define`.

**Fundamental scope ambiguity**: append to `## Rollback Notes` with trigger, affected domains, decisions to preserve. Roll back to `/explore`.

Glossary does NOT need re-running for Requirements patches discovered during design. No technical implementation (schemas, APIs, architecture). Redirect: "Captured for technical design — let's stay on UX."

## Wrapping Up

When every domain is fully resolved with no remaining sub-questions, proceed to wrap up.

### Self-review (silent)
Before writing: audit all recorded assumptions — resolve any that later context now answers. If an answer in a later domain invalidates an earlier one, reopen that domain before proceeding. Then: (1) Every user story maps to at least one flow? (2) Every flow's screens appear in the inventory? (3) Every screen has states defined (empty, loading, error, success)? (4) Components mapped to existing codebase where possible? Fix gaps silently before writing.

Write `## UX Design` section into the living doc using the template in `assets/ux-design-template.md`. After writing: "Review this and tell me what to change. When satisfied, run `/architect`."

Update directly on change requests. No re-interview for minor adjustments. Flag conflicts with earlier decisions. Update `## Decisions Log` with UX decisions. Update `## Pipeline Status` with design row.

## Rollback

**Receiving**: Read `## Rollback Notes` for trigger, affected domains, decisions to preserve. Resume only affected domains — do not re-interview resolved decisions. Update `## UX Design`, clear `## Rollback Notes`, direct user back to triggering skill.

**Triggering**: Contradictory requirements → `/define`. Fundamental scope ambiguity → `/explore`. See upstream gap tracking.
