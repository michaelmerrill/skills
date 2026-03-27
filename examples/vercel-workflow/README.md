# SDLC Pipeline — Vercel Workflow Example

Maps the skills pipeline (`scope → product → design → engineering → plan`) into a durable Vercel Workflow with AI agents at each phase.

## Architecture

```
POST /api/sdlc { featureName, idea }
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Vercel Workflow (durable, resumable)                │
│                                                      │
│  Step 1: SCOPE ──── agent + askUser (HITL pause) ──┐│
│  Step 2: PRODUCT ── agent + quality gate loop      ││
│  Step 3: DESIGN ─── agent + quality gate (or skip) ││
│  Step 4: ENGINEERING agent + adversarial review    ││
│  Step 5: PLAN ───── agent → vertical-slice issues  ││
│  Step 6: NOTIFY ─── publish to Linear / GitHub     ││
│                                                      │
│  Each step survives serverless timeouts, failures,  │
│  and deploys. Human answers resume via webhook.     │
└─────────────────────────────────────────────────────┘
         │
         ▼
  { scopeBrief, prd, designSpec, tdd, plan }
```

### Parallel tracks

```
POST /api/triage { bugReport }   ← independent from feature pipeline
```

## Vercel Primitives Used

| Primitive | Where | Why |
|-----------|-------|-----|
| **Workflow** (`@vercel/workflow`) | `workflow.ts` | Durable multi-step execution across serverless invocations. Each pipeline phase is a `context.run()` step with automatic retries, state persistence, and resume-after-failure. |
| **AI SDK** (`ai`) | Every agent | `generateText` with tool use for multi-turn agent loops. `maxSteps` drives autonomous tool calling (codebase reads, searches, quality gates). |
| **AI Gateway** (`@ai-sdk/anthropic`) | Model routing | Routes all Claude calls through Vercel AI Gateway for rate limiting, caching, cost tracking, and prompt logging. |
| **Human-in-the-loop** | `askUser` tool | Workflow pauses when an agent needs user input. Resumes via `/api/human-input` webhook — the user answers in Slack/web UI and the workflow continues. |
| **`context.call`** | Step 6 | Makes HTTP calls to other services (Linear sync, GitHub issue creation) as durable workflow steps with built-in retries. |

## How It Works

### 1. Quality gate loops

Product, design, and engineering phases run in a **verdict loop**:

```
generate document → quality gate review → ready? → proceed
                                        → revise? → regenerate with feedback
                                        → rethink? → throw (rollback upstream)
```

This mirrors the Ready/Revise/Rethink pattern from the skill definitions.

### 2. Human-in-the-loop interviews

Each agent has access to `askUser` — when invoked, the workflow pauses and fires a notification. The user responds asynchronously (could be minutes or hours later), and the workflow resumes exactly where it left off.

### 3. Durable execution

Each `context.run()` step is checkpointed. If the serverless function times out mid-generation, the workflow resumes from the last completed step — not from scratch.

### 4. Parallel tracks

Bug triage (`/api/triage`) runs as a standalone endpoint with its own agent, independent of the feature pipeline. In production you could also run it as a separate workflow for durability.

## Running Locally

```bash
cp .env.example .env.local
# Add ANTHROPIC_API_KEY and WORKFLOW_TOKEN
npm install
npm run dev
```

```bash
# Start the pipeline
curl -X POST http://localhost:3000/api/sdlc \
  -H "Content-Type: application/json" \
  -d '{"featureName": "team-billing", "idea": "Let teams share a single billing account with role-based access"}'

# Triage a bug (parallel track)
curl -X POST http://localhost:3000/api/triage \
  -H "Content-Type: application/json" \
  -d '{"bugReport": "Users see a blank screen after accepting an invite on mobile Safari"}'
```

## Extending

- **Add `/bootstrap`**: Create a separate workflow for project scaffolding with convention inheritance
- **Add `/publish-linear`**: Wire Step 6 to Linear's API for idempotent project sync
- **Stream to UI**: Replace `generateText` with `streamText` + `useChat` for real-time agent output in a dashboard
- **Sandbox execution**: Use Vercel AI Sandbox to run generated code (test execution, migration validation) inside workflow steps
