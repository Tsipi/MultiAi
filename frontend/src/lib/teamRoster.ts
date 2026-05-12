import { MODEL_OPTIONS } from "@/data/models";
import { FACE_OPTIONS, TeamMember, mkMember } from "@/data/experts";

/** Appends a new critic using the next face rotation and default model (matches Advanced team tools). */
export function appendDefaultTeamMember(team: TeamMember[], baseRole: string): TeamMember[] {
  const face = FACE_OPTIONS[team.length % FACE_OPTIONS.length];
  return [
    ...team,
    mkMember(`expert-${Date.now()}`, face.name, face.avatar, MODEL_OPTIONS[0].id, "critic", baseRole),
  ];
}
