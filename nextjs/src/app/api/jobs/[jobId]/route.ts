// src/app/api/jobs/[jobId]/route.ts

// That route is for:
// updating a specific job
// loading a specific job
// deleting a specific job

import { NextRequest, NextResponse } from "next/server";

import { db } from "@/server/db";
import { assetProcessingJobs } from "@/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { z } from "zod";

// Define schema for validating the request body when updating a job
const updateJobSchema = z.object({
  message: z.string().min(1),
});

//export async function GET(request: Request) {}
//export async function PATCH(request: NextRequest) {}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract jobId from params
  const { jobId } = await params;

  //  const body = await request.json();
  // Validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate request body against schema
  const validatedData = updateJobSchema.safeParse(body);

  if (!validatedData.success) {
    return NextResponse.json(
      { error: validatedData.error.issues },
      { status: 400 },
    );
  }

  const { message } = validatedData.data;

  // Update the job in the database
  //MAKE A DB REQUEST TO UPDATE THE JOB MESSAGE
  const updatedJob = await db
    .update(assetProcessingJobs)
    .set({ message })
    .where(
      and(
        eq(assetProcessingJobs.userId, userId),
        eq(assetProcessingJobs.id, jobId),
      ),
    )
    .returning();

  //404 IF JOB NOT FOUND
  if (updatedJob.length === 0) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  //RETURN RESULTS
  return NextResponse.json(updatedJob[0]);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract jobId from params
  const { jobId } = await params;

  // Load the job from the database
  const job = await db.query.assetProcessingJobs.findFirst({
    where: and(
      eq(assetProcessingJobs.userId, userId),
      eq(assetProcessingJobs.id, jobId),
    ),
  });

  // 404 IF JOB NOT FOUND
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // RETURN RESULTS
  return NextResponse.json(job);
}
