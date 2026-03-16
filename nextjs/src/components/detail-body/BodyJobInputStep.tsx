// src/components/detail-body/BodyJobInputStep.tsx
"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { Job } from "@/server/db/schema";

interface BodyJobInputStepProps {
  jobId: string;
  job: Job;
}

function BodyJobInputStep({ jobId, job }: BodyJobInputStepProps) {
  const statusLabel = job.status ?? "created";
  const statusText = statusLabel.replaceAll("_", " ");
  const userMessage = job.message ?? "";

  const markdownComponents = {
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-4 text-base leading-8 text-foreground/90 last:mb-0 sm:text-[1.05rem]">
        {children}
      </p>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="mb-4 list-decimal space-y-2 pl-6 text-base leading-8 text-foreground/90 last:mb-0 sm:text-[1.05rem]">
        {children}
      </ol>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="mb-4 list-disc space-y-2 pl-6 text-base leading-8 text-foreground/90 last:mb-0 sm:text-[1.05rem]">
        {children}
      </ul>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li className="marker:text-primary">{children}</li>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="mb-2 text-lg font-semibold text-foreground sm:text-xl">
        {children}
      </h3>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="mb-4 rounded-r-xl border-l-4 border-primary/40 bg-primary/5 px-4 py-3 italic text-muted-foreground last:mb-0">
        {children}
      </blockquote>
    ),
    code: ({ children }: { children?: React.ReactNode }) => (
      <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.95em] text-foreground">
        {children}
      </code>
    ),
  };

  return (
    <div className="w-full">
      <Card className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Job Conversation
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Review the user request and the latest assistant response.
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
          <div className="space-y-5 p-4 sm:p-6">
            {userMessage ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-muted/80 to-muted/50 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      U
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        User Request
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Original submitted prompt
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="p-5 sm:p-6 lg:p-7">
                    <div className="rounded-2xl border border-border/60 bg-background/95 p-5 shadow-inner sm:p-6 lg:p-7">
                      <ReactMarkdown components={markdownComponents}>
                        {userMessage}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                No message has been saved for this job yet.
              </div>
            )}

            {job.errorMessage && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {job.errorMessage}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BodyJobInputStep;
