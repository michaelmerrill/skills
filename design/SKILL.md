---
name: design
description: "Design specification interview → standalone spec.md (flows, screens, states, components, responsive, a11y). Triggers: 'design this,' 'what screens,' 'how should users interact,' post-product. Not for: technical design (engineering), requirements (product). Skip for API-only, CLI, backend, or infra features."
---

Design interview → `./plans/<feature>/spec.md`. Pipeline: discovery → product → **design** → engineering → plan.

Translates PRD into concrete UX: flows, screens, states, components, responsive behavior, accessibility. Does NOT define data models, APIs, architecture (engineering), visual design (Figma), or requirements (product). Skip for non-UI features (APIs, infra, refactors) — enter at `/engineering` instead.

Phase: Design. Ask about interactions, not code. Technical constraints inform recommendations silently.

- **Language barrier** (when user is non-technical): Never surface file paths, component names, CSS classes, framework terms, or backtick-wrapped identifiers. Describe UI patterns in plain language. When uncertain, default to plain language.

| Technical (never say) | Plain language (say this) |
|---|---|
| "We'll use a `Dialog` component with `Sheet` on mobile" | "A popup form on desktop, slides up from bottom on mobile" |
| "The `useQuery` hook handles loading/error states" | "The screen shows a spinner while loading and an error message if it fails" |

## Starting

1. Read feature folder (`./plans/*/`). If multiple, list via `AskUserQuestion` and ask which feature. Check `./plans/<feature>/pipeline.md` for `## Rollback Notes` — if content, skip to Rollback Receiving.
2. Look for `discovery.md` and `prd.md`. If `prd.md` exists: extract every user story (each becomes a flow), use glossary terms for UI labels. If no `prd.md`: note gap — defined requirements produce better specs — proceed if user wants.
3. Explore existing UI patterns — component library, design system, nav, forms, notifications, empty states, error handling.
4. Search for design system docs, Storybook, component READMEs.

If `prd.md` exists: "I've read the PRD for [feature] and explored the existing UI. Stories include [list]. App uses [patterns]. First: [question about IA]."

## Interview Protocol

One decision at a time. Focus on what users see, do, experience.

Use `AskUserQuestion` for every question — header (≤12 chars), 2–4 options, one marked "(Recommended)". When user can't decide: push — reframe, explain tradeoffs, stronger recommendation. Record as assumption only when genuinely unresolvable. Revisit assumptions when later answers provide resolution.

### Code-first

Explore codebase before asking questions it could answer. Present as confirmation: "The app uses a dialog for creation flows. I'll follow that unless you say otherwise." When codebase has competing patterns, surface conflict and ask. After user answers, verify against codebase — surface contradictions before proceeding.

### Completeness tracking

Exhaust every branch depth-first. Resolve sub-questions before moving on. Only ask what codebase can't answer. No limit on questions; depth from more turns, not longer ones.

| # | Domain | Covers | Maps to |
|---|--------|--------|---------|
| 1 | Information architecture | Nav location, URL structure, IA impact | IA section |
| 2 | User flows | Per story: happy path + branches + error paths + terminal states. Mermaid for flows with 2+ branches. | Flows section |
| 3 | Screen inventory | Every screen with full state table (empty/loading/default/error/permission-denied/partial) | Screens section |
| 4 | Component mapping | Existing components to reuse, new ones needed, design system refs | Components section |
| 5 | Interactions & responsive | Triggers, behavior, feedback, undo, keyboard. Responsive breakpoint table (desktop/tablet/mobile). | Interaction + Responsive sections |
| 6 | Accessibility | By concern: focus management, keyboard nav, screen reader, visual | A11y section |
| 7 | Content & copy | Exact text, tone, character limits, i18n notes | Content section |
| 8 | Design references | Figma links, prototypes, external refs | References section |

### Interview checkpointing

After resolving each domain, append `<!-- progress: domain-N resolved -->` to the target section in `spec.md` (create file early if needed). On resume, detect markers and skip resolved domains. Remove markers when writing final spec.

### Upstream gap tracking

**Minor gaps** (missing AC details, edge cases): resolve inline, record in PRD Addendum.

**Missing user stories/AC**: note as assumption, continue, flag in PRD Addendum as "BLOCKING — backport to PRD before engineering."

**Contradictory requirements**: append to `## Rollback Notes` in `pipeline.md` with trigger, affected domains, design decisions to preserve. Roll back to `/product`.

**Fundamental scope ambiguity**: append to `## Rollback Notes` in `pipeline.md` with trigger, affected domains, decisions to preserve. Roll back to `/discovery`.

No technical implementation (schemas, APIs, architecture). Redirect: "Captured for technical design — let's stay on UX."

## Quality Gate

After all domains resolved, silent analysis before writing:

| Criterion | Check |
|-----------|-------|
| Story coverage | Every story from PRD maps to a flow |
| Error coverage | Every flow has happy path + error path |
| State tables | Every screen has state table with 5+ states |
| Component mapping | Components mapped to design system where possible |
| Accessibility | 4 concerns covered per interaction (focus, keyboard, screen reader, visual) |
| Content | Table covers all user-facing strings |
| Responsive | Breakpoints defined (desktop + mobile minimum) |
| Flow diagrams | Mermaid diagram for every flow with 2+ branches |

**Ready**: all criteria pass → write spec.
**Revise**: 1–2 criteria fail → reopen affected domains, then re-gate.
**Rethink**: 3+ criteria fail or structural issue → explain gaps, reopen domains.

## Output

Write `./plans/<feature>/spec.md` using template in `assets/spec-template.md`. Update `## Decisions Log` and `## Status` in `pipeline.md`.

Close with: "Review this and tell me what to change. When satisfied, run `/engineering`."

Update directly on change requests. No re-interview for minor adjustments. Flag conflicts with earlier decisions.

## Rollback

**Receiving**: Read `## Rollback Notes` in `pipeline.md` for trigger + affected domains + decisions to preserve. Resume only affected domains — do not re-interview resolved decisions. Update `spec.md`, clear notes, direct user to triggering skill.

**Triggering**: Contradictory requirements → `/product`. Fundamental scope ambiguity → `/discovery`.
