// src/app/(dashboard)/projects/loading.tsx
import React from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-10 w-40 sm:h-12 sm:w-52" />
          <Skeleton className="h-5 w-64 sm:w-80 md:w-96" />
        </div>

        <Skeleton className="h-10 w-36 rounded-full sm:mt-1" />
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="space-y-4">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
