// src/components/job-detail/JobDetailView.tsx
"use client";

import { Job } from "@/server/db/schema";
import React, { lazy, useEffect, useState } from "react";
import JobDetailHeader from "./JobDetailHeader";
import JobDetailStepper from "./JobDetailStepper";
import JobDetailBody from "./JobDetailBody";

//import ConfirmationModal from "../ConfirmationModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
// import BodyJobInputStep from "../BodyJobInputStep";
// import BodyJobAIStep from "../BodyJobAIStep";
// import BodyOtherStep from "../BodyOtherStep";

// Lazy load the step components
const BodyJobInputStep = lazy(() => import("../BodyJobInputStep"));
const BodyJobAIStep = lazy(() => import("../BodyJobAIStep"));
const BodyOtherStep = lazy(() => import("../BodyOtherStep"));

//Your component has three step options:
// Then findStepIndex(tab) converts a tab name into a number:
// "upload" → 0
// "prompts" → 1
// "generate" → 2
const steps = [
  { name: "Job Input", tab: "input", component: BodyJobInputStep },
  { name: "Job AI", tab: "ai", component: BodyJobAIStep },
  { name: "Other", tab: "other", component: BodyOtherStep },
];

// const steps = [
//   { name: "Upload Media", tab: "upload", component: ManageUploadStep },
//   { name: "Prompts", tab: "prompts", component: ConfigurePromptsStep },
//   { name: "Generate", tab: "generate", component: GenerateContentStep },
// ];

// Interface for props
interface JobDetailViewProps {
  job: Job;
}

// Main component for project detail view
function JobDetailView({ job }: JobDetailViewProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const searchParams = useSearchParams();

  // findStepIndex(tab) converts a tab name into a number:
  const findStepIndex = (tab: string) => {
    const index = steps.findIndex((step) => step.tab === tab);
    return index === -1 ? 0 : index;
  };

  // currentStep is a number that represents which step/tab is currently active
  // It is initialized by looking at the "tab" query parameter in the URL.
  // If the URL has "?tab=prompts", then currentStep will be set to 1.
  const [currentStep, setCurrentStep] = useState(
    findStepIndex(searchParams.get("tab") ?? "upload"),
  );

  // useRouter is a Next.js hook that allows you to navigate programmatically
  const router = useRouter();

  useEffect(() => {
    const tab = searchParams.get("tab") ?? "upload";
    setCurrentStep(findStepIndex(tab));
  }, [searchParams]);

  const handleStepClick = (index: number) => {
    router.push(`/project/${job.id}?tab=${steps[index].tab}`, {
      scroll: false,
    });
  };

  // Check for query param to show deletion success message
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Make API call to delete the job
      await axios.delete(`/api/jobs/${job.id}`);
      toast.success("Job deleted successfully");
      // change this to go back to projects page after deletion
      router.push("/projects?deleted=true");
    } catch (error) {
      console.error("Failed to delete job", error);
      toast.error("Failed to delete job. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-white space-y-12">
      {/* max-w-screen-xl to max-w-7xl */}
      <h1>Job Detail View</h1>
      <p>Job ID: {job.id}</p>
      <JobDetailHeader
        job={job}
        setShowDeleteConfirmation={setShowDeleteConfirmation}
      />
      <JobDetailStepper
        currentStep={currentStep}
        handleStepClick={handleStepClick}
        steps={steps}
      />

      <JobDetailBody currentStep={currentStep} steps={steps} jobId={job.id} />

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        title="Delete Job"
        message="Are you sure you want to delete this job? This action cannot be undone."
        isLoading={isDeleting}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default JobDetailView;
