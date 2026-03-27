/**
 * SDLC Pipeline as a Vercel Workflow
 *
 * Maps the skills pipeline (scope → product → design → engineering → plan)
 * into durable, resumable workflow steps with AI agents at each phase.
 *
 * Uses:
 * - @vercel/workflow  — durable steps, sleep, human-in-the-loop
 * - ai (Vercel AI SDK) — streaming agent calls with tool use
 * - @ai-sdk/anthropic  — Claude as the model provider (via AI Gateway)
 */

import { serve } from "@vercel/workflow";
import { generateText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Verdict = "ready" | "revise" | "rethink";

interface PipelineState {
  featureName: string;
  idea: string;
  scopeBrief?: string;
  prd?: string;
  designSpec?: string;
  tdd?: string;
  plan?: string;
  issues?: Issue[];
  currentPhase: string;
  verdicts: Record<string, Verdict>;
  rollbackNotes?: string;
}

interface Issue {
  id: string;
  title: string;
  type: "auto" | "hitl";
  blockedBy: string[];
  files: string[];
  body: string;
}

// ---------------------------------------------------------------------------
// Model — routed through Vercel AI Gateway for caching, rate limits, logging
// ---------------------------------------------------------------------------

const model = anthropic("claude-sonnet-4-6");

// ---------------------------------------------------------------------------
// Shared tools available to every agent
// ---------------------------------------------------------------------------

const askUser = tool({
  description: "Ask the user a question with structured options",
  parameters: z.object({
    header: z.string().max(12),
    question: z.string(),
    options: z
      .array(z.string())
      .min(2)
      .max(4)
      .describe("2-4 choices, mark one with (Recommended)"),
  }),
});

const readCodebase = tool({
  description: "Read a file from the project codebase",
  parameters: z.object({
    path: z.string().describe("Relative path from project root"),
  }),
  execute: async ({ path }) => {
    // In production, this would use fs or a sandboxed file reader
    const fs = await import("fs/promises");
    return fs.readFile(path, "utf-8");
  },
});

const searchCodebase = tool({
  description: "Search for a pattern across the codebase",
  parameters: z.object({
    pattern: z.string(),
    glob: z.string().optional().describe("e.g. **/*.ts"),
  }),
  execute: async ({ pattern, glob }) => {
    const { execSync } = await import("child_process");
    const cmd = glob
      ? `rg "${pattern}" --glob "${glob}" -l --max-count=20`
      : `rg "${pattern}" -l --max-count=20`;
    return execSync(cmd, { encoding: "utf-8", timeout: 10_000 });
  },
});

const qualityGate = tool({
  description: "Run a quality gate check on a document and return a verdict",
  parameters: z.object({
    document: z.string(),
    criteria: z.array(z.string()),
  }),
});

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export default serve<PipelineState>(async (context) => {
  const { featureName, idea } = context.requestPayload;

  // =========================================================================
  // Step 1 — SCOPE: Shape the idea into a bounded bet
  // =========================================================================
  const scopeResult = await context.run("scope", async () => {
    const { text } = await generateText({
      model,
      maxTokens: 8192,
      system: `You are a product shaping agent. Your job is to take a vague idea
and shape it into a concrete, bounded scope brief. Explore the codebase first.
Never use technical jargon — the user is a product person.

Interview domains (resolve in order):
1. Problem & evidence — What's broken? Evidence? What do users do today?
2. Users & stakeholders — Who cares? How painful?
3. Appetite & timing — Days/weeks/months? Why this size?
4. Shaped solution — Rough shape, in/out for v1, rabbit holes
5. Feasibility — Current stack support? Gaps? Constraints?
6. Risks & bet — Risk register, place/pass decision

Output a structured scope brief in markdown.`,
      tools: { askUser, readCodebase, searchCodebase },
      maxSteps: 30,
      prompt: `Shape this idea into a scope brief: "${idea}"
Feature name: ${featureName}`,
    });

    return text;
  });

  // =========================================================================
  // Step 2 — PRODUCT: Translate scope into requirements (PRD)
  // =========================================================================
  const productResult = await context.run("product", async () => {
    let prd: string | undefined;
    let verdict: Verdict = "revise";
    let attempts = 0;

    // Quality gate loop — revise until ready or rethink
    while (verdict === "revise" && attempts < 3) {
      attempts++;

      const { text } = await generateText({
        model,
        maxTokens: 12288,
        system: `You are a product requirements agent. Translate the scope brief
into a complete PRD. Never use technical jargon.

Interview domains (10):
1. Problem & motivation (skip — scope covers it)
2. Target users — personas, needs, behavior
3. User stories — As a/I want/So that, MoSCoW priority
4. Functional requirements — with story traceability
5. Non-functional requirements — measurable targets
6. Success metrics — baselines + targets + 30/60/90d
7. Scope — in/out/future with rationale
8. Market context — competitors (skip for internal tools)
9. Dependencies & constraints
10. Risks & open questions

Quality criteria:
- Every story has 2+ acceptance criteria
- Every FR maps to a story
- Success metrics have baselines, targets, timeframes
- No implementation language in FRs
- Out-of-scope items have rationale`,
        tools: { askUser, readCodebase, searchCodebase, qualityGate },
        maxSteps: 40,
        prompt: prd
          ? `Revise this PRD based on quality gate feedback:\n\n${prd}`
          : `Create a PRD from this scope brief:\n\n${scopeResult}`,
      });

      prd = text;

      // Run quality gate as a separate sub-step
      const gate = await generateText({
        model,
        maxTokens: 2048,
        system: `You are a quality gate reviewer. Evaluate the PRD against the
criteria and return exactly one verdict: ready, revise, or rethink.
If revise, list specific issues. If rethink, explain what's fundamentally wrong.`,
        prompt: `Evaluate this PRD:\n\n${prd}`,
      });

      verdict = gate.text.toLowerCase().includes("ready")
        ? "ready"
        : gate.text.toLowerCase().includes("rethink")
          ? "rethink"
          : "revise";
    }

    if (verdict === "rethink") {
      throw new Error(
        "PRD quality gate returned 'rethink' — rollback to /scope"
      );
    }

    return prd!;
  });

  // =========================================================================
  // Step 3 — DESIGN: UX flows, screens, states (skip for non-UI features)
  // =========================================================================
  const designResult = await context.run("design", async () => {
    // Determine if this feature has UI
    const { text: hasUI } = await generateText({
      model,
      maxTokens: 100,
      prompt: `Does this PRD describe a user-facing feature with UI?
Answer only "yes" or "no".\n\n${productResult}`,
    });

    if (hasUI.toLowerCase().includes("no")) {
      return "SKIPPED — non-UI feature. Proceeding directly to engineering.";
    }

    let spec: string | undefined;
    let verdict: Verdict = "revise";
    let attempts = 0;

    while (verdict === "revise" && attempts < 3) {
      attempts++;

      const { text } = await generateText({
        model,
        maxTokens: 12288,
        system: `You are a UX design agent. Translate the PRD into a design spec.

Interview domains (8):
1. Information architecture — nav location, URL structure
2. User flows — per story: happy + error + terminal states (Mermaid)
3. Screen inventory — every screen with state table (empty/loading/default/error/partial)
4. Component mapping — existing components to reuse, new ones needed
5. Interactions & responsive — triggers, feedback, breakpoints
6. Accessibility — focus, keyboard, screen reader, visual
7. Content & copy — exact text, tone, i18n
8. Design references — Figma links, prototypes

Quality criteria:
- Every PRD story → flow
- Happy + error path per flow
- 5+ states per screen
- A11y: 4 concerns per interaction
- All user-facing strings defined
- Desktop + mobile minimum`,
        tools: { askUser, readCodebase, searchCodebase, qualityGate },
        maxSteps: 40,
        prompt: spec
          ? `Revise this design spec:\n\n${spec}`
          : `Create a design spec from this PRD:\n\n${productResult}`,
      });

      spec = text;

      const gate = await generateText({
        model,
        maxTokens: 2048,
        system:
          "Evaluate the design spec. Return exactly: ready, revise, or rethink.",
        prompt: `Evaluate:\n\n${spec}`,
      });

      verdict = gate.text.toLowerCase().includes("ready")
        ? "ready"
        : gate.text.toLowerCase().includes("rethink")
          ? "rethink"
          : "revise";
    }

    return spec!;
  });

  // =========================================================================
  // Step 4 — ENGINEERING: Technical design with adversarial review
  // =========================================================================
  const engineeringResult = await context.run("engineering", async () => {
    let tdd: string | undefined;
    let verdict: Verdict = "revise";
    let attempts = 0;

    while (verdict === "revise" && attempts < 3) {
      attempts++;

      const { text } = await generateText({
        model,
        maxTokens: 16384,
        system: `You are a technical design agent. Produce a TDD from the upstream
documents. Explore the codebase thoroughly before designing.

Interview domains (12):
1. System context — boundaries, C4 diagram (Mermaid)
2. Architecture decisions — inline ADRs
3. Data models — fields, indexes, migrations, ER diagrams
4. API design — full contracts, all error responses
5. Core behavior — behavior specs linked to FRs
6. Edge cases — severity + mitigation
7. Security — auth, trust boundaries, data protection
8. Observability — structured logging, metrics, health checks
9. Testing — strategy per layer
10. Operational — rollout, feature flags, rollback, perf targets
11. Code design — key interfaces, dependency direction
12. Phased build — vertical slices with traceability`,
        tools: { askUser, readCodebase, searchCodebase, qualityGate },
        maxSteps: 50,
        prompt: tdd
          ? `Revise this TDD based on adversarial review:\n\n${tdd}`
          : `Create a TDD.\n\nPRD:\n${productResult}\n\nDesign Spec:\n${designResult}`,
      });

      tdd = text;

      // Adversarial review — 13 pressure-test lenses
      const review = await generateText({
        model,
        maxTokens: 4096,
        system: `You are an adversarial reviewer. Pressure-test this TDD using
13 lenses: (1) Assumptions that may not hold, (2) Failure modes,
(3) Overengineering, (4) Code coupling, (5) Scope creep, (6) Requirements gaps,
(7) Implementation readiness, (8) Security, (9) Operational readiness,
(10) Maintenance burden, (11) Simpler alternatives, (12) Should this exist?,
(13) Feasibility & phasing.

Return exactly one verdict: ready, revise, or rethink.
If revise, list issues by severity. If rethink, explain the fundamental problem.`,
        prompt: `Review this TDD:\n\n${tdd}`,
      });

      verdict = review.text.toLowerCase().includes("ready")
        ? "ready"
        : review.text.toLowerCase().includes("rethink")
          ? "rethink"
          : "revise";
    }

    return tdd!;
  });

  // =========================================================================
  // Step 5 — PLAN: Decompose into agent-sized implementation issues
  // =========================================================================
  const planResult = await context.run("plan", async () => {
    const { text } = await generateText({
      model,
      maxTokens: 16384,
      system: `You are a planning agent. Decompose the TDD into vertical-slice
implementation issues. Each issue delivers one working capability through all
layers (schema + service + route + UI together).

Rules:
- 1–6 files per issue (max 8)
- Classify each: Auto (agent implements) or HITL (needs human review)
- No horizontal layers (all schema, then all services, then all UI)
- Include dependency graph (Mermaid), execution order
- Verify every FR from PRD and every phase from TDD is covered

Per issue include:
- Title, type (Auto/HITL), blocked-by
- Requirements addressed (FR/story refs)
- What to build (concrete deliverable)
- Files to modify/create (with patterns to follow)
- Acceptance criteria (testable)
- Verification steps`,
      tools: { askUser, readCodebase, searchCodebase },
      maxSteps: 30,
      prompt: `Decompose into issues.\n\nPRD:\n${productResult}\n\nTDD:\n${engineeringResult}`,
    });

    return text;
  });

  // =========================================================================
  // Step 6 — NOTIFY: Send results (webhook, Linear, GitHub, etc.)
  // =========================================================================
  await context.run("notify", async () => {
    // Example: create GitHub issues for each planned issue
    // In production, this maps to the /publish-linear skill
    await context.call("publish-to-linear", {
      url: `${process.env.APP_URL}/api/publish-linear`,
      method: "POST",
      body: {
        featureName,
        plan: planResult,
        prd: productResult,
        tdd: engineeringResult,
      },
    });
  });

  return {
    featureName,
    currentPhase: "complete",
    scopeBrief: scopeResult,
    prd: productResult,
    designSpec: designResult,
    tdd: engineeringResult,
    plan: planResult,
  };
});
