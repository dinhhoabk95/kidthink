import { describe, expect, it } from "vitest";
import { loadGoLiveConfig } from "#src/gates/go-live-readiness";
import { ALL_SEED_LEVELS } from "#src/index";

describe("Cấu hình go-live được parse, không ép kiểu (BR-GLR-06)", () => {
  it("đọc được và có đủ ngưỡng bắt buộc", () => {
    const config = loadGoLiveConfig();
    expect(config.thresholds.min_levels_per_skill).toBeGreaterThan(0);
    expect(config.active_engines.length).toBeGreaterThan(0);
  });

  it("ca âm: thiếu một khoá ngưỡng thì NÉM, Cấm — NEVER thành `undefined` rồi xanh", () => {
    // `count < undefined` là `false`, nên một khoá bị mất tên sẽ làm luật biến
    // mất trong im lặng thay vì làm cổng đỏ.
    expect(() => loadGoLiveConfig({ active_engines: ["GT-001"] })).toThrow();
    expect(() => loadGoLiveConfig({})).toThrow();
  });
});

/**
 * Bộ sinh level (`cli/gen-levels.ts`) **cố ý** ghi `title: ""`, `instruction: ""`
 * và tag rỗng — nó tự khai "bước 6 thuộc về người". Đầu ra của nó vì thế là
 * nháp hợp lệ chờ người soạn, không được commit vào cây (test chạy bộ sinh ở
 * chế độ `silent` hoặc ghi ra thư mục tạm).
 *
 * Thứ thiếu là cái chặn: `generated/` không nằm trong `ALL_SEED_LEVELS`, nhưng
 * không luật nào ngăn ai đó nối nó vào. Một level không tên, không lời dẫn mà
 * lọt vào corpus thì trẻ mở ra thấy màn không có câu lệnh — và mọi cổng chiều
 * sâu vẫn đếm nó là một level đủ tiêu chuẩn.
 */
describe("Corpus seed ❌ NEVER chứa bản nháp chưa soạn (BR-LGK-08)", () => {
  it("mọi level đã seed đều có title và instruction thật", () => {
    const unnamed = ALL_SEED_LEVELS.filter(
      (l) =>
        l.header.title.trim().length === 0 ||
        l.header.instruction.trim().length === 0
    ).map((l) => l.header.code);

    expect(unnamed).toEqual([]);
  });

  it("ca âm: một level trống tên bị bắt, không lọt qua bằng khoảng trắng", () => {
    const draft = [
      { header: { code: "GL-DRAFT-01", title: "", instruction: "Bé thử nhé" } },
      { header: { code: "GL-DRAFT-02", title: "  ", instruction: "  " } },
      { header: { code: "GL-OK-01", title: "Đếm quả", instruction: "Bé đếm" } },
    ];
    const caught = draft
      .filter(
        (l) =>
          l.header.title.trim().length === 0 ||
          l.header.instruction.trim().length === 0
      )
      .map((l) => l.header.code);

    expect(caught).toEqual(["GL-DRAFT-01", "GL-DRAFT-02"]);
  });
});
