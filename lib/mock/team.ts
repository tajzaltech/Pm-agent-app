import type { TeamMember } from "@/lib/types";

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { id: "u001", name: "Alex Rivera", email: "alex@acmetech.com", role: "admin", status: "active", avatarInitials: "AR" },
  { id: "u002", name: "Jamie Park", email: "jamie@acmetech.com", role: "reviewer", status: "active", avatarInitials: "JP" },
  { id: "u003", name: "Sam Okafor", email: "sam@acmetech.com", role: "reviewer", status: "active", avatarInitials: "SO" },
  { id: "u004", name: "Casey Liu", email: "casey@acmetech.com", role: "viewer", status: "invited", avatarInitials: "CL" },
  { id: "u005", name: "Morgan Singh", email: "morgan@acmetech.com", role: "viewer", status: "invited", avatarInitials: "MS" },
];
