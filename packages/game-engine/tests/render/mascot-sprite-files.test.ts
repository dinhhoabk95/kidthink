import { readFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  MASCOT_POSES,
  MASCOT_SPRITE_FILES,
  type MascotPose,
} from "#src/render/mascot";

const BASE_SPRITE_PATTERN =
  /mascot-bear-(waiting|jumping|thinking|celebrating)\.svg$/;
const OWN_SPRITE_POSES: readonly MascotPose[] = ["wonder", "freeze", "cheer"];
const SHARED_SPRITE_POSES: readonly MascotPose[] = MASCOT_POSES.filter(
  (pose) => !OWN_SPRITE_POSES.includes(pose)
);

function spriteSource(pose: MascotPose): string {
  const file = MASCOT_SPRITE_FILES[pose];
  return readFileSync(repoPath("apps/web/public", file.slice(1)), "utf8");
}

describe("Sprite riêng cho wonder/freeze/cheer (§7.4, BR-FBK-17)", () => {
  it("mỗi dáng có sprite riêng, không trùng dáng nào khác", () => {
    for (const pose of OWN_SPRITE_POSES) {
      const others = MASCOT_POSES.filter((other) => other !== pose);
      for (const other of others) {
        expect(MASCOT_SPRITE_FILES[pose]).not.toBe(MASCOT_SPRITE_FILES[other]);
      }
      expect(MASCOT_SPRITE_FILES[pose]).toBe(`/mascot/mascot-bear-${pose}.svg`);
    }
  });

  it("file SVG tồn tại, cùng viewBox 120 và cùng bảng màu với bộ gốc", () => {
    const baseline = spriteSource("idle");
    const baseColors = new Set(baseline.match(/#[0-9a-f]{6}/g));
    for (const pose of OWN_SPRITE_POSES) {
      const svg = spriteSource(pose);
      expect(svg).toContain('viewBox="0 0 120 120"');
      for (const color of svg.match(/#[0-9a-f]{6}/g) ?? []) {
        expect(baseColors.has(color) || color === "#fffbeb").toBe(true);
      }
    }
  });

  it("các dáng còn lại vẫn dùng bốn sprite gốc", () => {
    for (const pose of SHARED_SPRITE_POSES) {
      expect(MASCOT_SPRITE_FILES[pose]).toMatch(BASE_SPRITE_PATTERN);
    }
  });
});
