/**
 * POST /api/triage
 *
 * Parallel track: bug investigation workflow.
 * Takes a bug report, investigates root cause, produces a fix plan.
 *
 * Runs independently from the main SDLC pipeline — you can triage bugs
 * while a feature is flowing through scope → plan.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const model = anthropic("claude-sonnet-4-6");

const readFile = tool({
  description: "Read a source file",
  parameters: z.object({ path: z.string() }),
  execute: async ({ path }) => {
    const fs = await import("fs/promises");
    return fs.readFile(path, "utf-8");
  },
});

const searchCode = tool({
  description: "Search codebase for a pattern",
  parameters: z.object({
    pattern: z.string(),
    glob: z.string().optional(),
  }),
  execute: async ({ pattern, glob }) => {
    const { execSync } = await import("child_process");
    const g = glob ? `--glob "${glob}"` : "";
    return execSync(`rg "${pattern}" ${g} -l --max-count=20`, {
      encoding: "utf-8",
      timeout: 10_000,
    });
  },
});

const gitLog = tool({
  description: "View recent git history for specific files",
  parameters: z.object({ files: z.array(z.string()) }),
  execute: async ({ files }) => {
    const { execSync } = await import("child_process");
    return execSync(`git log -20 --oneline -- ${files.join(" ")}`, {
      encoding: "utf-8",
    });
  },
});

export async function POST(req: NextRequest) {
  const { bugReport } = await req.json();

  const { text } = await generateText({
    model,
    maxTokens: 8192,
    system: `You are a bug triage agent. Investigation-first approach:

1. Parse symptom — extract broken behavior, error messages
2. Search codebase — find the exact code path
3. Trace code path — read from entry point to failure
4. Check git history — recent changes to affected files
5. Check related work — TODO/FIXME/HACK markers, existing issues

Classify the result:
- Bug: Code doesn't do what designed → produce fix plan with TDD approach
- Missing feature (simple): 1-3 files → produce issue
- Missing feature (complex): Multiple files → recommend /scope
- Systemic: 8+ files → recommend /engineering

Output a structured issue in markdown with:
- Symptom, reproduction steps
- Root cause (files, functions, line numbers)
- Blast radius (other affected code paths)
- Fix plan: (1) add failing test, (2) implement fix, (3) verify`,
    tools: { readFile, searchCode, gitLog },
    maxSteps: 25,
    prompt: `Investigate this bug report:\n\n${bugReport}`,
  });

  return NextResponse.json({ issue: text });
}
