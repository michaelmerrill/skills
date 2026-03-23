---
name: write-a-prd
description: MUST USE when a user wants to define product requirements, write a PRD, or specify what a feature should do from the user's perspective. This is the second step in the planning pipeline (plan-feature → write-a-prd → review-prd → glossary → design-feature). Typical signals — "write a PRD", "define the requirements", "what should this feature do", "let's spec this out", "write-a-prd", or following up after a plan-feature scoping session. Also applies when the user says "let's figure out the requirements" or "what exactly should we build." Conducts a structured interview to produce a product requirements document focused on WHAT to build, not HOW. Do NOT use for technical design (use design-feature), plan review (use review-plan), scoping/feasibility (use plan-feature), or when the user wants to challenge or critique an existing plan.
---

## What This Skill Does

Define detailed product requirements through a structured interview. Produce a PRD that specifies what to build from the user's perspective — user stories, functional requirements, success metrics, and scope boundaries. No technical design, no architecture, no data models.

This is the second step in the planning pipeline (`plan-feature` → **write-a-prd** → `review-prd` → `glossary` → `design-feature` → `review-plan`). The scope document (from plan-feature) established that this is worth building. This skill answers: "What exactly should we build, and how will we know it's right?"

## Starting

### Check for prior context

Before asking anything:

1. Look for a scope document in `./plans/` matching the feature name (`*-scope.md`). If found, read it fully — the problem statement, stakeholders, feasibility assessment, and high-level scope are your starting context. Acknowledge what's already been decided.
2. Explore the codebase to understand the product — existing user flows, UI patterns, terminology, and conventions. You're looking at this from a product perspective, not a technical one.
3. Search for any existing documentation — user guides, help docs, product specs, onboarding flows. Understanding the product as users experience it informs better requirements.

If a scope document exists, ground your first question in it:

> "I've read the scope document for [feature]. The problem is [X], the stakeholders are [Y], and the high-level scope includes [Z]. Let me start refining the requirements. First question: [question about target users/personas]."

If no scope document exists, that's fine — start from the user's description. Begin with problem and motivation to establish context, then move to users and requirements.

### No scope document? No problem.

This skill works standalone. If the user skips plan-feature, the interview will naturally cover problem context as part of Domain 1. The PRD will be complete on its own.

## Interview Protocol

This is a product discovery interview. Focus on user needs, behaviors, and success criteria — not on technical implementation.

### One question per turn

Each response contains exactly one question with:
- The question, clearly stated
- 2-4 concrete options when applicable
- Your recommended answer with a brief rationale
- An invitation to accept, modify, or reject

Batching questions produces shallow answers. One question, fully resolved, then move on.

### When the user can't decide

If the user defers a decision ("I'm not sure", "whatever you think"), state your recommended choice explicitly and record it as an assumption in the PRD. Do not stall the interview on a single unresolved question — capture it in Risks & Open Questions and move on.

### Code-first (product lens)

Before asking anything the codebase could answer, look first. But look through a product lens:

> "I can see the app currently shows [existing behavior] when users [action]. For this feature, should we extend that pattern or introduce something new?"

Focus on what users see and do today, not on internal architecture.

### Completeness tracking

Follow the natural conversation thread, but internally track whether you've resolved decisions across these domains:

1. **Problem & motivation** — Confirm or deepen understanding from the scope doc. What's the user pain point in their own words? What are they doing today instead?
2. **Target users & personas** — Who specifically will use this? Are there distinct user types with different needs? What's their technical sophistication? How frequently will they use this?
3. **User stories & jobs-to-be-done** — What are the key user stories (As a [user], I want [action], so that [outcome])? What job is the user hiring this feature to do?
4. **Functional requirements** — What must the feature do? Walk through each user story and define the expected behavior. What does the user see, click, and receive at each step?
5. **Non-functional requirements** — Performance expectations, accessibility needs, device/browser support, data retention, compliance requirements. Only include what's relevant.
6. **Success metrics & KPIs** — How will we know this feature is successful? What can we measure? What does "good" look like 30/60/90 days after launch?
7. **Scope definition** — Detailed in/out/future. For each "out" item, briefly explain why it's deferred. For each "future" item, explain what would trigger bringing it in.
8. **Dependencies & constraints (business)** — Business dependencies (pricing decisions, partner agreements, legal review), timing constraints (market window, customer commitments), content needs (copy, assets, translations).
9. **Risks & open questions** — Product risks (user adoption, competitive response, cannibalization), open questions that need answers before or during implementation.

These are a safety net, not a script. The interview should feel thorough but natural. Do not limit the number of questions — be relentless in pursuing complete understanding. Keep probing until you and the user have a thorough, shared picture of every requirement, edge case, and constraint. When you think the conversation is winding down, actively check for gaps and fill them. Don't produce the PRD until every domain has at least one decision.

### Staying in the product lane

This is NOT the place for:
- Database schemas or data models
- API design or endpoint definitions
- Architecture decisions
- Build phases or implementation ordering
- Technology selection
- Operational concerns (monitoring, deployment, feature flags)

If the user starts going into technical implementation, gently redirect: "That's an important implementation detail — let's capture it as a note for the design phase. For now, I want to make sure we've nailed down what users need to see and do."

### Wrapping up

When all domains are covered, say: "I think we have enough to draft the PRD. Let me put it together."

If a scope document exists in `./plans/`, match its naming prefix for the PRD filename (e.g., if the scope is `team-billing-scope.md`, save the PRD as `team-billing-prd.md`). If no scope doc exists, derive the feature name as kebab-case from the core concept (2-3 words) and confirm with the user before saving.

Save to `./plans/<feature-name>-prd.md`. After writing, ask: "Review this and tell me what to change. When you're satisfied, run `/review-prd` to get a requirements assessment."

When the user requests changes to the PRD, update the document directly. Do not re-enter the interview protocol for minor adjustments. If a requested change conflicts with an earlier decision, flag the conflict and confirm the resolution before updating.

## PRD Template

Include the sections below that are relevant to the feature. Omit any section that would just say "N/A" — keep the PRD focused.

```markdown
# PRD: <Feature Name>

> Product requirements for [feature]. Scope: [<feature-name>-scope.md] (if exists)
> Generated from write-a-prd interview on <date>

## Problem Statement

What user problem this solves, stated from the user's perspective. What they're doing today and why it's painful.

## Target Users

### <Persona Name>
- **Who**: Description
- **Current behavior**: What they do today
- **Key need**: What they need from this feature
- **Usage frequency**: How often they'll use this

## User Stories

### <Story Name>
- **As a** <persona>, **I want** <action>, **so that** <outcome>
- **Acceptance criteria**:
  - [ ] <criterion from the user's perspective>
  - [ ] <criterion from the user's perspective>

## Functional Requirements

### <Requirement Area>
- FR-1: <requirement statement>
- FR-2: <requirement statement>

## Non-Functional Requirements

- NFR-1: <requirement> (e.g., "Page loads in under 2 seconds on 3G")
- NFR-2: <requirement>

## Success Metrics

| Metric | Target | Measurement Method | Timeframe |
|--------|--------|--------------------|-----------|
| <metric> | <target value> | <how measured> | <30/60/90 days> |

## Scope

**In scope (v1):**
- ...

**Out of scope:**
- <thing> — <why deferred>

**Future (conditional):**
- <thing> — <trigger for inclusion>

## Dependencies & Constraints

- **Dependency**: <statement>. *Status: <resolved/pending>*
- **Constraint**: <statement>. *Impact: <what this limits>*

## Risks & Open Questions

- **Risk**: <statement>. *Mitigation: <approach>*
- **Open question**: <question>. *Needed by: <when>. Impact if unresolved: <consequence>*

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| plan-feature | <date or "skipped"> | <verdict> | <summary> |
| write-a-prd | <date> | -- | Interview covered 9 product domains |
```
