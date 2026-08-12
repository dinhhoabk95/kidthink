import { exportTemplateContracts, MVP_TEMPLATES } from "@kidthink/game-engine";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { gameTemplates } from "../schema/game.ts";

/**
 * Seeds Master Game Templates from `@kidthink/game-engine`.
 * Idempotent according to `code`.
 */
export async function seedGameTemplatesMasterData(
  db: NodePgDatabase<Record<string, unknown>>
): Promise<{ templateCount: number }> {
  let count = 0;

  for (const [code, template] of Object.entries(MVP_TEMPLATES)) {
    const exported = exportTemplateContracts(code);

    await db
      .insert(gameTemplates)
      .values({
        code: template.code,
        nameVi: template.name_vi,
        mechanic: template.mechanic,
        layouts: template.layouts,
        contentContract:
          exported.content_contract_json_schema as unknown as Record<
            string,
            unknown
          >,
        difficultyContract:
          exported.difficulty_contract_json_schema as unknown as Record<
            string,
            unknown
          >,
        limits: template.limits as unknown as Record<string, unknown>,
        ageMin: template.age_min,
        ageMax: template.age_max,
        bannedAgeBands: template.banned_age_bands ?? null,
        requiresTapFallback: template.requires_tap_fallback,
        assetKinds: template.asset_kinds,
        scoring: template.scoring as unknown as Record<string, unknown>,
        events: template.events,
        engineSession: template.engine_session,
        status: "active",
        version: template.version,
      })
      .onConflictDoNothing({ target: gameTemplates.code });

    count++;
  }

  return { templateCount: count };
}
