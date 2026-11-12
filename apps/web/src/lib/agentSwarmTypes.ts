export type AgentRole =
  | "sentinel"
  | "threat_modeler"
  | "red_team"
  | "containment_commander";

export interface AgentPersona {
  id: AgentRole;
  name: string;
  badge: string;
  avatar: string;
  color: string;
  description: string;
}

export const AGENT_PERSONAS: Record<AgentRole, AgentPersona> = {
  sentinel: {
    id: "sentinel",
    name: "Sentinel Agent",
    badge: "Perimeter Discovery",
    avatar: "🛡️",
    color: "#1b6c80",
    description: "Inspects perimeter identities, masks secrets, and audits requested scopes.",
  },
  threat_modeler: {
    id: "threat_modeler",
    name: "Threat Modeler Agent",
    badge: "Blast Graph & Trust Boundaries",
    avatar: "🕸️",
    color: "#6b21a8",
    description: "Constructs multi-hop attack paths and maps lateral movement across providers.",
  },
  red_team: {
    id: "red_team",
    name: "Red Team Simulator",
    badge: "Adversary Simulation",
    avatar: "⚔️",
    color: "#b91c1c",
    description: "Evaluates worst-case exploit viability from the attacker's perspective.",
  },
  containment_commander: {
    id: "containment_commander",
    name: "Containment Commander",
    badge: "Surgical Mitigation",
    avatar: "🚨",
    color: "#0f766e",
    description: "Generates RFC 7009 kill switches, session invalidations, and 401 verification probes.",
  },
};

export interface SwarmMessage {
  agent: AgentRole;
  content: string;
  timestamp: string;
  isComplete?: boolean;
}

export interface SwarmRequestPayload {
  headline: string;
  providers: string[];
  credentialCount: number;
  scopeCount: number;
  maxHops: number;
  trustBoundaries: string[];
  userQuestion?: string;
}
