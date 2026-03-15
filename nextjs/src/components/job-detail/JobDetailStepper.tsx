import React from "react";
import { cn } from "@/lib/utils";

interface JobDetailStepperProps {
  currentStep: number;
  handleStepClick: (index: number) => void;
  steps: { name: string; tab: string }[];
}

function JobDetailStepper({
  currentStep,
  handleStepClick,
  steps,
}: JobDetailStepperProps) {
  // TODO: Grab the tab query from the URL.
  // TODO: Create state for the current tab.
  // TODO: Use the fetched tab query to set the current tab.

  // TODO: Create a function to handle tab changes.

  return (
    <>
      {/* MOBILE STEP BAR */}
      <div className="md:hidden flex items-start w-full">
        {steps.map((step, index) => (
          <div
            key={step.tab}
            className="flex-1 flex items-center justify-center"
          >
            <button
              onClick={() => handleStepClick(index)}
              className={cn(
                "flex flex-col items-center w-full",
                index === currentStep
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              {/* Number in circle */}
              <span
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mb-1",
                  index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              {/* Step name */}
              <span className="text-xs font-semibold wrap-break-word w-full text-center">
                {step.name}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* DESKTOP STEP BAR */}
      <div className="hidden md:flex items-start w-full">
        {steps.map((step, index) => (
          <div key={step.tab} className="flex items-center flex-1 last:grow-0">
            <button
              onClick={() => handleStepClick(index)}
              className={cn(
                "flex flex-col items-center",
                index === currentStep
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              {/* Number in circle */}
              <span
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold mb-2",
                  index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </span>

              {/* Step name */}
              <span className="text-sm font-semibold">{step.name}</span>
            </button>
            {/* Step separator Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-grow h-0.5 mx-2",
                  index < currentStep ? "bg-primary" : "bg-gray-200",
                )}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default JobDetailStepper;
