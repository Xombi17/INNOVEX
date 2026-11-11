"use client";
export type WorkflowStep = 1 | 2 | 3;
export const STEP_LABELS = [
  "Check input",
  "Understand exposure",
  "Review actions",
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
    <nav
      aria-label="Analysis steps"
      className="border-b border-[#e8eaec] px-4 py-3 sm:px-7"
    >
      <ol className="grid grid-cols-3 gap-2">
        {STEP_LABELS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => onChangeStep((index + 1) as WorkflowStep)}
              disabled={index > 0 && !hasAnalysis}
              aria-current={activeStep === index + 1 ? "step" : undefined}
              className={`flex min-h-11 w-full items-center gap-2 rounded-md p-2 text-left text-[13px] sm:text-[14px] ${activeStep === index + 1 ? "bg-[#e6f2f5] font-medium text-[#155768]" : "text-[#5d5f60] disabled:opacity-60"}`}
            >
              <span className="shrink-0 font-mono">{index + 1}.</span>
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
