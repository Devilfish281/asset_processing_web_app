// src/app/(dashboard)/project/[projectId]/page.tsx
import React from "react";
import { notFound } from "next/navigation";

import JobDetailView from "@/components/job-detail/JobDetailView";
// import { Job } from "@/server/db/schema";
import { getJobById } from "@/server/queries";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params;

  // testing 404 only - remove this later
  if (projectId === "123") {
    return notFound();
  }

  // TODO: Make a query to the DB to grab the job with the ID `params.projectId`
  const result = await getJobById(projectId);

  // If project is not found, return 404

  if (!result.job) {
    notFound();
  }

  // TODO: Pass job to our children components
  return (
    <div className="p-2 sm:p-4 md:p-6 lg:p-8 mt-2">
      <JobDetailView job={result.job} />
    </div>
  );
}
