import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildLevelsForSkill,
  GENERATED_LEVEL_CONTENT_VERSION,
} from "#src/builders/build-levels";
import { ALL_SKILL_SEEDS } from "#src/skills/index";

const LOCK_PATH = fileURLToPath(
  new URL("../../content-version.lock.json", import.meta.url)
);

interface VersionLock {
  readonly version: number;
  readonly hash: string;
}

function hashBuiltLevels(): string {
  const hash = createHash("sha256");
  for (const skill of ALL_SKILL_SEEDS) {
    for (const level of buildLevelsForSkill(skill)) {
      const { content_version: _ignored, ...header } = level.header;
      hash.update(JSON.stringify({ ...level, header }));
    }
  }
  return hash.digest("hex");
}

function readLock(): VersionLock | undefined {
  if (!existsSync(LOCK_PATH)) {
    return undefined;
  }
  return JSON.parse(readFileSync(LOCK_PATH, "utf8")) as VersionLock;
}

function canUpdateLock(
  lock: VersionLock | undefined,
  currentHash: string,
  currentVersion: number
): boolean {
  if (lock && lock.hash !== currentHash && lock.version >= currentVersion) {
    return false;
  }
  return true;
}

describe("BR-CSA-17 — khoá phiên bản level sinh", () => {
  it("băm nội dung level đổi thì phải tăng GENERATED_LEVEL_CONTENT_VERSION", () => {
    const hash = hashBuiltLevels();
    const lock = readLock();

    if (process.env.UPDATE_CONTENT_LOCK === "1") {
      if (!canUpdateLock(lock, hash, GENERATED_LEVEL_CONTENT_VERSION)) {
        throw new Error(
          `Nội dung level đổi nhưng GENERATED_LEVEL_CONTENT_VERSION vẫn là ${GENERATED_LEVEL_CONTENT_VERSION}; tăng số này trước khi cập nhật khoá.`
        );
      }
      const next: VersionLock = {
        version: GENERATED_LEVEL_CONTENT_VERSION,
        hash,
      };
      writeFileSync(LOCK_PATH, `${JSON.stringify(next, null, 2)}\n`);
      return;
    }

    expect(lock, "thiếu content-version.lock.json").toBeDefined();
    expect(
      hash === lock?.hash && GENERATED_LEVEL_CONTENT_VERSION === lock?.version,
      "Nội dung level sinh đã đổi: tăng GENERATED_LEVEL_CONTENT_VERSION rồi chạy UPDATE_CONTENT_LOCK=1 pnpm --filter @mindkid/content test content-version-lock (BR-CSA-17)"
    ).toBe(true);
  });

  it("Ca âm BR-CSA-17: băm đổi mà phiên bản không tăng thì từ chối cập nhật khoá", () => {
    const existingLock: VersionLock = {
      version: 8,
      hash: "old-hash-value",
    };
    expect(canUpdateLock(existingLock, "new-hash-value", 8)).toBe(false);
    expect(canUpdateLock(existingLock, "new-hash-value", 9)).toBe(true);
  });
});
