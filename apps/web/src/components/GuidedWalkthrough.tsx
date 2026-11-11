"use client";
import { useEffect, useRef, type MouseEvent } from "react";
import type { WorkflowStep } from "./StepStepper";

const steps = [
  {
    title: "Start with the evidence",
    body: "Look at a permission or redacted credential and its source. This is what the example supplies; actual access and compromise remain unknown.",
    reveal: "Show me the evidence",
    next: "Next: follow the exposure",
  },
  {
    title: "Follow the possible exposure",
    body: "Trace one conditional chain. A valid key copied from another service needs separate review at its own issuer, even after the original app loses access.",
    reveal: "Show me the exposure chain",
    next: "Next: review the actions",
  },
  {
    title: "Find a practical next action",
    body: "Open a provider action, check who can perform it, and review how to verify the result. These are instructions; ScopeBomb does not execute them.",
    reveal: "Show me the first review action",
    next: "Finish walkthrough",
  },
];

export function GuidedWalkthrough({
  step,
  complete,
  onReveal,
  onStep,
  onFinish,
  onExit,
  onStartInput,
}: {
  step: WorkflowStep;
  complete: boolean;
  onReveal: (event: MouseEvent<HTMLButtonElement>) => void;
  onStep: (step: WorkflowStep) => void;
  onFinish: () => void;
  onExit: () => void;
  onStartInput: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (complete) heading.current?.focus();
  }, [complete]);
  const current = steps[step - 1];
  return (
    <section
      aria-label="Guided example walkthrough"
      className="walkthrough-guide"
      data-walkthrough-step={complete ? "complete" : step}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px]">
        <span aria-live="polite" aria-atomic="true" className="font-medium text-[#155768]">
          {complete ? "Walkthrough complete" : `Guided example · ${step} of 3`}
        </span>
        <button type="button" className="walkthrough-exit" onClick={onExit}>
          Explore without guidance
        </button>
      </div>
      <h2 ref={heading} tabIndex={-1} className="mt-3 text-lg font-semibold">
        {complete ? "Your next step is a real review." : current.title}
      </h2>
      <p className="muted mt-2 max-w-[80ch]">
        {complete
          ? "You’ve seen the evidence, a possible exposure chain and a provider review action. No account was changed or verified. Try your own input when you’re ready."
          : current.body}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {complete ? (
          <button className="control control-primary" type="button" onClick={onStartInput}>
            Check my configuration now
          </button>
        ) : (
          <>
            <button className="control control-primary" type="button" onClick={onReveal}>
              {current.reveal}
            </button>
            {step > 1 && (
              <button className="control" type="button" onClick={() => onStep((step - 1) as WorkflowStep)}>
                Previous step
              </button>
            )}
            <button
              className="control"
              type="button"
              onClick={() => step === 3 ? onFinish() : onStep((step + 1) as WorkflowStep)}
            >
              {current.next}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
