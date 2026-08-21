import { REPO_ROOT } from "@mindkid/config/paths";
import { type FileItem, readCodebaseFiles } from "./lint-lib/codebase-files.ts";

const RE_ALLOWED_TIERS = /allowedTiers\s*\(/;
const RE_CLIENT_TIER_CHECK = /access_tier\s*===?\s*['"](standard|premium)['"]/;

function checkServerGating(file: FileItem): string | null {
  // Manager routes (content authoring/studio) are guarded by requireManagerSession, not learner access tiers
  if (file.filePath.includes("/api/managers/")) {
    return null;
  }

  const returnsContentPack = file.content.includes("content_pack");
  const returnsDiffParams = file.content.includes("difficulty_params");
  const hasGatingCall =
    file.content.includes("assertContentAccess") ||
    file.content.includes("assertContentAccess(");

  if ((returnsContentPack || returnsDiffParams) && !hasGatingCall) {
    return `BR-GAT-01 VIOLATION: Handler "${file.filePath}" returns content_pack/difficulty_params without calling assertContentAccess()`;
  }
  return null;
}

function checkClientGating(file: FileItem): string | null {
  const hasClientTierCheck =
    RE_ALLOWED_TIERS.test(file.content) ||
    RE_CLIENT_TIER_CHECK.test(file.content);

  if (hasClientTierCheck) {
    return `BR-GAT-01 VIOLATION: Client file "${file.filePath}" attempts access tier gating logic on client-side.`;
  }
  return null;
}

/**
 * BR-GAT-01 & D-FO: Content handlers must call assertContentAccess on server side.
 * Client components must NOT execute access tier gating checks.
 */
export function scanGatingHandlers(files: FileItem[]): void {
  const violations: string[] = [];

  for (const file of files) {
    const isServer =
      file.filePath.includes("server/api/") ||
      file.filePath.includes("server/routes/");
    const isClient =
      file.filePath.includes("apps/web/components/") ||
      file.filePath.includes("apps/web/pages/") ||
      file.filePath.includes("apps/web/composables/");

    if (isServer) {
      const err = checkServerGating(file);
      if (err) {
        violations.push(err);
      }
    }

    if (isClient) {
      const err = checkClientGating(file);
      if (err) {
        violations.push(err);
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(violations.join("\n"));
  }
}

// Run CLI if called directly
/** Cổng thật: đọc `apps/` + `packages/` từ gốc repo. Ném Error khi vi phạm. */
export function runGatingGate(root: string = REPO_ROOT): void {
  scanGatingHandlers(readCodebaseFiles(root));
}
