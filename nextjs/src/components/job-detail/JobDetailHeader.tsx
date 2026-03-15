// src/components/job-detail/JobDetailHeader.tsx
"use client";

import { Job } from "@/server/db/schema";
import React, { Dispatch, SetStateAction, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { CheckIcon, SquarePen, Trash2, X } from "lucide-react";

import axios from "axios";
import { toast } from "react-hot-toast";

interface JobDetailHeaderProps {
  job: Job;
  setShowDeleteConfirmation: Dispatch<SetStateAction<boolean>>;
}

function JobDetailHeader({
  job,
  setShowDeleteConfirmation,
}: JobDetailHeaderProps) {
  const [message, setMessage] = useState(job.message ?? "");
  const [isEditing, setIsEditing] = useState(false);

  // TODO: create edit title functionality
  // TODO: useState for title & edited title

  // TODO: save title to db function
  // TODO: Create PUT/PATCH/POST request endpoint for project changes

  // TODO: create delete project functionality
  // TODO: Create DELETE request endpoint for project deletion

  const handleMessageSubmit = async () => {
    try {
      const response = await axios.patch<Job>(`/api/jobs/${job.id}`, {
        message,
      });
      setMessage(response.data.message ?? "");

      // Toast success message
      toast.success("Job message updated successfully");
    } catch (error) {
      const defaultMessage = "Failed to update job message. Please try again.";

      let errorMessages: string[];

      if (axios.isAxiosError(error)) {
        const apiErrors = error.response?.data?.error as
          | Array<{ message?: string }>
          | undefined;

        if (apiErrors && apiErrors.length > 0) {
          errorMessages = apiErrors.map(
            (detail) => detail?.message ?? defaultMessage,
          );
        } else {
          errorMessages = [defaultMessage];
        }
      } else {
        errorMessages = [defaultMessage];
      }

      errorMessages.forEach((msg) => toast.error(msg));
    } finally {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 space-x-0 sm:space-x-2 w-full">
        {/* INPUT EDITOR */}
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="p-0 border-gray-100 bg-gray-50 text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 w-full focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {/* ACTION BUTTONS Section */}
        {/* Checkmark Icon  */}
        <Button
          onClick={handleMessageSubmit}
          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0 bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center"
        >
          <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        {/* X Icon */}
        <Button
          onClick={() => {
            setIsEditing(false);
            setMessage(job.message ?? "");
          }}
          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0 bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between md:justify-start md:space-x-2 w-full">
      {/* TITLE */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 truncate py-1">
        {message}
      </h1>
      {/* ACTIONS */}
      <div className="flex items-center space-x-2">
        <Button
          className={cn(
            "rounded-full p-0 bg-gray-100 text-gray-500 flex items-center justify-center",
            "h-8 w-8 sm:h-10 sm:w-10",
            "hover:text-main hover:bg-main/20",
          )}
          onClick={() => setIsEditing(true)}
        >
          <SquarePen className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>

        <Button
          className={cn(
            "rounded-full p-0 bg-gray-100 text-gray-500 flex items-center justify-center",
            "h-8 w-8 sm:h-10 sm:w-10",
            "hover:text-red-600 hover:bg-red-50",
          )}
          onClick={() => setShowDeleteConfirmation(true)}
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    </div>
  );
}

export default JobDetailHeader;
