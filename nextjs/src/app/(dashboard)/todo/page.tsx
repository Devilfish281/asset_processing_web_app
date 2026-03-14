// src/app/(dashboard)/todo/page.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useUser } from "@clerk/nextjs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type JobRecord = {
  id: string;
  threadId: string;
  userId: string;
  todoKind: string;
  status: string;
  attempts: number;
  lastHeartbeat: string | null;
  errorMessage: string | null;
  size: number;
  message: string | null;
  lastMsgType: string | null;
  lastMsgContent: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function TodoPage() {
  const { isLoaded, isSignedIn, user } = useUser();

  const [message, setMessage] = useState("");
  const [job, setJob] = useState<JobRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn || !user) {
    return <div>Please sign in.</div>;
  }

  const tags = Array.from({ length: 50 }).map((_, i) => `Tag #${i}`);
  // TODO: make a form or button

  // TODO: send the message to /api/jobs

  // TODO: get back the created job

  // TODO: redirect or display success

  // Use this 3-step flow:

  // 1. POST /api/jobs

  // Create the row with:

  // status: "created"

  // Return:

  // the new job

  // especially the jobId

  // 2. GET /api/jobs/[jobId]

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  const fetchJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        stopPolling();
        setError(data?.error ?? "Failed to load job status.");
        return;
      }

      setJob(data);

      if (data.status === "failed" || data.status === "completed") {
        stopPolling();
      }
    } catch {
      stopPolling();
      setError("Unable to check job status.");
    }
  };

  const startPolling = (jobId: string) => {
    stopPolling();
    setIsPolling(true);

    pollingIntervalRef.current = setInterval(() => {
      void fetchJobStatus(jobId);
    }, 2000);
  };

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Please enter a message first.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    stopPolling();

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.error?.[0]?.message ?? data?.error ?? "Failed to create job.",
        );
        setIsSubmitting(false);
        return;
      }

      setJob(data);
      setMessage("");
      setIsSubmitting(false);
      startPolling(data.id);
    } catch {
      setError("Unable to create job.");
      setIsSubmitting(false);
    }
  };

  const statusLabel = job?.status ?? "created";
  const statusText = statusLabel.replaceAll("_", " ");

  const getTodosPrompt = `Developer: # Role and Objective
Help the user identify their to-dos and sort them by priority.

# Instructions
- Determine what tasks the user needs to do.
- Organize those tasks by priority.
- If the user does not provide enough information about their tasks, ask for the missing details needed to create a prioritized list.
- Begin with a concise checklist (3-5 bullets) of what you will do; keep items conceptual, not implementation-level.
- Attempt a first pass autonomously using the information provided unless critical details are missing; ask clarifying questions only when the missing information prevents a reasonable prioritization.
- Set reasoning effort to match task complexity; keep intermediate planning concise and make the final answer clear and slightly fuller than the checklist.

# Context
- The user wants help understanding what they have to do.
- The user also wants their priorities sorted.

# Planning and Verification
- Identify the user's tasks.
- Rank them by priority using the information provided.
- Verify that the response clearly separates tasks and priority order.
- Before finishing, perform a brief validation that the list includes the identified tasks, the priority order is explicit, and any assumptions or missing details are clearly stated.

# Output Format
- Provide a clear, organized list of to-dos.
- Present the priorities in an easy-to-follow order.
- Default to plain text unless the user explicitly asks for another format.

# Verbosity
- Default to concise summaries.

# Stop Conditions
- Finish once the user's to-dos are identified and sorted by priority, or after asking for any missing information required to do so.

# Safety and Reasoning
- Reason internally and do not reveal private chain-of-thought unless the user explicitly requests reasoning output appropriate to the task.`;

  return (
    <div className="w-full h-[100dvh] overflow-hidden">
      <div className="mx-auto flex h-[100dvh] max-w-screen-2xl flex-col gap-3 p-2 sm:gap-4 sm:p-3 md:p-4 lg:gap-5 lg:p-6">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl font-bold text-primary sm:text-3xl lg:text-4xl">
              Chat
              <span className="ml-3 inline-block align-middle text-sm font-medium text-muted-foreground sm:text-base">
                {job?.id
                  ? `Id: ${job.id}`
                  : "Create and track an asset processing job from this page."}
              </span>
            </h1>

            {/* <p className="text-sm text-muted-foreground sm:text-base">
              Create and track an asset processing job from this page.
            </p> */}
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium capitalize text-primary sm:text-sm">
              {statusText}
            </div>

            {/*
            <Button
              variant="outline"
              size="sm"
              className="rounded-3xl"
              onClick={() => {
                if (job?.id) {
                  void fetchJobStatus(job.id);
                }
              }}
              disabled={!job?.id || isSubmitting}
            >
              Retry
            </Button> */}

            <Button
              variant="outline"
              size="sm"
              className="rounded-3xl"
              disabled
            >
              ...
            </Button>
          </div>
        </div>

        {/* <Card className="rounded-3xl border border-border bg-card shadow-sm transition-colors duration-200 hover:border-primary">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-lg text-primary sm:text-xl lg:text-2xl">
                Todo Title
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground sm:text-base">
                {job?.id
                  ? `Current job id: ${job.id}`
                  : "Create and track an asset processing job from this page."}
              </CardDescription>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <div className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium capitalize text-primary">
                {statusText}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-3xl"
                onClick={() => {
                  if (job?.id) {
                    void fetchJobStatus(job.id);
                  }
                }}
                disabled={!job?.id || isSubmitting}
              >
                Refresh
              </Button>
            </div>
          </CardHeader>
        </Card> */}

        <Card className="flex-1 min-h-0 rounded-3xl border border-border bg-card shadow-sm transition-colors duration-200 hover:border-primary">
          <CardContent className="h-full p-3 sm:p-4 lg:p-5">
            <ScrollArea className="h-full rounded-2xl border border-border bg-muted/40">
              <div className="space-y-4 p-4 pb-24 sm:p-5 sm:pb-28 lg:p-6 lg:pb-32">
                {job?.message ? (
                  <div className="rounded-2xl border border-border bg-muted p-3 text-sm sm:p-4">
                    <p className="font-medium text-primary">User</p>
                    <p className="mt-1 text-muted-foreground">{job.message}</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground sm:p-4">
                    No message yet. Type a todo message below and click Send.
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-card p-3 text-sm sm:p-4">
                  <p className="font-medium text-primary">Assistant</p>
                  <div className="mt-2 text-foreground">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-3 leading-7 text-muted-foreground last:mb-0">
                            {children}
                          </p>
                        ),
                        ol: ({ children }) => (
                          <ol className="mb-3 list-decimal space-y-2 pl-5 text-muted-foreground last:mb-0">
                            {children}
                          </ol>
                        ),
                        ul: ({ children }) => (
                          <ul className="mb-3 list-disc space-y-2 pl-5 text-muted-foreground last:mb-0">
                            {children}
                          </ul>
                        ),
                        li: ({ children }) => (
                          <li className="leading-7">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-foreground">
                            {children}
                          </strong>
                        ),
                        h1: ({ children }) => (
                          <h1 className="mb-3 text-xl font-bold text-primary">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="mb-3 text-lg font-semibold text-primary">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="mb-2 text-base font-semibold text-primary">
                            {children}
                          </h3>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="mb-3 border-l-2 border-border pl-4 italic text-muted-foreground">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children }) => (
                          <code className="rounded-md bg-muted px-1.5 py-0.5 text-[0.9em] text-foreground">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {job?.lastMsgContent ??
                        (job
                          ? "Waiting for asset_processing_service response."
                          : "No assistant reply yet.")}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-medium capitalize text-primary">
                  System Badge: {statusText}
                </div>

                {(isSubmitting || isPolling) && (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground sm:p-4">
                    {isSubmitting
                      ? "Creating job..."
                      : `Polling job status${
                          job?.status ? `: ${job.status}` : ""
                        }...`}
                  </div>
                )}

                {job?.errorMessage && (
                  <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive sm:p-4">
                    {job.errorMessage}
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive sm:p-4">
                    {error}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="sticky bottom-0 z-10 rounded-3xl border border-border bg-card shadow-sm transition-colors duration-200 hover:border-primary">
          {/*<CardHeader className="space-y-2">
            <CardTitle className="text-lg text-primary sm:text-xl lg:text-2xl">
              Composer
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground sm:text-base">
              Type a message to create or continue a job.
            </CardDescription>
          </CardHeader> */}

          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
              <div className="flex-1">
                <Textarea
                  placeholder="Type your message here."
                  className="min-h-40 resize-none rounded-2xl border-border bg-background text-foreground sm:min-h-44 lg:min-h-full"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex w-full flex-col gap-3 lg:w-52 lg:justify-end">
                {/* Make a component */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-3xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <span className="text-sm font-semibold">P</span>
                      </div>

                      <div className="flex flex-1 flex-col gap-1 leading-none">
                        <span className="truncate text-sm font-semibold text-foreground">
                          Prompt Tools
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          Quick prompt actions
                        </span>
                      </div>

                      <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel>Prompt Tools</DropdownMenuLabel>

                    <DropdownMenuItem
                      onClick={() => {
                        setMessage(getTodosPrompt);
                        setError(null);
                      }}
                    >
                      <div className="flex w-full items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-foreground">
                          <span className="text-sm font-semibold">T</span>
                        </div>

                        <div className="flex flex-col">
                          <span>Get To-Dos</span>
                          <span className="text-xs text-muted-foreground">
                            Fill the message box with the to-do prioritization
                            prompt
                          </span>
                        </div>
                      </div>

                      {message === getTodosPrompt && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Make a component */}
                <Button
                  className="w-full rounded-3xl"
                  onClick={handleSubmit}
                  disabled={isSubmitting || message.trim().length === 0}
                >
                  {isSubmitting ? "Sending..." : "Send Button"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
