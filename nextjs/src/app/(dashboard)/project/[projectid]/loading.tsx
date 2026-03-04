import React from "react";

type Props = {
  params: Promise<{ projectid: string }>;
};

export default async function ProjectPage({ params }: Props) {
  const { projectid } = await params;

  return (
    <div>
      <h1>Project Loading...</h1>
      <p>Project ID: {projectid}</p>
    </div>
  );
}
