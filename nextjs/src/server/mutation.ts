//nextjs/src/server/mutation.ts
// In open mutation.ts, you expect to see:
// create
// insert
// update
// delete
import "server-only";
import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { assetProcessingJobs } from "./db/schema";
import { randomUUID } from "crypto";
import type { InsertJob, Job } from "./db/schema";

export async function createJobTodo() {
  "use server";
  //  Figure out who the user is
  const { userId } = await auth();

  // Verify the user exists
  if (!userId) {
    throw new Error("User not found");
  }

  const message = "what todo do I have to do?";

  // Create job in database
  // Your schema says these fields are not null:
  // id
  // threadId
  // userId
  // todoKind
  // status
  // attempts
  // size
  const [newJob] = await db
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

  // TODO: LATER - redirect to detail view
  // redirect -> `/project/${newJob.id}`;
}

export async function createJobForUser(message: string): Promise<Job> {
  "use server";
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not found");
  }

  // const newJobDBEntry = await db
  //   .insert(assetProcessingJobs)
  //   .values({
  //     id: randomUUID(),
  //     threadId: `thread_${userId}`,
  //     userId,
  //     todoKind: "personal",
  //     status: "created",
  //     attempts: 0,
  //     size: message.length,
  //     message,
  //   })
  //   .returning();

  const newJob: InsertJob = {
    id: randomUUID(),
    threadId: `thread_${userId}`,
    userId,
    todoKind: "personal",
    status: "created",
    attempts: 0,
    size: message.length,
    message,
  };

  const insertedRows = await db
    .insert(assetProcessingJobs)
    .values(newJob)
    .returning();

  return insertedRows[0];
}
