import { processPdfRenderJob } from "@mindkid/db";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

export const pdfRender: Consumer<"pdf:render"> = async (payload, ctx) => {
  await processPdfRenderJob(payload.exportJobUuid);
  logJobDone("pdf:render", ctx, { exportJobUuid: payload.exportJobUuid });
};
