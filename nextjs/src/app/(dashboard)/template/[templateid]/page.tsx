// src/app/(dashboard)/template/[templateid]/page.tsx
import React from "react";
import notFound from "./not-found";

type Props = {
  params: Promise<{ templateid: string }>;
};

export default async function TemplatePage({ params }: Props) {
  const { templateid } = await params;

  if (templateid === "123") {
    return notFound();
  }

  return (
    <div>
      <div>Template Page Slug: {templateid}</div>
      <div>To test notFound slug 123</div>
    </div>
  );
}
