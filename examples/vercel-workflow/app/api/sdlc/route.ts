/**
 * POST /api/sdlc
 *
 * Kicks off the SDLC pipeline workflow. Send a feature idea, get back
 * a full plan — scope brief, PRD, design spec, TDD, and implementation issues.
 *
 * Uses Vercel Workflow for durable execution — each phase is a resumable step
 * that survives serverless timeouts, failures, and deploys.
 */

import { NextRequest, NextResponse } from "next/server";
import { Client } from "@vercel/workflow";

const workflow = new Client({ token: process.env.WORKFLOW_TOKEN! });

export async function POST(req: NextRequest) {
  const { featureName, idea, entryPoint = "scope" } = await req.json();

  if (!featureName || !idea) {
    return NextResponse.json(
      { error: "featureName and idea are required" },
      { status: 400 }
    );
  }

  // Launch the durable workflow — returns immediately with a run ID.
  // The workflow itself runs across multiple serverless invocations.
  const run = await workflow.trigger({
    url: `${process.env.VERCEL_URL}/api/workflow`,
    body: { featureName, idea, entryPoint },
  });

  return NextResponse.json({
    runId: run.id,
    status: "started",
    message: `Pipeline started for "${featureName}" at /${entryPoint}`,
    statusUrl: `/api/sdlc/${run.id}`,
  });
}
