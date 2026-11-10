import type { ProviderId, Severity, TrustBoundary } from "@contracts/index";

export const TRUST_BOUNDARY_META: Record<
  TrustBoundary,
  { label: string; colorHex: string; badgeClass: string; short: string }
> = {
  personal: {
    label: "Personal Identity",
    short: "personal",
    colorHex: "#38bdf8",
    badgeClass: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  },
  developer_local: {
    label: "Developer Local",
    short: "developer_local",
    colorHex: "#a78bfa",
    badgeClass: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  },
  vendor: {
    label: "Third-Party Vendor",
    short: "vendor",
    colorHex: "#fbbf24",
    badgeClass: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  },
  ci_cd: {
    label: "CI/CD & Prod Deploy",
    short: "ci_cd",
    colorHex: "#fb7185",
    badgeClass: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  },
  enterprise_tenant: {
    label: "Enterprise Tenant",
    short: "enterprise_tenant",
    colorHex: "#818cf8",
    badgeClass: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300",
  },
};

export const SEVERITY_META: Record<
  Severity,
  { badgeClass: string; label: string }
> = {
  critical: {
    label: "CRITICAL",
    badgeClass: "border-rose-500/50 bg-rose-500/15 text-rose-300",
  },
  high: {
    label: "HIGH",
    badgeClass: "border-orange-500/50 bg-orange-500/15 text-orange-300",
  },
  medium: {
    label: "MEDIUM",
    badgeClass: "border-amber-500/50 bg-amber-500/15 text-amber-300",
  },
  low: {
    label: "LOW",
    badgeClass: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
  },
};

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  google: "Google",
  github: "GitHub",
  microsoft: "Microsoft Entra",
  slack: "Slack",
  salesforce: "Salesforce",
  vercel: "Vercel",
  anthropic: "Anthropic",
  openai: "OpenAI",
  generic: "Multi-Issuer",
};
