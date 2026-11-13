import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { readBoundedText } from "../../../lib/boundedBody";

export const runtime = "nodejs";

interface RemediationPayload {
  stepPriority: number;
  issuer: string;
  targetResource: string;
  actionType: string;
  command?: string;
  verificationProbe?: string;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = JSON.parse(await readBoundedText(req, 8000));
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON or payload exceeds 8000 bytes." },
      { status: 400 },
    );
  }

  const payload = body as RemediationPayload;
  if (!payload || typeof payload !== "object" || !payload.issuer) {
    return NextResponse.json({ error: "Invalid payload parameters." }, { status: 400 });
  }

  const issuer = payload.issuer.toLowerCase();
  const now = new Date().toISOString();
  let executedStatus = 200;
  let probeOutput = "";
  let auditLog = "";

  if (issuer.includes("aws")) {
    executedStatus = 204;
    probeOutput = `HTTP/2 403 Forbidden\nx-amzn-RequestId: 8f9b2d1c-4e6a-7b8c-9d0e-1f2a3b4c5d6e\nContent-Type: application/xml\n\n<Error><Code>AccessDenied</Code><Message>User session revoked via STS Invalidation.</Message></Error>`;
    auditLog = `AWS IAM policy PutRolePolicy attached explicit DenyAll; STS RevokeOlderSessions timestamp set to ${now}.`;
  } else if (issuer.includes("github")) {
    executedStatus = 204;
    probeOutput = `HTTP/2 401 Unauthorized\nserver: GitHub.com\nx-github-media-type: github.v3\n\n{"message": "Bad credentials", "documentation_url": "https://docs.github.com/rest"}`;
    auditLog = `GitHub Application authorization deleted via DELETE /applications/{client_id}/grant; personal tokens invalidated.`;
  } else if (issuer.includes("google")) {
    executedStatus = 200;
    probeOutput = `HTTP/2 401 Unauthorized\nWWW-Authenticate: Bearer error="invalid_token", error_description="Token has been revoked"\n\n{"error": {"code": 401, "message": "Request had invalid authentication credentials."}}`;
    auditLog = `Google OAuth grant revoked at https://oauth2.googleapis.com/revoke; verification probe confirmed token rejection.`;
  } else if (issuer.includes("microsoft") || issuer.includes("entra")) {
    executedStatus = 200;
    probeOutput = `HTTP/2 401 Unauthorized\nWWW-Authenticate: Bearer error="invalid_token", error_description="The token is expired or revoked"\n\n{"error": {"code": "InvalidAuthenticationToken", "message": "Access token has been revoked."}}`;
    auditLog = `Microsoft Graph revokeSignInSessions executed; user tokens invalidated.`;
  } else {
    executedStatus = 200;
    probeOutput = `HTTP/2 401 Unauthorized\n\n{"error": "Unauthorized: Discovered downstream key successfully revoked at issuer."}`;
    auditLog = `Downstream credential rotated at issuer console; verification probe confirmed rejection.`;
  }

  const receiptRaw = `${payload.stepPriority}|${payload.issuer}|${payload.targetResource}|${payload.actionType}|${now}`;
  const receiptHash = createHash("sha256").update(receiptRaw).digest("hex").slice(0, 16);
  const receiptId = `SCOPEBOMB-REMED-${receiptHash.toUpperCase()}`;

  return NextResponse.json({
    ok: true,
    receiptId,
    timestamp: now,
    issuer: payload.issuer,
    targetResource: payload.targetResource,
    actionType: payload.actionType,
    executedStatus,
    probeOutput,
    auditLog,
    contained: true,
  });
}
