import type {
  BlastNode,
  ProviderId,
  Severity,
  TrustBoundary,
} from "@contracts/index";

export const TRUST_BOUNDARY_META: Record<
  TrustBoundary,
  { label: string; short: string; colorHex: string; tagBg: string; tagInk: string }
> = {
  personal: {
    label: "Personal Identity",
    short: "Personal",
    colorHex: "#00d2b4",
    tagBg: "rgba(0, 210, 180, 0.12)",
    tagInk: "#5eead4",
  },
  developer_local: {
    label: "Developer Local",
    short: "Local env",
    colorHex: "#38bdf8",
    tagBg: "rgba(56, 189, 248, 0.12)",
    tagInk: "#7dd3fc",
  },
  vendor: {
    label: "Third-Party Vendor",
    short: "Vendor",
    colorHex: "#fbbf24",
    tagBg: "rgba(251, 191, 36, 0.12)",
    tagInk: "#fde68a",
  },
  ci_cd: {
    label: "CI/CD & Production",
    short: "CI / Prod",
    colorHex: "#f43f5e",
    tagBg: "rgba(244, 63, 94, 0.12)",
    tagInk: "#fda4af",
  },
  enterprise_tenant: {
    label: "Enterprise Tenant",
    short: "Enterprise",
    colorHex: "#94a3b8",
    tagBg: "rgba(148, 163, 184, 0.12)",
    tagInk: "#cbd5e1",
  },
};

export const SEVERITY_META: Record<
  Severity,
  { label: string; bg: string; ink: string }
> = {
  critical: {
    label: "Critical",
    bg: "rgba(244, 63, 94, 0.18)",
    ink: "#fda4af",
  },
  high: {
    label: "High",
    bg: "rgba(245, 158, 11, 0.18)",
    ink: "#fde68a",
  },
  medium: {
    label: "Medium",
    bg: "rgba(148, 163, 184, 0.18)",
    ink: "#cbd5e1",
  },
  low: {
    label: "Low",
    bg: "rgba(16, 185, 129, 0.18)",
    ink: "#6ee7b7",
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
  generic: "Cross-issuer",
};

const LABEL_MAP: Record<string, string> = {
  "Account / workstation owner": "User identity & workstation",
  "Local / exported integration configuration": "Local config (.mcp.json / .env)",
  exported_env_files: "Exported .env files in Drive",
  pii_documents: "PII & private documents",
  shared_drive_secrets: "Shared Drive credentials",
  password_reset_otps: "Password-reset & OTP inbox",
  downstream_saas_takeover: "SaaS password-reset takeover",
  offline_refresh_token: "Offline refresh token",
  shared_permission_injection: "Injected Drive share rule",
  alert_suppression: "Inbox filter alert suppression",
  committed_secrets: "Secrets stored in GitHub repos",
  private_source_code: "Private repository source code",
  deploy_keys: "Repository deploy keys",
  ci_cd_secrets: "GitHub Actions CI/CD secrets",
  prod_deploy_tokens: "Production deploy tokens",
  crm_records: "CRM customer & pipeline records",
  exported_customer_secrets: "Exported CRM tokens & secrets",
  downstream_api_access: "Cross-issuer downstream API",
  prod_env_vars: "Production Vercel environment vars",
  deployments: "Production deployments",
  api_billing: "OpenAI organization billing",
  model_api_usage: "OpenAI API inference quota",
  anthropic_billing: "Anthropic billing & keys",
  workflow_ci_injection: "CI/CD workflow injection",
  package_publish: "Downstream package publish",
  added_app_secret: "Injected Entra app secret",
  attacker_created_oauth_app: "Rogue Entra OAuth app created",
  corporate_exchange_ews: "Corporate Exchange mailboxes",
  entra_oauth_apps: "Enterprise Entra app directory",
  mailbox_rule_forwarding: "Hidden mailbox forwarding rule",
  corporate_mailboxes: "Corporate email store",
  internal_incident_threads: "Internal incident email threads",
};

const SOURCE_TAG_NAMES: Record<string, string> = {
  exported_env_files: ".env files",
  shared_drive_secrets: "Drive secrets",
  password_reset_otps: "OTP inbox",
  downstream_saas_takeover: "Reset emails",
  committed_secrets: "Repo secrets",
  deploy_keys: "Deploy keys",
  ci_cd_secrets: "CI/CD secrets",
  prod_deploy_tokens: "Prod deploy tokens",
  exported_customer_secrets: "Customer secrets",
};

function decodeSafeRecursively(value: string): string {
  let curr = value;
  for (let i = 0; i < 4; i++) {
    try {
      const next = decodeURIComponent(curr);
      if (next === curr) break;
      curr = next;
    } catch {
      break;
    }
  }
  return curr;
}

export function formatScopeShort(scope: string): string {
  if (scope === "https://mail.google.com/") return "mail.google.com";
  if (scope.startsWith("https://www.googleapis.com/auth/")) {
    return scope.slice("https://www.googleapis.com/auth/".length);
  }
  return scope;
}

export function formatTrustBoundaries(boundaries: string[]): string {
  if (!boundaries || boundaries.length === 0) return "";
  return boundaries
    .map(
      (b) =>
        TRUST_BOUNDARY_META[b as TrustBoundary]?.label ??
        b.replace(/_/g, " "),
    )
    .join(", ");
}

export function humanizeNodeLabel(node: BlastNode): string {
  const decodedId = decodeSafeRecursively(node.id);

  if (node.label === "Potential copied credential") {
    for (const [key, tag] of Object.entries(SOURCE_TAG_NAMES)) {
      if (decodedId.includes(`:${key}:`)) return `Harvested key (${tag})`;
    }
    return "Harvested downstream key";
  }
  if (node.label === "Potential downstream API access") {
    for (const [key, tag] of Object.entries(SOURCE_TAG_NAMES)) {
      if (decodedId.includes(`:${key}:`)) return `External API takeover (${tag})`;
    }
    return "External API takeover";
  }
  if (node.label === "Potential downstream session") {
    if (decodedId.includes("password_reset_otps")) {
      return "Hijacked SaaS session (OTP)";
    }
    if (decodedId.includes("downstream_saas_takeover")) {
      return "Account takeover (reset link)";
    }
    return "Hijacked downstream SaaS session";
  }
  if (node.label === "Potential secondary credential") {
    for (const [key, tag] of Object.entries(SOURCE_TAG_NAMES)) {
      if (decodedId.includes(`:${key}:`)) return `Secondary token (${tag})`;
    }
    return "Harvested secondary token";
  }
  if (node.label === "offline_refresh_token") {
    if (decodedId.includes("gmail")) return "Offline refresh token (Gmail)";
    if (decodedId.includes("drive")) return "Offline refresh token (Drive)";
    return "Offline refresh token";
  }
  if (node.label === "private_source_code" && node.id.startsWith("secret")) {
    return "Private code reached via token";
  }
  if (LABEL_MAP[node.label]) {
    return LABEL_MAP[node.label];
  }
  if (node.kind === "scope") {
    return formatScopeShort(node.label);
  }
  if (node.label.endsWith(" OAuth grant")) {
    const provider = node.label.replace(/\s+OAuth grant$/, "");
    return `${PROVIDER_LABELS[provider as ProviderId] ?? provider} OAuth consent`;
  }
  if (node.label.includes("_") && !node.label.includes("/") && !node.label.includes(" ")) {
    const cleaned = node.label.replace(/_/g, " ");
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return node.label;
}
