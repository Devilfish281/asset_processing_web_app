import React from "react";

interface BodyOtherStepProps {
  jobId: string;
}

function BodyOtherStep({ jobId }: BodyOtherStepProps) {
  return <div>Body Other Step for Job: {jobId}</div>;
}

export default BodyOtherStep;
