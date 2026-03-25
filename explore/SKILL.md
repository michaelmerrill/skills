---
name: explore
description: "Scope and assess new feature ideas → living doc with go/no-go. Elaborates vague ideas into clear concepts. First pipeline step. Triggers: user wants to add/build/implement any new capability. Not for: bugs (triage-issue), requirements (define), design (design/architect)."
---

Vision & scope interview → scope section in living doc with go/no-go. Pipeline: **explore** → define → [design] → architect → plan.

## Language barrier

The user is a product person, not an engineer. Everything you say must make sense to someone who has never seen the codebase. This is the single most important rule in this skill — it applies to every question, every feasibility statement, every summary.

**What to never surface:**
- Table names, column names, foreign keys, schema terms (`candidates`, `userId`, `FK`)
- File paths, function names, service names (`repository.ts`, `CandidacyService`)
- Framework/library names (`Drizzle`, `Effect`, `Better Auth`, `NeonDB`)
- Technical abbreviations (`FK`, `PK`, `ORM`, `SQL`)
- Internal project documents by technical name ("the migration plan", "the ADR")
- Code-formatted terms (backtick-wrapped identifiers)

**How to translate:** Read the codebase silently. Then describe what you found as if explaining to someone who has never opened a terminal.

| Bad (technical) | Good (plain language) |
|---|---|
| "The `candidates` table has an optional `userId` FK" | "Candidates are already tracked in the system with a link to user accounts" |
| "The migration plan left billing out of scope" | "Billing was intentionally deferred when the app was first built" |
| "Better Auth has an organization plugin with RBAC" | "The app already has organizations with roles" |
| "No search infrastructure — no vector DB, no embeddings" | "There's no search feature today — this would be built from scratch" |

When in doubt, ask yourself: "Would a board president or nonprofit treasurer understand this sentence?" If not, rephrase.

## Starting

Accept the user's idea. Before asking anything:

1. Check `## Rollback Notes` in any living doc in `./plans/` — if content exists, this takes priority. Read notes, skip steps 2-5, resume only affected domains.
2. Detect state in `./plans/`:
   - Existing living doc (`./plans/*.md` with `## Scope`): read for context.
3. Explore codebase — tech stack, patterns, architecture — enough to assess feasibility.
4. Search for existing docs — architecture docs, ADRs, glossaries, READMEs.
5. Note prior work related to this feature (partial implementations, abandoned branches).

Ground first question in what you found. Start with problem and motivation.

## Interview Protocol

Vision & scope interview, not requirements or design session. Stay at the capability level — define handles functional requirements.

### Question format

Use `AskUserQuestion` for every question. Each question must have:
- **Bold header** (≤12 chars) — a short label for the topic
- **2–4 numbered options** — each starting with a bold label
- **One option marked "(Recommended)"**

Example of a well-formed question:

```
**Content type**

Should profiles be text-only, or also support photos?

1. **Text only** — a written bio or statement, simplest to start (Recommended)
2. **Text + photo** — bio plus a profile photo
3. **Rich content** — text, photos, links, endorsements
```

When user can't decide: push — reframe the question, explain tradeoffs, give a stronger recommendation. Record as assumption only when the user genuinely can't resolve it — not after a fixed attempt count. Revisit assumptions when later answers provide resolution.

### Code-first

Explore codebase before asking questions it could answer. Sufficient exploration: you can state what exists, what's missing, and what would need to change — at capability level, not implementation. Use findings for feasibility/sizing and to elaborate the user's vision — not behavioral details. Present as confirmation: "This looks feasible to extend from what's already there — unless you see a constraint?" When codebase has competing patterns for the same concern, surface the conflict and ask user which to follow — don't silently pick one. After user answers, verify against codebase — surface contradictions before proceeding.

Remember: all codebase findings must pass through the language barrier. Never present raw technical details — always translate to plain language first.

### Completeness tracking

Walk every branch of the decision tree until shared understanding — not a checklist. When an answer opens sub-questions, resolve them before moving on. When an answer is shallow or unsubstantiated, probe: reframe, ask for evidence, propose a contrary position. If codebase answers a question, confirm with user and mark resolved. No question limit; depth from more turns, not longer ones. When user's initial prompt pre-answers a domain, confirm rather than re-interview: "Based on what you described, [X]. Correct?"

| # | Domain | Covers | Does NOT cover |
|---|--------|--------|----------------|
| 1 | Problem & motivation | What problem? Why now? What if we don't? What evidence exists? | |
| 2 | Stakeholders & success | Who cares? Business case? How will you measure success? | Permissions, access control |
| 3 | Feasibility | Current stack support? Constraints? Buy vs build? | Implementation details |
| 4 | High-level scope | Capabilities in/out for v1. Size: days/weeks/months? | Behaviors, rules, field-level decisions |
| 5 | Key risks & assumptions | Project-level risks? Assumptions that might not hold? External deps? | |
| 6 | Recommendation | Go, no-go, or needs investigation? | |

### Scope altitude

Stay at concept/capability level. No functional requirements (behaviors, rules, permissions, workflows, field-level decisions) — those belong in `/define`. No implementation details (data models, APIs, architecture). Redirect: "Good question for requirements — let's stay on scope."

**Scope-level** (ask): "Text-only or media?" / "Self-service, admin-managed, or both?"
**Requirements-level** (defer): "Should profiles lock during voting?" / "What approval flow?"

### Dependencies and conflicts

When code, docs, and intent conflict, surface it. Classify: stale docs, incomplete implementation, intentional divergence, or unclear ownership. Technical pattern conflicts (competing approaches in codebase): note in feasibility, defer resolution to `/architect`.

## Wrapping Up

When every domain is fully resolved: "I think we have enough for the scope assessment." Confirm you explored risks/assumptions with the user — don't invent them.

### Self-review (silent)
Before writing: audit all recorded assumptions — resolve any that later context now answers. If an answer in a later domain invalidates an earlier one, reopen that domain before proceeding. Then: (1) Is the problem statement falsifiable? (2) Are risks user-confirmed, not agent-invented? (3) Does scope have clear in/out boundaries? (4) Does the recommendation follow logically from findings? (5) Does every sentence pass the language barrier — no table names, file paths, framework names, or technical abbreviations? Fix issues silently before writing.

### Save and hand off

Derive feature name as kebab-case (2-3 words). Confirm: "I'll save as `plans/<name>.md` — all pipeline skills will update this file."

Create `./plans/<feature-name>.md` using the template in `assets/living-doc-template.md`. Write `## Scope` with interview results. Initialize `## Decisions Log`, `## Rollback Notes` (empty), and `## Pipeline Status`.

After writing, always close with: "Review this and tell me what to change. When satisfied, run `/define`." This handoff is mandatory — every explore session must end by directing the user to `/define`. Update directly on change requests. No re-interview for minor adjustments. For design questions: "Run `/define` first, then `/architect`."

## Rollback

**Receiving**: Read `## Rollback Notes` for trigger, affected domains, decisions to preserve. Resume only affected domains — do not re-interview resolved decisions. Update `## Scope`, clear `## Rollback Notes`, direct user back to triggering skill.

**Triggering**: Not applicable — first pipeline step.
