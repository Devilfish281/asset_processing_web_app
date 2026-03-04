// src/app/(dashboard)/project/[projectid]/page.tsx
import { notFound } from "next/navigation";
import React from "react";

type Props = {
  params: Promise<{ projectid: string }>;
};

export default async function ProjectPage({ params }: Props) {
  const { projectid } = await params;

  if (projectid === "123") {
    return notFound();
  }

  return (
    <div>
      <div>Project Page Slug: {projectid}</div>
      <div>To test notFound slug 123</div>
    </div>
  );
}
