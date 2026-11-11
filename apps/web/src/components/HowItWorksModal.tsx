"use client";
import React, { useEffect, useRef } from "react";
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
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  return (
    <dialog ref={dialog} onCancel={onClose} aria-label="How 3 tools connect"
      className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-[650px] rounded-[16px] border border-[#cdced1] bg-white p-0 text-[#131416] backdrop:bg-[#131416]/45"
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="relative max-h-[85vh] w-full max-w-[600px] overflow-y-auto rounded-[16px] border border-[#cdced1] bg-[#ffffff] p-6">
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
    </dialog>
  );
}

