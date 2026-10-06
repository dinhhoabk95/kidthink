import type {
  RoadmapSession,
  RoadmapSessionRole,
  RoadmapWeek,
} from "./types.js";

export function session(
  sessionNo: number,
  role: RoadmapSessionRole,
  skillCode: string
): RoadmapSession {
  return { session_no: sessionNo, role, skill_code: skillCode };
}

function targetSkills(sessions: readonly RoadmapSession[]): string[] {
  return [...new Set(sessions.map((s) => s.skill_code))];
}

export function week(
  weekNo: number,
  goal: string,
  sessions: readonly RoadmapSession[]
): RoadmapWeek {
  return {
    week_no: weekNo,
    goal,
    target_skills: targetSkills(sessions),
    sessions,
  };
}
