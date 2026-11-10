"use client";
import React, { useEffect } from "react";
import { X } from "@phosphor-icons/react";
import { HowItWorksView } from "./HowItWorksView";

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
  onOpenSimulator: () => void;
  onOpenPkceGuard: () => void;
  onLoadMcpSample: () => void;
}

export function HowItWorksModal({
  open,
  onClose,
  onOpenSimulator,
  onOpenPkceGuard,
  onLoadMcpSample,
}: HowItWorksModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#131416]/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="How 3 tools connect"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[80vh] w-full max-w-[560px] overflow-y-auto rounded-[16px] border border-[#e8eaec] bg-[#ffffff] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#131416]">How the 3 tools connect</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[#5d5f60] hover:bg-[#ebedee] hover:text-[#131416]"
          >
            <X size={18} />
          </button>
        </div>
        <HowItWorksView
          onOpenSimulator={() => {
            onClose();
            onOpenSimulator();
          }}
          onOpenPkceGuard={() => {
            onClose();
            onOpenPkceGuard();
          }}
          onLoadMcpSample={() => {
            onClose();
            onLoadMcpSample();
          }}
        />
      </div>
    </div>
  );
}

