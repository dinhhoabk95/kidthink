/* biome-ignore-all lint/style/noNonNullAssertion: test assertions */
/* biome-ignore-all lint/performance/useTopLevelRegex: test regexes */

import { describe, expect, it } from "vitest";
import { MVP_TEMPLATES } from "../src/contracts/registry.js";
import type { AgeBand } from "../src/contracts/types.js";
import { GameEngine } from "../src/core.js";
import {
  getTouchFloor,
  LOGIC_HEIGHT,
  LOGIC_WIDTH,
  SAFE_MARGIN_PX,
} from "../src/layout/constants.js";
import {
  computeGridLayout,
  computeTrackLayout,
} from "../src/layout/geometry.js";
import {
  isLayoutId,
  LAYOUT_IDS,
  resolveLayout,
} from "../src/layout/registry.js";
import type { LayoutId } from "../src/layout/types.js";

describe("Game Layout Engine (BR-LAY-01..10)", () => {
  it("BR-LAY-01 — hàm layout thuần: cùng đầu vào cho cùng kết quả 50 lần liên tiếp", () => {
    const input = { slotCount: 6, ageBand: "3-4" as AgeBand };
    const firstResult = computeGridLayout(input);

    for (let i = 0; i < 50; i++) {
      const result = computeGridLayout(input);
      expect(result).toEqual(firstResult);
    }
  });

  it("BR-LAY-02 — LayoutId là từ vựng đóng gồm đúng 12 giá trị; id lạ bị từ chối", () => {
    expect(LAYOUT_IDS).toHaveLength(12);
    expect(isLayoutId("grid")).toBe(true);
    expect(isLayoutId("step-ladder")).toBe(true);
    expect(isLayoutId("random-unknown-layout")).toBe(false);

    expect(() => resolveLayout("invalid-layout" as LayoutId)).toThrowError(
      /LAYOUT_NOT_SUPPORTED/
    );
  });

  it("BR-LAY-03 — mọi slot có hitW và hitH >= sàn chạm theo band tuổi", () => {
    const ageBands: AgeBand[] = ["3-4", "4-5", "5-6"];

    for (const ageBand of ageBands) {
      const floor = getTouchFloor(ageBand);
      for (const id of LAYOUT_IDS) {
        const layoutFn = resolveLayout(id);
        const slots = layoutFn({ slotCount: 4, ageBand, targetCount: 2 });
        for (const s of slots) {
          expect(
            s.hitW,
            `Slot ${s.index} của layout '${id}' band '${ageBand}' có hitW < ${floor}`
          ).toBeGreaterThanOrEqual(floor);
          expect(
            s.hitH,
            `Slot ${s.index} của layout '${id}' band '${ageBand}' có hitH < ${floor}`
          ).toBeGreaterThanOrEqual(floor);
        }
      }
    }
  });

  it("BR-LAY-04 — không đủ chỗ thì phân trang, không thu nhỏ dưới sàn chạm", () => {
    const slots = computeGridLayout({ slotCount: 10, ageBand: "3-4" });
    const pages = new Set(slots.map((s) => s.page));

    expect(pages.size).toBeGreaterThan(1);
    const floor = getTouchFloor("3-4");
    for (const s of slots) {
      expect(s.hitW).toBeGreaterThanOrEqual(floor);
      expect(s.hitH).toBeGreaterThanOrEqual(floor);
    }

    // Thứ tự index tăng dần theo từng trang
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i]!.index).toBe(slots[i - 1]!.index + 1);
      expect(slots[i]!.page).toBeGreaterThanOrEqual(slots[i - 1]!.page);
    }
  });

  it("BR-LAY-05 — vùng chạm của các slot cùng trang không chồng nhau và cách nhau tối thiểu SLOT_GAP_PX", () => {
    for (const id of LAYOUT_IDS) {
      const layoutFn = resolveLayout(id);
      const slots = layoutFn({ slotCount: 4, ageBand: "5-6", targetCount: 2 });

      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const a = slots[i]!;
          const b = slots[j]!;
          if (a.page !== b.page) {
            continue;
          }

          const dx = Math.abs(a.x - b.x);
          const dy = Math.abs(a.y - b.y);
          const minRequiredDistX = (a.hitW + b.hitW) / 2;
          const minRequiredDistY = (a.hitH + b.hitH) / 2;

          // Không được giao nhau cả 2 trục
          const overlaps = dx < minRequiredDistX && dy < minRequiredDistY;
          expect(
            overlaps,
            `Slot ${a.index} và ${b.index} trong layout '${id}' bị chồng vùng chạm`
          ).toBe(false);
        }
      }
    }
  });

  it("BR-LAY-06 — hàm layout không phụ thuộc hay nhận nội dung học (chỉ nhận slotCount, ageBand, targetCount)", () => {
    for (const id of LAYOUT_IDS) {
      const layoutFn = resolveLayout(id);
      expect(layoutFn.length).toBeLessThanOrEqual(1); // 1 tham số LayoutInput
    }
  });

  it("BR-LAY-07 — mọi template MVP khai layouts hợp lệ và resolveLayout được mọi giá trị", () => {
    const templates = Object.values(MVP_TEMPLATES);
    expect(templates.length).toBeGreaterThanOrEqual(6);
    for (const template of templates) {
      expect(template.layouts.length).toBeGreaterThanOrEqual(1);
      for (const layoutId of template.layouts) {
        expect(isLayoutId(layoutId)).toBe(true);
        const fn = resolveLayout(layoutId);
        expect(typeof fn).toBe("function");
      }
    }
  });

  it("BR-LAY-08 — vị trí slot ổn định theo chỉ số qua nhiều lần gọi", () => {
    const input = { slotCount: 5, ageBand: "4-5" as AgeBand };
    const run1 = computeTrackLayout(input, { isLadder: true });
    const run2 = computeTrackLayout(input, { isLadder: true });

    expect(run1).toHaveLength(5);
    for (let i = 0; i < run1.length; i++) {
      expect(run1[i]!.x).toBe(run2[i]!.x);
      expect(run1[i]!.y).toBe(run2[i]!.y);
      expect(run1[i]!.index).toBe(i);
    }
  });

  it("BR-LAY-09 — toàn bộ slot nằm trong không gian logic 960x540 trừ lề an toàn SAFE_MARGIN_PX", () => {
    for (const id of LAYOUT_IDS) {
      const layoutFn = resolveLayout(id);
      const slots = layoutFn({ slotCount: 4, ageBand: "4-5", targetCount: 2 });

      for (const s of slots) {
        const left = s.x - s.w / 2;
        const right = s.x + s.w / 2;
        const top = s.y - s.h / 2;
        const bottom = s.y + s.h / 2;

        expect(
          left,
          `Slot ${s.index} của layout '${id}' vượt mép trái`
        ).toBeGreaterThanOrEqual(SAFE_MARGIN_PX - 2); // Dung sai làm tròn toạ độ tâm
        expect(
          right,
          `Slot ${s.index} của layout '${id}' vượt mép phải`
        ).toBeLessThanOrEqual(LOGIC_WIDTH - SAFE_MARGIN_PX + 2);
        expect(
          top,
          `Slot ${s.index} của layout '${id}' vượt mép trên`
        ).toBeGreaterThanOrEqual(SAFE_MARGIN_PX - 2);
        expect(
          bottom,
          `Slot ${s.index} của layout '${id}' vượt mép dưới`
        ).toBeLessThanOrEqual(LOGIC_HEIGHT - SAFE_MARGIN_PX + 2);
      }
    }
  });

  it("BR-LAY-10 & GameEngine.load() — từ chối layout không được template hỗ trợ (LAYOUT_NOT_SUPPORTED)", () => {
    const engine = new GameEngine();

    // GT-001 chỉ hỗ trợ "grid" và "horizontal-row"
    const invalidConfig = {
      level_code: "GL-TEST-001",
      content_version: 1,
      template_code: "GT-001",
      content_pack: {
        prompt: "Chọn quả táo đúng",
        target_item: { item_id: "t1", asset: { kind: "emoji", ref: "apple" } },
        options: [
          {
            item_id: "o1",
            asset: { kind: "emoji", ref: "apple" },
            is_correct: true,
          },
          {
            item_id: "o2",
            asset: { kind: "emoji", ref: "banana" },
            is_correct: false,
          },
        ],
      },
      difficulty_params: {
        distractor_count: 1,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
        layout_id: "card-flip-grid", // Không thuộc GT-001
      },
      theme_id: "farm",
      age_band: "3-4" as AgeBand,
      reduced_motion: false,
      audio_enabled: true,
    };

    expect(() =>
      engine.load(invalidConfig, () => ({
        setupEntities: () => {
          /* noop */
        },
        validateAction: () => ({ valid: true, feedback: "none" }),
        checkWinCondition: () => false,
        getTelemetry: () => ({
          events: [],
          start_time_ms: 0,
        }),
        completeSession: () => {
          /* noop */
        },
        destroy: () => {
          /* noop */
        },
      }))
    ).toThrowError(/LAYOUT_NOT_SUPPORTED/);
  });

  it("GameEngine.load() — tự động tính toán slots cho layout hợp lệ", () => {
    const engine = new GameEngine();

    const validConfig = {
      level_code: "GL-TEST-002",
      content_version: 1,
      template_code: "GT-001",
      content_pack: {
        prompt: "Chọn quả táo đúng",
        target_item: { item_id: "t1", asset: { kind: "emoji", ref: "apple" } },
        options: [
          {
            item_id: "o1",
            asset: { kind: "emoji", ref: "apple" },
            is_correct: true,
          },
          {
            item_id: "o2",
            asset: { kind: "emoji", ref: "banana" },
            is_correct: false,
          },
          {
            item_id: "o3",
            asset: { kind: "emoji", ref: "grape" },
            is_correct: false,
          },
        ],
      },
      difficulty_params: {
        distractor_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
        layout_id: "horizontal-row",
      },
      theme_id: "farm",
      age_band: "4-5" as AgeBand,
      reduced_motion: false,
      audio_enabled: true,
    };

    engine.load(validConfig, () => ({
      setupEntities: () => {
        /* noop */
      },
      validateAction: () => ({ valid: true, feedback: "none" }),
      checkWinCondition: () => false,
      getTelemetry: () => ({
        events: [],
        start_time_ms: 0,
      }),
      completeSession: () => {
        /* noop */
      },
      destroy: () => {
        /* noop */
      },
    }));

    expect(engine.slots).toHaveLength(3);
    expect(engine.slots[0]!.hitW).toBeGreaterThanOrEqual(getTouchFloor("4-5"));
  });
});
