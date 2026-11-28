import { join } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { ENGINE_STORY_LINES } from "@mindkid/game-engine/story-lines";
import { describe, expect, it } from "vitest";
import { UNRENDERED_STORY_LINE_FIXTURE } from "./fixtures/story-voice-coverage/unrendered-story-line.fixture.ts";
import {
  CONTENT_SRC_DIR,
  findDeadAudioPaths,
  findMissingStoryLines,
} from "./story-voice-coverage.ts";

const FIXTURE_DIR = join(
  REPO_ROOT,
  "apps/web/tests/gates/fixtures/story-voice-coverage"
);

/** Bậc thang nợ: câu chưa có mp3. Đỏ khi tăng và khi giảm (xoá dòng khi đã render). */
const KNOWN_MISSING: readonly string[] = [];

describe("Cổng story-voice-coverage (BR-PNR-05)", () => {
  it("bảng câu khung chuyện không rỗng", () => {
    expect(ENGINE_STORY_LINES.length).toBeGreaterThanOrEqual(60);
  });

  it("mọi story line của engine có mp3 trong kho giọng (trừ bậc thang nợ)", () => {
    const missing = findMissingStoryLines(ENGINE_STORY_LINES)
      .map((v) => v.subject)
      .sort();
    expect(missing).toEqual([...KNOWN_MISSING].sort());
  });

  it("mọi audio_path tĩnh trong packages/content/src trỏ file tồn tại", () => {
    expect(findDeadAudioPaths(CONTENT_SRC_DIR)).toEqual([]);
  });

  it("ca âm: câu không có mp3 làm cổng đỏ", () => {
    const hit = findMissingStoryLines([UNRENDERED_STORY_LINE_FIXTURE]);
    expect(hit).toHaveLength(1);
  });

  it("ca âm: audio_path chết trong fixture làm cổng đỏ", () => {
    const hit = findDeadAudioPaths(FIXTURE_DIR);
    expect(hit.map((v) => v.expectedPath)).toEqual([
      "/audio/vi/c4/khong-ton-tai-mau-vi-pham.mp3",
    ]);
  });
});
