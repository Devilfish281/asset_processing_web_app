import React, { Suspense } from "react";
import { Skeleton } from "../ui/skeleton";

//Interface for the props of JobDetailBody. It includes currentStep (number), jobId (string), and steps (array of objects with component property which is a lazy-loaded React component).
interface JobDetailBodyProps {
  currentStep: number;
  jobId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  steps: { component: React.LazyExoticComponent<React.ComponentType<any>> }[];
}

// JobDetailBody is responsible for showing the content of each step in the JobDetailView. It receives the currentStep, jobId, and steps as props. Based on the currentStep, it determines which component to render from the steps array. Each step component is lazy-loaded to optimize performance.
function JobDetailBody({ currentStep, steps, jobId }: JobDetailBodyProps) {
  // CurrentStepComponent is the React component that corresponds to the current step. It is determined by looking up the steps array using the currentStep index and accessing its component property.
  const CurrentStepComponent = steps[currentStep].component;

  // TODO: Look at the current tab and change the project step to show to our users.

  return (
    <Suspense fallback={<StepSkeleton />}>
      <CurrentStepComponent jobId={jobId} />
    </Suspense>
  );
}
export default JobDetailBody;

const StepSkeleton = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 sm:h-12 w-full" />
      <Skeleton className="h-10 sm:h-12 w-full" />
      <Skeleton className="h-10 sm:h-12 w-3/4" />
    </div>
  );
};
