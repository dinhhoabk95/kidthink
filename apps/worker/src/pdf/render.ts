import { processPdfRenderJob } from "@kidthink/db";

const PDF_RENDER_PREFIX = /^pdf:render:/;

export async function runPdfRenderJob(
  jobId: string,
  payload?: { exportJobUuid?: string }
): Promise<void> {
  const jobUuid =
    payload?.exportJobUuid || jobId.replace(PDF_RENDER_PREFIX, "");
  if (!jobUuid) {
    throw new Error("Missing exportJobUuid in pdf:render job");
  }

  await processPdfRenderJob(jobUuid);
}
