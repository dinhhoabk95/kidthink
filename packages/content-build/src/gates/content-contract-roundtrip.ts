/**
 * Spec sở hữu: docs/specs/01-platform/game-template-contract.md
 * Rule sở hữu: BR-GTC-10
 */

import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { repoPath } from "@mindkid/config/paths";
import {
  ALL_TEMPLATES,
  type GameTemplate,
} from "@mindkid/game-engine/registry";
import { ALL_SEED_LEVELS } from "#src/catalog";
import type { ContentSeed } from "#src/types";

export interface ContentContractRoundTripIssue {
  readonly levelCode: string;
  readonly templateCode: string;
  readonly target: "content_pack" | `rounds[${number}].content_pack`;
  readonly fieldPath: string;
  readonly message: string;
}

export interface ContentContractRoundTripReport {
  readonly totalLevels: number;
  readonly totalPacksChecked: number;
  readonly passedLevels: number;
  readonly failedLevels: number;
  readonly issues: readonly ContentContractRoundTripIssue[];
  readonly passed: boolean;
}

function checkSinglePackRoundTrip(
  levelCode: string,
  templateCode: string,
  template: GameTemplate,
  target: "content_pack" | `rounds[${number}].content_pack`,
  pack: ContentSeed["content_pack"],
  issues: ContentContractRoundTripIssue[]
): boolean {
  const firstParse = template.content_contract.safeParse(pack);
  if (!firstParse.success) {
    for (const err of firstParse.error.issues) {
      issues.push({
        levelCode,
        templateCode,
        target,
        fieldPath: err.path.length > 0 ? err.path.join(".") : "(root)",
        message: err.message,
      });
    }
    return false;
  }

  const serialized = JSON.stringify(firstParse.data);
  const roundTrippedParse = template.content_contract.safeParse(
    JSON.parse(serialized)
  );
  if (!roundTrippedParse.success) {
    for (const err of roundTrippedParse.error.issues) {
      issues.push({
        levelCode,
        templateCode,
        target,
        fieldPath: err.path.length > 0 ? err.path.join(".") : "(root)",
        message: `Round-trip parse failed: ${err.message}`,
      });
    }
    return false;
  }

  const reserialized = JSON.stringify(roundTrippedParse.data);
  if (reserialized !== serialized) {
    issues.push({
      levelCode,
      templateCode,
      target,
      fieldPath: "(root)",
      message:
        "Round-trip serialization mismatch after re-parsing content_contract",
    });
    return false;
  }

  return true;
}

function evaluateSingleLevelRoundTrip(
  level: ContentSeed,
  registry: Record<string, GameTemplate>,
  issues: ContentContractRoundTripIssue[]
): { levelOk: boolean; packsChecked: number } {
  const levelCode = level.header.code;
  const templateCode = level.header.template_code;
  const template = registry[templateCode];

  if (!template) {
    issues.push({
      levelCode,
      templateCode,
      target: "content_pack",
      fieldPath: "template_code",
      message: `Template '${templateCode}' không tồn tại trong ALL_TEMPLATES`,
    });
    return { levelOk: false, packsChecked: 0 };
  }

  let packsChecked = 1;
  let levelOk = checkSinglePackRoundTrip(
    levelCode,
    templateCode,
    template,
    "content_pack",
    level.content_pack,
    issues
  );

  for (let idx = 0; idx < (level.rounds?.length ?? 0); idx++) {
    const round = level.rounds?.[idx];
    if (!round) {
      continue;
    }
    packsChecked++;
    const roundOk = checkSinglePackRoundTrip(
      levelCode,
      templateCode,
      template,
      `rounds[${idx}].content_pack`,
      round.content_pack,
      issues
    );
    if (!roundOk) {
      levelOk = false;
    }
  }

  return { levelOk, packsChecked };
}

export function evaluateContentContractRoundTrip(
  levels: readonly ContentSeed[] = ALL_SEED_LEVELS,
  registry: Record<string, GameTemplate> = ALL_TEMPLATES
): ContentContractRoundTripReport {
  const issues: ContentContractRoundTripIssue[] = [];
  let failedLevels = 0;
  let totalPacksChecked = 0;

  for (const level of levels) {
    const { levelOk, packsChecked } = evaluateSingleLevelRoundTrip(
      level,
      registry,
      issues
    );
    totalPacksChecked += packsChecked;
    if (!levelOk) {
      failedLevels++;
    }
  }

  return {
    totalLevels: levels.length,
    totalPacksChecked,
    passedLevels: levels.length - failedLevels,
    failedLevels,
    issues,
    passed: issues.length === 0,
  };
}

export function loadRoundTripSeedFixtures(
  repoRelativePath: string
): readonly ContentSeed[] {
  const fullPath = repoPath(repoRelativePath);
  const raw = fs.readFileSync(fullPath, "utf-8");
  return JSON.parse(raw) as readonly ContentSeed[];
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = evaluateContentContractRoundTrip();
  if (!report.passed) {
    console.error(
      `✗ BR-GTC-10 round-trip failed: ${report.failedLevels}/${report.totalLevels} levels (${report.issues.length} issues)`
    );
    for (const issue of report.issues.slice(0, 20)) {
      console.error(
        `  - ${issue.levelCode} (${issue.templateCode}) ${issue.target}.${issue.fieldPath}: ${issue.message}`
      );
    }
    process.exit(1);
  }
  console.log(
    `✓ BR-GTC-10 round-trip passed: ${report.passedLevels}/${report.totalLevels} levels (${report.totalPacksChecked} content packs)`
  );
}
