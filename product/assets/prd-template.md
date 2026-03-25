<!-- Product Requirements Document. Create as ./plans/<feature-name>/prd.md -->
<!-- Standalone PRD. Downstream: design reads for UX flows, engineering reads for technical scope. -->
<!-- Include relevant subsections. Omit any that would say "N/A." -->

# PRD: <Feature Name>

> <date> | Status: Draft

## Problem Statement

<Falsifiable statement. What's broken or missing, for whom.>

**Evidence:**
- <signal> — <source>

**If we do nothing:** <consequence>

## Target Users

### <Persona Name>
- **Who**: <role/segment>
- **Current behavior**: <what they do today>
- **Key need**: <what they need>
- **Usage frequency**: <daily/weekly/occasional>
- **Success looks like**: <measurable outcome>

## User Stories

### <Story Name>
- **As a** <persona>, **I want** <action>, **so that** <outcome>
- **Priority**: Must / Should / Could / Won't
- **Acceptance criteria**:
  - [ ] <criterion>

## Functional Requirements

| ID | Requirement | Stories | Priority |
|----|------------|---------|----------|
| FR-1 | <what the system must do, user perspective> | S-1, S-3 | Must |

## Non-Functional Requirements

| ID | Category | Requirement | Target | Measurement |
|----|----------|------------|--------|-------------|
| NFR-1 | Performance | <requirement> | <threshold> | <how to measure> |

## Success Metrics

| Metric | Baseline | Target | Timeframe | How Measured |
|--------|----------|--------|-----------|--------------|
| <metric> | <current or "new"> | <target> | 30d / 60d / 90d | <instrumentation> |

## Scope

### In scope (v1)
- <capability> — maps to FR-N

### Out of scope
- <capability> — <why excluded>

### Future (conditional)
- <capability> — <trigger>

## Competitive & Market Context

<Only when relevant. Skip for internal tools.>

| Approach | Who does it | Strength | Weakness |
|----------|------------|----------|----------|

## Dependencies & Constraints

| Type | Statement | Status | Impact |
|------|-----------|--------|--------|
| Dependency | <statement> | Resolved / Pending | <what this blocks> |
| Constraint | <statement> | — | <what this limits> |

## Risks & Open Questions

| Type | Statement | Severity | Mitigation / Needed By |
|------|-----------|----------|----------------------|
| Risk | <statement> | H / M / L | <mitigation> |
| Assumption | <statement> | H / M / L | <if wrong: consequence> |
| Open question | <question> | — | Needed by: <when>. Impact: <consequence> |

## Glossary

| Term | Definition | Aliases | Code Name | Status |
|------|-----------|---------|-----------|--------|
| <canonical term> | <definition> | <other names> | <code name or "new"> | canonical / rename / new |

### Ambiguities Resolved
- **<Title>**: <conflict> — <chosen term + why>
