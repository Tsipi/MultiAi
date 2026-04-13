import type { TeamMember } from "@/data/experts";

/** Non-empty role text only when every member has the same trimmed role. */
export function sharedLeadExpertRole(team: TeamMember[]): string | null {
  if (team.length === 0) return null;
  const first = team[0].role.trim();
  if (!first) return null;
  if (!team.every((m) => m.role.trim() === first)) return null;
  return first;
}
