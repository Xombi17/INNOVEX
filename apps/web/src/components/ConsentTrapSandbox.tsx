"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  ShieldCheck,
  ShieldWarning,
  X,
} from "@phosphor-icons/react";
import { DEMO_PKCE_TRAP_URL } from "./InputAndPresetBar";

interface ConsentTrapSandboxProps {
  open: boolean;
  onClose: () => void;
  onApplyCleanScopes: (cleanUrl: string) => void;
  onInspectUrl: (url: string) => void;
}

export function ConsentTrapSandbox({
  open,
  onClose,
  onApplyCleanScopes,
  onInspectUrl,
}: ConsentTrapSandboxProps) {
  const [interceptionTriggered, setInterceptionTriggered] = useState(false);
  const [copiedScopes, setCopiedScopes] = useState(false);

  if (!open) return null;

  const cleanDemoUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?client_id=9481203-shadowai.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fscopebomb.vercel.app%2Foauth-callback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file&access_type=offline&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&state=mv3_guard_clean";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#131416]/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Simulate Fake AI App Consent"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[85vh] w-full max-w-[600px] overflow-y-auto rounded-[16px] border border-[#e8eaec] bg-[#ffffff] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-[#f0f1f2] pb-3">
          <div>
            <span className="rounded-full bg-[#f4f6f8] px-2 py-0.5 text-[11px] font-semibold tracking-wider text-[#5d5f60] uppercase">
              Sandbox Simulator
            </span>
            <h2 className="mt-1 text-[16px] font-semibold text-[#131416]">
              Simulate Third-Party AI App Consent
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[#5d5f60] hover:bg-[#ebedee] hover:text-[#131416]"
          >
            <X size={18} />
          </button>
        </div>

        {!interceptionTriggered ? (
          <div className="space-y-4">
            {/* Realistic OAuth Dialog Box */}
            <div className="rounded-[12px] border border-[#cdced1] bg-[#ffffff] p-5">
              <div className="flex items-center gap-3 border-b border-[#f0f1f2] pb-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1b6c80] font-bold text-[#ffffff]">
                  N
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#131416]">
                    NovaAI Workspace Assistant
                  </div>
                  <div className="text-[12px] text-[#5d5f60]">
                    wants access to your Google Account (john.doe@company.com)
                  </div>
                </div>
              </div>

              <div className="mt-3.5 space-y-3">
                <div className="text-[13px] font-medium text-[#131416]">
                  This app is requesting broad permissions:
                </div>

                <div className="rounded-[8px] bg-[#fbf5e8] p-3 text-[13px] text-[#855306]">
                  <div className="font-semibold">
                    ⚠️ Critical Scope: Read, compose &amp; delete all emails
                  </div>
                  <div className="text-[12px] text-[#855306]/90">
                    https://mail.google.com/
                  </div>
                </div>

                <div className="rounded-[8px] bg-[#fbf5e8] p-3 text-[13px] text-[#855306]">
                  <div className="font-semibold">
                    ⚠️ Critical Scope: Full Google Drive access
                  </div>
                  <div className="text-[12px] text-[#855306]/90">
                    https://www.googleapis.com/auth/drive
                  </div>
                </div>

                <div className="rounded-[6px] bg-[#f4f6f8] px-3 py-2 text-[12px] text-[#5d5f60]">
                  <strong>Protocol Security:</strong> PKCE S256 active · Offline access requested (long-lived refresh token).
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setInterceptionTriggered(true)}
                  className="rounded-[6px] border border-[#1b6c80] bg-[#e6f2f5] px-3.5 py-1.5 text-[13px] font-medium text-[#1b6c80] transition hover:bg-[#d8eef3]"
                >
                  Inspect with ScopeBomb Guard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onInspectUrl(DEMO_PKCE_TRAP_URL);
                    onClose();
                  }}
                  className="rounded-[6px] bg-[#131416] px-4 py-1.5 text-[13px] font-medium text-[#ffffff] transition hover:bg-[#2a2c30]"
                >
                  Allow (Simulate Attack)
                </button>
              </div>
            </div>

            <p className="text-[12px] text-[#5d5f60]">
              In a real browser, the Chrome MV3 Extension intercepts this navigation before the consent page loads, preventing you from accidentally authorizing over-scoped permissions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Interception View */}
            <div className="rounded-[12px] border border-[#a2cfd8] bg-[#e6f2f5]/40 p-5">
              <div className="flex items-center gap-2 text-[#1b6c80]">
                <ShieldCheck size={20} />
                <h3 className="text-[15px] font-semibold">
                  Pre-Consent Interception Active
                </h3>
              </div>

              <div className="mt-3 space-y-2.5 text-[13px] text-[#131416]">
                <p>
                  <strong>Why not silently rewrite the URL query?</strong> Because this OAuth flow uses PKCE (RFC 7636). The client app initialized a cryptographic SHA-256 hash (<code className="font-mono text-[12px]">code_challenge</code>) bound to this specific authorization URL. Modifying <code className="font-mono text-[12px]">?scope=</code> in-flight would cause the subsequent token exchange to be rejected by Google.
                </p>

                <div className="rounded-[8px] bg-[#ffffff] p-3 border border-[#a2cfd8]">
                  <div className="text-[13px] font-semibold text-[#131416]">
                    Recommended Least-Privilege Scope Downgrade:
                  </div>
                  <ul className="mt-1.5 space-y-1 text-[12px] text-[#5d5f60]">
                    <li>
                      ❌ <span className="line-through font-mono">https://mail.google.com/</span> →{" "}
                      <span className="font-mono font-medium text-[#1e7b4f]">
                        https://www.googleapis.com/auth/gmail.readonly
                      </span>
                    </li>
                    <li>
                      ❌ <span className="line-through font-mono">https://www.googleapis.com/auth/drive</span> →{" "}
                      <span className="font-mono font-medium text-[#1e7b4f]">
                        https://www.googleapis.com/auth/drive.file
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.file",
                    );
                    setCopiedScopes(true);
                    setTimeout(() => setCopiedScopes(false), 1500);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-3 py-1.5 text-[13px] text-[#131416] transition hover:bg-[#f4f6f8]"
                >
                  {copiedScopes ? (
                    <>
                      <Check size={14} className="text-[#1e7b4f]" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy Least-Privilege Scopes
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onApplyCleanScopes(cleanDemoUrl);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#1b6c80] px-4 py-1.5 text-[13px] font-medium text-[#ffffff] transition hover:bg-[#155666]"
                >
                  Apply Clean Scopes to Simulation
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInterceptionTriggered(false)}
              className="text-[13px] text-[#5d5f60] hover:underline"
            >
              ← Back to simulated consent prompt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

