// src/components/ProjectList.tsx
import { Job } from "@/server/db/schema";
import React from "react";
import { Card, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";
import { getTimeDifference } from "@/utils/timeUtils";

interface JobListProps {
  jobs: Job[];
}

function JobList({ jobs }: JobListProps) {
  return (
    <div className="grid gap-4 sm:gap-6 md:gap-8 lg:gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {/* note: iterate through each job and convert it into its own card */}
      {jobs.map((job) => (
        <Link key={job.id} href={`/project/${job.id}`}>
          <Card className="border border-gray-200 rounded-3xl p-3 hover:border-main hover:scale-[1.01] hover:shadow-md hover:text-main transition-all duration-300">
            <CardHeader className="pb-3 sm:pb-4 lg:pb-5 w-full">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl truncate">
                {job.todoKind}
              </CardTitle>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                Updated {getTimeDifference(job.updatedAt)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                Size {job.size}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                Status: {job.status}
              </p>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default JobList;
