---
name: plan-feature
description: MUST USE when a user describes wanting to add, build, or implement a new feature or capability in their software. This is the first step in the planning pipeline — it conducts a lightweight scoping interview to assess feasibility, identify risks, and produce a go/no-go recommendation. Typical signals — user mentions adding webhooks, notifications, i18n, autosave, referral programs, custom reports, dashboards, search, or ANY new functionality. Applies whether the user says "plan this" or simply states the feature idea. Applies even when the user provides extensive detail — having details doesn't mean they have a scope assessment. Do NOT use for bug fixes, PR reviews, deployments, doc updates, explaining existing code, writing PRDs (use write-a-prd), technical design (use design-feature), or when the user points to an existing PRD/spec file to execute.
---

## What This Skill Does

Assess whether a proposed feature is worth pursuing and feasible to build. Conduct a short structured interview to understand the problem, stakeholders, feasibility, scope boundaries, and key risks. Produce a scope document with a go/no-go recommendation.

This is the first step in the planning pipeline (`plan-feature` → `write-a-prd` → `review-prd` → `glossary` → `design-feature` → `review-plan`). This skill answers: "Should we build this, and can we?" The later skills handle what exactly to build (PRD) and how to build it (design).

## Starting

Accept the user's idea — it can be one sentence or several paragraphs. Before asking anything:

1. Explore the codebase to understand the tech stack, existing patterns, and high-level architecture — enough to assess feasibility, not to design a solution.
2. Search for any existing documentation — architecture docs, ADRs, domain glossaries, process docs, READMEs. Every repo organizes these differently, so search rather than assuming paths.
3. If you find prior work related to this feature (partial implementations, abandoned branches, related features), note it to surface during the interview.

Ground your first question in what you found. Start with problem and motivation: what problem does this solve, and why now?

## Interview Protocol

This is a scoping interview, not a design session. Keep it focused on whether to proceed, not on how to build it.

### One question per turn

Each response contains exactly one question with:
- The question, clearly stated
- 2-4 concrete options when applicable
- Your recommended answer with a brief rationale
- An invitation to accept, modify, or reject

Batching questions produces shallow answers. One question, fully resolved, then move on.

### When the user can't decide

If the user defers a decision ("I'm not sure", "whatever you think"), state your recommended choice explicitly and record it as an assumption in the scope document. Do not stall the interview on a single unresolved question — capture it in Key Risks & Assumptions and move on.

### Code-first

Before asking anything the codebase could answer, look first. Present findings as confirmation:

> "I can see the project uses [framework] with [database]. The existing [related area] is handled via [pattern] in `[file]`. This looks feasible to extend — unless you see a constraint I'm missing?"

Focus codebase exploration on feasibility signals: Does the architecture support this? Are there blocking constraints? Is there related prior work?

### Completeness tracking

Follow the natural conversation thread, but internally track whether you've resolved decisions across these domains:

1. **Problem & motivation** — What problem does this solve? Why now? What happens if we don't build it? Is this validated by user feedback, business metrics, or intuition?
2. **Stakeholders & impact** — Who cares about this? Who are the users? What's the business justification? Are there internal stakeholders with opinions?
3. **Feasibility** — Is this technically possible with the current stack? Are there architectural constraints or prerequisites? Are there existing third-party solutions or libraries that address this — should we evaluate buy/integrate before build?
4. **High-level scope** — What's roughly in for v1? What's clearly out? Are there natural phase boundaries?
5. **Key risks & assumptions** — What are the project-level risks? What are we assuming that might not be true? Are there dependencies on external factors (third-party services, other teams, business decisions)?
6. **Recommendation** — Given the above, should this proceed? Go, no-go, or needs further investigation?

These are a safety net, not a script. The interview should feel natural. Do not limit the number of questions — be relentless in pursuing complete understanding. Keep probing until you and the user have a thorough, shared picture of the problem, the constraints, and the right thing to build. When you think the conversation is winding down, actively check for gaps and fill them. Don't produce the scope document until every domain has at least one decision.

### Keeping it light

This is NOT the place for:
- Detailed data models or schemas
- API design or behavior specifications
- Edge case enumeration
- Integration architecture
- Operational runbooks or rollout strategies
- Testing strategies

If the user starts going deep on implementation details, gently redirect: "That's a great detail — let's capture it as context for the PRD and design phases. For now, I want to make sure the scope and feasibility picture is clear."

### Dependencies and conflicts

When code, documentation, and stakeholder intent conflict, surface it explicitly. Classify as stale docs, incomplete implementation, intentional divergence, or unclear ownership. These conflicts are important feasibility signals.

### Wrapping up

When all domains are covered, say: "I think we have enough for the scope assessment. Let me put it together."

Derive the feature name as kebab-case from the core concept (2-3 words, e.g., "team-billing", "dashboard-sharing"). Confirm with the user before saving: "I'll save this as `plans/team-billing-scope.md` — all subsequent pipeline documents will use the `team-billing` prefix. Sound right?"

Save to `./plans/<feature-name>-scope.md`. After writing, ask: "Review this and tell me what to change. When you're ready, run `/write-a-prd` to define detailed requirements."

When the user requests changes to the scope document, update the document directly. Do not re-enter the interview protocol for minor adjustments.

## Scope Document Template

Include the sections below that are relevant. Omit any section that would just say "N/A" — keep the scope document focused.

```markdown
# Scope: <Feature Name>

> Generated from plan-feature scoping interview on <date>

## Problem Statement

What problem this solves, why it matters now, and what happens if we don't build it.

## Stakeholders

- **Users**: Who uses this and why they care
- **Business**: Why this matters to the business
- **Internal**: Teams or individuals with opinions or dependencies

## Feasibility Assessment

- **Technical feasibility**: Can the current stack support this? Key constraints or prerequisites.
- **Prior work**: Existing code, abandoned attempts, or related features that inform feasibility.

## High-Level Scope

**Likely in for v1:**
- ...

**Likely out for v1:**
- <thing> — <why deferred>

**Needs investigation:**
- <thing> — <what we need to learn>

## Key Risks & Assumptions

- **Risk**: <statement>. *Likelihood: high/medium/low. Impact: <what happens>*
- **Assumption**: <statement>. *If wrong: <consequence>*

## Recommendation

**Verdict**: Go / No-Go / Investigate Further

<1-2 paragraph rationale for the recommendation, summarizing the key factors.>

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| plan-feature | <date> | <Go/No-Go/Investigate> | Scoping interview covered 6 domains |
```

## Interaction After Scope

If the user asks follow-up questions about the scope document, answer them directly. If they want to dive into requirements or technical design, direct them:
- For requirements: "Run `/write-a-prd` to define detailed product requirements."
- For technical design: "Run `/write-a-prd` first to nail down requirements, then `/design-feature` for technical design."
