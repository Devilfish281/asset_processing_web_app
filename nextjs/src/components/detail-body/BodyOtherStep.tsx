// src/components/detail-body/BodyOtherStep.tsx
"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { Job } from "@/server/db/schema";

interface BodyOtherStepProps {
  jobId: string;
  job: Job;
}

function BodyOtherStep({ jobId, job }: BodyOtherStepProps) {
  const statusLabel = job.status ?? "created";
  const statusText = statusLabel.replaceAll("_", " ");

  const details = [
    { label: "id", value: job.id },
    { label: "threadId", value: job.threadId },
    { label: "userId", value: job.userId },
    { label: "todoKind", value: job.todoKind },
    { label: "status", value: job.status },
    { label: "attempts", value: String(job.attempts) },
    { label: "lastHeartbeat", value: job.lastHeartbeat ?? "null" },
    { label: "errorMessage", value: job.errorMessage ?? "null" },
    { label: "size", value: String(job.size) },
    { label: "lastMsgType", value: job.lastMsgType ?? "null" },
    { label: "createdAt", value: String(job.createdAt) },
    { label: "updatedAt", value: String(job.updatedAt) },
  ];

  return (
    <div className="w-full">
      <Card className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Other Job Details
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Review metadata and system fields for this job.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                Job ID: {jobId}
              </span>
              <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
                {statusText}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div>
            <div className="p-4 sm:p-6">
              <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-muted/80 to-muted/50 shadow-sm">
                <div className="border-b border-border/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Job Metadata
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Internal fields and timestamps
                  </p>
                </div>

                <div className="grid gap-3 p-4 sm:p-5">
                  {details.map((detail) => (
                    <div
                      key={detail.label}
                      className="rounded-2xl border border-border/60 bg-background/95 p-4 shadow-sm"
                    >
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                        {detail.label}
                      </p>
                      <p className="break-words font-mono text-sm leading-6 text-foreground sm:text-base">
                        {detail.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BodyOtherStep;
