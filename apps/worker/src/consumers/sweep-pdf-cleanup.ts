import { runPdfCleanupJob } from "@mindkid/db";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

export const sweepPdfCleanup: Consumer<"sweep:pdf-cleanup"> = async (
  _payload,
  ctx
) => {
  await runPdfCleanupJob();
  logJobDone("sweep:pdf-cleanup", ctx);
};
