"use client";
export type WorkflowStep = 1 | 2 | 3;
export const STEP_LABELS = [
  "Input",
  "Exposure",
  "Actions",
];
export function StepStepper({
  activeStep,
  onChangeStep,
  hasAnalysis = true,
}: {
  activeStep: WorkflowStep;
  onChangeStep: (step: WorkflowStep) => void;
  hasAnalysis?: boolean;
}) {
  return (
    <nav aria-label="Analysis steps" className="workflow-stepper sm:px-7">
      <ol className="workflow-steps">
        {STEP_LABELS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => onChangeStep((index + 1) as WorkflowStep)}
              disabled={index > 0 && !hasAnalysis}
              aria-current={activeStep === index + 1 ? "step" : undefined}
              className="workflow-step w-full sm:text-[14px]"
            >
              <span className="workflow-step__number" aria-hidden="true">{index + 1}.</span>
              <span className="workflow-step__label">{label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
