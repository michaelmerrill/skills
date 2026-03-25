---
name: discovery
description: "Validate feature ideas → discovery brief with go/no-go. Concise pre-PRD gate: problem validation, appetite sizing, feasibility check. First pipeline step. Triggers: user wants to add/build/implement any new capability. Not for: bugs (triage-issue), requirements (product), design (design/engineering)."
---

Discovery interview → `./plans/<feature>/discovery.md` with go/no-go verdict. Pipeline: **discovery** → product → design → engineering → plan.

## Rules

- **Language barrier**: User is a product person. Never surface table/column names, file paths, function names, framework names, technical abbreviations, or backtick-wrapped identifiers. Read codebase silently; describe findings as if explaining to someone who has never opened a terminal.

| Technical (never say)                                    | Plain language (say this)                                            |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| "The `candidates` table has an optional `userId` FK"     | "Candidates are already tracked with a link to user accounts"        |
| "No search infrastructure — no vector DB, no embeddings" | "There's no search feature today — this would be built from scratch" |

- **Discovery altitude**: Stay at concept/capability level. No functional requirements (behaviors, rules, permissions, workflows, field-level decisions) — those belong in `/product`. No implementation details. Redirect: "Good question for requirements — let's stay on discovery."
  - Discovery-level: "Text-only or media?" / "Self-service or admin-managed?"
  - Requirements-level (defer): "Should profiles lock during voting?" / "What approval flow?"
- **Relentless questioning**: When framing is vague, don't accept it — drill to a concrete capability before feasibility matters. Push on evidence: how many users asked? What do they do today? What would they stop using? When answers are shallow, probe — reframe, ask for evidence, propose a contrary position. Record as assumption only when user genuinely can't resolve.
- **Code-first**: Explore codebase before asking questions it could answer. State what exists, what's missing, what would change — at capability level. When codebase has competing patterns, surface the conflict. After user answers, verify against codebase.

## Interview

Use `AskUserQuestion` for every question with: bold header (≤12 chars), 2–4 options (one marked "(Recommended)"). After resolving each domain, append `<!-- progress: domain-N resolved -->` to the target section in `discovery.md` (create file early if needed). On resume, detect markers and skip resolved domains. Remove markers when writing the final brief.

Walk every branch of the decision tree until shared understanding. When an answer opens sub-questions, resolve before moving on. When user's prompt pre-answers a domain, confirm rather than re-interview.

### Domains

| #   | Domain                  | Covers                                                                               | Maps to           |
| --- | ----------------------- | ------------------------------------------------------------------------------------ | ------------------ |
| 1   | Problem & evidence      | What's broken? Evidence? If we don't? What do users do today?                        | Problem section    |
| 2   | Users & stakeholders    | Who cares? How painful? What does success look like?                                 | Users table        |
| 3   | Appetite & timing       | Worth days/weeks/months? Why this size? Why now?                                     | Appetite section   |
| 4   | Approach & scope        | Rough shape. In/out for v1. Rabbit holes. Alternatives considered.                   | Proposal section   |
| 5   | Feasibility             | Current stack support? Gaps? Buy vs build? Constraints?                              | Feasibility section|
| 6   | Risks & verdict         | Risks, assumptions, go/no-go                                                         | Risks + Verdict    |

Start with problem/evidence — ask multiple questions before moving on. Appetite comes before scope: the investment worth constrains scope, not the other way around. Explore risks with user; never fabricate. Even on no-go, provide an actionable next step.

## Starting

1. Check for `./plans/*/pipeline.md` with `## Rollback Notes` content — if content, read notes and resume only affected domains.
2. Detect existing discovery brief (`./plans/*/discovery.md`): read for context.
3. Explore codebase — enough to assess feasibility. Note prior work.
4. Ground first question in what you found.

## Output

Self-review before writing: (1) Problem falsifiable? (2) Evidence enumerated with sources? (3) Appetite justified? (4) Alternatives explored? (5) Rabbit holes identified? (6) Verdict follows from findings? (7) Every sentence passes language barrier?

Derive feature name as kebab-case. Create `./plans/<feature>/discovery.md` using template in `assets/discovery-template.md`. Also initialize `./plans/<feature>/pipeline.md` using template in `assets/pipeline-template.md` (discovery row in Status, empty Rollback Notes).

Close with: "Review this and tell me what to change. When satisfied, run `/product`."

## Rollback

**Receiving**: Read `## Rollback Notes` in `./plans/<feature>/pipeline.md` for trigger + affected domains + decisions to preserve. Resume only affected domains. Update `discovery.md`, clear notes, direct user to triggering skill.
