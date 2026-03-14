// src/app/(dashboard)/project/[projectId]/not-found.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <div className="flex h-full items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg text-center">
        <Image
          src="/images/404-error.png"
          alt="404 Error"
          width={300}
          height={300}
          className="mx-auto mb-2 size-48 sm:size-64 md:size-[270px]"
        />
        <h1 className="mb-3 text-2xl font-bold text-secondary sm:mb-4 sm:text-3xl md:text-4xl">
          Oops! Project Not Found
        </h1>
        <p className="mb-6 text-base text-muted-foreground sm:mb-8 sm:text-lg md:text-xl">
          We couldn&apos;t find the project you&apos;re looking for. It may have
          been removed, renamed, or doesn&apos;t exist.
        </p>
        <Link href="/projects">
          <Button className="px-4 py-2 text-sm transition-colors sm:px-6 sm:py-3 sm:text-base">
            Back to Projects
          </Button>
        </Link>
      </div>
    </div>
  );
}
