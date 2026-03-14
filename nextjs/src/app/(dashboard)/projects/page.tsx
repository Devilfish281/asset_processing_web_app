// nextjs/src/app/(dashboard)/projects/page.tsx
// Using Tailwind UI for styling, we will create a dashboard page that lists the user's projects and allows them to create new projects. We will also create a detail view for each project where the user can see the project's details and manage the project's assets and todos.
// We will use the getJobsForUser query to fetch the jobs for the user and display them in a list. We will also create a form to create new jobs for the user. When the user creates a new job, we will call the createJobForUser mutation to create a new job in the database and then refresh the list of jobs for the user.
import React from "react";
import { getJobsForUser } from "@/server/queries";
import { createJobForUser, createJobTodo } from "@/server/mutation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import JobList from "@/components/ProjectList";

export default async function ProjectsPage() {
  let { userId, jobs } = await getJobsForUser();

  if (jobs.length === 0) {
    const message =
      "Hello, this is Mark Dobley. I need to get soil for my elevated planter for my herb garden.";

    await createJobForUser(message);
    ({ userId, jobs } = await getJobsForUser());
  }

  await new Promise((resolve) => setTimeout(resolve, 10000));
  // TODO: Fetch projects from database

  return (
    <div className="w-full">
      <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 md:p-8 lg:p-12 mt-2 space-y-6 sm:space-y-8 lg:space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
          <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              My Jobs
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              Manage your asset processing jobs effectively using AI
            </p>
          </div>
          <form action={createJobTodo} className="w-full sm:w-auto">
            <Button className="rounded-3xl text-base w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-1" strokeWidth={3} />
              New Job Todo
            </Button>
          </form>
        </div>
        <JobList jobs={jobs} />
      </div>
      <div>
        <div>
          {jobs.length === 0 ? (
            <h1>none found for user ID: {userId}</h1>
          ) : (
            jobs.map((job) => (
              <div key={job.id}>
                {" "}
                <div>id: {job.id}</div>
                <div>threadId: {job.threadId}</div>
                <div>userId: {job.userId}</div>
                <div>todoKind: {job.todoKind}</div>
                <div>status: {job.status}</div>
                <div>attempts: {job.attempts}</div>
                <div>lastHeartbeat: {job.lastHeartbeat ?? "null"}</div>{" "}
                <div>errorMessage: {job.errorMessage ?? "null"}</div>{" "}
                <div>size: {job.size}</div>
                <div>message: {job.message ?? "null"}</div>
                <div>lastMsgType: {job.lastMsgType ?? "null"}</div>{" "}
                <div>lastMsgContent: {job.lastMsgContent ?? "null"}</div>{" "}
                <div>createdAt: {job.createdAt}</div>
                <div>updatedAt: {job.updatedAt}</div>
                <hr />
              </div>
            ))
          )}{" "}
        </div>
        {/* TODO: Create project list header with create action */}
        {/* TODO: Grid of cards to view each project and navigate to detail view */}
      </div>
    </div>
  );
}
