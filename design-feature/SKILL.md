---
name: design-feature
description: MUST USE when a user wants to create a technical design or architecture for a feature that has defined requirements. This is the technical design step in the planning pipeline (write-a-prd → review-prd → glossary → design-ux → design-feature → review-plan). Typical signals — "design this feature," "how should we build this," "create the technical design," "design-feature," "let's architect this," or following up after a write-a-prd, review-prd, glossary, or design-ux session. Also applies when the user has a PRD or clear requirements and wants to figure out the implementation approach. Conducts a structured interview to produce a technical design document. Do NOT use for scoping/feasibility (use plan-feature), writing requirements (use write-a-prd), UX design (use design-ux), reviewing plans (use review-plan), or when the user wants to start coding immediately without a design.
---

## What This Skill Does

Create a technical design for a feature whose requirements are already defined. Conduct a structured interview focused on HOW to build it — architecture, data models, integration patterns, edge case handling, and phased build plan. Product decisions are already made; this skill translates them into a buildable technical plan.

This is the technical design step in the planning pipeline (`plan-feature` → `write-a-prd` → `review-prd` → `glossary` → `design-ux` → **design-feature** → `review-plan`). The PRD established what to build. The UX spec (if it exists) established how users interact with it. This skill answers: "How do we build it?"

## Starting

### Check for prior context

Before asking anything:

1. Look for a PRD in `./plans/` matching the feature name (`*-prd.md`). If found, read it fully — the user stories, functional requirements, and scope are your design inputs.
2. Look for a scope document (`*-scope.md`). If found, read it for feasibility context, constraints, and high-level scope boundaries.
3. Look for a glossary (`*-glossary.md`). If found, read it fully — use the canonical terms when naming data models, API endpoints, modules, and variables throughout the design. If a glossary term has status "rename," the design should use the canonical term, not the current code name.
4. Look for a UX spec (`*-ux.md`). If found, read it fully — the user flows, screen inventory, component inventory, and interaction specs are your design inputs for the frontend layer. Each user flow maps to a behavior spec. Each screen/component maps to frontend architecture decisions. The UX spec defines what users see and do; your job is to define how the system implements it.
5. Explore the codebase thoroughly — tech stack, existing patterns, data models, auth approach, API conventions, testing patterns, deployment setup. You ARE designing the technical solution, so you need deep understanding.
6. Search for any existing documentation — architecture docs, ADRs, domain glossaries, process docs, READMEs. Every repo organizes these differently, so search rather than assuming paths.
7. If documentation and code disagree, note the discrepancy to surface during the interview.

If prior documents exist, ground your first question in them:

> "I've read the PRD for [feature], the UX spec, and explored the codebase. The requirements call for [key items]. The UX spec defines [N flows] across [N screens] using [component patterns]. The existing stack uses [tech details]. Let me start working through the technical design. First: [question about architecture/patterns]."

If no PRD exists, the skill still works — but note to the user that having defined requirements makes for a better design. If no UX spec exists, that's fine — the interview will cover frontend concerns as needed, but note that having a UX spec (from `/design-ux`) makes for better behavior specs. If no glossary exists, proceed without one, but be consistent in your naming choices and note any terminology decisions in the Decisions Log.

### No PRD? Works anyway.

This skill can operate without a PRD. If the user has clear requirements in their head or in the conversation, proceed with design. The interview will naturally draw out requirements as needed. However, if the requirements seem vague, suggest: "It might be worth running `/write-a-prd` first to nail down exactly what users need — but we can proceed and capture requirements as we go."

## Interview Protocol

Walk down each branch of the design tree one decision at a time. Leave nothing unresolved.

### One question per turn

Always use the `AskUserQuestion` tool to ask questions. Never present options as plain text.

Each call contains exactly one question with:
- `question`: the question, clearly stated
- `header`: short topic label (max 12 chars), e.g. "Architecture", "Data model", "API design"
- `options`: 2-4 concrete choices, each with a `label` (1-5 words) and `description` (trade-offs, implications)
- Put your recommended option first and append "(Recommended)" to its label
- `multiSelect`: set to `true` only when choices aren't mutually exclusive
- `preview`: use when comparing code snippets, ASCII mockups, or config examples

The user can always select "Other" to write in a custom answer — you don't need to include it.

Batching questions produces shallow answers. One question, fully resolved, then move on.

### When the user can't decide

If the user defers a decision ("I'm not sure", "whatever you think"), state your recommended choice explicitly and record it as an assumption in the plan. Do not stall the interview on a single unresolved question — capture it in Assumptions & Unknowns and move on.

### Code-first

Before asking anything the codebase could answer, look first. Present findings as confirmation:

> "I found that the project handles authentication via [pattern] in `[file]`. I'll follow the same approach here unless you say otherwise."

### Completeness tracking

Follow the natural conversation thread, but internally track whether you've resolved decisions across these domains:

1. **Architecture & patterns** — System design, service/module boundaries, API design. What new services, modules, or system components are needed? How do they fit into the existing architecture? What patterns from the codebase should be followed or intentionally deviated from? (Note: UI component decisions belong in the UX spec — this domain covers system-level boundaries.)
2. **Data & state** — What's created/read/updated/deleted? Models, schemas, migrations, state management. Where does state live (database, cache, session, client)?
3. **Core behavior (technical)** — Implementation approach for each user story or functional requirement from the PRD. Step-by-step: what happens in the system when the user performs each action?
4. **Edge cases & failure modes** — Race conditions, partial failures, concurrent access, error handling, data validation, boundary conditions. What breaks and how does the system respond?
5. **Integration & dependencies** — What existing systems does this touch? External services, third-party APIs, existing internal services? What are the integration contracts?
6. **Operational & rollout** — Backward compatibility, feature flags, database migrations, monitoring, performance budget, cost implications. How does this get safely into production?
7. **Security & access** — Permissions, trust boundaries, sensitive data handling, input validation, abuse prevention. What are the security implications of each design decision?
8. **Testing strategy** — Test approach per component. What needs unit tests, integration tests, end-to-end tests? Test data needs, mocking strategy, acceptance verification approach.
9. **Code design & boundaries** — Interfaces, abstractions, and dependency direction between components. Where should contracts exist between modules? Which dependencies should be injected vs. hardcoded? Where does the codebase already use patterns (repository pattern, strategy pattern, etc.) that this feature should follow? Coupling/cohesion tradeoffs — what should be easy to change later vs. locked down now?
10. **Phased build plan** — Vertical slices that each deliver working functionality. Dependency ordering between phases. Acceptance criteria per phase tied to decisions made during the interview.

These are a safety net, not a script. When the conversation winds down, check for gaps and fill them. Don't produce the plan until every domain has at least one decision.

### Dependencies and conflicts

Resolve upstream decisions before downstream ones — earlier choices constrain later ones. When a new decision invalidates an earlier one, flag it and propose an update.

When code, documentation, and stakeholder intent conflict, surface it explicitly. Classify as stale docs, incomplete implementation, intentional divergence, or unclear ownership. Confirm how to proceed before continuing — unresolved conflicts get captured in the plan.

### Wrapping up

When all domains are covered, verify PRD traceability before generating the document:

If a PRD exists, walk through every numbered functional requirement (FR-1, FR-2, ...) and user story. Verify each maps to at least one behavior spec or build phase entry in the design. If any are missing, surface them: "The PRD includes FR-3 (bulk invite) and the 'Remove Team Member' user story, but the design doesn't address either. Should I add them to the design or are they intentionally deferred?" Resolve gaps before producing the document.

Then say: "I think we have enough to draft the technical design. Let me put it together."

Save to `./plans/<feature-name>-design.md`. After writing, ask: "Review this and tell me what to change. When you're satisfied, run `/review-plan` to get a technical assessment."

When the user requests changes to the design, update the document directly. Do not re-enter the interview protocol for minor adjustments. If a requested change conflicts with an earlier decision, flag the conflict and confirm the resolution before updating.

## Technical Design Template

Include the sections below that are relevant to the feature. Omit any section that would just say "N/A" — keep the design focused.

```markdown
# Design: <Feature Name>

> Technical design for [<feature-name>-prd.md] (scope: [<feature-name>-scope.md], UX: [<feature-name>-ux.md])
> Output: <feature-name>-design.md
> Generated from design-feature interview on <date>

## Decisions Log

1. **<Topic>**: <Decision>. *Rationale: <why>*

## Data Models

### <ModelName>
- **Fields**: name, type, constraints
- **Relationships**: foreign keys, associations
- **Migration notes**: changes to existing models

Use whatever format matches the project's existing conventions.

## Behavior Specs

### <Behavior Name>
- **Trigger**: What initiates this
- **Steps**: What happens (numbered)
- **Result**: What the user sees
- **Variations**: Conditional paths

## Edge Cases & Failure Modes

| Scenario | Expected Behavior | Severity |
|----------|-------------------|----------|
| <what goes wrong> | <how system responds> | critical / warning / graceful |

## Scope

**In scope (v1):**
- ...

**Out of scope:**
- <thing> — <why deferred>

## Assumptions & Unknowns

- **Assumption**: <statement>. *Risk if incorrect: <impact>*
- **Unknown**: <question>. *Risk if incorrect: <impact>*

## Documentation Impact

- **Must update**: <docs that will become inaccurate>
- **New docs needed**: <new concepts requiring documentation>

## Source-of-Truth Conflicts

| Conflict | Sources | Classification | Resolution |
|----------|---------|---------------|------------|
| <description> | <files/docs> | stale docs / incomplete impl / intentional / unclear | <action> |

## Operational Considerations

- **Rollout strategy**: <approach>
- **Backward compatibility**: <impact>
- **Feature flags**: <needs>
- **Performance / cost**: <concerns>
- **Monitoring**: <what to observe>
- **Failure recovery**: <approach>

## Security & Access

- **Permissions affected**: <changes>
- **Sensitive data**: <handling>
- **Trust boundaries**: <changes>
- **Abuse risks**: <scenarios>

## Code Design & Boundaries

- **Key interfaces/abstractions**: <new contracts or boundaries introduced>
- **Dependency direction**: <what depends on what, injection points>
- **Patterns applied**: <existing codebase patterns followed, or new ones introduced with rationale>
- **Extension points**: <what's designed to be easy to change later>

## Testing Strategy

- **Unit tests**: <what to unit test and approach>
- **Integration tests**: <what to integration test and approach>
- **End-to-end tests**: <key user flows to test>
- **Test data**: <data needs, fixtures, factories>
- **Acceptance verification**: <how to verify the feature works as specified in the PRD>

## Phased Build Plan

### Phase 1: <Title>
**Depends on**: Nothing / Phase N
**Decisions**: #1, #2
**PRD coverage**: FR-1, FR-2, User Story: <name>
**What**: Description of this vertical slice
**Acceptance criteria**:
- [ ] Criterion 1
- [ ] Criterion 2

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| plan-feature | <date or "skipped"> | <verdict> | <summary> |
| write-a-prd | <date or "skipped"> | -- | <summary> |
| review-prd | <date or "skipped"> | <verdict> | <summary> |
| glossary | <date or "skipped"> | -- | <summary> |
| design-ux | <date or "skipped"> | -- | <summary> |
| design-feature | <date> | -- | Interview covered 10 technical domains |
```
