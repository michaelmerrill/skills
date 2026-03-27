/**
 * POST /api/human-input
 *
 * Human-in-the-loop callback endpoint for Vercel Workflow.
 *
 * When an agent uses the `askUser` tool, the workflow pauses and sends
 * a notification (Slack, email, web UI). The user's response is POSTed
 * here, which resumes the paused workflow step.
 *
 * This is the bridge between async durable execution and real-time
 * human decision-making — the core of interview-driven skills.
 */

import { NextRequest, NextResponse } from "next/server";
import { Client } from "@vercel/workflow";

const workflow = new Client({ token: process.env.WORKFLOW_TOKEN! });

export async function POST(req: NextRequest) {
  const { runId, stepId, answer } = await req.json();

  if (!runId || !stepId || !answer) {
    return NextResponse.json(
      { error: "runId, stepId, and answer are required" },
      { status: 400 }
    );
  }

  // Resume the paused workflow step with the user's answer
  await workflow.notify({
    runId,
    eventId: stepId,
    eventData: { answer },
  });

  return NextResponse.json({ status: "resumed" });
}
