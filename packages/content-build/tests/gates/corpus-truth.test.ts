import { describe, expect, it } from "vitest";
import { loadGoLiveConfig } from "#src/gates/go-live-readiness";
import { evaluateLessonSupply } from "#src/gates/lesson-supply";
import { ALL_SEED_LESSONS, ALL_SEED_LEVELS } from "#src/index";
import { MVP_CURRICULA_CONFIGS } from "#src/seed-master/curricula";

/**
 * Cổng phải quét **corpus thật**, không phải mock.
 *
 * `lesson-supply.test.ts` và `go-live-readiness.test.ts` dựng 100% dữ liệu giả,
 * và mock của chúng mang `header.status` cùng `metadata.target_skill_code` —
 * hai trường **không tồn tại** trên kiểu seed nào của repo. Đó là lý do cả hai
 * cổng đọc ra 0 mà không test nào đỏ.
 */
describe("Cổng cung giáo án chạy trên corpus thật (BR-LCD-01, BR-LCD-10)", () => {
  const result = evaluateLessonSupply({
    curriculaConfigs: MVP_CURRICULA_CONFIGS,
    lessons: [...ALL_SEED_LESSONS],
    gameLevels: ALL_SEED_LEVELS,
  });

  it("corpus thật không rỗng — nếu rỗng thì mọi phép đo dưới đây vô nghĩa", () => {
    expect(ALL_SEED_LESSONS.length).toBeGreaterThan(0);
    expect(ALL_SEED_LEVELS.length).toBeGreaterThan(0);
  });

  it("ca âm: cung tiết phải khớp số lesson thật, Cấm — NEVER là 0", () => {
    // Trước sửa đổi này cổng lọc `l.header.status === "published"` trên một
    // kiểu không có trường `status`, nên nó báo 0 tiết trong khi corpus có 81.
    expect(result.metrics.publishedLessonCount).toBe(ALL_SEED_LESSONS.length);
    expect(result.metrics.publishedLessonCount).toBeGreaterThan(0);
  });

  it("ca âm: tập kỹ năng phải đọc được từ header.skill_codes", () => {
    // Trước sửa đổi này cổng đọc `les.metadata.target_skill_code` — luôn
    // `undefined` — nên `min_levels_per_skill` là luật không thể vi phạm.
    const skillsInCorpus = new Set(
      ALL_SEED_LESSONS.flatMap((l) => l.header.skill_codes)
    );
    expect(skillsInCorpus.size).toBeGreaterThan(0);
    expect(result.metrics.totalUniqueSkills).toBe(skillsInCorpus.size);
  });

  it("số level đếm cho mỗi kỹ năng phải khác 0 ở ít nhất một kỹ năng", () => {
    const covered =
      result.metrics.skillsWithOneLevel.length +
      result.metrics.skillsWithSufficientLevels.length;
    expect(covered).toBeGreaterThan(0);
  });
});

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
 * và tag rỗng — nó tự khai "bước 6 thuộc về người". 198 bản nháp trong
 * `seed-content/generated/` vì thế là nháp hợp lệ, ❌ NEVER là rác cần xoá.
 *
 * Thứ thiếu là cái chặn: `generated/` không nằm trong `ALL_SEED_LEVELS`, nhưng
 * không luật nào ngăn ai đó nối nó vào. Một level không tên, không lời dẫn mà
 * lọt vào corpus thì trẻ mở ra thấy màn không có câu lệnh — và mọi cổng chiều
 * sâu vẫn đếm nó là một level đủ tiêu chuẩn.
 */
describe("Corpus seed ❌ NEVER chứa bản nháp chưa soạn (BR-LVB-01)", () => {
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
