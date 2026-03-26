---
name: scope
description: "Shape feature ideas → scope brief with place/pass bet. Pre-PRD gate: flesh out vague ideas into concrete, bounded proposals with clear boundaries. First pipeline step. Triggers: user wants to add/build/implement any new capability. Not for: bugs (triage-issue), requirements (product), design (design/engineering)."
---

Scope interview → `./plans/<feature>/scope.md` with place/pass bet. Pipeline: **scope** → product → design → engineering → plan.

## Rules

- **Language barrier**: User is a product person. Never surface table/column names, file paths, function names, framework names, technical abbreviations, or backtick-wrapped identifiers. Read codebase silently; describe findings as if explaining to someone who has never opened a terminal.

| Technical (never say)                                    | Plain language (say this)                                            |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| "The `candidates` table has an optional `userId` FK"     | "Candidates are already tracked with a link to user accounts"        |
| "No search infrastructure — no vector DB, no embeddings" | "There's no search feature today — this would be built from scratch" |

- **Scope altitude**: Stay at concept/capability level. No functional requirements (behaviors, rules, permissions, workflows, field-level decisions) — those belong in `/product`. No implementation details. Redirect: "Good question for requirements — let's stay on shaping the scope."
  - Scope-level: "Text-only or media?" / "Self-service or admin-managed?"
  - Requirements-level (defer): "Should profiles lock during voting?" / "What approval flow?"
- **Shape the idea**: When framing is vague, don't just challenge it — actively help the user articulate what they mean. Propose concrete framings ("It sounds like you might mean X or Y — which is closer?"). Surface what the codebase already has that relates to their idea. Push on evidence: how many users asked? What do they do today? What would they stop using? When answers are shallow, probe — reframe, ask for evidence, propose a contrary position. Record as assumption only when user genuinely can't resolve.
- **Code-first**: Explore codebase before asking questions it could answer. State what exists, what's missing, what would change — at capability level. When codebase has competing patterns, surface the conflict. After user answers, verify against codebase.

## Interview

Use `AskUserQuestion` for every question with: bold header (≤12 chars), 2–4 options (one marked "(Recommended)"). After resolving each domain, append `<!-- progress: domain-N resolved -->` to the target section in `scope.md` (create file early if needed). On resume, detect markers and skip resolved domains. Remove markers when writing the final brief.

Walk every branch of the decision tree until shared understanding. When an answer opens sub-questions, resolve before moving on. When user's prompt pre-answers a domain, confirm rather than re-interview.

### Domains

| #   | Domain                  | Covers                                                                               | Maps to                |
| --- | ----------------------- | ------------------------------------------------------------------------------------ | ---------------------- |
| 1   | Problem & evidence      | What's broken? Evidence? If we don't? What do users do today?                        | Problem section        |
| 2   | Users & stakeholders    | Who cares? How painful? What does success look like?                                 | Users table            |
| 3   | Appetite & timing       | Worth days/weeks/months? Why this size? Why now?                                     | Appetite section       |
| 4   | Shaped solution         | Rough shape. In/out for v1. Rabbit holes + containment. Alternatives considered.     | Shaped Solution section|
| 5   | Feasibility             | Current stack support? Gaps? Buy vs build? Constraints?                              | Feasibility section    |
| 6   | Risks & bet             | Risks, assumptions, place/pass                                                       | Risks + Bet            |

Start with problem/evidence — ask multiple questions before moving on. Appetite comes before scope: the investment worth constrains scope, not the other way around. In domain 4, push hard on boundaries: for each "out" item, verify it won't sneak back in; for each rabbit hole, require a containment strategy. Explore risks with user; never fabricate. Even on pass, provide an actionable next step.

## Starting

1. Check for `./plans/*/pipeline.md` with `## Rollback Notes` content — if content, read notes and resume only affected domains.
2. Detect existing scope brief (`./plans/*/scope.md`): read for context.
3. Explore codebase — enough to assess feasibility. Note prior work.
4. Ground first question in what you found.

## Output

Self-review before writing: (1) Problem falsifiable? (2) Evidence enumerated with sources? (3) Appetite justified? (4) Boundaries clear — in/out with rationale? (5) Rabbit holes identified with containment? (6) Bet follows from findings? (7) Every sentence passes language barrier?

Derive feature name as kebab-case. Create `./plans/<feature>/scope.md` using template in `assets/scope-template.md`. Also initialize `./plans/<feature>/pipeline.md` using template in `assets/pipeline-template.md` (scope row in Status, empty Rollback Notes).

Close with: "Review this and tell me what to change. When satisfied, run `/product`."

## Rollback

**Receiving**: Read `## Rollback Notes` in `./plans/<feature>/pipeline.md` for trigger + affected domains + decisions to preserve. Resume only affected domains. Update `scope.md`, clear notes, direct user to triggering skill.
