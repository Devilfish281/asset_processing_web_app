// src/app/(dashboard)/project/[projectId]/page.tsx
import { notFound } from "next/navigation";
import React from "react";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params;

  if (projectId === "123") {
    return notFound();
  }

  return (
    <div>
      <div>Project Page Slug: {projectId}</div>
      <div>To test notFound slug 123</div>
    </div>
  );
}
