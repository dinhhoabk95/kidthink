import {
  type ProcessEmailJobInput,
  type ProcessEmailJobResult,
  runSendEmail as runSendEmailShared,
} from "@kidthink/shared";

export function runSendEmail(
  jobId: string,
  input: ProcessEmailJobInput
): Promise<ProcessEmailJobResult> {
  return runSendEmailShared(jobId, input);
}
