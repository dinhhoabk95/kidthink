import { sweepAbandonedSessions } from "@mindkid/play";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

export const sweepAbandoned: Consumer<"sweep:abandoned"> = async (
  _payload,
  ctx
) => {
  const sweptCount = await sweepAbandonedSessions();
  logJobDone("sweep:abandoned", ctx, { swept: sweptCount });
  return { sweptCount };
};
