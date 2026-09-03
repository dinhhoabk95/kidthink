/**
 * Check Skill Registry (BR-SDS-07).
 *
 * Mọi file định nghĩa kỹ năng trong thư mục `packages/db/src/seed-content/skills/`
 * bắt buộc phải được đăng ký trong registry `SKILL_DATASETS` ở `skills/index.ts`.
 * Bất kỳ file nào nằm mồ côi ngoài registry sẽ làm cổng đỏ.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { SkillDataset } from "@mindkid/shared";
import type { GateIssue, GateResult } from "#src/seed-content/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.resolve(__dirname, "../skills");

function findSkillFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSkillFiles(fullPath));
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".d.ts") &&
      entry.name !== "index.ts"
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

const SKILL_CODE_REGEX = /^C[1-6]\.[A-Z]{2,5}\.\d{2}$/;

export function checkSkillRegistry(
  registeredDatasets: Record<string, SkillDataset>
): GateResult {
  const issues: GateIssue[] = [];
  const registeredCodes = new Set(Object.keys(registeredDatasets));

  const skillFiles = findSkillFiles(SKILLS_DIR);

  for (const filePath of skillFiles) {
    const baseName = path.basename(filePath, ".ts");
    // Mã kỹ năng theo tên file, ví dụ "C1.NREC.02"
    if (SKILL_CODE_REGEX.test(baseName) && !registeredCodes.has(baseName)) {
      issues.push({
        code: "SKILL_NOT_IN_REGISTRY",
        message: `[BR-SDS-07] File kỹ năng '${filePath}' chưa được đăng ký trong SKILL_DATASETS registry.`,
      });
    }
  }

  return {
    gate: 10,
    name: "Skill Registry (BR-SDS-07)",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}
