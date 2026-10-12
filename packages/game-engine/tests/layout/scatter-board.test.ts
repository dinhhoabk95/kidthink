import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import {
  CONTENT_TOP_PX,
  DEFAULT_LOGIC_SPACE,
  getTouchFloor,
  JITTER_MAX_PX,
  SAFE_MARGIN_PX,
  SLOT_GAP_PX,
} from "#src/layout/constants";
import {
  computeScatterBoardLayout,
  scatterBoardCandidateCellCount,
  scatterBoardCapacity,
} from "#src/layout/geometry-boards";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { findHitPairViolations } from "./stage-checks.ts";

const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];
const CAPACITY_ERROR_REGEX = /LAYOUT_CAPACITY_EXCEEDED/;

describe("layout scatter-board (Task #278 / GT-037)", () => {
  it("BR-LAY-01: hàm layout thuần — 50 lần gọi cùng input cho kết quả đồng nhất", () => {
    const input = {
      slotCount: 20,
      ageBand: "4-5" as const,
    };
    const first = computeScatterBoardLayout(input);
    expect(first.length).toBeGreaterThan(0);

    for (let i = 0; i < 50; i++) {
      const current = computeScatterBoardLayout(input);
      expect(current).toEqual(first);
    }
  });

  it("BR-LAY-03: mọi ô đạt sàn chạm theo band tuổi", () => {
    for (const band of BANDS) {
      const floor = getTouchFloor(band);
      const slots = computeScatterBoardLayout({
        slotCount: 1,
        ageBand: band,
      });
      expect(slots.length).toBeGreaterThan(0);
      for (const slot of slots) {
        expect(slot.hitW).toBeGreaterThanOrEqual(floor);
        expect(slot.hitH).toBeGreaterThanOrEqual(floor);
        expect(slot.role).toBe("neutral");
        expect(slot.page).toBe(0);
      }
    }
  });

  it("bước ô = hit + SLOT_GAP_PX + 2 * JITTER_MAX_PX", () => {
    for (const band of BANDS) {
      const floor = getTouchFloor(band);
      const expectedStep = floor + SLOT_GAP_PX + 2 * JITTER_MAX_PX;
      const slots = computeScatterBoardLayout({
        slotCount: 1,
        ageBand: band,
      });

      // Kiểm tra khoảng cách giữa hai cột liền kề trong cùng một hàng
      const row0Slots = slots.filter((s) => s.y === slots[0]?.y);
      if (row0Slots.length >= 2 && row0Slots[0] && row0Slots[1]) {
        expect(row0Slots[1].x - row0Slots[0].x).toBe(expectedStep);
      }

      // Kiểm tra khoảng cách giữa hai hàng liền kề trong cùng một cột
      const col0Slots = slots.filter((s) => s.x === slots[0]?.x);
      if (col0Slots.length >= 2 && col0Slots[0] && col0Slots[1]) {
        expect(col0Slots[1].y - col0Slots[0].y).toBe(expectedStep);
      }
    }
  });

  it("đo sức chứa chuẩn trên 960x540 khớp bảng ước tính (plan mục 3.4)", () => {
    // Band 3-4: 7x3 = 21 ô ứng viên, sức chứa (<=85%) = 17
    expect(scatterBoardCandidateCellCount("3-4")).toBe(21);
    expect(scatterBoardCapacity("3-4")).toBe(17);

    // Band 4-5: 8x3 = 24 ô ứng viên, sức chứa (<=85%) = 20
    expect(scatterBoardCandidateCellCount("4-5")).toBe(24);
    expect(scatterBoardCapacity("4-5")).toBe(20);

    // Band 5-6: 9x4 = 36 ô ứng viên, sức chứa (<=85%) = 30
    expect(scatterBoardCandidateCellCount("5-6")).toBe(36);
    expect(scatterBoardCapacity("5-6")).toBe(30);
  });

  it("BR-LAY-11: cấm phân trang — vượt sức chứa ném LAYOUT_CAPACITY_EXCEEDED", () => {
    // Band 4-5 có sức chứa 20: slotCount 20 hợp lệ, 21 ném lỗi
    expect(() =>
      computeScatterBoardLayout({
        slotCount: 20,
        ageBand: "4-5",
      })
    ).not.toThrow();

    expect(() =>
      computeScatterBoardLayout({
        slotCount: 21,
        ageBand: "4-5",
      })
    ).toThrow(CAPACITY_ERROR_REGEX);

    // Band 5-6 có sức chứa 30: slotCount 30 hợp lệ, 31 ném lỗi
    expect(() =>
      computeScatterBoardLayout({
        slotCount: 30,
        ageBand: "5-6",
      })
    ).not.toThrow();

    expect(() =>
      computeScatterBoardLayout({
        slotCount: 31,
        ageBand: "5-6",
      })
    ).toThrow(CAPACITY_ERROR_REGEX);
  });

  it("hai hướng màn hình (ngang 960x540 và dọc 540x960) đều chứa ô trong vùng an toàn", () => {
    const orientations = [
      { name: "landscape", logic: DEFAULT_LOGIC_SPACE },
      { name: "portrait", logic: { w: 540, h: 960 } },
    ];

    for (const orient of orientations) {
      for (const band of BANDS) {
        const slots = computeScatterBoardLayout({
          slotCount: 5,
          ageBand: band,
          logic: orient.logic,
        });

        expect(slots.length).toBeGreaterThan(0);
        for (const slot of slots) {
          const left = slot.x - slot.hitW / 2;
          const right = slot.x + slot.hitW / 2;
          const top = slot.y - slot.hitH / 2;
          const bottom = slot.y + slot.hitH / 2;

          expect(left).toBeGreaterThanOrEqual(SAFE_MARGIN_PX);
          expect(right).toBeLessThanOrEqual(orient.logic.w - SAFE_MARGIN_PX);
          expect(top).toBeGreaterThanOrEqual(CONTENT_TOP_PX);
          expect(bottom).toBeLessThanOrEqual(orient.logic.h - SAFE_MARGIN_PX);
        }
      }
    }
  });

  it("BR-E037-03: hai ô sau khi cộng jitter ngẫu nhiên [-8, +8] px vẫn cách nhau >= SLOT_GAP_PX", () => {
    for (const band of BANDS) {
      const slots = computeScatterBoardLayout({
        slotCount: 1,
        ageBand: band,
      });

      // Thử thách kiểm tra khoảng cách vùng chạm với jitter xấu nhất (tối đa 8px về phía nhau)
      // Tạo các slot giả lập bị jitter cực đại đối đầu nhau
      const jitteredSlots: Slot[] = slots.map((s, idx) => ({
        ...s,
        // Ô chẵn lệch +8px, ô lẻ lệch -8px để kéo hai ô gần nhau nhất
        x: s.x + (idx % 2 === 0 ? JITTER_MAX_PX : -JITTER_MAX_PX),
        y: s.y + (idx % 4 < 2 ? JITTER_MAX_PX : -JITTER_MAX_PX),
      }));

      const violations = findHitPairViolations(jitteredSlots);
      expect(violations).toEqual([]);
    }
  });

  it("ca âm: bước ô thiếu 2·JITTER_MAX_PX làm test gap đỏ khi bị lệch cực đại", () => {
    // Giả lập công thức sai: bước ô chỉ bằng hit + SLOT_GAP_PX (thiếu 2 * JITTER_MAX_PX = 16px)
    const touchFloor = getTouchFloor("5-6"); // 64px
    const deficientStep = touchFloor + SLOT_GAP_PX; // 64 + 16 = 80px (đúng phải là 96px)

    // Tạo hai slot liền kề với bước ô thiếu
    const slotA: Slot = {
      index: 0,
      x: 100,
      y: 100,
      w: touchFloor,
      h: touchFloor,
      hitW: touchFloor,
      hitH: touchFloor,
      page: 0,
      role: "neutral",
    };
    const slotB: Slot = {
      index: 1,
      x: 100 + deficientStep,
      y: 100,
      w: touchFloor,
      h: touchFloor,
      hitW: touchFloor,
      hitH: touchFloor,
      page: 0,
      role: "neutral",
    };

    // Khi chưa jitter: khoảng cách giữa hai vùng chạm = 80 - 64 = 16px (vừa đủ SLOT_GAP_PX)
    expect(findHitPairViolations([slotA, slotB])).toEqual([]);

    // Khi áp dụng jitter tối đa 8px đối đầu (A lệch sang phải +8px, B lệch sang trái -8px):
    const jitteredA: Slot = { ...slotA, x: slotA.x + JITTER_MAX_PX };
    const jitteredB: Slot = { ...slotB, x: slotB.x - JITTER_MAX_PX };

    // Khoảng cách mới: (180 - 8 - 32) - (100 + 8 + 32) = 140 - 140 = 0px < 16px!
    const negativeViolations = findHitPairViolations([jitteredA, jitteredB]);
    expect(negativeViolations.length).toBeGreaterThan(0);
    expect(negativeViolations[0]).toContain("cách 0");
  });

  it("đăng ký trong registry: resolveLayout('scatter-board') hợp lệ và bọc trong stage", () => {
    const layoutFn = resolveLayout("scatter-board");
    expect(typeof layoutFn).toBe("function");

    const slots = layoutFn({
      slotCount: 15,
      ageBand: "4-5",
    });
    expect(slots.length).toBe(24);
  });
});
