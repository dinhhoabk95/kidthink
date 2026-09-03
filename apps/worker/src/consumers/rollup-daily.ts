import { logJobDone } from "#src/log";
import { runDailyRollup } from "../services/rollup.js";
import type { Consumer } from "./types.js";

export const rollupDaily: Consumer<"rollup:daily"> = async (payload, ctx) => {
  const result = await runDailyRollup(payload.dateIct);

  logJobDone("rollup:daily", ctx, {
    dateIct: result.dateIct,
    child: result.childStatsCount,
    level: result.levelStatsCount,
    skill: result.skillStatsCount,
  });
};
