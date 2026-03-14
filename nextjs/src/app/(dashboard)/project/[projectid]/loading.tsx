import React from "react";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div>
      <h1>Project Loading...</h1>
      <p>Project ID: {projectId}</p>
    </div>
  );
}
