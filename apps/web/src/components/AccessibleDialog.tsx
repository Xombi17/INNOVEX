"use client";
import React, { useEffect, useRef } from "react";
export function AccessibleDialog({
  open,
  onClose,
  title,
  id,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    element.showModal();
    return () => {
      element.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        close.current();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close.current();
      }}
      className="scope-dialog"
    >
      <div className="p-5 sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id={id} className="text-xl font-semibold">
            {title}
          </h2>
          <button
            type="button"
            autoFocus
            className="control shrink-0"
            onClick={() => close.current()}
            aria-label={`Close ${title}`}
          >
            Close
          </button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
}
