import React from "react";

type Project = {
  id: number;
  name: string;
  description: string;
};

export default async function ProjectsPage() {
  const projectPromise = new Promise<Project[]>((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: "Project 1",
          description: "Description 1",
        },
        {
          id: 2,
          name: "Project 2",
          description: "Description 2",
        },
        {
          id: 3,
          name: "Project 3",
          description: "Description 3",
        },
      ]);
    }, 5000);
  });

  const projects = await projectPromise;

  return (
    <div>
      <h1>Projects Page</h1>
      <div>
        {projects.map((project) => (
          <div key={project.id}>
            <h2>{project.name}</h2>
            <p>{project.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
