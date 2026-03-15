//src/components/BodyJobAIStep.tsx
import React from "react";

interface BodyJobAIStepProps {
  jobId: string;
}

function BodyJobAIStep({ jobId }: BodyJobAIStepProps) {
  return <div>Body Job AI Step for Job: {jobId}</div>;
}

export default BodyJobAIStep;
