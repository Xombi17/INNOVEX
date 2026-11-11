"use client";
import React from "react";

interface Props {
  onOpenSimulator: () => void;
  onOpenPkceGuard: () => void;
  onLoadMcpSample: () => void;
}
export function HowItWorksView({ onOpenSimulator, onOpenPkceGuard, onLoadMcpSample }: Props) {
  return <div className="space-y-5 text-[14px]">
    <p>ScopeBomb models possible exposure from permissions and credential-like values. It cannot establish compromise, effective access or completed remediation.</p>
    <section><h3 className="font-semibold">Web Arena</h3><p className="mt-1 text-[#5d5f60]">Pasted links and files are parsed locally. Public repository checks retrieve selected files through our server and return redacted findings. Optional AI receives only counts and recognized provider names after you request it.</p><button type="button" className="control mt-2" onClick={onOpenSimulator}>Open simulator</button></section>
    <section><h3 className="font-semibold">Chrome extension</h3><p className="mt-1 text-[#5d5f60]">Install the downloaded ZIP separately. The extension evaluates supported Google, GitHub and Microsoft Entra consent navigations and redirects high-risk requests to its warning page. It preserves the pending OAuth transaction. Choosing Open in ScopeBomb Arena sends the authorization URL here.</p><button type="button" className="control mt-2" onClick={onOpenPkceGuard}>Preview guard decision</button></section>
    <section><h3 className="font-semibold">Local CLI</h3><p className="mt-1 text-[#5d5f60]">Scan local MCP/environment files without uploading them. The CLI masks credentials before producing a contract-conforming report.</p><code className="mt-2 block break-words text-[13px]">node packages/engine/cli.ts . --json</code><button type="button" className="control mt-2" onClick={onLoadMcpSample}>Load sample scenario</button></section>
    <p className="text-[13px] text-[#5d5f60]">HTTP 200 is not proof of containment. Independent credentials need issuer-specific cleanup. Commands are reviewable templates; ScopeBomb executes no live revocations.</p>
  </div>;
}
