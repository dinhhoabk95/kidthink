import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `play-stage-zones.md` mục 5 hàng "Studio preview": preview-sandbox chạy trong
 * cùng khung năm vùng với trang chơi. Engine đã bỏ nhánh dự phòng vẽ lời dẫn
 * (#283), nên preview không tính vùng thì mất lời dẫn.
 */
const SANDBOX = path.resolve(
  import.meta.dirname,
  "../../app/pages/play/preview-sandbox.vue"
);

const REQUIRED_CALLS = [
  "computeZonesForSession(",
  "prepareRound",
  "drawPromptZone(",
  "drawCommitButton(",
];

function findMissingCalls(source: string): string[] {
  return REQUIRED_CALLS.filter((call) => !source.includes(call));
}

describe("preview-sandbox dùng khung năm vùng", () => {
  it("tính vùng, đặt slot trong vùng, vẽ lời dẫn và nút hành động", () => {
    expect(findMissingCalls(readFileSync(SANDBOX, "utf8"))).toEqual([]);
  });

  it("ca âm: trang preview không tính vùng bị báo", () => {
    const withoutZones = readFileSync(SANDBOX, "utf8").replaceAll(
      "computeZonesForSession(",
      "legacyLayout("
    );

    expect(findMissingCalls(withoutZones)).toEqual(["computeZonesForSession("]);
  });
});
