import React from "react";

type Template = {
  id: number;
  name: string;
  description: string;
};

export default async function TemplatesPage() {
  const templatePromise = new Promise<Template[]>((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: "Template 1",
          description: "Description 1",
        },
        {
          id: 2,
          name: "Template 2",
          description: "Description 2",
        },
        {
          id: 3,
          name: "Template 3",
          description: "Description 3",
        },
      ]);
    }, 5000);
  });

  const templates = await templatePromise;

  return (
    <div>
      <h1>Templates Page</h1>
      <div>
        {templates.map((template) => (
          <div key={template.id}>
            <h2>{template.name}</h2>
            <p>{template.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
