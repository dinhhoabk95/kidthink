import { deriveAgeBand } from "./child-data.js";

export interface AdminChildProjectionInput {
  uuid: string;
  displayName: string;
  birthYear: number;
  status: string;
  createdAt: Date | string;
  purgeAt?: Date | string | null;
}

export interface AdminChildProjection {
  uuid: string;
  display_name: string;
  age_band: "3-4" | "4-5" | "5-6";
  status: string;
  created_at: string;
  purge_at?: string | null;
}

/**
 * BR-CPA-02, BR-USD-02, D-JF:
 * Single canonical projection for child profiles on admin/manager surfaces.
 * Returns EXACTLY display_name, age_band, status, created_at (+ uuid, purge_at).
 * Forbidden: birth_year, avatar_id, current_curriculum_id, daily_play_cap_minutes, telemetry, mastery, p_learn.
 */
export function projectChildForAdmin(
  child: AdminChildProjectionInput,
  currentYear?: number
): AdminChildProjection {
  const result: AdminChildProjection = {
    uuid: child.uuid,
    display_name: child.displayName,
    age_band: deriveAgeBand(child.birthYear, currentYear),
    status: child.status,
    created_at:
      child.createdAt instanceof Date
        ? child.createdAt.toISOString()
        : String(child.createdAt),
  };

  if (child.purgeAt) {
    result.purge_at =
      child.purgeAt instanceof Date
        ? child.purgeAt.toISOString()
        : String(child.purgeAt);
  }

  return result;
}
