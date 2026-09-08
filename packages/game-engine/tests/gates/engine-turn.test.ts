import { readFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  formatEngineTurnReport,
  lintSingleTurnSpec,
  scanEngineTurnGate,
} from "./engine-turn.js";

const N4_BLOCK_REGEX = /4\.\s*\*\*`N4`[\s\S]*?(?=5\.\s*\*\*`N5`)/;
const N2_MATCH_REGEX = /2\.\s*\*\*`N2`[^\n]+(\n[^\d\n][^\n]*)*/;
const N3_MATCH_REGEX = /3\.\s*\*\*`N3`[^\n]+(\n[^\d\n][^\n]*)*/;
const M5_ABANDON_ROW_REGEX = /\|\s*7\s*\|\s*Bỏ dở giữa lượt[^\n]+\n/g;
const N5_MATCH_REGEX = /5\.\s*\*\*`N5`[\s\S]*?(?=6\.\s*\*\*`N6`)/;
const N7_MATCH_REGEX = /7\.\s*\*\*`N7`[\s\S]*?(?=##\s*5\.)/;
const N2_BLOCK_REGEX = /2\.\s*\*\*`N2`[\s\S]*?(?=3\.\s*\*\*`N3`)/;
const M5_REPLAY_ROW_REGEX = /\|\s*8\s*\|\s*Chơi lại lần thứ n[^\n]+\n/g;

describe("Gate check:engine-turn (BR-ETS-01..12, BR-ESS-18..19)", () => {
  const specsDir = repoPath("docs/specs/01-platform/engines");
  const sampleSpecPath = repoPath("docs/specs/01-platform/engines/GT-001.md");
  const sampleSpecContent = readFileSync(sampleSpecPath, "utf-8");

  it("baseline: 37 phiếu engine đạt chuẩn kịch bản 7 nhịp và 8 nhánh, 0 vi phạm", () => {
    const result = scanEngineTurnGate({ specsDir });
    expect(result.totalSpecs).toBe(37);
    expect(result.violations).toHaveLength(0);

    const report = formatEngineTurnReport(result);
    expect(report).toContain("Tổng số spec đã quét: 37");
    expect(report).toContain("Số vi phạm: 0");
    expect(report).toContain(
      "Tất cả 37 phiếu engine đạt chuẩn kịch bản lượt chơi"
    );
  });

  // Ca âm 1: Thiếu một nhịp (BR-ETS-01)
  it("Ca âm 1: thiếu một nhịp (ví dụ N4) làm cổng đỏ (BR-ETS-01)", () => {
    const badContent = sampleSpecContent.replace(N4_BLOCK_REGEX, "");
    const violations = lintSingleTurnSpec(badContent, "GT-001.md");
    expect(
      violations.some((v) => v.rule === "BR-ETS-01" && v.message.includes("N4"))
    ).toBe(true);
  });

  // Ca âm 2: Sai thứ tự nhịp (BR-ETS-01)
  it("Ca âm 2: sai thứ tự nhịp (N3 đứng trước N2) làm cổng đỏ (BR-ETS-01)", () => {
    const n2Match = sampleSpecContent.match(N2_MATCH_REGEX);
    const n3Match = sampleSpecContent.match(N3_MATCH_REGEX);
    expect(n2Match).not.toBeNull();
    expect(n3Match).not.toBeNull();

    if (n2Match && n3Match) {
      const swapped = sampleSpecContent
        .replace(n2Match[0], "__TEMP_SWAP__")
        .replace(n3Match[0], n2Match[0])
        .replace("__TEMP_SWAP__", n3Match[0]);

      const violations = lintSingleTurnSpec(swapped, "GT-001.md");
      expect(
        violations.some(
          (v) =>
            v.rule === "BR-ETS-01" &&
            v.message.includes("không xuất hiện đúng thứ tự")
        )
      ).toBe(true);
    }
  });

  // Ca âm 3: Còn chuỗi bản sao cũ (BR-ETS-01)
  it("Ca âm 3: còn chuỗi bản sao cũ trong Mục 4 làm cổng đỏ (BR-ETS-01)", () => {
    const badContent = sampleSpecContent.replace(
      "3. **`N3` Thao tác**",
      "3. **`N3` Thao tác** — Trẻ tương tác theo cơ chế tap-select"
    );
    const violations = lintSingleTurnSpec(badContent, "GT-001.md");
    expect(
      violations.some(
        (v) =>
          v.rule === "BR-ETS-01" &&
          v.message.includes("Trẻ tương tác theo cơ chế")
      )
    ).toBe(true);
  });

  // Ca âm 4: Thiếu một nhánh bắt buộc trong Mục 5 (BR-ETS-11)
  it("Ca âm 4: thiếu một nhánh bắt buộc trong Mục 5 làm cổng đỏ (BR-ETS-11)", () => {
    const badContent = sampleSpecContent.replace(M5_ABANDON_ROW_REGEX, "");
    const violations = lintSingleTurnSpec(badContent, "GT-001.md");
    expect(
      violations.some(
        (v) => v.rule === "BR-ETS-11" && v.message.includes("Bỏ dở giữa lượt")
      )
    ).toBe(true);
  });

  // Ca âm 5: N5 chỉ ghi scaffolding highlight mà không nêu ba cấp L1, L2, L3 (BR-ETS-08)
  it("Ca âm 5: N5 chỉ ghi scaffolding highlight mà không nêu ba cấp L1, L2, L3 làm cổng đỏ (BR-ETS-08)", () => {
    const badContent = sampleSpecContent.replace(
      N5_MATCH_REGEX,
      "5. **`N5` Trợ giúp** — scaffolding highlight khi trẻ bế tắc và dừng lại lâu.\n"
    );
    const violations = lintSingleTurnSpec(badContent, "GT-001.md");
    expect(
      violations.some(
        (v) => v.rule === "BR-ETS-08" && v.message.includes("L1, L2, L3")
      )
    ).toBe(true);
  });

  // Ca âm 6: N7 không nói cái gì giữ nguyên (BR-ETS-10)
  it("Ca âm 6: N7 không nói cái gì giữ nguyên làm cổng đỏ (BR-ETS-10)", () => {
    const badContent = sampleSpecContent.replace(
      N7_MATCH_REGEX,
      "7. **`N7` Chơi lại** — seed mới đổi hoàn toàn thứ tự các thẻ lựa chọn trên màn hình.\n\n"
    );
    const violations = lintSingleTurnSpec(badContent, "GT-001.md");
    expect(
      violations.some(
        (v) => v.rule === "BR-ETS-10" && v.message.includes("cái gì giữ nguyên")
      )
    ).toBe(true);
  });

  // Ca âm 7: N2 không nêu trường lời đọc và kênh hình song song (BR-ETS-04)
  it("Ca âm 7: N2 thiếu trường lời đọc hoặc kênh hình song song làm cổng đỏ (BR-ETS-04)", () => {
    const badContent = sampleSpecContent.replace(
      N2_BLOCK_REGEX,
      "2. **`N2` Ra đề** — hiển thị nội dung cho trẻ xem tự do.\n"
    );
    const violations = lintSingleTurnSpec(badContent, "GT-001.md");
    expect(violations.some((v) => v.rule === "BR-ETS-04")).toBe(true);
  });

  // Ca âm 8: Có nhịp thứ 8 trở lên (BR-ETS-01)
  it("Ca âm 8: có nhịp thứ 8 trở lên làm cổng đỏ (BR-ETS-01)", () => {
    const badContent = sampleSpecContent.replace(
      N7_MATCH_REGEX,
      (match) =>
        `${match}\n8. **\`N8\` Tổng kết** — màn hình hiển thị điểm số và kết thúc lượt chơi.\n\n`
    );
    const violations = lintSingleTurnSpec(badContent, "GT-001.md");
    expect(
      violations.some(
        (v) =>
          v.rule === "BR-ETS-01" &&
          v.message.includes("cấm đặt nhịp thứ 8 trở lên")
      )
    ).toBe(true);
  });

  // Ca âm 9: Nhịp quá ngắn dưới 30 ký tự (BR-ETS-01)
  it("Ca âm 9: nhịp điền đối phó dưới 30 ký tự làm cổng đỏ (BR-ETS-01)", () => {
    const badContent = sampleSpecContent.replace(
      N4_BLOCK_REGEX,
      "4. **`N4` Phản hồi** — rung.\n"
    );
    const violations = lintSingleTurnSpec(badContent, "GT-001.md");
    expect(
      violations.some(
        (v) => v.rule === "BR-ETS-01" && v.message.includes("quá ngắn")
      )
    ).toBe(true);
  });

  // Ca âm 10: Mục 5 có ít hơn 8 hàng nhánh (BR-ETS-11)
  it("Ca âm 10: mục 5 có ít hơn 8 hàng nhánh làm cổng đỏ (BR-ETS-11)", () => {
    const badContent = sampleSpecContent.replace(M5_REPLAY_ROW_REGEX, "");
    const violations = lintSingleTurnSpec(badContent, "GT-001.md");
    expect(
      violations.some(
        (v) => v.rule === "BR-ETS-11" && v.message.includes("ít nhất 8 hàng")
      )
    ).toBe(true);
  });
});
