// nextjs/src/server/queries.ts
// In queries.ts, you expect to see:
// get
// list
// find
// we are using clerk for auth, so we can get the user ID from there and use it to query the database for jobs that belong to that user. We will also need to define the types for the jobs and the database schema.
// we are using drizzle-orm for our database, so we will need to define the schema for the jobs and the queries to fetch the jobs for a user. We will also need to handle the case where there are no jobs for a user and create a new job for them.
import "server-only";

import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { assetProcessingJobs } from "./db/schema";
import { randomUUID } from "crypto";
import type { InsertJob, Job } from "./db/schema";

export async function getJobsForUser(): Promise<{
  userId: string;
  jobs: Job[];
}> {
  "use server";
  // note: Figure out who the user is
  const { userId } = await auth();

  // Visual Code TERMINAL DEBUGGING
  console.log(userId);

  // Verify the user exists
  // note: Verify the user exists
  if (!userId) {
    throw new Error("User not found");
  }

  // Note: Fetch jobs from database
  const jobs = await db.query.assetProcessingJobs.findMany({
    where: eq(assetProcessingJobs.userId, userId),
    orderBy: [desc(assetProcessingJobs.updatedAt)],
  });

  return { userId, jobs };
}
