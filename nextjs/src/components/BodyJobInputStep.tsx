import React from "react";

interface BodyJobInputStepProps {
  jobId: string;
}

function BodyJobInputStep({ jobId }: BodyJobInputStepProps) {
  return <div>Body Job Input Step for Job: {jobId}</div>;
}

export default BodyJobInputStep;
