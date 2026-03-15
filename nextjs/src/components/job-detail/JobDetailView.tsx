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

interface JobDetailViewProps {
  job: Job;
}

function JobDetailView({ job }: JobDetailViewProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const searchParams = useSearchParams();

  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
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
      <JobDetailStepper />
      <JobDetailBody />

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
