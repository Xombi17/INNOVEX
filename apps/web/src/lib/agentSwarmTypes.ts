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
    avatar: "sentinel",
    color: "#00d2b4",
    description: "Inspects perimeter identities, masks secrets, and audits requested scopes.",
  },
  threat_modeler: {
    id: "threat_modeler",
    name: "Threat Modeler Agent",
    badge: "Blast Graph & Boundaries",
    avatar: "threat_modeler",
    color: "#a855f7",
    description: "Constructs multi-hop attack paths and maps lateral movement across providers.",
  },
  red_team: {
    id: "red_team",
    name: "Red Team Simulator",
    badge: "Adversary Simulation",
    avatar: "red_team",
    color: "#f43f5e",
    description: "Evaluates worst-case exploit viability from the attacker's perspective.",
  },
  containment_commander: {
    id: "containment_commander",
    name: "Containment Commander",
    badge: "Surgical Mitigation",
    avatar: "containment_commander",
    color: "#38bdf8",
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

export interface SwarmResponse {
  ok: boolean;
  messages: SwarmMessage[];
  error?: string;
  provider?: "gemini-3.x" | "local-deterministic";
}
