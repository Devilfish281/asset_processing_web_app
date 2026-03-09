// nextjs/src/server/queries.ts
// In queries.ts, you expect to see:
// get
// list
// find
// read
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
