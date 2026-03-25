## File → Document

| Source file | Linear document title |
|---|---|
| `discovery.md` | Discovery Brief |
| `prd.md` | Product Requirements |
| `spec.md` | Design Specification |
| `tdd.md` | Technical Design |
| `plan.md` | Implementation Plan |
| `pipeline.md` `## Decisions Log` | Decisions |
| `pipeline.md` `## Status` | Pipeline Status |

## Stage → Project Status

| Pipeline stage | Linear project state |
|---|---|
| discovery | Discovering |
| product | Defining |
| design | Designing |
| engineering | Architecting |
| plan | Planning |

## Issue Field Mapping

| Issue file field | Linear issue field |
|---|---|
| `# Title` | `title` |
| Full file content | `description` (markdown) |
| `Type: Auto` | `labels: ["Auto"]` |
| `Type: HITL` | `labels: ["HITL"]` |
| `## Blocked by` references | `blockedBy: [<issue-ids>]` |

## Labels

| Name | Color | Description |
|---|---|---|
| Auto | `#22c55e` | Agent implements autonomously |
| HITL | `#f59e0b` | Needs human review |
