// src/app/api/jobs/route.ts

// Route Handlers, Clerk App Router auth, Drizzle insert,
// and Zod validation are intended to work.
// /api/jobs = collection route
// POST /api/jobs = create new item

// TODO:The server checks who the user is with Clerk

// TODO:TThe server validates the message with Zod

// TODO:TThe server inserts a new row into assetProcessingJobs
// POST create route

// TODO:TThe server returns the new job

// TODO:TYour page can then:

// TODO:Tshow success

// TODO:Tredirect to a project page

// TODO:Tor keep the job ID for later

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { db } from "@/server/db";
import { assetProcessingJobs } from "@/server/db/schema";

const createJobSchema = z.object({
  message: z.string().min(1),
});

export async function POST(request: NextRequest) {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validatedData = createJobSchema.safeParse(body);

  if (!validatedData.success) {
    return NextResponse.json(
      { error: validatedData.error.issues },
      { status: 400 },
    );
  }

  const { message } = validatedData.data;

  // Insert a new job in the database
  const insertedRows = await db
    .insert(assetProcessingJobs)
    .values({
      id: randomUUID(),
      threadId: `thread_${userId}`,
      userId,
      todoKind: "personal",
      status: "created",
      attempts: 0,
      size: message.length,
      message,
    })
    .returning();

  const newJob = insertedRows[0];

  return NextResponse.json(newJob, { status: 201 });
}
