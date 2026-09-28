import { resolve } from "node:path";
import { repoPath } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import { readPlannedCodes } from "#scripts/gen-engine-depth-section.js";

const MALFORMED_ERROR_REGEX = /BR-ESS-15.*object/;

describe("Mục 16 bỏ qua mã đặt trước (BR-ESS-15)", () => {
  it("đọc mã đặt trước từ engine-spec-planned.json", () => {
    const planned = readPlannedCodes(
      repoPath("packages/game-engine/config/engine-spec-planned.json")
    );
    expect(planned.has("GT-037")).toBe(true);
  });

  // Ca âm: cấu hình sai hình dạng phải làm đỏ, không lặng lẽ thành "không có mã nào"
  it("ném lỗi khi cấu hình đặt trước là mảng thay vì object", () => {
    const malformedPath = resolve(
      import.meta.dirname,
      "fixtures",
      "planned-malformed.json"
    );
    expect(() => readPlannedCodes(malformedPath)).toThrow(
      MALFORMED_ERROR_REGEX
    );
  });
});
