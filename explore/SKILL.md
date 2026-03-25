---
name: explore
description: "Scope and assess new feature ideas → living doc with go/no-go. Elaborates vague ideas into clear concepts. First pipeline step. Triggers: user wants to add/build/implement any new capability. Not for: bugs (triage-issue), requirements (define), design (design/architect)."
---

Vision & scope interview → scope section in living doc with go/no-go. Pipeline: **explore** → define → [design] → architect → plan.

## Rules

- **Language barrier**: User is a product person. Never surface table/column names, file paths, function names, framework names, technical abbreviations, or backtick-wrapped identifiers. Read codebase silently; describe findings as if explaining to someone who has never opened a terminal.

| Technical (never say)                                    | Plain language (say this)                                            |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| "The `candidates` table has an optional `userId` FK"     | "Candidates are already tracked with a link to user accounts"        |
| "No search infrastructure — no vector DB, no embeddings" | "There's no search feature today — this would be built from scratch" |

- **Scope altitude**: Stay at concept/capability level. No functional requirements (behaviors, rules, permissions, workflows, field-level decisions) — those belong in `/define`. No implementation details. Redirect: "Good question for requirements — let's stay on scope."
  - Scope-level: "Text-only or media?" / "Self-service or admin-managed?"
  - Requirements-level (defer): "Should profiles lock during voting?" / "What approval flow?"
- **Relentless questioning**: When framing is vague, don't accept it — drill to a concrete capability before feasibility matters. Push on evidence: how many users asked? What do they do today? What would they stop using? When answers are shallow, probe — reframe, ask for evidence, propose a contrary position. Record as assumption only when user genuinely can't resolve.
- **Code-first**: Explore codebase before asking questions it could answer. State what exists, what's missing, what would change — at capability level. When codebase has competing patterns, surface the conflict. After user answers, verify against codebase.

## Interview

Use `AskUserQuestion` for every question with: bold header (≤12 chars), 2–4 options (one marked "(Recommended)").

Walk every branch of the decision tree until shared understanding. When an answer opens sub-questions, resolve before moving on. When user's prompt pre-answers a domain, confirm rather than re-interview.

### Domains

| #   | Domain                  | Covers                                                                               |
| --- | ----------------------- | ------------------------------------------------------------------------------------ |
| 1   | Problem & motivation    | What problem? Why now? What if we don't? What evidence?                              |
| 2   | Stakeholders & success  | Who cares? Business case? How to measure?                                            |
| 3   | Feasibility             | Current stack support? Constraints? Buy vs build?                                    |
| 4   | High-level scope        | Capabilities in/out for v1. Size: days/weeks/months?                                 |
| 5   | Key risks & assumptions | Project-level risks (user-confirmed, not invented). Assumptions that might not hold? |
| 6   | Recommendation          | Go, no-go, or needs investigation?                                                   |

Start with problem/motivation — ask multiple questions before moving on. Explore risks with user; never fabricate. Even on no-go, provide an actionable next step.

## Starting

1. Check `## Rollback Notes` in any living doc in `./plans/` — if content, read notes and resume only affected domains.
2. Detect existing living doc (`./plans/*.md` with `## Scope`): read for context.
3. Explore codebase — enough to assess feasibility. Note prior work.
4. Ground first question in what you found.

## Output

Self-review before writing: (1) Problem falsifiable? (2) Risks user-confirmed? (3) Scope has clear in/out? (4) Recommendation follows from findings? (5) Every sentence passes language barrier?

Derive feature name as kebab-case. Create `./plans/<feature-name>.md` using template in `assets/living-doc-template.md`. Write `## Scope` with interview results. Initialize `## Decisions Log`, `## Rollback Notes` (empty), `## Pipeline Status`.

Close with: "Review this and tell me what to change. When satisfied, run `/define`."

## Rollback

**Receiving**: Read `## Rollback Notes` for trigger + affected domains + decisions to preserve. Resume only affected domains. Update `## Scope`, clear notes, direct user to triggering skill.
