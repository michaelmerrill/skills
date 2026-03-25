## Section → Document

| Living doc section | Linear document title |
|---|---|
| `## Scope` | Scope |
| `## Requirements` | Requirements |
| `## UX Design` | UX Design |
| `## Technical Design` | Technical Design |
| `## Implementation Plan` | Implementation Plan |
| `## Decisions Log` | Decisions |
| `## Pipeline Status` | Pipeline Status |

## Stage → Project Status

| Pipeline stage | Linear project state |
|---|---|
| explore | Exploring |
| define | Defining |
| design | Designing |
| architect | Architecting |
| plan | Planning |

## Issue Field Mapping

| Issue file field | Linear issue field |
|---|---|
| `# Title` | `title` |
| Full file content | `description` (markdown) |
| `Type: AFK` | `labels: ["AFK"]` |
| `Type: HITL` | `labels: ["HITL"]` |
| `## Blocked by` references | `blockedBy: [<issue-ids>]` |

## Labels

| Name | Color | Description |
|---|---|---|
| AFK | `#22c55e` | Agent implements autonomously |
| HITL | `#f59e0b` | Needs human review |
