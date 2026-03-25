---
name: publish-linear
description: "Publish pipeline state to Linear — creates/updates project, documents, and issues from feature folder docs + issue files. Triggers: 'publish to linear,' 'sync to linear,' 'push to linear,' post-plan. Not for: reading from Linear, two-way sync."
---

Sync local pipeline state to Linear. Reads standalone docs + issue files from feature folder, creates or updates Linear project, documents, and issues. Safe to run multiple times — idempotent.

## Starting

Determine feature to publish:
- If arg given: read `./plans/<arg>/` feature folder
- Else: list `./plans/*/`, ask via `AskUserQuestion` (header: "Feature", options: each folder name, mark most recently modified "(Recommended)")

If feature folder not found: stop with error.

Read `.pipeline.md` from project root for `linear-team` value. If missing, ask via `AskUserQuestion` (header: "Team", options: team names from `list_teams`). Save choice to `.pipeline.md`.

## Sync

Use mapping tables in `assets/linear-mapping.md` for all field mappings.

### 1. Project

Extract feature name from `# Discovery: <name>` heading in `discovery.md`, or from the folder name if no discovery brief exists.

Check for `<!-- linear-project: <id> -->` in `pipeline.md`:
- **Has ID**: `list_projects`, verify project exists by ID. If gone, treat as new.
- **No ID**: `list_projects` with `query=<feature name>` and `team=<linear-team>`. Match by exact name.

If project exists: note its ID.
If not: `save_project` with `name=<feature name>`, `addTeams=[<linear-team>]`. Write `<!-- linear-project: <id> -->` into `pipeline.md`.

### 2. Documents

Read the feature folder. For each standalone doc that exists, sync as a Linear document:

| File | Linear document title |
|------|----------------------|
| `discovery.md` | Discovery Brief |
| `prd.md` | Product Requirements |
| `spec.md` | Design Specification |
| `tdd.md` | Technical Design |
| `plan.md` | Implementation Plan |

For `pipeline.md`, extract sections and sync separately:
- `## Decisions Log` content → document titled "Decisions"
- `## Status` content → document titled "Pipeline Status"

For each document:
1. Read file/section content
2. `list_documents` with `projectId=<project-id>`, find by matching title
3. **Exists**: `update_document` with `id=<doc-id>`, `content=<content>`
4. **Missing**: `create_document` with `title=<title>`, `project=<project-id>`, `content=<content>`

### 3. Project status

Read `## Status` table in `pipeline.md`. Find last row with a verdict. Map stage to Linear project state per `assets/linear-mapping.md`.

`save_project` with `id=<project-id>`, `state=<mapped state>`.

### 4. Issues

Check if `./issues/<feature-name>/` exists (kebab-case matching feature folder name). If not, skip.

**Ensure labels exist**: `list_issue_labels` with `team=<linear-team>`. If `Auto` or `HITL` missing, `create_issue_label` for each.

Read each `NN-slug.md` file in order. For each:
1. Parse title from `# <Title>` heading
2. Parse `Type: Auto` or `Type: HITL` from header
3. Parse `## Blocked by` references (extract filenames like `01-slug.md`)
4. `list_issues` with `project=<project-id>`, `query=<title>`. Match by exact title.
5. **Exists**: `save_issue` with `id=<issue-id>`, `description=<full file content>` (only if changed)
6. **Missing**: `save_issue` with `title`, `team=<linear-team>`, `project=<project-id>`, `description=<full file content>`, `labels=[<type>]`

Store mapping of `NN-slug.md` → Linear issue identifier as you go.

**Wire blockedBy** (second pass): For each issue that has `## Blocked by` references, `save_issue` with `id=<issue-id>`, `blockedBy=[<resolved issue identifiers>]`.

### 5. Project update

Build summary: "Published after /<last-stage> — <new docs>, status: <state>, issues: <count>."

`save_project` with `id=<project-id>`, `summary=<summary text>`.

## Finish

Print confirmation: "Published to Linear. Project: <name>, status: <state>, documents: <N synced>, issues: <N synced>."
