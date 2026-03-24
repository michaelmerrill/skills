---
name: design-ux
description: MUST USE when a user wants to design user flows, interaction patterns, or screen-level UX for a feature that has defined requirements. This is the UX design step in the planning pipeline (write-a-prd → review-prd → glossary → design-ux → design-feature → review-plan). Typical signals — "design the UX," "how should users interact with this," "what should the UI look like," "design the flows," "design-ux," "what screens do we need," or following up after a review-prd or glossary session. Also applies when the user has a PRD and wants to figure out the user experience before technical design. Conducts a structured interview to produce a UX specification — user flows, screen inventory, component mapping, interaction specs, and accessibility requirements. Do NOT use for technical design (use design-feature), writing requirements (use write-a-prd), reviewing plans (use review-plan), scoping/feasibility (use plan-feature), or when the feature has no user-facing UI (API-only, backend, CLI tools).
---

## What This Skill Does

Design the user experience for a feature whose requirements are already defined. Conduct a structured interview focused on HOW USERS INTERACT with it — flows, screens, states, components, accessibility, and content. Product decisions are already made (PRD); this skill translates them into a concrete interaction specification that technical design consumes.

This is the UX design step in the planning pipeline (`plan-feature` → `write-a-prd` → `review-prd` → `glossary` → **design-ux** → `design-feature` → `review-plan`). The PRD established what to build. This skill answers: "How do users experience it?"

This skill does NOT define:
- Data models, API contracts, or system architecture (that's design-feature)
- Visual design — colors, spacing, typography, illustrations (that's the design system / Figma)
- Product requirements or acceptance criteria (that's write-a-prd)

## When to Skip

This skill is optional. Skip it when:
- The feature is API-only or backend-only (no user-facing UI)
- The feature is a CLI tool or developer-facing utility
- The feature exactly replicates an existing UI pattern with no new interactions
- The change is a config update, copy change, or bug fix

## Starting

### Check for prior context

Before asking anything:

1. Look for a PRD in `./plans/` matching the feature name (`*-prd.md`). If found, read it fully — the user stories, functional requirements, personas, and scope are your design inputs. Extract every user story — each one becomes a flow to design.
2. Look for a scope document (`*-scope.md`). If found, read it for context on what's in/out of scope.
3. Look for a glossary (`*-glossary.md`). If found, read it fully — use the canonical terms for all UI labels, button text, navigation items, error messages, and help text throughout the UX spec. If a glossary term has status "rename," the UX spec should use the canonical term, not the current name.
4. Explore the codebase for existing UI patterns — component library, design system, existing screens, navigation structure, form patterns, notification patterns, empty states, error handling patterns. You need to understand what exists so you can reuse it.
5. Search for design system documentation, Storybook configs, component READMEs, style guides, or UI pattern libraries. Look for `src/components/ui/`, `src/components/`, Storybook files, Tailwind config, or similar.
6. If the codebase has no UI (pure backend, CLI), tell the user: "This project doesn't appear to have a user-facing UI. If you're designing a new frontend, let's proceed. Otherwise, you might skip this step and go straight to `/design-feature`."

If a PRD exists, ground your first question in it:

> "I've read the PRD for [feature] and explored the existing UI. The requirements include [key user stories]. The app currently uses [UI patterns/component library]. Let me start working through the UX design. First: [question about entry points/navigation]."

If no PRD exists, the skill still works — but note to the user that having defined requirements produces a better UX spec. If no glossary exists, that's fine — be consistent in naming choices and note any terminology decisions made during the interview.

### No PRD? Works anyway.

This skill can operate without a PRD. If the user has clear requirements in their head or in the conversation, proceed with design. However, if the requirements seem vague, suggest: "It might be worth running `/write-a-prd` first to nail down what users need — but we can proceed and capture requirements as we go."

## Interview Protocol

Walk through each aspect of the user experience one decision at a time. Focus on what users see, do, and experience — not on how the system implements it.

### One question per turn

Always use the `AskUserQuestion` tool to ask questions. Never present options as plain text.

Each call contains exactly one question with:
- `question`: the question, clearly stated
- `header`: short topic label (max 12 chars), e.g. "Navigation", "Layout", "Flow"
- `options`: 2-4 concrete choices, each with a `label` (1-5 words) and `description` (trade-offs, implications)
- Put your recommended option first and append "(Recommended)" to its label
- `multiSelect`: set to `true` only when choices aren't mutually exclusive
- `preview`: use when comparing ASCII mockups or layout options

The user can always select "Other" to write in a custom answer — you don't need to include it.

Batching questions produces shallow answers. One question, fully resolved, then move on.

### When the user can't decide

If the user defers a decision ("I'm not sure", "whatever you think"), state your recommended choice explicitly and record it as an assumption in the UX spec. Do not stall the interview on a single unresolved question — capture it in Assumptions & Open Questions and move on.

### Code-first

Before asking anything the codebase could answer, look first. Present findings as confirmation:

> "I found that the app uses a `<Dialog>` component in `src/components/ui/dialog.tsx` for creation flows. The team settings page uses tabs for sub-navigation. I'll follow these patterns unless you say otherwise."

### Completeness tracking

Follow the natural conversation thread, but internally track whether you've resolved decisions across these domains:

1. **Entry points & navigation** — Where does the user first encounter this feature? How do they get to it? Does it add new navigation items, modify existing ones, or live within an existing page? What's the information architecture impact?
2. **Core user flows** — For each user story in the PRD: what is the step-by-step interaction sequence? Entry point, each user action, each system response, all branches (success, error, validation failure, edge cases). These are the core deliverable.
3. **Screen/view inventory** — Every distinct screen, page, modal, panel, or view this feature introduces or modifies. For each: purpose, key content areas, primary actions available.
4. **State coverage** — For every screen: what does empty state look like (no data yet)? Loading state? Error state (data fetch failed)? Success state? Partial state (some data, not all)? Are there permission-based variations (viewer vs admin)?
5. **Component mapping** — What existing components from the codebase/design system can be reused? What new components are needed? For new components: what's the closest existing pattern to follow?
6. **Interaction details** — Edge case interactions beyond the main flows: bulk actions, keyboard navigation, responsive/mobile behavior, drag-and-drop, real-time updates, optimistic UI, undo/redo.
7. **Accessibility** — Focus management (modals, drawers), keyboard navigation paths, screen reader announcements, color-independent status indicators, touch targets, reduced motion support.
8. **Content & copy** — Key labels, button text, error messages, help text, placeholder text, confirmation messages, empty state messaging. What tone/voice guidelines exist?

These are a safety net, not a script. The interview should feel thorough but natural. Do not limit the number of questions — be relentless in pursuing complete understanding. Keep probing until you and the user have a thorough, shared picture of every screen, flow, state, and interaction. When you think the conversation is winding down, actively check for gaps and fill them. Don't produce the UX spec until every domain has at least one decision.

### Upstream gap tracking

During the interview, track any gaps found in the PRD:

**Minor gaps** (resolvable inline): Missing acceptance criteria details, unspecified behavior for an edge case, filter types not enumerated. Resolve these during the UX interview by discussing with the user. Record them in the PRD Addendum section of the output so the user can backport to the PRD.

**Major gaps** (blocking): Missing user stories for flows you need to design, personas that lack context needed for UX decisions (device type, accessibility needs, expertise level), fundamental scope ambiguity. When you hit a major gap, surface it immediately:

> "The PRD doesn't include a user story for [scenario], but designing the [flow] requires knowing whether users can [action]. I'd recommend pausing here and updating the PRD with `/write-a-prd` or `/review-prd` before we continue. Alternatively, we can make an assumption and note it — what do you prefer?"

If the user wants to proceed with assumptions, record them clearly. If major gaps accumulate (3+), recommend pausing the UX interview to address upstream requirements first.

### Staying in the UX lane

This is NOT the place for:
- Database schemas or data models
- API design or endpoint definitions
- System architecture or service boundaries
- Build phases or implementation ordering
- Technology selection or framework decisions
- Performance budgets or infrastructure concerns

If the user starts going into technical implementation, gently redirect: "That's an important implementation detail — let's capture it as a note for the technical design phase. For now, I want to make sure we've nailed down how users experience this."

### Wrapping up

When all domains are covered, verify PRD traceability before generating the document:

If a PRD exists, walk through every user story. Verify each maps to at least one user flow in the UX spec. If any are missing, surface them: "The PRD includes 'Remove Team Member' but we haven't designed that flow. Should I add it or is it deferred?" Resolve gaps before producing the document.

Then say: "I think we have enough to draft the UX spec. Let me put it together."

If a scope document or PRD exists in `./plans/`, match its naming prefix for the UX spec filename (e.g., if the PRD is `team-billing-prd.md`, save the UX spec as `team-billing-ux.md`). If no prior doc exists, derive the feature name as kebab-case from the core concept (2-3 words) and confirm with the user before saving.

Save to `./plans/<feature-name>-ux.md`. After writing, ask: "Review this and tell me what to change. When you're satisfied, run `/design-feature` to create the technical design — it will pick up this UX spec automatically."

When the user requests changes to the UX spec, update the document directly. Do not re-enter the interview protocol for minor adjustments. If a requested change conflicts with an earlier decision, flag the conflict and confirm the resolution before updating.

## UX Spec Template

Include the sections below that are relevant to the feature. Omit any section that would just say "N/A" — keep the spec focused.

```markdown
# UX: <Feature Name>

> UX specification for [<feature-name>-prd.md] (scope: [<feature-name>-scope.md])
> Output: <feature-name>-ux.md
> Generated from design-ux interview on <date>

## Decisions Log

1. **<Topic>**: <Decision>. *Rationale: <why>*

## Information Architecture

Where this feature lives in the product navigation and page hierarchy.

- **Location**: <path through navigation>
- **New nav items**: <what's added, if any>
- **Changes to existing nav**: <what moves or changes>

## User Flows

### <Flow Name> (maps to: <User Story from PRD>)
**Entry point**: <where the user starts>
**Precondition**: <what must be true>

1. User <action>
2. System <response>
   - **Success**: <what happens>
   - **Error — <type>**: <what the user sees>
   - **Loading**: <what the user sees while waiting>
3. User <next action>
4. ...

### <Flow Name>
...

## Screen Inventory

### <Screen/View Name>
- **Purpose**: What this screen is for
- **Entry points**: How users get here
- **States**:
  - **Empty**: <description and messaging>
  - **Loading**: <description>
  - **Default**: <description of populated state>
  - **Error**: <description and recovery action>
  - **Permission variants**: <what changes by role, if applicable>
- **Key content areas**: <what information is displayed>
- **Primary actions**: <what users can do from here>

### <Screen/View Name>
...

## Component Inventory

| Component | Exists? | Source | Notes |
|-----------|---------|--------|-------|
| <component name> | Yes | <file path or library> | Reuse as-is / Extend with <variant> |
| <component name> | No | — | New — follows <existing pattern> |

## Interaction Specs

### <Interaction Name>
- **Trigger**: <what initiates this>
- **Behavior**: <what happens step by step>
- **Keyboard**: <keyboard interaction, if applicable>
- **Responsive**: <how it adapts to smaller screens, if applicable>

## Accessibility

- **Focus management**: <how focus moves for modals, drawers, dynamic content>
- **Keyboard navigation**: <tab order, shortcuts, arrow key behavior>
- **Screen reader**: <announcements, live regions, aria labels>
- **Visual**: <color-independent indicators, contrast, motion preferences>

## Content & Copy

### Key Labels & Text
| Element | Text | Notes |
|---------|------|-------|
| <button/label/heading> | <exact text> | <context or variant> |

### Error Messages
| Scenario | Message | Recovery Action |
|----------|---------|-----------------|
| <what went wrong> | <exact message text> | <what user can do> |

### Empty States
| Screen | Message | CTA |
|--------|---------|-----|
| <screen name> | <message text> | <action button text and target> |

## External Design References

| Screen | Tool | Link | Status |
|--------|------|------|--------|
| <screen name> | Figma / v0 / other | <link> | Draft / Final |

## Assumptions & Open Questions

- **Assumption**: <statement>. *Impact if wrong: <consequence>*
- **Open question**: <question>. *Needed by: <when>. Affects: <which flows/screens>*

## PRD Addendum

Gaps discovered during UX design that were resolved inline. Backport these to the PRD.

- **<FR-NEW-N or US-N update>**: <description of the gap and how it was resolved>

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| plan-feature | <date or "skipped"> | <verdict> | <summary> |
| write-a-prd | <date or "skipped"> | -- | <summary> |
| review-prd | <date or "skipped"> | <verdict> | <summary> |
| glossary | <date or "skipped"> | -- | <summary> |
| design-ux | <date> | -- | Interview covered 8 UX domains |
```
