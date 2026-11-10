"use client";
import React from "react";

interface StepStepperProps {
  activeStep: 1 | 2 | 3;
  onChangeStep: (step: 1 | 2 | 3) => void;
}

const STEPS: { id: 1 | 2 | 3; label: string }[] = [
  { id: 1, label: "1. Scan & Verdict" },
  { id: 2, label: "2. Attack Path" },
  { id: 3, label: "3. Fix Plan & Blocker" },
];

export function StepStepper({ activeStep, onChangeStep }: StepStepperProps) {
  return (
    <div
      role="tablist"
      aria-label="Workflow steps"
      className="flex items-center gap-1 border-b border-[#e8eaec] px-5 py-2"
    >
      {STEPS.map((step, i) => {
        const active = activeStep === step.id;
        const completed = activeStep > step.id;
        return (
          <React.Fragment key={step.id}>
            <button
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChangeStep(step.id)}
              className={`whitespace-nowrap rounded-[6px] px-3 py-1.5 text-[13px] transition ${
                active
                  ? "bg-[#ebedee] font-medium text-[#131416]"
                  : "text-[#5d5f60] hover:bg-[#f4f6f8] hover:text-[#131416]"
              }`}
            >
              {completed ? "✓ " : ""}
              {step.label}
            </button>
            {i < STEPS.length - 1 && (
              <span className="select-none text-[13px] text-[#cdced1]" aria-hidden="true">
                ›
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
