"use client";
import React, { useEffect, useRef, useState } from "react";
import type { AuditReport } from "@contracts/index";
import { analyzeAudit } from "@scopebomb/engine";
import { DEMO_PKCE_TRAP_URL } from "./InputAndPresetBar";

export function ConsentTrapSandbox({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [audit, setAudit] = useState<AuditReport | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (open) { dialog.current?.showModal(); setAudit(null); setCopied(false); }
    else dialog.current?.close();
  }, [open]);
  const inspect = (clean = false) => {
    const url = new URL(DEMO_PKCE_TRAP_URL);
    if (clean) {
      url.searchParams.set("scope", "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.file");
      for (const key of ["state", "code_challenge", "code_challenge_method"]) url.searchParams.delete(key);
    }
    setAudit(analyzeAudit({ mode: "oauth_url", raw_payload: url.href, simulation_mode: "naive_single_revoke" }));
  };
  return <dialog ref={dialog} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="consent-sandbox-title" className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-[600px] overflow-y-auto rounded-[16px] border border-[#cdced1] bg-white p-6 text-[#131416] backdrop:bg-[#131416]/45">
    <div className="flex items-start justify-between gap-4"><div><h2 id="consent-sandbox-title" className="text-[20px] font-semibold">Fake AI app consent sandbox</h2><p className="mt-1 text-[13px] text-[#5d5f60]">Educational simulation. Your current audit stays unchanged; no login, consent or browser extension action occurs.</p></div><button className="control" type="button" onClick={onClose} aria-label="Close consent sandbox">Close</button></div>
    {!audit ? <div className="mt-5 space-y-4"><h3 className="font-semibold">NovaAI Workspace Assistant wants access</h3><ul className="list-disc space-y-2 pl-5"><li>Read, compose and delete Gmail messages</li><li>Full Google Drive access</li><li>Offline access, with a PKCE S256 challenge present</li></ul><p className="text-[13px] text-[#5d5f60]">Choosing the button evaluates the sample through the real deterministic engine. It does not grant permissions.</p><button className="control control-primary" type="button" onClick={() => inspect()}>Simulate Allow and inspect</button></div> : <div className="mt-5 space-y-4">
      <p role="status" className="font-semibold">Engine decision: {audit.pre_consent_guard.action}</p>
      <p className="text-[14px]">Modeled risk: {audit.summary.max_risk_score}/100. Surviving resources after one simulated revoke: {audit.naive_containment.persisting_node_ids.length}.</p>
      <p className="text-[14px]">PKCE S256 derives its challenge from the verifier, not the scopes. The extension preserves the pending request. A real permission change must start in the client with fresh state and PKCE values.</p>
      <p className="text-[13px] text-[#5d5f60]">Engine replacement URL: <code>{JSON.stringify(audit.pre_consent_guard.safe_replacement_url)}</code>. This demo re-audits a separate sample; it never opens that URL.</p>
      <ul className="list-disc space-y-2 pl-5 text-[13px]">{audit.pre_consent_guard.flagged_scopes.map(scope => <li key={scope.scope_id} className="break-words"><code>{scope.scope_id}</code> → <code>{scope.recommended_scope_id}</code></li>)}</ul>
      <div className="flex flex-wrap gap-2"><button className="control" type="button" onClick={async () => { try { await navigator.clipboard.writeText("https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.file"); setCopied(true); } catch { setCopied(false); } }}>{copied ? "Copied scopes" : "Copy narrower sample scopes"}</button><button className="control control-primary" type="button" onClick={() => inspect(true)}>Apply clean scopes to simulation</button></div>
      <p className="text-[13px] text-[#5d5f60]">Narrower permissions can still expose sensitive data. A lower score is not a safety guarantee.</p>
    </div>}
  </dialog>;
}
