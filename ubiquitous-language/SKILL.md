---
name: ubiquitous-language
description: MUST USE when the user wants to extract, define, or harden domain terminology before technical design. This is the terminology alignment step in the planning pipeline (write-a-prd → review-prd → ubiquitous-language → design-feature). Typical signals — "define the domain terms," "build a glossary," "harden the terminology," "ubiquitous language," "what should we call things," "align naming," or following up after a review-prd session. Also applies when a user just finished a PRD and wants to lock down vocabulary before design. This skill reads the PRD and the codebase quietly, then produces a glossary — it does NOT restart discovery, re-interview the user, or produce new documents beyond the glossary. Do NOT use for writing requirements (use write-a-prd), technical design (use design-feature), reviewing plans (use review-plan), or scoping (use plan-feature).
---

## What This Skill Does

Extract a DDD-style ubiquitous language glossary from a reviewed PRD and the codebase. Identify every domain term, flag ambiguities (same concept with different names, same name for different concepts), check how the codebase currently names things, and propose canonical terms with definitions.

This is the terminology alignment step in the planning pipeline (`plan-feature` → `write-a-prd` → `review-prd` → **ubiquitous-language** → `design-feature` → `review-plan`). The PRD established what to build. This skill answers: "What do we call things — and does everyone agree?"

## Why This Step Exists

Domain terminology drifts. The PRD says "workspace," the database calls it "org," the UI shows "team," and the API uses "account." When `design-feature` runs without a canonical vocabulary, it bakes naming inconsistencies into data models, API endpoints, and code constructs. Fixing terminology after design is expensive. Fixing it after implementation is worse.

This step creates a shared vocabulary that `design-feature` uses as its naming source of truth.

## Finding the PRD

Look for the PRD in this order:
1. If the user names a specific file, read that file.
2. Check `./plans/` for PRD files (`*-prd.md`). If there's exactly one, use it. If there are several, ask which one.
3. If the PRD was produced earlier in this conversation (via write-a-prd), use the conversation context.

If no PRD can be found, say so and stop. Do not fabricate a glossary without a source document.

### Check for scope document

Also look for a matching scope document (`*-scope.md`) in `./plans/`. If one exists, read it — additional domain context often surfaces during scoping.

## Analysis Process

Work through these steps before writing any output. Do the investigation silently — the user sees only the final glossary, not a play-by-play of your exploration.

### Step 1: Extract terms from the PRD

Read the PRD fully. Extract every noun and noun phrase that names a domain concept:
- Entities from user stories ("As a **team admin**, I want to **invite a member** to a **workspace**...")
- Objects from functional requirements ("The **subscription** must track **usage limits**...")
- Personas and roles ("**viewer**, **editor**, **owner**")
- States and transitions ("**pending invite**, **active member**, **suspended account**")
- Actions that imply domain operations ("**archive**, **publish**, **escalate**")

Collect every term, even if it seems obvious. Obvious terms are the ones most likely to have silent disagreements about meaning.

### Step 2: Check the codebase for existing naming

Search the codebase for each extracted term. Look at:
- Database models, schemas, and migrations
- API endpoint names and route definitions
- Type definitions and interfaces
- Variable and function names in core domain logic
- UI labels and copy (if accessible)
- Existing documentation, glossaries, or domain language files

For each term, record what the codebase currently calls it. Note divergences — the PRD says "workspace" but the code says "organization", the PRD says "invite" but the code says "add_member".

### Step 3: Detect ambiguities

Flag two categories of problems:

**Synonyms** — same concept, different names:
- PRD says "workspace" in user stories but "project" in functional requirements
- Code uses `org` but UI displays "Team"

**Homonyms** — same name, different concepts:
- "account" means a billing entity in one context and a user login in another
- "admin" means a system administrator in some places and a team administrator in others

### Step 4: Propose canonical terms

For each domain concept, propose a single canonical term. Consider:
- **User-facing consistency**: If users see the term in the UI, the canonical term should match what they see
- **Codebase momentum**: If the codebase already uses a term consistently, prefer it over a new name (renaming everything is expensive)
- **Precision**: Choose the term that most precisely describes the concept without ambiguity
- **Simplicity**: Shorter, more common words over jargon when equally precise

When the codebase term and PRD term disagree, recommend one and explain why. Don't try to keep both alive.

### Step 5: Write the glossary

Save to `./plans/<feature-name>-glossary.md` using the template below.

## Interaction Model

This skill minimizes user interaction. Do not:
- Re-interview the user about their domain
- Ask questions the codebase or PRD can answer
- Rewrite or revise the PRD

Ask a clarifying question **only** if:
- Two terms genuinely cannot be disambiguated from the PRD and codebase alone (e.g., "account" is used for two distinct concepts and context doesn't clarify which is primary)
- A critical domain concept appears in the PRD but has zero presence in the codebase, and you cannot determine if it's new or a renamed version of something existing

Limit yourself to 1-2 questions maximum. If you need more, the PRD likely needs revision — say so and stop.

## Glossary Template

```markdown
# Ubiquitous Language: <Feature Name>

> Domain glossary for [<feature-name>-prd.md]. Scope: [<feature-name>-scope.md] (if exists)
> Generated from ubiquitous-language analysis on <date>

## Glossary

| Term | Definition | Aliases | Code Name | Status |
|------|-----------|---------|-----------|--------|
| <canonical term> | <precise definition in domain context> | <other names used in PRD/code/UI> | <current name in codebase, or "new"> | canonical / rename / new |

### Status key
- **canonical**: Term and code name already match — no action needed
- **rename**: Code currently uses a different name — design should use the canonical term, implementation should rename
- **new**: No existing code representation — design should introduce using this term

## Ambiguities Resolved

### <Ambiguity title>
- **Problem**: <description of the naming conflict>
- **Resolution**: <which term was chosen and why>
- **Action**: <what needs to change — in code, PRD, or both>

## Naming Conventions

<Any patterns observed in the codebase that should guide naming of new terms — e.g., "models use singular nouns", "API routes use kebab-case plural", "UI copy uses title case">

## Pipeline Status

| Step | Date | Verdict | Key Findings |
|------|------|---------|--------------|
| plan-feature | <date or "skipped"> | <verdict> | <summary> |
| write-a-prd | <date or "skipped"> | -- | <summary> |
| review-prd | <date or "skipped"> | <verdict> | <summary> |
| ubiquitous-language | <date> | -- | <N> terms defined, <N> ambiguities resolved, <N> renames proposed |
```

## After Delivering the Glossary

After writing the glossary, say: "Review this and tell me what to change. When you're satisfied, run `/design-feature` to create the technical design — it will use these canonical terms for data models, APIs, and code."

When the user requests changes to the glossary, update the document directly. If a requested change would introduce a new ambiguity (e.g., using one term for two concepts), flag it before applying.

## Tone

Precise and pragmatic. You are a domain analyst establishing a shared vocabulary, not a linguist debating semantics. Every term recommendation should have a concrete reason — user-facing consistency, codebase momentum, or precision. Avoid bikeshedding on terms where the stakes are low.
